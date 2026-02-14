import crypto from "crypto";
import EscrowStore from "../escrow.store.js";
import { Escrow, IEscrowUTXO, type IEscrow } from "../model/Escrow.js";
import { PrivateKey } from "@kluster/kaspa-wasm-node";
import TR_STATUS from "../../config/TR_STATUSES.js";
import { encrypt } from "../escrow.utils.js";
import { escrowFeeBuffer } from "../../utils/bufferCalculator.js";
import { BadRequestError, NotFoundError } from "../../errors/auth.erros.js";
import { Actor, canTransitionEscrow } from "../machine/escrow.fsm.js";
import { User } from "../../auth/User.model.js";
import { checkExpiry } from "../../utils/checkExpiry.js";
import { maxAgeMsForUnfundedEscrows } from "../../config/options.js";
import * as Refund from "./escrow.refund.js";
import * as Release from "./escrow.release.js";
import * as Funding from "./escrow.funding.js";
import { kaspaRpcService } from "../../services/kaspaRpcService.js";
import { Subscription } from "../model/Subscription.js";
import { kaspaAddressListener } from "./kaspaAddressListener.js";
import { SettlementService } from "../../settlement/settlement.service.js";
import { getAddressBalance } from "./escrow.helpers.js";
// import { subscribeUtxosChangedForAddress } from "../escrow.listener.js";
//

export interface ISettlementDataInput {
  type: "TEXT" | "DOCUMENT";
  content?: string;
  file?: {
    buffer: any;
    mimeType: string;
    filename: string;
  };
}

export default class EscrowService {
  constructor(
    private readonly escrowStore: EscrowStore,
    private readonly SettlementService: SettlementService,
  ) {}

  async createEscrow(
    title: string,
    amount: number,
    buyerAddress: string,
    vendorAddress: string,
  ): Promise<IEscrow> {
    if (title.length < 3)
      throw new BadRequestError("title should be greater that 3 chars");
    const ESCROW_FEE_BUFFER_KAS = escrowFeeBuffer; // small buffer for fees in KAS
    const totalAmountKAS = amount + ESCROW_FEE_BUFFER_KAS;

    const NETWORK = process.env.KASPA_NETWORK || "testnet-10";

    const escrowId = crypto.randomUUID();

    // 1️⃣ Generate 32-byte random private key (hex)
    const privateKeyHex = crypto.randomBytes(32).toString("hex");

    // 2️⃣ Create Kaspa private key
    const privateKey = new PrivateKey(privateKeyHex);

    // 3️⃣ Derive escrow address
    const escrowAddress = privateKey.toAddress(NETWORK).toString();

    const encryptedPrivateKey = await encrypt(privateKeyHex);

    const expiresAt = Date.now() + maxAgeMsForUnfundedEscrows;

    const escrow = await this.escrowStore.create({
      escrowId,
      title,
      buyerAddress,
      vendorAddress,
      escrowAddress,
      amount,
      expectedAmount: totalAmountKAS, // KAS
      encryptedPrivateKey,
      status: TR_STATUS.CREATED,
      expiresAt,
    });

    await Subscription.updateOne(
      {},
      { $addToSet: { addresses: escrowAddress } },
      { upsert: true },
    );

    await kaspaAddressListener.addAddress(escrowAddress);

    console.log(`📡 Subscribed to UTXOs for escrow ${escrow.escrowId}`);

    return escrow;
  }

  //
  // vendor creates settlement and acknowledges
  async createSettlement(
    escrowId: string,
    senderId: string,
    settlementData: ISettlementDataInput,
  ) {
    const { escrow, actor } = await this.getEscrowAndActor(escrowId, senderId);

    canTransitionEscrow(escrow, TR_STATUS.AWAITING_PAYMENT, actor);
    const input = {
      escrow: escrow._id.toString(),
      ...settlementData,
    };
    console.log("transition valid");
    const settlement = await this.SettlementService.create(input);
    console.log("settlement created successfully");
    escrow.status = TR_STATUS.AWAITING_PAYMENT;
    escrow.vendorAcknowledgedAt = new Date();

    await escrow.save();
    return settlement;
  }

  // buyer decrypts settlement and change state to awaiting release to signal funds release is next
  async allowRelease(
    escrowId: string,
    senderId: string,
  ): Promise<Release.IFinalSettlement> {
    const { escrow, actor } = await this.getEscrowAndActor(escrowId, senderId);
    console.log("here1", actor, escrow.status);
    canTransitionEscrow(escrow, TR_STATUS.AWAITING_RELEASE, actor);
    console.log("transition valid");
    const settlement = await this.SettlementService.getSettlmentByEscrow(
      escrow._id.toString(),
    );
    console.log("settlement found", settlement);
    return Release.allowFundsRelease(
      escrow,
      actor,
      settlement,
      this.SettlementService,
    );
  }

  // refund buyer using saved address
  private async refundBuyer(escrow: IEscrow) {
    return Refund.executeRefund(escrow);
  }

  // inner helper
  private async getEscrowAndActor(escrowId: string, senderId: string) {
    const escrow = await this.getEscrowById(escrowId);
    if (!escrow) throw new NotFoundError("Escrow not found");

    const sender = await User.findOne({ _id: senderId });
    if (!sender)
      throw new NotFoundError("Address is not linked to any account");
    const actor: Actor =
      sender.walletAddress === escrow.vendorAddress ? "vendor" : "buyer";
    return { escrow, actor };
  }

  // funding update for listener
  async applyFundingUpdate(escrow: IEscrow, utxos: IEscrowUTXO[]) {
    return Funding.executeFundingUpdate(escrow, utxos);
  }

  // refunding partially funded escrows that are expired
  async handlePartialRefundAndExpiry(escrow: IEscrow) {
    canTransitionEscrow(escrow, TR_STATUS.EXPIRED, "system");

    await this.refundBuyer(escrow);
    escrow.status = TR_STATUS.EXPIRED;
    escrow.expiredAt = new Date();

    await escrow.save();
  }

  // gets pending escrows from cron and checks for expiry;
  async handlePossibleExpiry(escrow: IEscrow) {
    console.log("here1");

    const now = Date.now();
    const isExpired = now >= escrow.expiresAt;

    console.log("here2", isExpired, {
      now,
      expiresAt: escrow.expiresAt,
    });

    console.log("here2", isExpired);
    if (!isExpired) return;
    switch (escrow.status) {
      case TR_STATUS.CREATED:
      case TR_STATUS.AWAITING_PAYMENT: {
        // awaiting payment state is not handled
        canTransitionEscrow(escrow, TR_STATUS.EXPIRED, "system");

        escrow.status = TR_STATUS.EXPIRED;
        escrow.expiredAt = new Date(now);
        break;
      }

      case TR_STATUS.PARTIALLY_FUNDED: {
        await this.handlePartialRefundAndExpiry(escrow);
        break;
      }
    }

    await escrow.save();
  }

  async getEscrowByAddress(escrowAddress: string): Promise<IEscrow | null> {
    return this.escrowStore.getByAddress(escrowAddress);
  }

  async getEscrowsByAddress(userAddress: string): Promise<IEscrow[]> {
    return this.escrowStore.getEscrowsByAddress(userAddress);
  }

  async getEscrowBalance(escrowAddress: string) {
    return getAddressBalance(escrowAddress);
  }

  async getEscrowById(escrowId: string): Promise<IEscrow | null> {
    return this.escrowStore.getById(escrowId);
  }

  async getPendingEscrows() {
    return this.escrowStore.getPendingEscrows();
  }

  async getUsersPendingEscrows(address: string) {
    return this.escrowStore.getUserPendingEscrows(address);
  }

  async getUnackedEscrows(address: string) {
    return this.escrowStore.getUnackedEscrows(address);
  }

  async getDashboardStats(address: string) {
    const activeEscrows = (await this.escrowStore.getPendingEscrows()).length;
    const completedEscrows = (
      await this.escrowStore.getUserCompletedEscrows(address)
    ).length;
    const unackedEscrows = (await this.getUnackedEscrows(address)).length;
    const recentEscrows = await this.escrowStore.getUserRecentEscrows(address);
    const totalReceived = await this.escrowStore.getUserTotalReceived(address);

    return {
      activeEscrows,
      completedEscrows,
      unackedEscrows,
      recentEscrows,
      totalReceived,
    };
  }

  async releaseEscrowFunds(escrowId: string, senderId: string) {
    const escrow = await this.escrowStore.getById(escrowId);
    if (!escrow) {
      throw new Error("Escrow not found");
    }
    return Release.executeRelease(escrow, senderId);
  }
}

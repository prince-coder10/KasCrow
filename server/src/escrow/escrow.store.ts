import { Escrow } from "./model/Escrow.js";
import type { IEscrow, CreateEscrowDTO } from "./model/Escrow.js";
import type { EscrowStatus } from "../config/TR_STATUSES.js";

export default class EscrowStore {
  async create(data: CreateEscrowDTO): Promise<IEscrow> {
    const escrow = await Escrow.create(data);
    return escrow;
  }

  async getById(escrowId: string): Promise<IEscrow | null> {
    return Escrow.findOne({ escrowId });
  }

  async getByAddress(escrowAddress: string): Promise<IEscrow | null> {
    return Escrow.findOne({ escrowAddress });
  }

  async getEscrowsByAddress(userAddress: string): Promise<IEscrow[]> {
    const normalized = userAddress.toLowerCase();

    return Escrow.find({
      $or: [{ buyerAddress: normalized }, { vendorAddress: normalized }],
    }).sort({ createdAt: -1 });
  }

  async getPendingEscrows(): Promise<IEscrow[]> {
    return Escrow.find({
      status: { $in: ["CREATED", "AWAITING_PAYMENT", "PARTIALLY_FUNDED"] },
    });
  }

  async getUserCompletedEscrows(address: string): Promise<IEscrow[]> {
    return Escrow.find({
      status: "RELEASED",
      $or: [{ buyerAddress: address }, { vendorAddress: address }],
    });
  }

  async getUserPendingEscrows(address: string): Promise<IEscrow[]> {
    return Escrow.find({
      status: {
        $in: [
          "CREATED",
          "AWAITING_PAYMENT",
          "PARTIALLY_FUNDED",
          "FUNDED",
          "AWAITING_RELEASE",
        ],
      },
      $or: [{ buyerAddress: address }, { vendorAddress: address }],
    });
  }

  async getUnackedEscrows(address: string): Promise<IEscrow[]> {
    return Escrow.find({
      status: "CREATED", // Since you're only checking one status, you can skip $in
      vendorAddress: address,
    });
  }

  async getUserRecentEscrows(address: string): Promise<IEscrow[]> {
    return Escrow.find({
      $or: [{ buyerAddress: address }, { vendorAddress: address }],
    })
      .sort({ createdAt: -1 })
      .limit(3);
  }

  async getUserTotalReceived(address: string): Promise<number> {
    const result = await Escrow.aggregate([
      {
        $match: {
          vendorAddress: address,
          status: "RELEASED",
        },
      },
      {
        $group: {
          _id: null,
          totalReceived: { $sum: "$amount" },
        },
      },
    ]);

    return result[0]?.totalReceived || 0;
  }

  // async updateStatus(
  //   escrowId: string,
  //   status: EscrowStatus,
  //   txid?: string,
  // ): Promise<IEscrow | null> {
  //   return Escrow.findOneAndUpdate(
  //     { escrowId },
  //     { status, fundingTxId: txid },
  //     { new: true },
  //   );
  // }

  // escrow.store.ts
  async expireOldEscrows(olderThanMs: number) {
    const cutoff = new Date(Date.now() - olderThanMs);

    return Escrow.updateMany(
      {
        status: "AWAITING_PAYMENT",
        createdAt: { $lt: cutoff },
      },
      { status: "EXPIRED" },
    );
  }
}

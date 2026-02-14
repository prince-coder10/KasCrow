import { kaspaRpcService } from "../../services/kaspaRpcService.js";
import TR_STATUS from "../../config/TR_STATUSES.js";
import {
  PrivateKey,
  createTransaction,
  signTransaction,
  kaspaToSompi,
} from "@kluster/kaspa-wasm-node";
import { Actor, canTransitionEscrow } from "../machine/escrow.fsm.js";
import { decrypt } from "../escrow.utils.js";
import { IEscrow } from "../model/Escrow.js";
import { User } from "../../auth/User.model.js";
import { ISettlement } from "../../settlement/model/Settlement.js";
import { SettlementService } from "../../settlement/settlement.service.js";
import { BadRequestError } from "../../errors/auth.erros.js";

export interface IFinalSettlement {
  content?: string;
  file?: { signedUrl: string; expiresIn: string };
}

export async function executeRelease(escrow: IEscrow, senderId: string) {
  const user = await User.findById(senderId);
  const actor: Actor =
    user?.walletAddress === escrow.buyerAddress ? "buyer" : "vendor";
  canTransitionEscrow(escrow, TR_STATUS.RELEASED, actor);
  console.log("here at top", escrow, escrow.encryptedPrivateKey);
  if (escrow.status === TR_STATUS.RELEASED) {
    throw new Error("Escrow already released");
  }

  console.log("here after transistion");
  if (
    escrow.status !== TR_STATUS.FUNDED &&
    escrow.status === TR_STATUS.PARTIALLY_FUNDED
  ) {
    throw new Error("Escrow not funded or partially funded");
  }

  console.log("escrow funded properly");

  const rpc = kaspaRpcService.getRpcClient();

  console.log("kaspa service", rpc);

  // load escrow private key
  if (!escrow.encryptedPrivateKey) {
    throw new Error("Escrow private key is missing");
  }
  console.log(escrow.encryptedPrivateKey);
  const decryptedPrivateKey = await decrypt(escrow.encryptedPrivateKey);
  console.log("decrypted", decryptedPrivateKey);

  if (!decryptedPrivateKey) {
    throw new Error("Failed to decrypt escrow private key");
  }
  console.log("here at private");
  const privateKey = new PrivateKey(decryptedPrivateKey);
  const NETWORK = process.env.KASPA_NETWORK || "testnet-10";

  const fromAddress = privateKey.toAddress(NETWORK).toString();

  // fetch UTXOs
  const utxoResponse = await rpc.getUtxosByAddresses([fromAddress]);
  const utxos = utxoResponse.entries || [];

  if (utxos.length === 0) {
    throw new Error("Escrow balance unavailable or already spent");
  }

  console.log("utxos have length");

  const totalInput = utxos.reduce((sum, utxo) => sum + BigInt(utxo.amount), 0n);
  if (
    totalInput < BigInt(kaspaToSompi(escrow.expectedAmount.toString()) ?? 0n)
  ) {
    throw new Error("Escrow underfunded");
  }

  const priorityFee = 2_000n;

  const sendAmount = escrow.amount;

  const sendAmountSompi = kaspaToSompi(sendAmount.toString()) ?? 0n;
  if (totalInput < sendAmountSompi + priorityFee) {
    throw new Error("Escrow underfunded for release + fee");
  }

  const tx = createTransaction(
    utxos,
    [
      {
        address: escrow.vendorAddress,
        amount: sendAmountSompi,
      },
    ],
    priorityFee,
  );

  console.log("transaction created");

  // sign transaction
  signTransaction(tx, [privateKey], true);

  // Finalize
  tx.finalize();

  //🚀 SUBMIT TO NETWORK
  const submitResult = await rpc.submitTransaction({
    transaction: tx,
  });

  escrow.status = TR_STATUS.RELEASED;
  escrow.releaseTxId = submitResult.transactionId;
  await escrow.save();

  return submitResult.transactionId;
}

export async function allowFundsRelease(
  escrow: IEscrow,
  actor: Actor,
  settlement: ISettlement,
  SettlementService: SettlementService,
) {
  const finalSettlement: IFinalSettlement = {};
  if (settlement.type === "TEXT") {
    const { text } = await SettlementService.decryptText(settlement, actor);
    console.log("text decrypted", text);
    finalSettlement.content = text;
  } else if (settlement.type === "DOCUMENT") {
    const file = await SettlementService.signDownloadUrl(settlement, actor);
    finalSettlement.file = file;
    console.log("file", file);
  } else throw new BadRequestError("Invalid settlement type");

  if (escrow.status !== TR_STATUS.FUNDED) {
    throw new BadRequestError("Escrow not ready for release");
  }

  escrow.status = TR_STATUS.AWAITING_RELEASE;
  await escrow.save();
  return finalSettlement;
}

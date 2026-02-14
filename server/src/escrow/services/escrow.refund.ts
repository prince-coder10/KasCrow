import { kaspaRpcService } from "../../services/kaspaRpcService.js";
import { canTransitionEscrow } from "../machine/escrow.fsm.js";
import type { IEscrow } from "../model/Escrow.js";
import { decrypt } from "../escrow.utils.js";
import TR_STATUS from "../../config/TR_STATUSES.js";
import { getRefundableAmount } from "./escrow.helpers.js";
import {
  PrivateKey,
  createTransaction,
  signTransaction,
} from "@kluster/kaspa-wasm-node";

export async function executeRefund(escrow: IEscrow) {
  canTransitionEscrow(escrow, TR_STATUS.REFUNDED, "system");
  // idempotency guard
  if (escrow.refundedAt) return;

  const refundable = getRefundableAmount(escrow);
  if (refundable === 0n) return;

  const rpc = kaspaRpcService.getRpcClient();

  const decryptedPrivateKey = await decrypt(escrow.encryptedPrivateKey);
  const NETWORK = process.env.KASPA_NETWORK || "testnet-10";
  const privateKey = new PrivateKey(decryptedPrivateKey);

  const fromAddress = privateKey.toAddress(NETWORK).toString();
  const utxoResponse = await rpc.getUtxosByAddresses([fromAddress]);
  const utxos = utxoResponse.entries || [];

  if (utxos.length === 0) {
    throw new Error("Escrow balance unavailable");
  }

  const priorityFee = 2_000n;

  const totalInput = utxos.reduce((sum, utxo) => sum + BigInt(utxo.amount), 0n);

  if (totalInput < refundable) {
    throw new Error("Escrow balance insufficient for refund");
  }

  const finalRefundableAmount =
    refundable > priorityFee ? refundable - priorityFee : 0n;

  if (finalRefundableAmount <= 0n) {
    throw new Error("Escrow balance too low after fee");
  }

  const tx = createTransaction(
    utxos,
    [
      {
        address: escrow.buyerAddress,
        amount: finalRefundableAmount,
      },
    ],
    priorityFee,
  );

  signTransaction(tx, [privateKey], true);
  tx.finalize();

  // 🚀 SUBMIT
  const submitResult = await rpc.submitTransaction({
    transaction: tx,
  });

  // ✅ persist refund state
  for (const utxo of escrow.utxos) {
    if (utxo.refunded) continue;
    utxo.refunded = true;
    utxo.refundTxId = submitResult.transactionId;
    utxo.refundedAt = new Date();
  }
  escrow.status = TR_STATUS.REFUNDED;
  escrow.refundTxId = submitResult.transactionId;
  escrow.refundedAt = new Date();
  await escrow.save();
}

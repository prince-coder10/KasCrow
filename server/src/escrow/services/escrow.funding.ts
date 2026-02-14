import type { IEscrow, IEscrowUTXO } from "../model/Escrow.js";
import { kaspaToSompi, sompiToKaspaString } from "@kluster/kaspa-wasm-node";
import { canTransitionEscrow } from "../machine/escrow.fsm.js";
import TR_STATUS from "../../config/TR_STATUSES.js";
import { Escrow } from "../model/Escrow.js";

export async function executeFundingUpdate(
  escrow: IEscrow,
  utxos: IEscrowUTXO[],
) {
  const updateFields: Partial<IEscrow> = {};

  /* ---------- balance calculation ---------- */
  const balance = utxos.reduce((a, u) => a + BigInt(u.amount), 0n);
  const requiredSompi = kaspaToSompi(escrow.expectedAmount.toString()) ?? 0n;

  updateFields.fundedAmount = Number(sompiToKaspaString(balance));

  /* ---------- merge UTXOs safely ---------- */
  const existingUtxoKeys = new Set(
    escrow.utxos.map((u) => `${u.txId}:${u.index}`),
  );

  const newUtxos = utxos.filter(
    (u) => !existingUtxoKeys.has(`${u.txId}:${u.index}`),
  );

  if (newUtxos.length > 0) {
    updateFields.utxos = [...escrow.utxos, ...newUtxos];
  }

  /* ---------- merge fundingTxIds safely ---------- */
  const existingTxIds = new Set(escrow.fundingTxIds ?? []);
  const newTxIds = newUtxos
    .map((u) => u.txId)
    .filter((txId) => !existingTxIds.has(txId));

  if (newTxIds.length > 0) {
    updateFields.fundingTxIds = [...(escrow.fundingTxIds ?? []), ...newTxIds];
  }

  /* ---------- FSM + status update ---------- */
  if (balance < requiredSompi) {
    canTransitionEscrow(escrow, TR_STATUS.PARTIALLY_FUNDED, "system");

    updateFields.status = TR_STATUS.PARTIALLY_FUNDED;
    updateFields.partiallyFundedAt = new Date();
  } else {
    canTransitionEscrow(escrow, TR_STATUS.FUNDED, "system");

    updateFields.status = TR_STATUS.FUNDED;
    updateFields.fundedAt = new Date();
  }

  /* ---------- atomic partial update ---------- */
  await Escrow.findByIdAndUpdate(
    escrow._id,
    { $set: updateFields },
    { new: false },
  );

  // TODO: emit websocket event
}

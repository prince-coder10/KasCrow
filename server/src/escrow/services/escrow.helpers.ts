import {
  BadRequestError,
  InternalServerError,
} from "../../errors/auth.erros.js";
import { kaspaRpcService } from "../../services/kaspaRpcService.js";
import type { IEscrow } from "../model/Escrow.js";

export function getRefundableAmount(escrow: IEscrow): bigint {
  return escrow.utxos
    .filter((u) => !u.refunded)
    .reduce((sum, u) => sum + BigInt(u.amount), 0n);
}

export async function getAddressBalance(escrowAddress: string) {
  if (!kaspaRpcService.isRpcConnected()) throw new InternalServerError();
  if (typeof escrowAddress !== "string")
    throw new BadRequestError("address must be a string");

  const balance = await kaspaRpcService.getBalancesByAddresses([escrowAddress]);
  if (!balance) throw new BadRequestError("invalid address");
  return balance;
}

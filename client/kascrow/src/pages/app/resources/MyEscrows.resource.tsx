import { useQuery } from "@tanstack/react-query";
import { api } from "../../../apis/axios";

type EscrowStatus =
  | "CREATED"
  | "AWAITING_PAYMENT"
  | "PARTIALLY_FUNDED"
  | "FUNDED"
  | "AWAITING_RELEASE"
  | "RELEASED"
  | "REFUNDED"
  | "DISPUTED"
  | "EXPIRED";

export interface IEscrow {
  escrowId: string;
  title: string;

  // parties
  buyerAddress: string;
  vendorAddress: string;

  // kaspa
  escrowAddress: string;
  encryptedPrivateKey: string; // NEVER plaintext

  // amounts
  amount: number;
  expectedAmount: number;
  fundedAmount: number;

  // state
  status: EscrowStatus;

  // chain data
  fundingTxIds: string[];
  releaseTxId?: string;
  refundTxId?: string;

  // lifecycle
  partiallyFundedAt?: Date;
  fundedAt?: Date;
  buyerReleasedAt?: Date;
  vendorAcknowledgedAt?: Date;

  expiresAt: number;
  expiredAt: Date;
  refundedAt?: Date;
  releasedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const fetchEscrows = async (): Promise<IEscrow[]> => {
  const response = await api.get<{ escrows: IEscrow[] }>("/escrow");
  return response.data.escrows || [];
};

export const useMyEscrows = () => {
  return useQuery({
    queryKey: ["myEscrows"],
    queryFn: fetchEscrows,
  });
};

export const useEscrow = (id: string) => {
  return useQuery({
    queryKey: ["myEscrows"], // Use same key to share cache
    queryFn: fetchEscrows,
    select: (escrows) => escrows.find((e) => e.escrowId === id),
  });
};

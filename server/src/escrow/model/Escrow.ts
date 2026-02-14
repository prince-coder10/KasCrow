import mongoose, { Schema, Document } from "mongoose";
import { type EscrowStatus } from "../../config/TR_STATUSES.js";
import TR_STATUS from "../../config/TR_STATUSES.js";

export interface IEscrow extends Document {
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
  utxos: IEscrowUTXO[];
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

  __v: number;
}

export interface IEscrowUTXO {
  txId: string;
  index: number;
  amount: number; // sompi
  address: string; // escrow address
  confirmations: number;

  refunded: boolean;
  refundTxId?: string;
  refundedAt?: Date;
}

export interface CreateEscrowDTO {
  title: string;
  escrowId: string;
  buyerAddress: string;
  vendorAddress: string;
  escrowAddress: string;
  amount: number;
  expectedAmount: number;
  encryptedPrivateKey: string;
  status: EscrowStatus;
  expiresAt: number;
}

const escrowSchema = new Schema<IEscrow>(
  {
    escrowId: { type: String, required: true, unique: true },
    title: { type: String, required: true },

    buyerAddress: { type: String, required: true, index: true },
    vendorAddress: { type: String, required: true, index: true },

    escrowAddress: { type: String, required: true, unique: true },
    encryptedPrivateKey: { type: String, required: true },

    amount: { type: Number, required: true },
    expectedAmount: { type: Number, required: true },
    fundedAmount: { type: Number, default: 0 },

    status: {
      type: String,
      enum: Object.values(TR_STATUS),
      required: true,
      index: true,
    },

    utxos: [
      {
        txId: String,
        index: Number,
        amount: Number,
        confirmations: Number,
      },
    ],

    fundingTxIds: [{ type: String }],
    releaseTxId: { type: String },
    refundTxId: { type: String },
    refundedAt: { type: Date },

    partiallyFundedAt: { type: Date },
    fundedAt: { type: Date },
    buyerReleasedAt: { type: Date },
    vendorAcknowledgedAt: { type: Date },
    expiresAt: { type: Number, required: true, index: true },
    expiredAt: { type: Date, index: true },
    releasedAt: { type: Date },
  },
  { timestamps: true },
);

// escrowSchema.index({ expiresAt: 1 });
escrowSchema.index({ buyerAddress: 1, status: 1 });
escrowSchema.index({ vendorAddress: 1, status: 1 });

export const Escrow = mongoose.model<IEscrow>("Escrow", escrowSchema);

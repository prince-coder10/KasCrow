import mongoose, { Document, Schema } from "mongoose";

export type SettlementType =
  | "TEXT"
  | "FILE"
  | "ARCHIVE"
  | "CREDENTIAL"
  | "MEDIA"
  | "CODE"
  | "LINK"
  | "IPFS"
  | "ONCHAIN_PROOF";

export interface ISettlement extends Document {
  escrowId: mongoose.Types.ObjectId;

  type: SettlementType;

  // Human-readable label
  title?: string;
  description?: string;

  // Storage reference (never raw blobs)
  uri?: string; // S3, IPFS, HTTPS, file server
  cid?: string; // IPFS
  txId?: string; // On-chain proof
  repoUrl?: string; // GitHub / GitLab

  // File metadata
  mimeType?: string;
  fileName?: string;
  fileSize?: number;

  // Integrity & verification
  checksum?: string; // SHA-256 / Blake3
  encrypted: boolean;

  // Lifecycle
  providedBy: "vendor" | "system";
  providedAt: Date;
  verifiedAt?: Date;
  acceptedAt?: Date;

  // Dispute / audit
  isAccepted: boolean;
  rejectionReason?: string;

  createdAt: Date;
  updatedAt: Date;
}

const SettlementSchema = new Schema<ISettlement>(
  {
    escrowId: {
      type: Schema.Types.ObjectId,
      ref: "Escrow",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: [
        "TEXT",
        "FILE",
        "ARCHIVE",
        "CREDENTIAL",
        "MEDIA",
        "CODE",
        "LINK",
        "IPFS",
        "ONCHAIN_PROOF",
      ],
      required: true,
    },

    title: String,
    description: String,

    uri: String,
    cid: String,
    txId: String,
    repoUrl: String,

    fileName: String,
    mimeType: String,
    fileSize: Number,

    checksum: String,
    encrypted: {
      type: Boolean,
      default: false,
    },

    providedBy: {
      type: String,
      enum: ["SELLER", "SYSTEM"],
      required: true,
    },

    providedAt: {
      type: Date,
      default: Date.now,
    },

    verifiedAt: Date,
    acceptedAt: Date,

    isAccepted: {
      type: Boolean,
      default: false,
    },

    rejectionReason: String,
  },
  { timestamps: true },
);

export default mongoose.model<ISettlement>("Settlement", SettlementSchema);

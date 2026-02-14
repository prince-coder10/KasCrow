import mongoose, { Document, Types, Schema } from "mongoose";
export type SettlementType = "TEXT" | "DOCUMENT";

export interface ISettlement extends Document {
  escrow: Types.ObjectId;
  type: SettlementType;
  content?: string; // for text
  // for documents
  fileUrl?: string;
  fileName?: string;
  mimeType?: string;
  // lifecycle
  providedAt: Date;
  acceptedAt: Date;
}

export type CreateSettlementDTO = {
  escrow: string;
  type: "TEXT" | "DOCUMENT";

  content?: string;

  file?: {
    buffer: any;
    mimeType: string;
    filename: string;
  };
  fileUrl?: string;
  mimeType?: string;
};

const settlementSchema = new Schema<ISettlement>(
  {
    escrow: {
      type: Schema.Types.ObjectId,
      ref: "Escrow",
      required: true,
      index: true,
    },
    type: { type: String, enum: ["TEXT", "DOCUMENT"] },
    // TEXT delivery
    content: {
      type: String,
    },

    // DOCUMENT delivery
    fileUrl: {
      type: String,
    },
    mimeType: {
      type: String,
      enum: [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
    },

    providedAt: {
      type: Date,
      default: Date.now,
    },

    acceptedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

// settlementSchema.pre("save", function (this: ISettlement, next: any) {
//   if (this.type === "TEXT" && !this.content) {
//     return next(new Error("TEXT settlement requires content"));
//   }

//   if (this.type === "DOCUMENT" && !this.fileUrl) {
//     return next(new Error("DOCUMENT settlement requires fileUrl"));
//   }

//   next();
// });

export const Settlement = mongoose.model<ISettlement>(
  "Settlement",
  settlementSchema,
);

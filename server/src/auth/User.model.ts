import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
  walletAddress: string;
  sessionToken: ISessionToken;

  // optional but useful
  createdAt: Date;
  updatedAt: Date;

  // future-proofing
  isBanned: boolean;
}

export interface ISessionToken {
  // tokenHash: string; future
  tokenVersion: number;
  createdAt: Date;
}

const SessionTokenSchema = new Schema<ISessionToken>(
  {
    // tokenHash: { type: String, required: true, unique: true, default: null },
    tokenVersion: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  },
);

const UserSchema = new Schema<IUser>(
  {
    walletAddress: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    sessionToken: { type: SessionTokenSchema, default: () => ({}) },

    isBanned: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export const User = model<IUser>("User", UserSchema);

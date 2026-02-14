import argon2 from "argon2";
import crypto from "crypto";

const KEY_LENGTH = 32; // 32 bytes = 256 bits
const ALGORITHM = "aes-256-gcm";

const SALT = Buffer.from(
  process.env.ESCROW_KEY_SALT || "playerflip-escrow-salt",
);

export const deriveKey = async (): Promise<Buffer> => {
  const masterSecret = process.env.ESCROW_MASTER_SECRET;
  if (!masterSecret) {
    throw new Error("ESCROW_MASTER_SECRET not set");
  }

  return argon2.hash(masterSecret, {
    type: argon2.argon2id,
    salt: SALT,
    memoryCost: 2 ** 16,
    timeCost: 3,
    parallelism: 1,
    hashLength: KEY_LENGTH,
    raw: true,
  });
};

export const encrypt = async (text: string): Promise<string> => {
  const key = await deriveKey();
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, tag, encrypted]).toString("base64");
};

export const decrypt = async (payload: string): Promise<string> => {
  const key = await deriveKey();
  const data = Buffer.from(payload, "base64");

  const iv = data.subarray(0, 12);
  const tag = data.subarray(12, 28);
  const encrypted = data.subarray(28);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
};

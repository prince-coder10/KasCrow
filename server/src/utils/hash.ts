import argon2 from "argon2";

export const hashToken = async (token: string) => {
  const hashed = await argon2.hash(token);
  return hashed;
};

export const verifyToken = async (hash: string, plain: string) => {
  const res = await argon2.verify(hash, plain);
  return res;
};

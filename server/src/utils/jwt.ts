import jwt, { JwtPayload } from "jsonwebtoken";

interface SessionTokenPayload {
  sub: string;
  wallet: string;
  v: number;
  iat: Date | number;
}

const sessionSecret = process.env.SESSION_TOKEN_SECRET!;
const expiresIn = +process.env.SESSION_EXPIRES_IN!;

export function signSessionToken(payload: SessionTokenPayload): string {
  return jwt.sign(payload, sessionSecret, {
    expiresIn,
  });
}

export function verifySessionToken(token: string): SessionTokenPayload {
  const payload = jwt.verify(token, sessionSecret) as JwtPayload;
  return payload as unknown as SessionTokenPayload;
}

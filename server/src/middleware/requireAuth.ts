import type { Request, Response, NextFunction } from "express";
import { User } from "../auth/User.model.js";
import { verifySessionToken } from "../utils/jwt.js";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    wallet: string;
  };
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const cookieName = process.env.COOKIE_NAME!;
    const sessionToken = req.cookies?.[cookieName];

    if (!sessionToken) {
      return res.status(401).json({ message: "Unauthenticated" });
    }

    const payload = verifySessionToken(sessionToken);

    const user = await User.findById(payload.sub);

    if (!user) {
      return res.status(401).json({ message: "Invalid session" });
    }

    if (user.isBanned) {
      return res.status(403).json({ message: "User is banned" });
    }

    if (user.sessionToken.tokenVersion !== payload.v) {
      return res.status(401).json({ message: "Session revoked" });
    }

    req.user = {
      id: user.id,
      wallet: user.walletAddress,
    };

    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired session" });
  }
}

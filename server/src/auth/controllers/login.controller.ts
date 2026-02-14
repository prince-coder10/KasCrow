import { UserService } from "../../auth/auth.service.js";
import { UserStore } from "../../auth/auth.store.js";
import type { Request, Response } from "express";
import { catchError } from "../../utils/catchError.js";

const User = new UserService(new UserStore());
const cookieName = process.env.COOKIE_NAME!;
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress || typeof walletAddress !== "string") {
      return res.status(400).json({
        success: false,
        message: "Wallet address must be provided as a string",
      });
    }
    const user = await User.findOrCreateUser(walletAddress);

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User registration failed" });
    }

    const sessionToken = User.issueJWT(user);

    if (!sessionToken) {
      return res
        .status(400)
        .json({ success: false, message: "Error authorizing user" });
    }

    // set cookie
    res.cookie(cookieName, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
    });

    return res.status(200).json({
      success: true,
      message: "User logged in successfully",
      data: { id: user._id, wallet: user.walletAddress },
    });
  } catch (error) {
    console.log("Error logging in user:", error);
    return catchError(res, error);
  }
};

import { UserService } from "../../auth/auth.service.js";
import { UserStore } from "../../auth/auth.store.js";
import type { Request, Response } from "express";
import { catchError } from "../../utils/catchError.js";
import type { AuthRequest } from "../../middleware/requireAuth.js";

const User = new UserService(new UserStore());
const cookieName = process.env.COOKIE_NAME!;
export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user)
      return res.status(401).json({
        success: false,
        message: "Unauthorized to perfom this action",
      });

    const id = req.user?.id;
    const walletAddress = req.user?.wallet;

    return res.status(200).json({
      success: true,
      message: "User logged in successfully",
      data: { id, wallet: walletAddress },
    });
  } catch (error) {
    console.log("Error logging in user:", error);
    return catchError(res, error);
  }
};

import { UserService } from "../../auth/auth.service.js";
import { UserStore } from "../../auth/auth.store.js";
import type { Response } from "express";
import { catchError } from "../../utils/catchError.js";
import type { AuthRequest } from "../../middleware/requireAuth.js";

const User = new UserService(new UserStore());
const cookieName = process.env.COOKIE_NAME!;

export const logoutUser = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (userId) {
      // Increment token version to invalidate all existing JWTs
      await User.invalidateUserSession(userId);
    }

    // Clear the session cookie
    res.clearCookie(cookieName, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    });

    return res.status(200).json({
      success: true,
      message: "User logged out successfully",
    });
  } catch (error) {
    console.log("Error logging out user:", error);
    return catchError(res, error);
  }
};

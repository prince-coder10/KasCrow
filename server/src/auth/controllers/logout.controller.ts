import { UserService } from "../../auth/auth.service.js";
import { UserStore } from "../../auth/auth.store.js";
import type { Response, Request } from "express";
import { catchError } from "../../utils/catchError.js";
import { verifySessionToken } from "../../utils/jwt.js";

const User = new UserService(new UserStore());
const cookieName = process.env.COOKIE_NAME!;

export const logoutUser = async (req: Request, res: Response) => {
  try {
    const token = req.cookies[cookieName];

    if (token) {
      const payload = verifySessionToken(token);
      const user = await User.getUserById(payload.sub);
      if (user) {
        // Increment token version to invalidate all existing JWTs
        await User.invalidateUserSession(user?._id.toString());
      }
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

import { loginUser } from "../auth/controllers/login.controller.js";
import { logoutUser } from "../auth/controllers/logout.controller.js";
import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { getProfile } from "../auth/controllers/profile.controller.js";

const authRoute: Router = Router();

authRoute.post("/wallet", loginUser);
authRoute.post("/logout", logoutUser);
authRoute.get("/profile", requireAuth, getProfile);

export default authRoute;

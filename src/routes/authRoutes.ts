import { Router } from "express";
import { authCallback, getMe } from "../controllers/authController";
import { protectRoute } from "../middleware/auth";

const authRoutes = Router()

authRoutes.get("/me", protectRoute, getMe)
authRoutes.post("/callback", authCallback)

export default authRoutes 
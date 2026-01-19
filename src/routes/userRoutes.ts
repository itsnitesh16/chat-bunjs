import { Router } from "express";
import { protectRoute } from "../middleware/auth";
import { getUsers } from "../controllers/userController";

const userRoutes = Router()

userRoutes.get("/", protectRoute, getUsers)

export default userRoutes 
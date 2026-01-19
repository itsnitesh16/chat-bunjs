import { Router } from "express";
import { protectRoute } from "../middleware/auth";
import { getMessages } from "../controllers/messageController";

const messageRoutes = Router()

messageRoutes.get("/chat/:chatId", protectRoute, getMessages)

export default messageRoutes 
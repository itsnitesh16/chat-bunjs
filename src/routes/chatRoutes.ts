import { Router } from "express";
import { protectRoute } from "../middleware/auth";
import { getChats, getOrCreateChat } from "../controllers/chatController";

const chatRoutes = Router()

chatRoutes.use(protectRoute)
chatRoutes.get("/", getChats)
chatRoutes.post("/with/:participantId", getOrCreateChat)

export default chatRoutes 
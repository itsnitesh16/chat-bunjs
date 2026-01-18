import express, { type Request, type Response } from "express"
import authRoutes from "./routes/authRoutes"
import chatRoutes from "./routes/chatRoutes"
import messageRoutes from "./routes/messageRoutes"
import userRoutes from "./routes/userRoutes"
import { clerkMiddleware } from '@clerk/express'
import { errorHandler } from "./middleware/errorHandler"


const app = express()

app.use(express.json())
app.use(clerkMiddleware())

app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ success: true, status: "Okk" })
})

app.use("/api/auth", authRoutes)
app.use("/api/chats", chatRoutes)
app.use("/api/messages", messageRoutes)
app.use("/api/users", userRoutes)

app.use(errorHandler)


export default app
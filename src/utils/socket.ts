import { Socket, Server as SocketServer } from "socket.io";
import { Server as HttpServer } from "http"
import { verifyToken } from "@clerk/express";
import { prisma } from "../lib/prisma";


// store online users in memory : userId -> socketId

export const onlineUsers: Map<string, string> = new Map()


export const initializeSocket = (httpServer: HttpServer) => {

  const allowedOrigins = [
    "http://localhost:8081",
    "http://localhost:5173",
    process.env.FRONTEND_URL as string,
  ]

  const io = new SocketServer(httpServer, {
    cors: {
      origin: allowedOrigins
    }
  })

  // verify the socket connection - if the user is authenticated, we will store the userId in the socket

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token

    if (!token) {
      return next(new Error("Authentication error"))
    }

    try {
      const session = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY! })

      const clerkId = session.sub

      const user = await prisma.user.findUnique({
        where: { clerkId }
      })

      if (!user) {
        return next(new Error("User not found"))
      }

      socket.data.userId = user.id

      next()
    } catch (error) {
      next(new Error(error as any))
    }
  })



  io.on("connection", (socket) => {
    const userId = socket.data.userId;

    // send list of currently online users to the newly connected client
    socket.emit("online-users", { userIds: Array.from(onlineUsers.keys()) })

    // store user in the onlineUsers map
    onlineUsers.set(userId, socket.id)

    // notify others that this current user is online
    socket.broadcast.emit("user-online", { userId })


    socket.join(`user:${userId}`)


    socket.on("join-chat", (chatId: string) => {
      socket.join(`chat:${chatId}`)
    })

    socket.on("leave-chat", (chatId: string) => {
      socket.leave(`chat:${chatId}`)
    })


    // handle sending message
    socket.on("send-message", async (data: { chatId: string, text: string }) => {
      try {
        const { chatId, text } = data


        const chat = await prisma.chat.findUnique({
          where: {
            id: chatId,
            participants: {
              some: {
                id: userId
              }
            }
          },
          include: {
            participants: {
              select: {
                id: true
              }
            }
          }
        })

        if (!chat) {
          socket.emit("socket-error", { message: "Chat not found" })
          return;
        }

        const message = await prisma.$transaction(async (tx) => {
          const msg = await tx.message.create({
            data: {
              chatId,
              senderId: userId,
              text
            },
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                }
              }
            }
          })

          await tx.chat.update({
            where: {
              id: chatId
            },
            data: {
              lastMessageId: msg.id,
              lastMessageAt: new Date()
            }
          })

          return msg;
        })

        io.to(`chat:${chatId}`).emit("new-message", message)


        for (const participantId of chat.participants) {
          io.to(`user:${participantId}`).emit("new-message", message)
        }


      } catch (error) {
        socket.emit("socket-error", { message: "Failed to send message" })
      }
    })


    socket.on("typing", async (data) => {

    })


    socket.on("disconnect", () => {
      onlineUsers.delete(userId)

      // notify others
      socket.broadcast.emit("user-offline", { userId })
    })

  });


  return io;
}


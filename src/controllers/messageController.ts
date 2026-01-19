import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";

export const getMessages = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId
    const { chatId } = req.params

    if (!chatId) {
      res.status(400).json({
        message: "Chat Id is required to fetch the chat messages"
      })
    }

    const chat = await prisma.chat.findUnique({
      where: {
        id: typeof chatId === "string" ? chatId : Array.isArray(chatId) ? chatId[0] : undefined,
      },
      include: {
        participants: {
          where: {
            id: userId
          }
        }
      }
    })

    if (!chat) {
      return res.status(404).json({
        message: "Chat not found"
      })
    }
    const messages = await prisma.message.findMany({
      where: {
        chatId: chat.id
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: "asc"
      }
    })

    res.status(200).json(messages)

  } catch (error) {
    res.status(500)
    next(error)
  }
}
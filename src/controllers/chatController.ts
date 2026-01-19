import type { NextFunction, Response } from "express"
import type { AuthRequest } from "../middleware/auth"
import { prisma } from "../lib/prisma"

export const getChats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId

    const chats = await prisma.chat.findMany({
      where: {
        participants: {
          some: {
            id: userId
          }
        }
      },
      include: {
        participants: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        lastMessage: true,
      },
      orderBy: {
        lastMessageAt: "desc"
      }
    })

    const formattedChats = chats.map((chat) => {
      const otherParticipant = chat.participants.find((participant) => participant.id !== userId)
      return {
        id: chat.id,
        participant: otherParticipant,
        lastMessage: chat.lastMessage,
        lastMessageAt: chat.lastMessageAt,
        createdAt: chat.createdAt
      }
    })
    res.status(200).json(formattedChats)
  } catch (error) {
    res.status(500)
    next(error)
  }
}


export const getOrCreateChat = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId
    const { participantId } = req.params

    if (!participantId) {
      return res.status(400).json({
        message: "Participant ID is required to create a chat"
      })
    }


    if (userId === participantId) {
      return res.status(400).json({
        message: "Cannot create chat with yourself"
      })
    }

    // check if chat already exists
    let chat = await prisma.chat.findFirst({
      where: {
        AND: [
          {
            participants: {
              some: { id: userId }
            }
          },
          {
            participants: { some: { id: participantId as string } }
          }
        ]
      },
      include: {
        participants: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        lastMessage: true
      }
    })
    if (!chat) {
      chat = await prisma.chat.create({
        data: {
          participants: {
            connect: [{ id: userId }, { id: participantId as string }]
          }
        },
        include: {
          participants: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          },
          lastMessage: true
        }
      })
    }

    const otherParticipant = chat.participants.find((participant) => participant.id !== userId)
    if (!otherParticipant) {
      return res.status(404).json({
        message: "Other participant not found"
      })
    }

    return res.status(200).json({
      id: chat.id,
      participant: otherParticipant,
      lastMessage: chat.lastMessage,
      lastMessageAt: chat.lastMessageAt,
      createdAt: chat.createdAt
    })
  } catch (error) {
    res.status(500)
    next(error)
  }
}
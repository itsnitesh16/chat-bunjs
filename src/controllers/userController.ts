import type { NextFunction, Request, Response } from "express";
import type { AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";

export const getUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;

    const users = await prisma.user.findMany({
      where: {
        id: {
          not: userId
        },
      },
      select: {
        name: true,
        email: true,
        avatar: true,
      },
      take: 50,
    })

    res.status(200).json(users)
  } catch (error) {
    res.status(500)
    next(error)
  }
}
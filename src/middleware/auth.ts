import { getAuth, requireAuth } from "@clerk/express";
import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";


export type AuthRequest = Request & {
  userId?: string;
}

export const protectRoute = [
  requireAuth(),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { userId: clerkId } = getAuth(req)
      if (!clerkId) {
        return res.status(401).json({
          message: "Unauthorized - Invalid Token"
        })
      }

      const user = await prisma.user.findUnique({
        where: {
          clerkId
        }
      })

      if (!user) {
        return res.status(404).json({
          message: "User not found"
        })
      }

      req.userId = user.id

      next()
    } catch (error) {
      // console.error("Error in protectRoute: ", error)
      // res.status(500).json({
      //   error: "Error in protect route"
      // })
      res.status(500)
      next(error)
    }
  }
]
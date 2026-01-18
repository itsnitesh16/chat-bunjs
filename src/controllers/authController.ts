import type { NextFunction, Request, Response } from "express";
import type { AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { clerkClient, getAuth } from "@clerk/express";

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId

    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      })
    }

    res.status(200).json(user)
  } catch (error) {
    // console.error("Error in getMe: ", error)
    // res.status(500).json({
    //   message: "Error in getting me"
    // })
    res.status(500)
    next(error)
  }
}


export const authCallback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId: clerkId } = getAuth(req)
    if (!clerkId) {
      return res.status(401).json({
        message: "Unauthorized"
      })
    }

    let user = await prisma.user.findUnique({
      where: { clerkId }
    })

    if (!user) {
      // get user info from clerk and save to db
      const clerkUser = await clerkClient.users.getUser(clerkId)

      user = await prisma.user.create({
        data: {
          clerkId,
          name: clerkUser.firstName ? `${clerkUser.firstName} ${clerkUser.lastName || ""}`.trim() : clerkUser.emailAddresses[0]?.emailAddress.split("@")[0]!,
          email: clerkUser.emailAddresses[0]?.emailAddress!,
          avatar: clerkUser.imageUrl
        }
      })
    }

    res.status(200).json(user);
  } catch (error) {
    // console.error("Error in authCallback: ", error)
    // res.status(500).json({
    //   message: "Error in auth callback"
    // })
    res.status(500)
    next(error)
  }
}
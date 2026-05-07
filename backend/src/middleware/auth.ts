import { getAuth } from "@clerk/express";
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/ApiError";
import { User } from "../models/user.model";
import { asyncHandler } from "../utils/asyncHandler";

//User is authenticate or not
export function requiredAuth(req: Request, _res: Response, next: NextFunction) {
    const {userId} = getAuth(req);

    if(!userId) {
        return next(
            new AppError(401, "User not authenticated")
        );
    }

    next();
}

//if User is authenticate then find the user information 
export async function getDbUserFromReq(req: Request) {
    const {userId} = getAuth(req);

    if(!userId) {
        throw new AppError(401, "User not authenticated");
    }

    const dbUser = await User.findOne({clerkUserId: userId});

    if(!dbUser) {
        throw new AppError(404, "User not found");
    }

    return dbUser;
}

//Check if the current user have admin access or not 
export const requireAdmin = asyncHandler(
    async (req: Request, _res: Response, next: NextFunction) => {
        const extractCurrectDbUser = await  getDbUserFromReq(req);

        if(extractCurrectDbUser.role !== "admin") {
            throw new AppError(403, "Admin access only");
        }

        next();
    }
);


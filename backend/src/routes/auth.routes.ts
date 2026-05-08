import { Router } from "express";
import { requiredAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { clerkClient, getAuth } from "@clerk/express";
import { AppError } from "../utils/ApiError";
import { User } from "../models/user.model";
import { ok } from "../utils/envelope";

export const  authRouter = Router();

authRouter.post("/sync", requiredAuth, 
    asyncHandler(async(req, res) => {
        const {userId} = getAuth(req);

            if(!userId) {
                throw new AppError(401, "User not authenticated");
            }

        const clerkUser = await clerkClient.users.getUser(userId);

        const extractEmailFromUserInfo = clerkUser.emailAddresses.find(
            item => item.id === clerkUser.primaryEmailAddressId
        ) || clerkUser.emailAddresses[0];

        const email = extractEmailFromUserInfo.emailAddress;

        const fullName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim();

        const name = fullName || clerkUser.username;

        const raw = process.env.ADMIN_EMAILS || "";

        const adminEmails = new Set(
            raw.split(",").map((item) => item.trim().toLocaleLowerCase()).filter(Boolean),
        );

        //if the current user is existing user or not 
        //if existing then update or do nothing
        //if not then create the user and save in db with role

        const existingUser = await User.findOne({clerkUserId : userId});
        const shouldBeAdmin = email ? adminEmails.has(email.toLowerCase()) : false;

        const nextRole = existingUser?.role === "admin"
        ? "admin" 
            : shouldBeAdmin
                ? "admin"
                    : existingUser?.role || "user";
        

        const newlyCreatedDbUser = await User.findOneAndUpdate(
            {
                clerkUserId : userId,
            },
            {
                clerkUserId : userId,
                email,
                name,
                role: nextRole,
            },
            {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true
            }
        );

        res.status(200).json(
            ok({
                user: {
                    id: newlyCreatedDbUser._id,
                    clerkUserId: newlyCreatedDbUser.clerkUserId,
                    email: newlyCreatedDbUser.email,
                    name: newlyCreatedDbUser.name,
                    role: newlyCreatedDbUser.role
                },
            }),
        );
    }),
);

authRouter.get("/me", requiredAuth,
    asyncHandler(
        async(req, res) => {
            const {userId} = getAuth(req);

            if(!userId) {
                throw new AppError(401, "User not authenticated");
            }

            const dbUser = await User.findOne({clerkUserId : userId});

            if(!dbUser) {
                new AppError(404, "User not found");
            }

            res.status(200).json(
            ok({
                user: {
                    id: dbUser._id,
                    clerkUserId: dbUser.clerkUserId,
                    email: dbUser.email,
                    name: dbUser.name,
                    role: dbUser.role
                },
            }),
        );
        }
    )
)
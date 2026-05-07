import 'dotenv/config';
import express from 'express';
import cors from "cors";
import morgan from "morgan";
import { connectDB } from './db';
import { ok } from './utils/envelope';
import { clerkMiddleware } from '@clerk/express';


async function mainEntryFunction() {
    await connectDB();

    const app = express();

    const corsOrigins = (process.env.CORS_ORIGINS || "http://localhost:5000").split(",").map(origin => origin.trim()).filter(Boolean);

    app.use(cors({
        origin: corsOrigins,
        credentials: true,
    }));

    app.use(express.json());
    app.use(morgan("dev"));
    app.use(clerkMiddleware())


    app.get("/health", (_req, res) => {
        res.status(200).json(ok({ message: "Server is healthy/in running state" }));
    });

    const port = process.env.PORT || 5000;

    app.listen(port, () =>{
        console.log(`Server is listening in port ${port}`)
    });
}   

mainEntryFunction().catch(err => {
    console.error("failed to state", err);
    process.exit(1)
});
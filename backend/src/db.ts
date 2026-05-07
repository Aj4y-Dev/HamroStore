import mongoose from "mongoose";

export async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI!);
        console.log("db connected")
    } catch (error) {
        console.error("DB connection failed", error);
        process.exit(1); 
    }
}
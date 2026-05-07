import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/ApiError";
import { fail } from "../utils/envelope";

export function errorHandler(
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction
) {
    if(err instanceof AppError) {
        return res.status(err.statusCode).json(fail(`API_ERROR`));
    }

    console.log("error", err);

    return res.status(500).json(fail(`Internal server error`, 'Internal'));
}
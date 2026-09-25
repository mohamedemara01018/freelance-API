import "express";
import { Types } from "mongoose";
import "multer";

declare global {
    namespace Express {
        interface Request {
            currentUser?: {
                _id: Types.ObjectId | string;
                email: string;
                role: string;
                firstName?: string;
                lastName?: string;
            };
            // Use Express.Multer.File instead of just Multer.File
            file?: Express.Multer.File,
            // files?: Express.Multer.File[];
        }
    }
}

export { };
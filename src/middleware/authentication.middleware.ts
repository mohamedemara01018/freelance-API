import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { appError } from "../utils/appError.utils.js";
import asyncWrapper from "../utils/asyncWrapper.utils.js";
import { statusText } from "../utils/enums.utils.js";
import { User } from "../features/user/user.model.js";

interface DecodedToken {
    email: string;
    role: string;
    isEmailVerified?: boolean;
    isIdentityVerified?: boolean;
    iat?: number;
}

export const authenticationMiddleware = asyncWrapper(
    async (req: Request, res: Response, next: NextFunction) => {
        const { token } = req.cookies;

        if (!token) {
            return next(
                appError({
                    statusCode: 401,
                    message: "Unauthorized. Please login first.",
                    statusText: statusText.FAIL,
                })
            );
        }

        try {
            const decoded = jwt.verify(
                token,
                String(process.env.JWT_TOKEN_SECRET_KEY)
            ) as DecodedToken;

            // Fetch actual user from DB by email
            const user = await User.findOne({ email: decoded.email }).select("_id email role firstName lastName");

            if (!user) {
                return next(
                    appError({
                        statusCode: 401,
                        message: "User account no longer exists.",
                        statusText: statusText.FAIL,
                    })
                );
            }

            req.currentUser = {
                _id: user._id,
                email: user.email,
                role: user.role,
                firstName: user.firstName,
                lastName: user.lastName,
            };

            next();
        } catch (error) {
            return next(
                appError({
                    statusCode: 401,
                    message: "Unauthorized. Invalid or expired token.",
                    statusText: statusText.FAIL,
                })
            );
        }
    }
);
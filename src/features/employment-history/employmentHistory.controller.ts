import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { EmploymentHistory } from "./employmentHistory.model.js";
import { appError } from "../../utils/appError.utils.js";
import asyncWrapper from "../../utils/asyncWrapper.utils.js";
import { statusText } from "../../utils/enums.utils.js";

// ==========================================
// 1. GET ALL EMPLOYMENT HISTORIES (Optionally by Profile)
// ==========================================
export const getAllEmploymentHistories = asyncWrapper(
    async (req: Request, res: Response, next: NextFunction) => {
        const profileId = req.query.profileId as string | undefined;

        const filter = profileId ? { profile: profileId } : {};

        const employmentHistories = await EmploymentHistory.find(filter).populate("profile", "title user");

        res.status(StatusCodes.OK).json({
            message: "employment histories returned successfully",
            data: {
                employmentHistories,
            },
        });
    }
);

// ==========================================
// 2. CREATE EMPLOYMENT HISTORY
// ==========================================
export const createEmploymentHistory = asyncWrapper(
    async (req: Request, res: Response, next: NextFunction) => {
        const {
            profile,
            company,
            position,
            employmentType,
            startDate,
            endDate,
            currentlyWorking,
            description,
        } = req.body;

        if (!profile) {
            return next(
                appError({
                    statusCode: StatusCodes.BAD_REQUEST,
                    message: "profile fields are required",
                    statusText: statusText.FAIL,
                })
            );
        }

        if (!company) {
            return next(
                appError({
                    statusCode: StatusCodes.BAD_REQUEST,
                    message: " company fields are required",
                    statusText: statusText.FAIL,
                })
            );
        }

        if (!position) {
            return next(
                appError({
                    statusCode: StatusCodes.BAD_REQUEST,
                    message: "position fields are required",
                    statusText: statusText.FAIL,
                })
            );
        }

        const newEmploymentHistory = await EmploymentHistory.create({
            profile,
            company,
            position,
            employmentType,
            startDate,
            endDate,
            currentlyWorking,
            description,
        });

        res.status(StatusCodes.CREATED).json({
            message: "Employment history added successfully",
            data: {
                employmentHistory: newEmploymentHistory,
            },
        });
    }
);

// ==========================================
// 3. EDIT EMPLOYMENT HISTORY
// ==========================================
export const editEmploymentHistory = asyncWrapper(
    async (req: Request, res: Response, next: NextFunction) => {
        const { id } = req.params;
        const body = req.body;

        if (!body || Object.keys(body).length === 0) {
            return next(
                appError({
                    statusCode: StatusCodes.BAD_REQUEST,
                    message: "Request body cannot be empty",
                    statusText: statusText.FAIL,
                })
            );
        }

        const updatedEmploymentHistory = await EmploymentHistory.findByIdAndUpdate(
            id,
            { $set: body },
            {
                new: true,
                runValidators: true,
            }
        );

        if (!updatedEmploymentHistory) {
            return next(
                appError({
                    statusCode: StatusCodes.NOT_FOUND,
                    message: "Employment history entry not found",
                    statusText: statusText.FAIL,
                })
            );
        }

        res.status(StatusCodes.OK).json({
            message: "Employment history updated successfully",
            data: {
                employmentHistory: updatedEmploymentHistory,
            },
        });
    }
);

// ==========================================
// 4. DELETE EMPLOYMENT HISTORY
// ==========================================
export const deleteEmploymentHistory = asyncWrapper(
    async (req: Request, res: Response, next: NextFunction) => {
        const { id } = req.params;

        const deletedEmploymentHistory = await EmploymentHistory.findByIdAndDelete(id);

        if (!deletedEmploymentHistory) {
            return next(
                appError({
                    statusCode: StatusCodes.NOT_FOUND,
                    message: "Employment history entry not found",
                    statusText: statusText.FAIL,
                })
            );
        }

        res.status(StatusCodes.OK).json({
            status: statusText.SUCCESS,
            message: "Employment history deleted successfully",
            data: null,
        });
    }
);
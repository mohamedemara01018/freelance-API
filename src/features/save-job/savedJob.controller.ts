import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { appError } from "../../utils/appError.utils.js";
import asyncWrapper from "../../utils/asyncWrapper.utils.js";
import { statusText } from "../../utils/enums.utils.js";
import { Job } from "../job/job.model.js";
import { SavedJob } from "./saveJob.model.js";

// ==========================================
// 1. GET ALL SAVED JOBS (For a specific user)
// ==========================================
export const getUserSavedJobs = asyncWrapper(
    async (req: Request, res: Response, next: NextFunction) => {
        const { user, page = 1, limit = 10 } = req.query;

        if (!user) {
            return next(
                appError({
                    statusCode: StatusCodes.BAD_REQUEST,
                    message: "user ID query parameter is required",
                    statusText: statusText.FAIL,
                })
            );
        }

        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.max(1, Number(limit));
        const skip = (pageNum - 1) * limitNum;

        const [savedJobs, totalSavedJobs] = await Promise.all([
            SavedJob.find({ user: String(user) })
                .populate({
                    path: "job",
                    populate: [
                        { path: "client", select: "firstName lastName avatar" },
                        { path: "category", select: "name slug" },
                    ],
                })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            SavedJob.countDocuments({ user: String(user) }),
        ]);

        res.status(StatusCodes.OK).json({
            status: statusText.SUCCESS,
            message: "Saved jobs fetched successfully",
            data: {
                totalSavedJobs,
                currentPage: pageNum,
                totalPages: Math.ceil(totalSavedJobs / limitNum),
                savedJobs,
            },
        });
    }
);

// ==========================================
// 2. CHECK IF A JOB IS SAVED BY USER
// ==========================================
export const isJobSaved = asyncWrapper(
    async (req: Request, res: Response, next: NextFunction) => {
        const { user, job } = req.query;

        if (!user || !job) {
            return next(
                appError({
                    statusCode: StatusCodes.BAD_REQUEST,
                    message: "Both user and job query parameters are required",
                    statusText: statusText.FAIL,
                })
            );
        }

        const savedRecord = await SavedJob.findOne({
            user: String(user),
            job: String(job),
        });

        res.status(StatusCodes.OK).json({
            status: statusText.SUCCESS,
            message: "Saved status retrieved successfully",
            data: {
                isSaved: Boolean(savedRecord),
                savedJobId: savedRecord ? savedRecord._id : null,
            },
        });
    }
);

// ==========================================
// 3. SAVE A JOB (Bookmark)
// ==========================================
export const saveJob = asyncWrapper(
    async (req: Request, res: Response, next: NextFunction) => {
        const { user, job } = req.body;

        if (!user || !job) {
            return next(
                appError({
                    statusCode: StatusCodes.BAD_REQUEST,
                    message: "Both user and job IDs are required",
                    statusText: statusText.FAIL,
                })
            );
        }

        // 1. Verify job exists
        const existingJob = await Job.findById(job);
        if (!existingJob) {
            return next(
                appError({
                    statusCode: StatusCodes.NOT_FOUND,
                    message: "Job posting not found",
                    statusText: statusText.FAIL,
                })
            );
        }

        // 2. Check if already saved
        const alreadySaved = await SavedJob.findOne({ user, job });
        if (alreadySaved) {
            return next(
                appError({
                    statusCode: StatusCodes.CONFLICT,
                    message: "Job is already saved by this user",
                    statusText: statusText.FAIL,
                })
            );
        }

        // 3. Save job
        const newSavedJob = await SavedJob.create({ user, job });

        await newSavedJob.populate({
            path: "job",
            select: "title budget type location status",
        });

        res.status(StatusCodes.CREATED).json({
            status: statusText.SUCCESS,
            message: "Job saved successfully",
            data: { savedJob: newSavedJob },
        });
    }
);

// ==========================================
// 4. TOGGLE SAVE / UNSAVE JOB
// ==========================================
export const toggleSaveJob = asyncWrapper(
    async (req: Request, res: Response, next: NextFunction) => {
        const { user, job } = req.body;

        if (!user || !job) {
            return next(
                appError({
                    statusCode: StatusCodes.BAD_REQUEST,
                    message: "Both user and job IDs are required",
                    statusText: statusText.FAIL,
                })
            );
        }

        const existingSave = await SavedJob.findOne({ user, job });

        if (existingSave) {
            // Unsave if currently saved
            await SavedJob.findByIdAndDelete(existingSave._id);

            return res.status(StatusCodes.OK).json({
                status: statusText.SUCCESS,
                message: "Job removed from saved list",
                data: { isSaved: false },
            });
        }

        // Save if not currently saved
        const newSavedJob = await SavedJob.create({ user, job });

        res.status(StatusCodes.CREATED).json({
            status: statusText.SUCCESS,
            message: "Job saved successfully",
            data: { isSaved: true, savedJob: newSavedJob },
        });
    }
);

// ==========================================
// 5. UNSAVE / REMOVE SAVED JOB BY ID
// ==========================================
export const unsaveJob = asyncWrapper(
    async (req: Request, res: Response, next: NextFunction) => {
        const { id } = req.params;

        const deletedSavedJob = await SavedJob.findByIdAndDelete(id);

        if (!deletedSavedJob) {
            return next(
                appError({
                    statusCode: StatusCodes.NOT_FOUND,
                    message: "Saved job record not found",
                    statusText: statusText.FAIL,
                })
            );
        }

        res.status(StatusCodes.OK).json({
            status: statusText.SUCCESS,
            message: "Job removed from saved list successfully",
            data: null,
        });
    }
);
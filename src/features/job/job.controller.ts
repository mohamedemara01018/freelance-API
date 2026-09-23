import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { appError } from "../../utils/appError.utils.js";
import asyncWrapper from "../../utils/asyncWrapper.utils.js";
import { AttachmentEntityType, JobStatus, statusText } from "../../utils/enums.utils.js";
import { Job } from "./job.model.js";
import { deleteAttachmentsByEntity } from "../../utils/functions.js";

// ==========================================
// 1. GET ALL JOBS (With Search, Filtering & Pagination)
// ==========================================
export const getAllJobs = asyncWrapper(
    async (req: Request, res: Response, next: NextFunction) => {
        const {
            search,
            category,
            type,
            experienceLevel,
            status,
            minBudget,
            maxBudget,
            client,
            page = 1,
            limit = 10,
        } = req.query;

        const filter: Record<string, any> = {};

        // By default, only show open & public jobs to users unless specifically filtered
        filter.status = status || JobStatus.OPEN;

        if (search) {
            filter.$text = { $search: search as string };
        }

        if (category) filter.category = category;
        if (type) filter.type = type;
        if (experienceLevel) filter.experienceLevel = experienceLevel;
        if (client) filter.client = client;

        // Budget filtering
        if (minBudget || maxBudget) {
            filter.budget = {};
            if (minBudget) filter.budget.$gte = Number(minBudget);
            if (maxBudget) filter.budget.$lte = Number(maxBudget);
        }

        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.max(1, Number(limit));
        const skip = (pageNum - 1) * limitNum;

        const [jobs, totalJobs] = await Promise.all([
            Job.find(filter)
                .populate("client", "firstName lastName avatar email")
                .populate("category", "name")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            Job.countDocuments(filter),
        ]);

        res.status(StatusCodes.OK).json({
            status: statusText.SUCCESS,
            message: "Jobs fetched successfully",
            data: {
                totalJobs,
                currentPage: pageNum,
                totalPages: Math.ceil(totalJobs / limitNum),
                jobs,
            },
        });
    }
);

// ==========================================
// 2. GET SINGLE JOB BY ID
// ==========================================
export const getJobById = asyncWrapper(
    async (req: Request, res: Response, next: NextFunction) => {
        const { id } = req.params;

        const job = await Job.findById(id)
            .populate("client", "firstName lastName avatar email")
            .populate("category", "name")

        if (!job) {
            return next(
                appError({
                    statusCode: StatusCodes.NOT_FOUND,
                    message: "Job posting not found",
                    statusText: statusText.FAIL,
                })
            );
        }

        res.status(StatusCodes.OK).json({
            status: statusText.SUCCESS,
            message: "Job details fetched successfully",
            data: {
                job,
            },
        });
    }
);

// ==========================================
// 3. CREATE JOB POSTING
// ==========================================
export const createJob = asyncWrapper(
    async (req: Request, res: Response, next: NextFunction) => {
        const {
            client,
            category,
            title,
            description,
            type,
            budget,
            hourlyRateFrom,
            hourlyRateTo,
            duration,
            experienceLevel,
            visibility,
            location,
            maxProposals,
            status,
        } = req.body;

        if (!client || !category || !title || !description || !type || budget === undefined) {
            return next(
                appError({
                    statusCode: StatusCodes.BAD_REQUEST,
                    message: "client, category, title, description, type, and budget are required fields",
                    statusText: statusText.FAIL,
                })
            );
        }

        const newJob = await Job.create({
            client,
            category,
            title,
            description,
            type,
            budget,
            hourlyRateFrom: hourlyRateFrom || null,
            hourlyRateTo: hourlyRateTo || null,
            duration: duration || null,
            experienceLevel,
            visibility,
            location,
            maxProposals: maxProposals || null,
            status: status || JobStatus.OPEN,
            publishedAt: new Date(),
        });

        await newJob.populate([
            { path: "category", select: "name" },
            { path: "client", select: "firstName lastName email" },
        ]);

        res.status(StatusCodes.CREATED).json({
            status: statusText.SUCCESS,
            message: "Job posted successfully",
            data: {
                job: newJob,
            },
        });
    }
);

// ==========================================
// 4. EDIT / UPDATE JOB POSTING
// ==========================================
export const editJob = asyncWrapper(
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

        // Auto set closedAt timestamp if status is being updated to closed or cancelled
        if (body.status && (body.status === JobStatus.CLOSED || body.status === JobStatus.CANCELLED)) {
            body.closedAt = new Date();
        }

        const updatedJob = await Job.findByIdAndUpdate(
            id,
            { $set: body },
            {
                new: true,
                runValidators: true,
            }
        )
            .populate("client", "firstName lastName avatar email")
            .populate("category", "name");

        if (!updatedJob) {
            return next(
                appError({
                    statusCode: StatusCodes.NOT_FOUND,
                    message: "Job posting not found",
                    statusText: statusText.FAIL,
                })
            );
        }

        res.status(StatusCodes.OK).json({
            status: statusText.SUCCESS,
            message: "Job posting updated successfully",
            data: {
                job: updatedJob,
            },
        });
    }
);

// ==========================================
// 5. DELETE JOB POSTING
// ==========================================
// ==========================================
// 5. DELETE JOB POSTING
// ==========================================
export const deleteJob = asyncWrapper(
    async (req: Request, res: Response, next: NextFunction) => {
        const { id } = req.params;

        if (!id) {
            return next(
                appError({
                    statusCode: StatusCodes.BAD_REQUEST,
                    message: "Job id is required",
                    statusText: statusText.FAIL,
                })
            );
        }

        const deletedJob = await Job.findByIdAndDelete(id);

        if (!deletedJob) {
            return next(
                appError({
                    statusCode: StatusCodes.NOT_FOUND,
                    message: "Job posting not found",
                    statusText: statusText.FAIL,
                })
            );
        }

        // Clean up external storage & database records for attachments linked to this job
        await deleteAttachmentsByEntity(
            AttachmentEntityType.JOB,
            id as string
        );

        res.status(StatusCodes.OK).json({
            status: statusText.SUCCESS,
            message: "Job posting and associated attachments deleted successfully",
            data: null,
        });
    }
);
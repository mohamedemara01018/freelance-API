import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { appError } from "../../utils/appError.utils.js";
import asyncWrapper from "../../utils/asyncWrapper.utils.js";
import { statusText } from "../../utils/enums.utils.js";
import JobSkill from "./jobSkill.model.js";

// ==========================================
// 1. GET JOB SKILLS (By Job ID or Skill ID)
// ==========================================
export const getJobSkills = asyncWrapper(
    async (req: Request, res: Response, next: NextFunction) => {
        const { jobId, skillId, isRequired } = req.query;

        const filter: Record<string, any> = {};

        if (jobId) filter.job = jobId;
        if (skillId) filter.skill = skillId;
        if (isRequired !== undefined) filter.isRequired = isRequired === "true";

        const jobSkills = await JobSkill.find(filter)
            .populate("job", "title client status type budget")
            .populate("skill", "name slug category icon");

        res.status(StatusCodes.OK).json({
            message: "Job skills returned successfully",
            data: {
                jobSkills,
            },
        });
    }
);

// ==========================================
// 2. GET SINGLE JOB SKILL BY ID
// ==========================================
export const getJobSkillById = asyncWrapper(
    async (req: Request, res: Response, next: NextFunction) => {
        const { id } = req.params;

        const jobSkill = await JobSkill.findById(id)
            .populate("job", "title client status type budget")
            .populate("skill", "name slug category icon");

        if (!jobSkill) {
            return next(
                appError({
                    statusCode: StatusCodes.NOT_FOUND,
                    message: "Job skill not found",
                    statusText: statusText.FAIL,
                })
            );
        }

        res.status(StatusCodes.OK).json({
            message: "Job skill returned successfully",
            data: {
                jobSkill,
            },
        });
    }
);

// ==========================================
// 3. ADD SKILL TO JOB
// ==========================================
export const createJobSkill = asyncWrapper(
    async (req: Request, res: Response, next: NextFunction) => {
        const { job, skill, isRequired } = req.body;

        if (!job || !skill) {
            return next(
                appError({
                    statusCode: StatusCodes.BAD_REQUEST,
                    message: "job and skill fields are required",
                    statusText: statusText.FAIL,
                })
            );
        }

        // Check if the skill is already attached to this job
        const existingJobSkill = await JobSkill.findOne({ job, skill });
        if (existingJobSkill) {
            return next(
                appError({
                    statusCode: StatusCodes.CONFLICT,
                    message: "This skill is already added to the specified job",
                    statusText: statusText.FAIL,
                })
            );
        }

        const newJobSkill = await JobSkill.create({
            job,
            skill,
            isRequired,
        });

        // Populate skill and job details in response for convenience
        await newJobSkill.populate("skill", "name slug category icon");

        res.status(StatusCodes.CREATED).json({
            message: "Skill added to job successfully",
            data: {
                jobSkill: newJobSkill,
            },
        });
    }
);

// ==========================================
// 4. EDIT JOB SKILL
// ==========================================
export const editJobSkill = asyncWrapper(
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

        const updatedJobSkill = await JobSkill.findByIdAndUpdate(
            id,
            { $set: body },
            {
                new: true,
                runValidators: true,
            }
        ).populate("skill", "name slug category icon");

        if (!updatedJobSkill) {
            return next(
                appError({
                    statusCode: StatusCodes.NOT_FOUND,
                    message: "Job skill entry not found",
                    statusText: statusText.FAIL,
                })
            );
        }

        res.status(StatusCodes.OK).json({
            message: "Job skill updated successfully",
            data: {
                jobSkill: updatedJobSkill,
            },
        });
    }
);

// ==========================================
// 5. REMOVE SKILL FROM JOB
// ==========================================
export const deleteJobSkill = asyncWrapper(
    async (req: Request, res: Response, next: NextFunction) => {
        const { id } = req.params;

        const deletedJobSkill = await JobSkill.findByIdAndDelete(id);

        if (!deletedJobSkill) {
            return next(
                appError({
                    statusCode: StatusCodes.NOT_FOUND,
                    message: "Job skill entry not found",
                    statusText: statusText.FAIL,
                })
            );
        }

        res.status(StatusCodes.OK).json({
            status: statusText.SUCCESS,
            message: "Skill removed from job successfully",
            data: null,
        });
    }
);
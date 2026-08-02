import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { appError } from "../../utils/appError.utils.js";
import asyncWrapper from "../../utils/asyncWrapper.utils.js";
import { statusText } from "../../utils/enums.utils.js";
import { Skill } from "./skill.model.js";

// Helper function to convert name to slug if client doesn't send one
const generateSlug = (name: string): string => {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
};

// ==========================================
// 1. GET ALL SKILLS (With Optional Search & Category Filter)
// ==========================================
export const getAllSkills = asyncWrapper(
    async (req: Request, res: Response, next: NextFunction) => {
        const { search, categoryId } = req.query;

        const filter: Record<string, any> = {};

        if (search) {
            filter.$text = { $search: search as string };
        }

        if (categoryId) {
            filter.category = categoryId;
        }

        const skills = await Skill.find(filter).populate("category", "name description");

        res.status(StatusCodes.OK).json({
            message: "Skills returned successfully",
            data: {
                skills,
            },
        });
    }
);

// ==========================================
// 2. GET SINGLE SKILL BY ID OR SLUG
// ==========================================
export const getSkillById = asyncWrapper(
    async (req: Request, res: Response, next: NextFunction) => {
        const { id } = req.params;

        // Check if param is a valid Mongo ObjectId, otherwise search by slug
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(String(id));
        const filter = isObjectId ? { _id: id } : { slug: String(id).toLowerCase() };

        const skill = await Skill.findOne(filter).populate("category", "name description");

        if (!skill) {
            return next(
                appError({
                    statusCode: StatusCodes.NOT_FOUND,
                    message: "Skill not found",
                    statusText: statusText.FAIL,
                })
            );
        }

        res.status(StatusCodes.OK).json({
            message: "Skill returned successfully",
            data: {
                skill,
            },
        });
    }
);

// ==========================================
// 3. CREATE SKILL
// ==========================================
export const createSkill = asyncWrapper(
    async (req: Request, res: Response, next: NextFunction) => {
        const { name, slug, category, description, icon } = req.body;

        if (!name) {
            return next(
                appError({
                    statusCode: StatusCodes.BAD_REQUEST,
                    message: "Skill name is required",
                    statusText: statusText.FAIL,
                })
            );
        }

        // Auto-generate slug if not provided explicitly
        const finalSlug = slug ? slug.toLowerCase().trim() : generateSlug(name);

        // Check if name or slug already exists
        const existingSkill = await Skill.findOne({
            $or: [{ name }, { slug: finalSlug }],
        });

        if (existingSkill) {
            return next(
                appError({
                    statusCode: StatusCodes.CONFLICT,
                    message: "Skill with this name or slug already exists",
                    statusText: statusText.FAIL,
                })
            );
        }

        const newSkill = await Skill.create({
            name,
            slug: finalSlug,
            category: category || null,
            description,
            icon,
        });

        res.status(StatusCodes.CREATED).json({
            message: "Skill created successfully",
            data: {
                skill: newSkill,
            },
        });
    }
);

// ==========================================
// 4. EDIT SKILL
// ==========================================
export const editSkill = asyncWrapper(
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

        // Auto-update slug if name is updated without a custom slug
        if (body.name && !body.slug) {
            body.slug = generateSlug(body.name);
        }

        const updatedSkill = await Skill.findByIdAndUpdate(
            id,
            { $set: body },
            {
                new: true,
                runValidators: true,
            }
        ).populate("category", "name description");

        if (!updatedSkill) {
            return next(
                appError({
                    statusCode: StatusCodes.NOT_FOUND,
                    message: "Skill not found",
                    statusText: statusText.FAIL,
                })
            );
        }

        res.status(StatusCodes.OK).json({
            message: "Skill updated successfully",
            data: {
                skill: updatedSkill,
            },
        });
    }
);

// ==========================================
// 5. DELETE SKILL
// ==========================================
export const deleteSkill = asyncWrapper(
    async (req: Request, res: Response, next: NextFunction) => {
        const { id } = req.params;

        const deletedSkill = await Skill.findByIdAndDelete(id);

        if (!deletedSkill) {
            return next(
                appError({
                    statusCode: StatusCodes.NOT_FOUND,
                    message: "Skill not found",
                    statusText: statusText.FAIL,
                })
            );
        }

        res.status(StatusCodes.OK).json({
            status: statusText.SUCCESS,
            message: "Skill deleted successfully",
            data: null,
        });
    }
);
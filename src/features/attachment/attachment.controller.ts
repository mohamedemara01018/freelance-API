import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { appError } from "../../utils/appError.utils.js";
import asyncWrapper from "../../utils/asyncWrapper.utils.js";
import { AttachmentEntityType, statusText } from "../../utils/enums.utils.js";
import Attachment from "./attachment.model.js";

// ==========================================
// 1. GET ALL ATTACHMENTS (Filter by entity, user, or fileType)
// ==========================================
export const getAllAttachments = asyncWrapper(
    async (req: Request, res: Response, next: NextFunction) => {
        const { entityType, entityId, uploadedBy, fileType, page = 1, limit = 10 } = req.query;

        const filter: Record<string, any> = {};

        if (entityType) filter.entityType = entityType;
        if (entityId) filter.entityId = entityId;
        if (uploadedBy) filter.uploadedBy = uploadedBy;
        if (fileType) filter.fileType = fileType;

        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.max(1, Number(limit));
        const skip = (pageNum - 1) * limitNum;

        const [attachments, totalAttachments] = await Promise.all([
            Attachment.find(filter)
                .populate("uploadedBy", "firstName lastName avatar email")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            Attachment.countDocuments(filter),
        ]);

        res.status(StatusCodes.OK).json({
            status: statusText.SUCCESS,
            message: "Attachments fetched successfully",
            data: {
                totalAttachments,
                currentPage: pageNum,
                totalPages: Math.ceil(totalAttachments / limitNum),
                attachments,
            },
        });
    }
);

// ==========================================
// 2. GET ATTACHMENTS FOR A SPECIFIC ENTITY
// ==========================================
export const getEntityAttachments = asyncWrapper(
    async (req: Request, res: Response, next: NextFunction) => {
        const { entityType, entityId } = req.params;

        if (!Object.values(AttachmentEntityType).includes(entityType as AttachmentEntityType)) {
            return next(
                appError({
                    statusCode: StatusCodes.BAD_REQUEST,
                    message: "Invalid entity type provided",
                    statusText: statusText.FAIL,
                })
            );
        }

        const attachments = await Attachment.find({ entityType: entityType as AttachmentEntityType, entityId })
            .populate("uploadedBy", "firstName lastName avatar")
            .sort({ createdAt: -1 });

        res.status(StatusCodes.OK).json({
            status: statusText.SUCCESS,
            message: `Attachments for ${entityType} fetched successfully`,
            data: { attachments },
        });
    }
);

// ==========================================
// 3. GET SINGLE ATTACHMENT BY ID
// ==========================================
export const getAttachmentById = asyncWrapper(
    async (req: Request, res: Response, next: NextFunction) => {
        const { id } = req.params;

        const attachment = await Attachment.findById(id).populate("uploadedBy", "firstName lastName avatar email");

        if (!attachment) {
            return next(
                appError({
                    statusCode: StatusCodes.NOT_FOUND,
                    message: "Attachment not found",
                    statusText: statusText.FAIL,
                })
            );
        }

        res.status(StatusCodes.OK).json({
            status: statusText.SUCCESS,
            message: "Attachment details fetched successfully",
            data: { attachment },
        });
    }
);

// ==========================================
// 4. CREATE SINGLE OR BULK ATTACHMENTS
// ==========================================
export const createAttachment = asyncWrapper(
    async (req: Request, res: Response, next: NextFunction) => {
        // Accepts an array (bulk upload) or a single object payload
        const attachmentsData = Array.isArray(req.body) ? req.body : [req.body];

        if (attachmentsData.length === 0) {
            return next(
                appError({
                    statusCode: StatusCodes.BAD_REQUEST,
                    message: "Attachment payload cannot be empty",
                    statusText: statusText.FAIL,
                })
            );
        }

        // Validate required fields on each items
        for (const item of attachmentsData) {
            const { uploadedBy, entityType, entityId, fileType, originalName, fileName, url, publicId, mimeType, extension, size } = item;
            if (!uploadedBy || !entityType || !entityId || !fileType || !originalName || !fileName || !url || !publicId || !mimeType || !extension || size === undefined) {
                return next(
                    appError({
                        statusCode: StatusCodes.BAD_REQUEST,
                        message: "All attachment fields (uploadedBy, entityType, entityId, fileType, originalName, fileName, url, publicId, mimeType, extension, size) are required",
                        statusText: statusText.FAIL,
                    })
                );
            }
        }

        const createdAttachments = await Attachment.insertMany(attachmentsData);

        res.status(StatusCodes.CREATED).json({
            status: statusText.SUCCESS,
            message: `${createdAttachments.length} attachment(s) created successfully`,
            data: { attachments: createdAttachments },
        });
    }
);

// ==========================================
// 5. DELETE ATTACHMENT BY ID
// ==========================================
export const deleteAttachment = asyncWrapper(
    async (req: Request, res: Response, next: NextFunction) => {
        const { id } = req.params;

        const deletedAttachment = await Attachment.findByIdAndDelete(id);

        if (!deletedAttachment) {
            return next(
                appError({
                    statusCode: StatusCodes.NOT_FOUND,
                    message: "Attachment not found",
                    statusText: statusText.FAIL,
                })
            );
        }

        // Note: You can trigger Cloudinary/S3 deletion logic here using deletedAttachment.publicId

        res.status(StatusCodes.OK).json({
            status: statusText.SUCCESS,
            message: "Attachment record deleted successfully",
            data: null,
        });
    }
);
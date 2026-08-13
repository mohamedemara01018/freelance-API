import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { appError } from "../../utils/appError.utils.js";
import asyncWrapper from "../../utils/asyncWrapper.utils.js";
import { AttachmentEntityType, cloudinaryFolderPath, statusText } from "../../utils/enums.utils.js";
import { Attachment } from "./attachment.model.js";
import { destroyImageFromCloudinary, ICloudinaryProbs, uploadImageToCloudinary } from "../../utils/cloudinary.utils.js";
import { VerificationRequest } from "../verification-request/verificationRequest.model.js";

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
        // Extract uploaded files from Multer
        let fileList: Express.Multer.File[] = [];

        if (Array.isArray(req.files)) {
            fileList = req.files;
        } else if (req.files && typeof req.files === "object") {
            // Handle dictionary of fields (e.g., req.files['attachments'])
            fileList = Object.values(req.files).flat();
        } else if (req.file) {
            fileList = [req.file];
        }

        // 1. Validation for empty files payload
        if (!fileList || fileList.length === 0) {
            return next(
                appError({
                    statusCode: StatusCodes.BAD_REQUEST,
                    message: "Attachment payload cannot be empty. Please upload at least one file.",
                    statusText: statusText.FAIL,
                })
            );
        }

        const { entityId, entityType, uploadedBy } = req.body;

        if (!entityId) {
            return next(
                appError({
                    statusCode: StatusCodes.BAD_REQUEST,
                    message: "entityId is required",
                    statusText: statusText.FAIL,
                })
            );
        }

        if (!entityType) {
            return next(
                appError({
                    statusCode: StatusCodes.BAD_REQUEST,
                    message: "entityType is required",
                    statusText: statusText.FAIL,
                })
            );
        }
        let entity;
        if (entityType == AttachmentEntityType.VERIFICATION) {
            entity = await VerificationRequest.findById(entityId);
        }

        if (!entity) {
            return next(
                appError({
                    statusCode: StatusCodes.BAD_REQUEST,
                    message: `entity id is wrong`,
                    statusText: statusText.FAIL,
                })
            );
        }

        if (!uploadedBy) {
            return next(
                appError({
                    statusCode: StatusCodes.BAD_REQUEST,
                    message: "uploadedBy is required",
                    statusText: statusText.FAIL,
                })
            );
        }

        // 2. Concurrently upload files to Cloudinary
        const uploadPromises = fileList.map((file) => {
            const fileName = `image-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
            return uploadImageToCloudinary(
                file.buffer,
                cloudinaryFolderPath.IMAGE,
                fileName
            ) as Promise<ICloudinaryProbs>;
        });

        const uploadResults = await Promise.all(uploadPromises);

        // 3. Map uploaded data to Attachment schema structure
        const attachmentsToCreate = uploadResults.map((result, index) => ({
            url: result.secure_url,
            publicId: result.public_id,
            originalName: fileList[index].originalname,
            mimeType: fileList[index].mimetype,
            fileName: result.display_name,
            size: fileList[index].size,
            entityId: entityId,
            entityType: entityType,
            uploadedBy: uploadedBy,
        }));

        // 4. Save to Database
        const createdAttachments = await Attachment.insertMany(attachmentsToCreate);

        res.status(StatusCodes.CREATED).json({
            status: statusText.SUCCESS,
            message: `${createdAttachments.length} attachment(s) uploaded successfully`,
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

        await destroyImageFromCloudinary(deletedAttachment?.publicId as string)
        // Note: You can trigger Cloudinary/S3 deletion logic here using deletedAttachment.publicId

        res.status(StatusCodes.OK).json({
            status: statusText.SUCCESS,
            message: "Attachment record deleted successfully",
            data: null,
        });
    }
);

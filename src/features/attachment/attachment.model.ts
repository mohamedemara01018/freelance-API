import { Schema, model, Types } from "mongoose";
import { AttachmentEntityType, AttachmentType } from "../../utils/enums.utils";



const attachmentSchema = new Schema(
    {
        uploadedBy: {
            type: Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        entityType: {
            type: String,
            enum: Object.values(AttachmentEntityType),
            required: true,
            index: true,
        },

        entityId: {
            type: Types.ObjectId,
            required: true,
            index: true,
        },

        fileType: {
            type: String,
            enum: Object.values(AttachmentType),
            required: true,
        },

        originalName: {
            type: String,
            required: true,
            trim: true,
        },

        fileName: {
            type: String,
            required: true,
            trim: true,
        },

        url: {
            type: String,
            required: true,
        },

        publicId: {
            type: String,
            required: true,
            unique: true,
        },

        mimeType: {
            type: String,
            required: true,
        },

        extension: {
            type: String,
            required: true,
        },

        size: {
            type: Number,
            required: true,
            min: 0,
        },

        isPublic: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

/**
 * Retrieve all attachments for an entity.
 */
attachmentSchema.index({
    entityType: 1,
    entityId: 1,
});

/**
 * Retrieve uploads by user.
 */
attachmentSchema.index({
    uploadedBy: 1,
    createdAt: -1,
});

/**
 * Filter by type.
 */
attachmentSchema.index({
    fileType: 1,
});

export default model("Attachment", attachmentSchema);
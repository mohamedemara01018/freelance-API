import { Attachment } from "../features/attachment/attachment.model";
import { destroyImageFromCloudinary } from "./cloudinary.utils";
import { AttachmentEntityType } from "./enums.utils";

export const deleteAttachmentsByEntity = async (
    entityType: AttachmentEntityType,
    entityId: string
) => {
    const attachments = await Attachment.find({
        entityType,
        entityId,
    }).sort({ createdAt: -1 });

    if (!attachments.length) {
        return;
    }

    // Delete attachments from database
    await Attachment.deleteMany({
        entityType,
        entityId,
    });

    // Delete files from Cloudinary
    await Promise.all(
        attachments
            .filter((attachment) => attachment.publicId)
            .map((attachment) =>
                destroyImageFromCloudinary(attachment.publicId)
            )
    );  
};
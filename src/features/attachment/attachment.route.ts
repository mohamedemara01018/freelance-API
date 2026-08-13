import { Router } from "express";
import * as attachmentController from "./attachment.controller.js";
import { upload } from "../../middleware/multer.middleware.js";

const router = Router();

// ==========================================
// Attachment Routes
// ==========================================

// GET  /api/v1/attachments - Fetch attachments (?entityType=job&entityId=ID or ?uploadedBy=USER_ID)
// POST /api/v1/attachments - Register single or bulk attachment records
router
    .route("/")
    .get(attachmentController.getAllAttachments)
    .post(upload.array('url'), attachmentController.createAttachment);

// GET /api/v1/attachments/entity/job/6691a1b2c3d4e5f6a7b8c9d0 - Get attachments linked to an entity
router
    .route("/entity/:entityType/:entityId")
    .get(attachmentController.getEntityAttachments)

// GET    /api/v1/attachments/:id - Fetch single attachment details
// DELETE /api/v1/attachments/:id - Delete attachment record
router
    .route("/:id")
    .get(attachmentController.getAttachmentById)
    .delete(attachmentController.deleteAttachment);

export default router;
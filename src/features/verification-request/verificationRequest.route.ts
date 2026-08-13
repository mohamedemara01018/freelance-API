import { Router } from "express";
import * as verificationController from "./verificationRequest.controller.js";

const router = Router();

// ==========================================
// Verification Request Routes
// ==========================================

// GET  /api/v1/verifications - Admin dashboard list (?status=pending&user=ID)
// POST /api/v1/verifications - Submit a new verification request
router
    .route("/")
    .get(verificationController.getAllVerificationRequests)
    .post(verificationController.createVerificationRequest)


// PATCH /api/v1/verifications/:id/review - Admin approve or reject request
router
    .route("/:id/review")
    .patch(verificationController.reviewVerificationRequest);

// GET    /api/v1/verifications/:id - Single request details
// DELETE /api/v1/verifications/:id - Remove request record
router
    .route("/:id")
    .get(verificationController.getVerificationRequestById)
    .delete(verificationController.deleteVerificationRequest);

router
    .route("/user/:userId")
    .get(verificationController.getVerificationByUserId);


export default router;
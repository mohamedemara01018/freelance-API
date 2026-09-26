import { Router } from "express";
import * as proposalController from "./proposal.controller.js";

const router = Router();

// ==========================================
// Proposal Routes
// ==========================================

// GET  /api/v1/proposals - Fetch proposals (?job=ID or ?freelancer=ID or ?status=pending)
// POST /api/v1/proposals - Submit a new proposal
router
    .route("/")
    .get(proposalController.getAllProposals)
    .post(proposalController.createProposal);

// GET    /api/v1/proposals/:id        - Get proposal details
// PUT    /api/v1/proposals/:id        - Update proposal details (coverLetter, bidAmount, estimatedDuration)
// PATCH  /api/v1/proposals/:id/status - Change proposal status (accept, reject, shortlist)
// DELETE /api/v1/proposals/:id        - Delete/withdraw proposal
router
    .route("/:id")
    .get(proposalController.getProposalById)
    .put(proposalController.updateProposal)
    .delete(proposalController.deleteProposal);

router
    .route("/:id/status")
    .patch(proposalController.updateProposalStatus);

export default router;
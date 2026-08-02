import { Router } from "express";
import * as portfolioController from "./portfolioItem.controller.js";
import { upload } from "../../middleware/multer.middleware.js";

const router = Router();

// ==========================================
// Portfolio Item Routes
// ==========================================

// GET  /api/v1/portfolio - Fetch portfolio items (?freelancer=ID or ?technology=ID or ?featured=true)
// POST /api/v1/portfolio - Create a new portfolio project
router
    .route("/")
    .get(portfolioController.getAllPortfolioItems)
    .post(upload.fields([
        { name: 'thumbnail', maxCount: 1 },
        { name: 'images', maxCount: 10 }
    ]), portfolioController.createPortfolioItem);

// GET    /api/v1/portfolio/:id - Get project details (Auto-increments views counter)
// PATCH  /api/v1/portfolio/:id - Edit project details
// DELETE /api/v1/portfolio/:id - Remove portfolio item
router
    .route("/:id")
    .get(portfolioController.getPortfolioItemById)
    .patch(portfolioController.editPortfolioItem)
    .delete(portfolioController.deletePortfolioItem);

router.post('/thumbnail/change/:id', upload.fields([
    { name: 'thumbnail', maxCount: 1 },
]), portfolioController.changeThumbnail)

router.post('/thumbnail/add/:id', upload.fields([
    { name: 'thumbnail', maxCount: 1 },
]), portfolioController.addThumbnail)

router.post('/thumbnail/delete/:id', portfolioController.deleteThumbnail)

router.post('/images/add/:id', upload.fields([
    { name: 'images', maxCount: 10 },
]), portfolioController.addImage)

router.post('/images/delete/:id', portfolioController.deleteImage)


export default router;
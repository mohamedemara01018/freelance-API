import { Router } from "express";
import {
    getAllCountries,
    getCountryById,
    createCountry,
    editCountry,
    deleteCountry,
} from "./country.controller.js";
import { upload } from "../../middleware/multer.middleware.js";

const router = Router();

// ==========================================
// COUNTRY ROUTES
// ==========================================

router
    .route("/")
    .get(getAllCountries)
    .post(upload.single("flag"), createCountry);

router
    .route("/:id")
    .get(getCountryById)
    .patch(upload.single("flag"), editCountry)
    .delete(deleteCountry);

export default router;
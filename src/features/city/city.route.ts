import { Router } from "express";
import {
    getAllCities,
    getCityById,
    createCity,
    editCity,
    deleteCity,
} from "./city.controller.js";

const router = Router();

// ==========================================
// CITY ROUTES
// ==========================================

router
    .route("/")
    .get(getAllCities)
    .post(createCity);

router
    .route("/:id")
    .get(getCityById)
    .patch(editCity)
    .delete(deleteCity);

export default router;
import { Router } from "express";
import {
    getUserSavedJobs,
    isJobSaved,
    saveJob,
    toggleSaveJob,
    unsaveJob,
} from "./savedJob.controller.js";

const router = Router();

router.route("/")
    .get(getUserSavedJobs)
    .post(saveJob);

router.get("/check", isJobSaved);
router.post("/toggle", toggleSaveJob);
router.delete("/:id", unsaveJob);

export default router;
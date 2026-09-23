import { Router } from "express";
import {
    getJobSkills,
    getJobSkillById,
    createJobSkill,
    editJobSkill,
    deleteJobSkill,
} from "./jobSkill.controller.js";

const router = Router();

router.route("/")
    .get(getJobSkills)
    .post(createJobSkill);

router.route("/:id")
    .get(getJobSkillById)
    .patch(editJobSkill)
    .delete(deleteJobSkill);

export default router;
import { Schema, model, Types } from "mongoose";

const jobSkillSchema = new Schema(
    {
        job: {
            type: Types.ObjectId,
            ref: "Job",
            required: true,
            index: true,
        },

        skill: {
            type: Types.ObjectId,
            ref: "Skill",
            required: true,
            index: true,
        },

        isRequired: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

/**
 * Prevent the same skill from being
 * added to the same job more than once.
 */
jobSkillSchema.index(
    {
        job: 1,
        skill: 1,
    },
    {
        unique: true,
    }
);

/**
 * Find all skills required by a job.
 */
jobSkillSchema.index({
    job: 1,
});

/**
 * Find all jobs requiring a specific skill.
 */
jobSkillSchema.index({
    skill: 1,
});

export default model("JobSkill", jobSkillSchema);
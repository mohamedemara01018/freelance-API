import mongoose from "mongoose";

const skillSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            maxlength: 100,
        },

        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            default: null,
        },

        description: {
            type: String,
            maxlength: 500,
        },

        icon: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

skillSchema.index({ name: "text" });

export const Skill = mongoose.model("Skill", skillSchema);
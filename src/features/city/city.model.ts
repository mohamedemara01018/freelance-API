import mongoose, { Schema, Document } from "mongoose";

export interface ICity extends Document {
    name: string;
    country: mongoose.Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}

const citySchema = new Schema<ICity>(
    {
        name: {
            type: String,
            required: [true, "City name is required"],
            trim: true,
            maxlength: 100,
        },

        country: {
            type: Schema.Types.ObjectId,
            ref: "Country",
            required: [true, "Country ID is required"],
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Prevent duplicate city names within the same country
citySchema.index({ name: 1, country: 1 }, { unique: true });
citySchema.index({ name: "text" });

export const City = mongoose.models.City || mongoose.model<ICity>("City", citySchema);
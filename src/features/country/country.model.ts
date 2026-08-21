import mongoose, { Schema, Document } from "mongoose";

export interface ICountry extends Document {
    name: string;
    code: string;
    dialCode?: string;
    flag: {
        image: string;
        publicId: string;
    };
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

const countrySchema = new Schema<ICountry>(
    {
        name: {
            type: String,
            required: [true, "Country name is required"],
            unique: true,
            trim: true,
            maxlength: 100,
        },

        code: {
            type: String,
            required: [true, "Country ISO code is required"],
            unique: true,
            uppercase: true,
            trim: true,
            minlength: 2,
            maxlength: 3,
        },

        dialCode: {
            type: String,
            trim: true,
            default: null,
        },

        flag: {
            image: {
                type: String,
                required: [true, "Flag image URL is required"],
            },
            publicId: {
                type: String,
                required: [true, "Flag public ID is required"],
            },
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

countrySchema.index({ name: "text", code: "text" });

export const Country = mongoose.models.Country || mongoose.model<ICountry>("Country", countrySchema);
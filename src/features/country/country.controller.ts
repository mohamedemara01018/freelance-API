import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { Country, ICountry } from "./country.model.js";
import { appError } from "../../utils/appError.utils.js";
import asyncWrapper from "../../utils/asyncWrapper.utils.js";
import { cloudinaryFolderPath, statusText } from "../../utils/enums.utils.js";
import { destroyImageFromCloudinary, ICloudinaryProbs, replaceImageFromCloudinary, uploadImageToCloudinary } from "../../utils/cloudinary.utils.js";

// ==========================================
// 1. GET ALL COUNTRIES (With Search & Pagination)
// ==========================================
export const getAllCountries = asyncWrapper(
    async (req: Request, res: Response, next: NextFunction) => {
        const search = req.query.search as string | undefined;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const isActive = req.query.isActive as string | undefined;

        const filter: Record<string, any> = {};

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { code: { $regex: search, $options: "i" } },
                { dialCode: { $regex: search, $options: "i" } },
            ];
        }

        if (isActive !== undefined) {
            filter.isActive = isActive === "true";
        }

        const skip = (page - 1) * limit;

        const [countries, totalItems] = await Promise.all([
            Country.find(filter)
                .sort({ name: 1 })
                .skip(skip)
                .limit(limit),
            Country.countDocuments(filter),
        ]);

        const totalPages = Math.ceil(totalItems / limit) || 1;

        res.status(StatusCodes.OK).json({
            status: statusText.SUCCESS,
            message: "Countries returned successfully",
            data: {
                countries,
                pagination: {
                    page,
                    limit,
                    totalItems,
                    totalPages,
                },
            },
        });
    }
);

// ==========================================
// 2. GET SINGLE COUNTRY BY ID
// ==========================================
export const getCountryById = asyncWrapper(
    async (req: Request, res: Response, next: NextFunction) => {
        const { id } = req.params;

        const country = await Country.findById(id);

        if (!country) {
            return next(
                appError({
                    statusCode: StatusCodes.NOT_FOUND,
                    message: "Country not found",
                    statusText: statusText.FAIL,
                })
            );
        }

        res.status(StatusCodes.OK).json({
            status: statusText.SUCCESS,
            message: "Country returned successfully",
            data: {
                country,
            },
        });
    }
);

// ==========================================
// 3. CREATE COUNTRY
// ==========================================
export const createCountry = asyncWrapper(
    async (req: Request, res: Response, next: NextFunction) => {
        const { name, code, dialCode, isActive } = req.body;

        // 1. Basic field validations
        if (!name || !code) {
            return next(
                appError({
                    statusCode: StatusCodes.BAD_REQUEST,
                    message: "Country name and ISO code are required fields",
                    statusText: statusText.FAIL,
                })
            );
        }

        // 2. Validate file upload
        const file = req.file;

        if (!file) {
            return next(
                appError({
                    statusCode: StatusCodes.BAD_REQUEST,
                    message: "A flag image file is required",
                    statusText: statusText.FAIL,
                })
            );
        }

        // 3. Check for duplicates
        const existingCountry = await Country.findOne({
            $or: [{ name }, { code: code.toUpperCase() }],
        });

        if (existingCountry) {
            return next(
                appError({
                    statusCode: StatusCodes.CONFLICT,
                    message: "Country with this name or code already exists",
                    statusText: statusText.FAIL,
                })
            );
        }

        // 4. Upload Flag Image to Cloudinary
        const fileName = `flag-${code.toLowerCase()}-${Date.now()}`;
        const uploadedFlag = (await uploadImageToCloudinary(
            file.buffer,
            cloudinaryFolderPath.IMAGE,
            fileName
        )) as ICloudinaryProbs;

        // 5. Create Country Record
        const newCountry = await Country.create({
            name,
            code: code.toUpperCase(),
            dialCode: dialCode || null,
            flag: {
                image: uploadedFlag.secure_url,
                publicId: uploadedFlag.public_id,
            },
            isActive: isActive === "true" || isActive === true,
        });

        res.status(StatusCodes.CREATED).json({
            status: statusText.SUCCESS,
            message: "Country created successfully",
            data: { country: newCountry },
        });
    }
);

// ==========================================
// 4. EDIT COUNTRY
// ==========================================
export const editCountry = asyncWrapper(
    async (req: Request, res: Response, next: NextFunction) => {
        const { id } = req.params;
        const body = { ...req.body };

        const country = (await Country.findById(id)) as ICountry;

        if (!country) {
            return next(
                appError({
                    statusCode: StatusCodes.NOT_FOUND,
                    message: "Country not found",
                    statusText: statusText.FAIL,
                })
            );
        }

        if (body.code) {
            body.code = body.code.toUpperCase();
        }

        // Handle Flag update if a new image file is uploaded
        if (req.file) {
            let uploadedFlag: ICloudinaryProbs;

            if (country.flag?.publicId) {
                // Overwrite the existing image on Cloudinary
                uploadedFlag = (await replaceImageFromCloudinary(
                    req.file.buffer,
                    country.flag.publicId
                )) as ICloudinaryProbs;
            } else {
                // Fallback upload if no previous publicId exists
                const fileName = `flag-${(body.code || country.code).toLowerCase()}-${Date.now()}`;
                uploadedFlag = (await uploadImageToCloudinary(
                    req.file.buffer,
                    cloudinaryFolderPath.IMAGE,
                    fileName
                )) as ICloudinaryProbs;
            }

            body.flag = {
                image: uploadedFlag.secure_url,
                publicId: uploadedFlag.public_id,
            };
        }

        if (body.isActive !== undefined) {
            body.isActive = body.isActive === "true" || body.isActive === true;
        }

        const updatedCountry = await Country.findByIdAndUpdate(
            id,
            { $set: body },
            {
                new: true,
                runValidators: true,
            }
        );

        res.status(StatusCodes.OK).json({
            status: statusText.SUCCESS,
            message: "Country updated successfully",
            data: {
                country: updatedCountry,
            },
        });
    }
);

// ==========================================
// 5. DELETE COUNTRY
// ==========================================
export const deleteCountry = asyncWrapper(
    async (req: Request, res: Response, next: NextFunction) => {
        const { id } = req.params;

        const deletedCountry = await Country.findByIdAndDelete(id) as ICountry

        if (!deletedCountry) {
            return next(
                appError({
                    statusCode: StatusCodes.NOT_FOUND,
                    message: "Country not found",
                    statusText: statusText.FAIL,
                })
            );
        }

        if (deletedCountry.flag.publicId) {
            await destroyImageFromCloudinary(deletedCountry.flag.publicId)
        }

        res.status(StatusCodes.OK).json({
            status: statusText.SUCCESS,
            message: "Country deleted successfully",
            data: null,
        });
    }
);
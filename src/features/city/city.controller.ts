import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { City } from "./city.model.js";
import { Country } from "../country/country.model.js";
import { appError } from "../../utils/appError.utils.js";
import asyncWrapper from "../../utils/asyncWrapper.utils.js";
import { statusText } from "../../utils/enums.utils.js";

// ==========================================
// 1. GET ALL CITIES (With Search, Filter & Pagination)
// ==========================================
export const getAllCities = asyncWrapper(
    async (req: Request, res: Response, next: NextFunction) => {
        const search = req.query.search as string | undefined;
        const countryId = req.query.country as string | undefined;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const filter: Record<string, any> = {};

        if (search) {
            filter.name = { $regex: search, $options: "i" };
        }

        if (countryId) {
            filter.country = countryId;
        }

        const skip = (page - 1) * limit;

        const [cities, totalItems] = await Promise.all([
            City.find(filter)
                .populate("country", "name code flag")
                .sort({ name: 1 })
                .skip(skip)
                .limit(limit),
            City.countDocuments(filter),
        ]);

        const totalPages = Math.ceil(totalItems / limit) || 1;

        res.status(StatusCodes.OK).json({
            status: statusText.SUCCESS,
            message: "Cities returned successfully",
            data: {
                cities,
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
// 2. GET SINGLE CITY BY ID
// ==========================================
export const getCityById = asyncWrapper(
    async (req: Request, res: Response, next: NextFunction) => {
        const { id } = req.params;

        const city = await City.findById(id).populate("country", "name code flag");

        if (!city) {
            return next(
                appError({
                    statusCode: StatusCodes.NOT_FOUND,
                    message: "City not found",
                    statusText: statusText.FAIL,
                })
            );
        }

        res.status(StatusCodes.OK).json({
            status: statusText.SUCCESS,
            message: "City returned successfully",
            data: { city },
        });
    }
);

// ==========================================
// 3. CREATE CITY
// ==========================================
export const createCity = asyncWrapper(
    async (req: Request, res: Response, next: NextFunction) => {
        const { name, country } = req.body;

        // 1. Validate mandatory fields
        if (!name || !country) {
            return next(
                appError({
                    statusCode: StatusCodes.BAD_REQUEST,
                    message: "City name and country ID are required fields",
                    statusText: statusText.FAIL,
                })
            );
        }

        // 2. Ensure parent country exists
        const parentCountry = await Country.findById(country);
        if (!parentCountry) {
            return next(
                appError({
                    statusCode: StatusCodes.NOT_FOUND,
                    message: "Referenced country not found",
                    statusText: statusText.FAIL,
                })
            );
        }

        // 3. Check for duplicates in the same country
        const existingCity = await City.findOne({ name, country });
        if (existingCity) {
            return next(
                appError({
                    statusCode: StatusCodes.CONFLICT,
                    message: "City with this name already exists in the target country",
                    statusText: statusText.FAIL,
                })
            );
        }

        // 4. Create City Record
        const newCity = await City.create({
            name,
            country,
        });

        await newCity.populate("country", "name code flag");

        res.status(StatusCodes.CREATED).json({
            status: statusText.SUCCESS,
            message: "City created successfully",
            data: { city: newCity },
        });
    }
);

// ==========================================
// 4. EDIT CITY
// ==========================================
export const editCity = asyncWrapper(
    async (req: Request, res: Response, next: NextFunction) => {
        const { id } = req.params;
        const body = { ...req.body };

        const city = await City.findById(id);

        if (!city) {
            return next(
                appError({
                    statusCode: StatusCodes.NOT_FOUND,
                    message: "City not found",
                    statusText: statusText.FAIL,
                })
            );
        }

        // Validate country reference if it is being changed
        if (body.country) {
            const parentCountry = await Country.findById(body.country);
            if (!parentCountry) {
                return next(
                    appError({
                        statusCode: StatusCodes.NOT_FOUND,
                        message: "Referenced country not found",
                        statusText: statusText.FAIL,
                    })
                );
            }
        }

        const updatedCity = await City.findByIdAndUpdate(
            id,
            { $set: body },
            {
                new: true,
                runValidators: true,
            }
        ).populate("country", "name code flag");

        res.status(StatusCodes.OK).json({
            status: statusText.SUCCESS,
            message: "City updated successfully",
            data: { city: updatedCity },
        });
    }
);

// ==========================================
// 5. DELETE CITY
// ==========================================
export const deleteCity = asyncWrapper(
    async (req: Request, res: Response, next: NextFunction) => {
        const { id } = req.params;

        const deletedCity = await City.findByIdAndDelete(id);

        if (!deletedCity) {
            return next(
                appError({
                    statusCode: StatusCodes.NOT_FOUND,
                    message: "City not found",
                    statusText: statusText.FAIL,
                })
            );
        }

        res.status(StatusCodes.OK).json({
            status: statusText.SUCCESS,
            message: "City deleted successfully",
            data: null,
        });
    }
);
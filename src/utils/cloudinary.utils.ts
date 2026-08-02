import { Readable } from "stream"
import cloudinary from "../config/cloudinary.config"
export interface ICloudinaryProbs {
    public_id: string
    secure_url: string
    result: string
}
export const uploadImageToCloudinary = async (buffer: Buffer, folder: string, fileName: string) => {
    return new Promise((resolve, reject) => {

        const options = {
            public_id: fileName,
            folder,
            overwrite: true
        }

        const stream = cloudinary.uploader.upload_stream(options, (err, res) => {
            if (err) reject(err);
            else resolve(res)
        })

        Readable.from(buffer).pipe(stream);
    })
}

export const replaceImageFromCloudinary = async (buffer: Buffer, public_id: string) => {
    return new Promise((resolve, reject) => {
        if (!public_id) throw Error('you must provide public_id to complete the process')
        const options = {
            public_id,
            overwrite: true
        }
        const stream = cloudinary.uploader.upload_stream(options, (err, res) => {
            if (err) reject(err);
            else resolve(res)
        })

        Readable.from(buffer).pipe(stream)
    })
}

export const destroyImageFromCloudinary = async (public_id: string) => {
    return new Promise((resolve, reject) => {
        if (!public_id) throw Error('you must provide public_id to complete the process')

        const result = cloudinary.uploader.destroy(public_id, (err, res) => {
            if (err) reject(err);
            else {
                resolve(res)
            }
        });

    })
}
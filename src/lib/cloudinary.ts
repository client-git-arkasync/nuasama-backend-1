import { v2 as cloudinary } from 'cloudinary';
import { AppError } from '../utils/AppError';

// Cloudinary is automatically configured using the CLOUDINARY_URL environment variable
export { cloudinary };

export const uploadBufferToCloudinary = (buffer: Buffer, folder: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(new AppError('Gagal mengunggah gambar ke Cloudinary', 500));
        } else if (result) {
          resolve(result.secure_url);
        } else {
          reject(new AppError('Gagal mengunggah gambar ke Cloudinary (No result)', 500));
        }
      }
    );
    
    stream.end(buffer);
  });
};

import { Request, Response } from 'express';
import multer from 'multer';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinaryUpload.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
  },
  fileFilter: (
    req: Express.Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
  ) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Middleware for multiple file upload
export const uploadMultiple = upload.array('images', 10); // Max 10 images

/**
 * Upload multiple images to Cloudinary
 * POST /api/upload/images
 */
export async function uploadImages(req: AuthRequest, res: Response) {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Upload all images to Cloudinary in parallel
    const uploadPromises = req.files.map(file =>
      uploadToCloudinary(file.buffer)
    );

    const results = await Promise.all(uploadPromises);

    // Return array of URLs and metadata
    const imageData = results.map(result => ({
      url: result.url,
      publicId: result.publicId,
      width: result.width,
      height: result.height,
    }));

    res.json({
      success: true,
      images: imageData,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Failed to upload images',
      message: error.message,
    });
  }
}

/**
 * Delete an image from Cloudinary
 * DELETE /api/upload/images/:publicId
 */
export async function deleteImage(req: AuthRequest, res: Response) {
  try {
    const { publicId } = req.params;

    if (!publicId) {
      return res.status(400).json({ error: 'Public ID is required' });
    }

    // Decode the public ID (it's URL-encoded)
    const decodedPublicId = decodeURIComponent(publicId);

    await deleteFromCloudinary(decodedPublicId);

    res.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete error:', error);
    res.status(500).json({
      error: 'Failed to delete image',
      message: error.message,
    });
  }
}

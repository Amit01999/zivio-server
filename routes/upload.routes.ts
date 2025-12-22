import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  uploadImages,
  deleteImage,
  uploadMultiple,
} from '../controllers/upload.controller';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Upload multiple images
router.post('/images', uploadMultiple, uploadImages);

// Delete an image
router.delete('/images/:publicId', deleteImage);

export default router;

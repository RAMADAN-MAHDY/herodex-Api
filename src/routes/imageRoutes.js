import express from 'express';
import { uploadImage, getImages, deleteImage } from '../controllers/imageController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public route for admin preview (no authentication required)
router.get('/', getImages);

// Protected routes (admin only)
router.post('/upload', protect, admin, uploadImage);
router.delete('/:id', protect, admin, deleteImage);

export default router;

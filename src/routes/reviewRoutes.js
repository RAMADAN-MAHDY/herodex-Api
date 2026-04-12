import express from 'express';
import { getReviews, createReview, deleteReview } from '../controllers/reviewController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getReviews)
  .post(protect, admin, upload.single('image'), createReview);

router.route('/:id')
  .delete(protect, admin, deleteReview);

export default router;

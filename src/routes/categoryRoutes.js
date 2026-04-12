import express from 'express';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../controllers/categoryController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getCategories)
  .post(protect, admin, upload.single('image'), createCategory);

router.route('/:id')
  .put(protect, admin, upload.single('image'), updateCategory)
  .delete(protect, admin, deleteCategory);

export default router;

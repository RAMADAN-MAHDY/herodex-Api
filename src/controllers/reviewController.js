import Review from '../models/Review.js';
import { uploadToImageBB } from '../utils/imageBB.js';
import { successResponse, errorResponse } from '../utils/responseFormatter.js';

export const getReviews = async (req, res) => {
  const reviews = await Review.find({}).sort({ createdAt: -1 }).lean();
  return successResponse(res, 'Reviews fetched', reviews);
};

export const createReview = async (req, res) => {
  if (!req.file) return errorResponse(res, 'Review image is required', [], 400);

  try {
    const imageUrl = await uploadToImageBB(req.file.buffer);
    const review = await Review.create({ imageUrl });
    return successResponse(res, 'Review created', review, 201);
  } catch (err) {
    return errorResponse(res, err.message, [], 500);
  }
};

export const deleteReview = async (req, res) => {
  const { id } = req.params;
  const review = await Review.findById(id);

  if (!review) return errorResponse(res, 'Review not found', [], 404);

  await Review.deleteOne({ _id: id });
  return successResponse(res, 'Review deleted');
};

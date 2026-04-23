import path from 'path';
import fs from 'fs/promises';
import Image from '../models/Image.js';
import { successResponse, errorResponse } from '../utils/responseFormatter.js';
import upload from '../middlewares/uploadMiddleware.js'; // Import the existing upload middleware
import { uploadToImageBB } from '../utils/imageBB.js'; // Import ImageBB service
import axios from 'axios';



/**
 * @desc Upload and process an image
 * @route POST /api/images/upload
 * @access Private (Admin only)
 */
export const uploadImage = (req, res, next) => {
  upload.single('image')(req, res, async (err) => { // Use the imported upload middleware
    if (err) {
      return errorResponse(res, err.message, [], 400);
    }

    if (!req.file) {
      return errorResponse(res, 'No image file provided', [], 400);
    }

    try {
      const { type } = req.body;

      // Check for maximum limit of 7 images
      const count = await Image.countDocuments();
      if (count >= 20) {
        return errorResponse(res, 'Maximum limit of 20 images reached. Please delete some images before adding new ones.', [], 400);
      }

      let aspectRatio = null;
      if (type === 'mobile') aspectRatio = '16:9';
      if (type === 'laptop') aspectRatio = '21:9';

      // Upload image to ImageBB (single upload)
      const { url: imageUrl, deleteUrl: imageDeleteUrl } = await uploadToImageBB(req.file.buffer);

      let mobilePath = null;
      let laptopPath = null;

      if (type === 'mobile') {
        mobilePath = imageUrl;
      } else if (type === 'laptop') {
        laptopPath = imageUrl;
      }

      const image = await Image.create({
        originalPath: imageUrl,
        mobilePath: mobilePath,
        laptopPath: laptopPath,
        type,
        aspectRatio,
        deleteUrl: imageDeleteUrl
      });

      return successResponse(res, 'Image uploaded successfully', image, 201);
    } catch (error) {
      console.error('Image upload/processing error:', error);
      return errorResponse(res, 'Failed to upload or process image', [error.message], 500);
    }
  });
};

/**
 * @desc Get all images (for admin preview)
 * @route GET /api/images
 * @access Public (for admin preview, no auth required)
 */
export const getImages = async (req, res) => {
  try {
    const images = await Image.find({})
      .sort({ createdAt: -1 }) // Sort by newest first
      .select('originalPath type aspectRatio deleteUrl')
      .lean();

    return successResponse(res, 'Images fetched successfully', images);
  } catch (error) {
    console.error('Error fetching images:', error);
    return errorResponse(res, 'Failed to fetch images', [error.message], 500);
  }
};

/**
 * @desc Delete an image
 * @route DELETE /api/images/:id
 * @access Private (Admin only)
 */
export const deleteImage = async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);

    if (!image) {
      return errorResponse(res, 'Image not found', [], 404);
    }

    // Attempt to delete from ImageBB using the stored deleteUrl
    if (image.deleteUrl) {
      try {
        await axios.delete(image.deleteUrl);
        console.log(`Image deleted from ImageBB: ${image.deleteUrl}`);
      } catch (imgbbError) {
        console.error(`Failed to delete image from ImageBB (${image.deleteUrl}):`, imgbbError.message);
        // Continue to delete from our database even if ImageBB deletion fails
      }
    }

    await image.deleteOne();

    return successResponse(res, 'Image removed successfully');
  } catch (error) {
    console.error('Error deleting image:', error);
    return errorResponse(res, 'Failed to delete image record', [error.message], 500);
  }
};

import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import Image from '../models/Image.js';
import { successResponse, errorResponse } from '../utils/responseFormatter.js';
import upload from '../middlewares/uploadMiddleware.js'; // Import the existing upload middleware
import { uploadToImageBB } from '../utils/imageBB.js'; // Import ImageBB service
import axios from 'axios';

// Helper function to process and upload image to ImageBB
const processAndUploadImage = async (buffer, type, aspectRatio) => {
  let processedBuffer = buffer;
  let width, height;

  if (type === 'mobile') {
    width = 720;
    height = 1280;
    processedBuffer = await sharp(buffer)
      .resize(width, height, {
        fit: sharp.fit.cover,
        position: sharp.strategy.entropy
      })
      .toBuffer();
  } else if (type === 'laptop') {
    width = 2560;
    height = 1080;
    processedBuffer = await sharp(buffer)
      .resize(width, height, {
        fit: sharp.fit.cover,
        position: sharp.strategy.entropy
      })
      .toBuffer();
  }
  // For 'general' type, no specific resizing, just upload original buffer

  const { url, deleteUrl } = await uploadToImageBB(processedBuffer);
  return { url, deleteUrl };
};

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
      // No longer requiring 'name' field
      // No longer associating with 'user' field

      let aspectRatio = null;
      if (type === 'mobile') aspectRatio = '16:9';
      if (type === 'laptop') aspectRatio = '21:9';

      // Upload original image to ImageBB
      const { url: originalImageUrl, deleteUrl: originalDeleteUrl } = await uploadToImageBB(req.file.buffer);

      let mobileImageUrl = null;
      let mobileDeleteUrl = null;
      let laptopImageUrl = null;
      let laptopDeleteUrl = null;

      if (type === 'mobile') {
        const { url, deleteUrl } = await processAndUploadImage(req.file.buffer, 'mobile', aspectRatio);
        mobileImageUrl = url;
        mobileDeleteUrl = deleteUrl;
      } else if (type === 'laptop') {
        const { url, deleteUrl } = await processAndUploadImage(req.file.buffer, 'laptop', aspectRatio);
        laptopImageUrl = url;
        laptopDeleteUrl = deleteUrl;
      }

      const image = await Image.create({
        originalPath: originalImageUrl,
        mobilePath: mobileImageUrl,
        laptopPath: laptopImageUrl,
        type,
        aspectRatio,
        deleteUrl: originalDeleteUrl // Store the delete URL for the original image
      });

      return successResponse(res, 'Image uploaded and processed successfully', image, 201);
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
    const images = await Image.find({});
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

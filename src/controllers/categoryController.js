import Category from '../models/Category.js';
import { uploadToImageBB } from '../utils/imageBB.js';
import { successResponse, errorResponse } from '../utils/responseFormatter.js';
import { categorySchema, updateCategorySchema } from '../validators/categoryValidator.js';
import axios from 'axios';

export const getCategories = async (req, res) => {
  const categories = await Category.find({}).lean();
  return successResponse(res, 'Categories fetched', categories);
};

export const createCategory = async (req, res) => {
  const { error } = categorySchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errorMessages = error.details.map((detail) => detail.message);
    return errorResponse(res, 'Validation Error', errorMessages, 400);
  }

  if (!req.file) return errorResponse(res, 'Category image is required', [], 400);

  const { name, description } = req.body;
  const categoryExists = await Category.findOne({ name });

  if (categoryExists) return errorResponse(res, 'Category already exists', [], 400);

  try {
    const { url: imageUrl, deleteUrl } = await uploadToImageBB(req.file.buffer);
    const category = await Category.create({ name, description, image: imageUrl, deleteUrl });
    return successResponse(res, 'Category created', category, 201);
  } catch (err) {
    return errorResponse(res, err.message, [], 500);
  }
};

export const updateCategory = async (req, res) => {
  const { id } = req.params;
  const category = await Category.findById(id);

  if (!category) return errorResponse(res, 'Category not found', [], 404);

  const { error } = updateCategorySchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errorMessages = error.details.map((detail) => detail.message);
    return errorResponse(res, 'Validation Error', errorMessages, 400);
  }

  try {
    let imageUrl = category.image;
    let deleteUrl = category.deleteUrl;
    if (req.file) {
      // Delete old image from ImageBB if it exists
      if (category.deleteUrl) {
        try {
          await axios.delete(category.deleteUrl);
          console.log(`Old category image deleted from ImageBB: ${category.deleteUrl}`);
        } catch (imgbbError) {
          console.error(`Failed to delete old category image from ImageBB (${category.deleteUrl}):`, imgbbError.message);
        }
      }
      const result = await uploadToImageBB(req.file.buffer);
      imageUrl = result.url;
      deleteUrl = result.deleteUrl;
    }

    category.name = req.body.name || category.name;
    category.description = req.body.description || category.description;
    category.image = imageUrl;
    category.deleteUrl = deleteUrl;

    const updatedCategory = await category.save();
    return successResponse(res, 'Category updated', updatedCategory);
  } catch (err) {
    return errorResponse(res, err.message, [], 500);
  }
};


export const deleteCategory = async (req, res) => {
  const { id } = req.params;
  const category = await Category.findById(id);

  if (!category) return errorResponse(res, 'Category not found', [], 404);

  // Attempt to delete image from ImageBB
  if (category.deleteUrl) {
    try {
      await axios.delete(category.deleteUrl);
      console.log(`Category image deleted from ImageBB: ${category.deleteUrl}`);
    } catch (imgbbError) {
      console.error(`Failed to delete category image from ImageBB (${category.deleteUrl}):`, imgbbError.message);
      // Continue to delete from our database even if ImageBB deletion fails
    }
  }

  await Category.deleteOne({ _id: id });
  return successResponse(res, 'Category deleted');
};

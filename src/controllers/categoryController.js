import Category from '../models/Category.js';
import { uploadToImageBB } from '../utils/imageBB.js';
import { successResponse, errorResponse } from '../utils/responseFormatter.js';
import { categorySchema, updateCategorySchema } from '../validators/categoryValidator.js';

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
    const imageUrl = await uploadToImageBB(req.file.buffer);
    const category = await Category.create({ name, description, image: imageUrl });
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
    if (req.file) {
      imageUrl = await uploadToImageBB(req.file.buffer);
    }

    category.name = req.body.name || category.name;
    category.description = req.body.description || category.description;
    category.image = imageUrl;

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

  await Category.deleteOne({ _id: id });
  return successResponse(res, 'Category deleted');
};

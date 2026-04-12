import Product from '../models/Product.js';
import { uploadToImageBB } from '../utils/imageBB.js';
import { successResponse, errorResponse } from '../utils/responseFormatter.js';
import { productSchema, updateProductSchema } from '../validators/productValidator.js';

export const getProducts = async (req, res) => {
  const pageSize = Number(req.query.limit) || 10;
  const page = Number(req.query.pageNumber) || 1;
  const category = req.query.category || '';

  const query = category ? { category } : {};
  const count = await Product.countDocuments(query);
  const products = await Product.find(query)
    .populate('category', 'name')
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .lean();

  return successResponse(res, 'Products fetched', {
    products,
    page,
    pages: Math.ceil(count / pageSize)
  });
};

export const createProduct = async (req, res) => {
  const { error } = productSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errorMessages = error.details.map((detail) => detail.message);
    return errorResponse(res, 'Validation Error', errorMessages, 400);
  }

  if (!req.file) return errorResponse(res, 'Product image is required', [], 400);

  try {
    const imageUrl = await uploadToImageBB(req.file.buffer);
    const { name, price, description, category } = req.body;
    const product = await Product.create({
      name,
      price,
      description,
      image: imageUrl,
      category
    });
    return successResponse(res, 'Product created', product, 201);
  } catch (err) {
    return errorResponse(res, err.message, [], 500);
  }
};

export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id);

  if (!product) return errorResponse(res, 'Product not found', [], 404);

  const { error } = updateProductSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errorMessages = error.details.map((detail) => detail.message);
    return errorResponse(res, 'Validation Error', errorMessages, 400);
  }

  try {
    let imageUrl = product.image;
    if (req.file) {
      imageUrl = await uploadToImageBB(req.file.buffer);
    }

    product.name = req.body.name || product.name;
    product.price = req.body.price || product.price;
    product.description = req.body.description || product.description;
    product.image = imageUrl;
    product.category = req.body.category || product.category;

    const updatedProduct = await product.save();
    return successResponse(res, 'Product updated', updatedProduct);
  } catch (err) {
    return errorResponse(res, err.message, [], 500);
  }
};


export const deleteProduct = async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id);

  if (!product) return errorResponse(res, 'Product not found', [], 404);

  await Product.deleteOne({ _id: id });
  return successResponse(res, 'Product deleted');
};

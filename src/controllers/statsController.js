import Product from '../models/Product.js';
import Category from '../models/Category.js';
import User from '../models/User.js';
import { successResponse } from '../utils/responseFormatter.js';

export const getStats = async (req, res) => {
  const [productCount, categoryCount, userCount] = await Promise.all([
    Product.countDocuments({}),
    Category.countDocuments({}),
    User.countDocuments({})
  ]);

  return successResponse(res, 'Stats fetched', {
    totalProducts: productCount,
    totalCategories: categoryCount,
    totalUsers: userCount
  });
};

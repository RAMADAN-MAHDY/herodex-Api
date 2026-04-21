import Product from '../models/Product.js';
import Category from '../models/Category.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import { successResponse, errorResponse } from '../utils/responseFormatter.js';

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

export const getTopSelling = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 10;

    const topSelling = await Order.aggregate([
      // Only include orders that are not cancelled
      { $match: { orderStatus: { $ne: 'cancelled' } } },
      // Unwind items array to create a document for each item
      { $unwind: '$items' },
      // Group by productId
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          image: { $first: '$items.image' },
          price: { $first: '$items.price' },
          totalQuantitySold: { $sum: '$items.quantity' } // Calculate total sold for this product
        }
      },
      // Sort by total quantity sold in descending order
      { $sort: { totalQuantitySold: -1 } },
      // Limit to top sellers
      { $limit: limit }
    ]);

    return successResponse(res, 'Top selling products fetched successfully', topSelling);
  } catch (err) {
    return errorResponse(res, err.message, [], 500);
  }
};

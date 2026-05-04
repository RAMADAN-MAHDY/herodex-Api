import ShippingRate from '../models/ShippingRate.js';
import { successResponse, errorResponse } from '../utils/responseFormatter.js';
import { getShippingDetails } from '../utils/shippingService.js';
import { seedShippingRates } from '../../seedShippingRates.js';
import { shippingRateSchema, updateShippingRateSchema } from '../validators/shippingRateValidator.js';

// @desc    Create a new shipping rate
// @route   POST /api/shippingrates
// @access  Admin
export const createShippingRate = async (req, res) => {
  try {
    const { error } = shippingRateSchema.validate(req.body, { abortEarly: false });
    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
      return errorResponse(res, 'Validation Error', errorMessages, 400);
    }

    const { governorate, cost, time } = req.body;

    const shippingRateExists = await ShippingRate.findOne({ governorate }).lean();

    if (shippingRateExists) {
      return errorResponse(res, 'Shipping rate for this governorate already exists', [], 400);
    }

    const shippingRate = await ShippingRate.create({
      governorate,
      cost,
      time,
    });

    return successResponse(res, 'Shipping rate created successfully', shippingRate, 201);
  } catch (error) {
    console.error('Create Shipping Rate Error:', error);
    return errorResponse(res, 'Failed to create shipping rate');
  }
};

// @desc    Get all shipping rates
// @route   GET /api/shippingrates
// @access  Admin
export const getShippingRates = async (req, res) => {
  try {
    const shippingRates = await ShippingRate.find({}).lean();
    return successResponse(res, 'Shipping rates fetched successfully', shippingRates);
  } catch (error) {
    console.error('Get Shipping Rates Error:', error);
    return errorResponse(res, 'Failed to fetch shipping rates');
  }
};

// @desc    Get single shipping rate by ID
// @route   GET /api/shippingrates/:id
// @access  Admin
export const getShippingRateById = async (req, res) => {
  try {
    const shippingRate = await ShippingRate.findById(req.params.id).lean();

    if (!shippingRate) {
      return errorResponse(res, 'Shipping rate not found', [], 404);
    }

    return successResponse(res, 'Shipping rate fetched successfully', shippingRate);
  } catch (error) {
    console.error('Get Shipping Rate By ID Error:', error);
    return errorResponse(res, 'Failed to fetch shipping rate');
  }
};

// @desc    Update a shipping rate
// @route   PUT /api/shippingrates/:id
// @access  Admin
export const updateShippingRate = async (req, res) => {
  try {
    const { error } = updateShippingRateSchema.validate(req.body, { abortEarly: false });
    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
      return errorResponse(res, 'Validation Error', errorMessages, 400);
    }

    const { governorate, cost, time } = req.body;

    // Add lean() to findById query for read-only operations
    const shippingRate = await ShippingRate.findById(req.params.id).lean();

    if (!shippingRate) {
      return errorResponse(res, 'Shipping rate not found', [], 404);
    }

    // Check if another shipping rate with the same governorate exists
    if (governorate && governorate !== shippingRate.governorate) {
      // Add lean() to the query to match the other queries
      const existingRate = await ShippingRate.findOne({ governorate }).lean();  
      if (existingRate) {
        return errorResponse(res, 'Shipping rate for this governorate already exists', [], 400);
      }
    }

    shippingRate.governorate = governorate || shippingRate.governorate;
    shippingRate.cost = cost !== undefined ? cost : shippingRate.cost;
    shippingRate.time = time || shippingRate.time;

    const updatedShippingRate = await shippingRate.save();

    return successResponse(res, 'Shipping rate updated successfully', updatedShippingRate);
  } catch (error) {
    console.error('Update Shipping Rate Error:', error);
    return errorResponse(res, 'Failed to update shipping rate');
  }
};

// @desc    Delete a shipping rate
// @route   DELETE /api/shippingrates/:id
// @access  Admin
export const deleteShippingRate = async (req, res) => {
  try {
    // Add lean() to findById query for read-only operations
    const shippingRate = await ShippingRate.findById(req.params.id).lean();

    if (!shippingRate) {
      return errorResponse(res, 'Shipping rate not found', [], 404);
    }

    await ShippingRate.deleteOne({ _id: req.params.id });

    return successResponse(res, 'Shipping rate deleted successfully', {});
  } catch (error) {
    console.error('Delete Shipping Rate Error:', error);
    return errorResponse(res, 'Failed to delete shipping rate');
  }
};

// @desc    Get public shipping details by ID
// @route   GET /api/shippingrates/public/:id
// @access  Public
export const getPublicShippingDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const details = await getShippingDetails(id);

    if (!details) {
      return errorResponse(res, 'Shipping details not found for this ID', [], 404);
    }

    return successResponse(res, 'Shipping details fetched successfully', details);
  } catch (error) {
    console.error('Get Public Shipping Details Error:', error);
    return errorResponse(res, 'Failed to fetch public shipping details');
  }
};

// @desc    Get all public shipping rates (governorate, cost, time, _id)
// @route   GET /api/shippingrates/public
// @access  Public
export const getAllShippingRatesPublic = async (req, res) => {
  try {
    const rates = await ShippingRate.find({}).select('governorate cost time').lean();
    return successResponse(res, 'Public shipping rates fetched successfully', rates);
  } catch (error) {
    console.error('Get All Public Shipping Rates Error:', error);
    return errorResponse(res, 'Failed to fetch public shipping rates');
  }
};

// @desc    Seed initial shipping rates (Admin only)
// @route   POST /api/shippingrates/seed
// @access  Admin
export const seedShippingRatesAdmin = async (req, res) => {
  try {
    const result = await seedShippingRates();
    if (result.success) {
      return successResponse(res, result.message);
    } else {
      return errorResponse(res, result.message);
    }
  } catch (error) {
    console.error('Seed Shipping Rates Admin Error:', error);
    return errorResponse(res, 'Failed to seed shipping rates');
  }
};

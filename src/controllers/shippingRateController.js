import ShippingRate from '../models/ShippingRate.js';
import { successResponse, errorResponse } from '../utils/responseFormatter.js';
import { shippingRateSchema, updateShippingRateSchema } from '../validators/shippingRateValidator.js';

// @desc    Get all shipping rates (Admin)
// @route   GET /api/shippingrates
// @access  Private/Admin
export const getShippingRates = async (req, res) => {
  try {
    const shippingRates = await ShippingRate.find({}).sort({ governorate: 1 }).lean();
    return successResponse(res, 'Shipping rates fetched', shippingRates);
  } catch (error) {
    return errorResponse(res, 'Error fetching shipping rates', error.message);
  }
};

// @desc    Get all shipping rates (Public)
// @route   GET /api/shippingrates/public
// @access  Public
export const getAllShippingRatesPublic = async (req, res) => {
  try {
    const shippingRates = await ShippingRate.find({}).sort({ governorate: 1 }).lean();
    return successResponse(res, 'Shipping rates fetched', shippingRates);
  } catch (error) {
    return errorResponse(res, 'Error fetching shipping rates', error.message);
  }
};

// @desc    Get single shipping rate by ID (Admin)
// @route   GET /api/shippingrates/:id
// @access  Private/Admin
export const getShippingRateById = async (req, res) => {
  try {
    const shippingRate = await ShippingRate.findById(req.params.id).lean();
    if (shippingRate) {
      return successResponse(res, 'Shipping rate fetched', shippingRate);
    } else {
      return errorResponse(res, 'Shipping rate not found', [], 404);
    }
  } catch (error) {
    return errorResponse(res, 'Error fetching shipping rate', error.message);
  }
};

// @desc    Get public shipping details by ID
// @route   GET /api/shippingrates/public/:id
// @access  Public
export const getPublicShippingDetails = async (req, res) => {
  try {
    const shippingRate = await ShippingRate.findById(req.params.id).lean();
    if (shippingRate) {
      return successResponse(res, 'Shipping rate details fetched', shippingRate);
    } else {
      return errorResponse(res, 'Shipping rate not found', [], 404);
    }
  } catch (error) {
    return errorResponse(res, 'Error fetching shipping rate', error.message);
  }
};

// @desc    Create a shipping rate
// @route   POST /api/shippingrates
// @access  Private/Admin
export const createShippingRate = async (req, res) => {
  try {
    const { error } = shippingRateSchema.validate(req.body, { abortEarly: false });
    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
      return errorResponse(res, 'Validation Error', errorMessages, 400);
    }

    const { governorate, cost, time } = req.body;

    const rateExists = await ShippingRate.findOne({ governorate });

    if (rateExists) {
      return errorResponse(res, 'Shipping rate for this governorate already exists', [], 400);
    }

    const shippingRate = await ShippingRate.create({
      governorate,
      cost,
      time,
    });

    return successResponse(res, 'Shipping rate created', shippingRate, 201);
  } catch (error) {
    return errorResponse(res, 'Error creating shipping rate', error.message);
  }
};

// @desc    Update a shipping rate
// @route   PUT /api/shippingrates/:id
// @access  Private/Admin
export const updateShippingRate = async (req, res) => {
  try {
    const { error } = updateShippingRateSchema.validate(req.body, { abortEarly: false });
    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
      return errorResponse(res, 'Validation Error', errorMessages, 400);
    }

    const { governorate, cost, time } = req.body;

    const shippingRate = await ShippingRate.findById(req.params.id);

    if (shippingRate) {
      shippingRate.governorate = governorate || shippingRate.governorate;
      shippingRate.cost = cost !== undefined ? cost : shippingRate.cost;
      shippingRate.time = time || shippingRate.time;

      const updatedRate = await shippingRate.save();
      return successResponse(res, 'Shipping rate updated', updatedRate);
    } else {
      return errorResponse(res, 'Shipping rate not found', [], 404);
    }
  } catch (error) {
    return errorResponse(res, 'Error updating shipping rate', error.message);
  }
};

// @desc    Delete a shipping rate
// @route   DELETE /api/shippingrates/:id
// @access  Private/Admin
export const deleteShippingRate = async (req, res) => {
  try {
    const shippingRate = await ShippingRate.findById(req.params.id);

    if (shippingRate) {
      await shippingRate.deleteOne();
      return successResponse(res, 'Shipping rate removed');
    } else {
      return errorResponse(res, 'Shipping rate not found', [], 404);
    }
  } catch (error) {
    return errorResponse(res, 'Error deleting shipping rate', error.message);
  }
};

// @desc    Seed shipping rates (Admin)
// @route   POST /api/shippingrates/seed
// @access  Private/Admin
export const seedShippingRatesAdmin = async (req, res) => {
  try {
    const shippingRatesData = [
      { governorate: 'القاهرة', cost: 70, time: '24 ل 48 ساعة' },
      { governorate: 'الجيزة', cost: 70, time: '24 ل 48 ساعة' },
      { governorate: 'الزقازيق داخلي', cost: 45, time: '24 ل 48 ساعة' },
      { governorate: 'اطراف الزقازيق', cost: 60, time: '24 ل 48 ساعة' },
      { governorate: 'مراكز الشرقية', cost: 60, time: '24 ل 48 ساعة' },
      { governorate: 'بدر', cost: 75, time: '48 ساعة' },
      { governorate: 'مدينتي', cost: 75, time: '48 ساعة' },
      { governorate: 'المستقبل', cost: 75, time: '48 ساعة' },
      { governorate: 'الشروق', cost: 75, time: '48 ساعة' },
      { governorate: 'العبور', cost: 75, time: '48 ساعة' },
      { governorate: 'حدائق اكتوبر', cost: 75, time: '48 ساعة' },
      { governorate: 'السادس من اكتوبر', cost: 75, time: '48 ساعة' },
      { governorate: 'الشيخ زايد', cost: 75, time: '48 ساعة' },
      { governorate: 'حدائق الاهرام', cost: 75, time: '48 ساعة' },
      { governorate: 'التجمعات', cost: 75, time: '48 ساعة' },
      { governorate: 'الرحاب', cost: 75, time: '48 ساعة' },
      { governorate: 'القليوبية', cost: 80, time: '4 أيام عمل' },
      { governorate: 'المنوفية', cost: 80, time: '4 أيام عمل' },
      { governorate: 'الغربية', cost: 80, time: '4 أيام عمل' },
      { governorate: 'دمياط', cost: 80, time: '4 أيام عمل' },
      { governorate: 'السويس', cost: 80, time: '4 أيام عمل' },
      { governorate: 'الدقهلية', cost: 80, time: '4 أيام عمل' },
      { governorate: 'الاسماعيلية', cost: 80, time: '4 أيام عمل' },
      { governorate: 'بورسعيد', cost: 80, time: '4 أيام عمل' },
      { governorate: 'كفر الشيخ', cost: 80, time: '4 أيام عمل' },
      { governorate: 'الاسكندرية', cost: 80, time: '4 أيام عمل' },
      { governorate: 'البحيرة', cost: 85, time: '4 أيام عمل' },
      { governorate: 'الفيوم', cost: 105, time: '4 أيام عمل' },
      { governorate: 'بني سويف', cost: 105, time: '4 أيام عمل' },
      { governorate: 'المنيا', cost: 105, time: '4 أيام عمل' },
      { governorate: 'أسيوط', cost: 105, time: '4 أيام عمل' },
      { governorate: 'سوهاج', cost: 105, time: '4 أيام عمل' },
      { governorate: 'الاقصر', cost: 105, time: '4 أيام عمل' },
      { governorate: 'قنا', cost: 105, time: '4 أيام عمل' },
      { governorate: 'اسوان', cost: 105, time: '4 أيام عمل' },
    ];

    await ShippingRate.deleteMany({});
    const createdRates = await ShippingRate.insertMany(shippingRatesData);

    return successResponse(res, 'Shipping rates seeded successfully', { count: createdRates.length });
  } catch (error) {
    return errorResponse(res, 'Error seeding shipping rates', error.message);
  }
};
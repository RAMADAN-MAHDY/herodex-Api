import Joi from 'joi';

export const shippingRateSchema = Joi.object({
  governorate: Joi.string().min(2).max(50).required().messages({
    'any.required': 'Governorate name is required',
    'string.empty': 'Governorate name cannot be empty',
    'string.min': 'Governorate name must be at least 2 characters long',
    'string.max': 'Governorate name cannot exceed 50 characters',
  }),
  cost: Joi.number().min(0).max(10000).required().messages({
    'any.required': 'Cost is required',
    'number.base': 'Cost must be a number',
    'number.min': 'Cost cannot be negative',
    'number.max': 'Cost seems too high, please verify',
  }),
  time: Joi.string().min(2).max(100).required().messages({
    'any.required': 'Delivery time is required',
    'string.empty': 'Delivery time cannot be empty',
    'string.min': 'Delivery time description must be at least 2 characters long',
    'string.max': 'Delivery time description cannot exceed 100 characters',
  }),
});

export const updateShippingRateSchema = Joi.object({
  governorate: Joi.string().min(2).max(50).optional(),
  cost: Joi.number().min(0).max(10000).optional(),
  time: Joi.string().min(2).max(100).optional(),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

import Joi from 'joi';

export const checkoutSchema = Joi.object({
  shippingAddress: Joi.object({
    address: Joi.string().min(5).max(200).required().messages({
      'any.required': 'Address is required',
      'string.empty': 'Address cannot be empty',
      'string.min': 'Address must be at least 5 characters long',
      'string.max': 'Address cannot exceed 200 characters',
    }),
    detailedAddress: Joi.string().max(500).allow('', null).optional().messages({
      'string.max': 'Detailed address cannot exceed 500 characters',
    }),
    city: Joi.string().min(2).max(50).required().messages({
      'any.required': 'City is required',
      'string.empty': 'City cannot be empty',
      'string.min': 'City name must be at least 2 characters long',
      'string.max': 'City name cannot exceed 50 characters',
    }),
    governorateId: Joi.string().required().messages({
      'any.required': 'Governorate ID is required',
      'string.empty': 'Governorate ID cannot be empty',
    }),
    postalCode: Joi.string().min(3).max(10).required().messages({
      'any.required': 'Postal code is required',
      'string.empty': 'Postal code cannot be empty',
      'string.min': 'Postal code must be at least 3 characters',
      'string.max': 'Postal code cannot exceed 10 characters',
    }),
    country: Joi.string().min(2).max(50).default('Egypt').optional(),
    phone: Joi.string().min(10).max(20).required().messages({
      'any.required': 'Phone number is required',
      'string.empty': 'Phone number cannot be empty',
      'string.min': 'Phone number must be at least 10 digits',
      'string.max': 'Phone number cannot exceed 20 digits',
    }),
    email: Joi.string().email().max(100).allow('', null).optional().messages({
      'string.email': 'Please provide a valid email address',
      'string.max': 'Email cannot exceed 100 characters',
    }),
  }).required().messages({
    'any.required': 'Shipping address is required',
  }),
  paymentMethod: Joi.string().valid('COD', 'wallet', 'card').required().messages({
    'any.only': 'Payment method must be COD, wallet, or card',
    'any.required': 'Payment method is required',
  }),
  walletNumber: Joi.string().min(10).max(15).when('paymentMethod', {
    is: 'wallet',
    then: Joi.required(),
    otherwise: Joi.optional().allow('', null),
  }).messages({
    'any.required': 'Wallet number is required for wallet payments',
    'string.min': 'Wallet number must be at least 10 digits',
    'string.max': 'Wallet number cannot exceed 15 digits',
  }),
  guestName: Joi.string().min(3).max(50).optional().allow('', null).messages({
    'string.min': 'Guest name must be at least 3 characters',
    'string.max': 'Guest name cannot exceed 50 characters',
  }),
});

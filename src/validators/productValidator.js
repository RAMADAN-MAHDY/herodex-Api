import Joi from 'joi';

export const productSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.base': 'Product name should be a type of text',
      'string.empty': 'Product name cannot be empty',
      'string.min': 'Product name should have at least {#limit} characters',
      'string.max': 'Product name cannot exceed {#limit} characters',
      'any.required': 'Product name is required'
    }),
  price: Joi.number()
    .min(0.01)
    .max(1000000)
    .required()
    .messages({
      'number.base': 'Price must be a number',
      'number.min': 'Price must be at least {#limit}',
      'number.max': 'Price cannot exceed {#limit}',
      'any.required': 'Price is required'
    }),
  description: Joi.string()
    .min(10)
    .max(1000)
    .required()
    .messages({
      'string.min': 'Description should be at least {#limit} characters long',
      'string.max': 'Description cannot exceed {#limit} characters',
      'any.required': 'Description is required'
    }),
  category: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid Category ID format',
      'any.required': 'Category ID is required'
    })
});

export const updateProductSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  price: Joi.number().min(0.01).max(1000000),
  description: Joi.string().min(10).max(1000),
  category: Joi.string().regex(/^[0-9a-fA-F]{24}$/)
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

import Joi from 'joi';

export const categorySchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.base': 'Category name should be a type of text',
      'string.empty': 'Category name cannot be empty',
      'string.min': 'Category name should have at least {#limit} characters',
      'string.max': 'Category name cannot exceed {#limit} characters',
      'any.required': 'Category name is required'
    }),
  description: Joi.string()
    .max(255)
    .messages({
      'string.max': 'Description cannot exceed {#limit} characters'
    })
});

export const updateCategorySchema = Joi.object({
  name: Joi.string().min(2).max(50),
  description: Joi.string().max(255)
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

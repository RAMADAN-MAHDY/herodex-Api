import Joi from 'joi';

export const registerSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .max(50)
    .required()
    .messages({
      'string.base': 'Name should be a type of text',
      'string.empty': 'Name cannot be an empty field',
      'string.min': 'Name should have a minimum length of {#limit}',
      'string.max': 'Name should have a maximum length of {#limit}',
      'any.required': 'Name is a required field'
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is a required field'
    }),
  password: Joi.string()
    .min(6)
    .max(30)
    .required()
    .messages({
      'string.min': 'Password should have a minimum length of {#limit}',
      'string.max': 'Password should have a maximum length of {#limit}',
      'any.required': 'Password is a required field'
    }),
  role: Joi.string()
    .valid('user', 'admin')
    .default('user')
    .messages({
      'any.only': 'Role must be either user or admin'
    })
});

export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is a required field'
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is a required field'
    })
});

export const googleLoginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is a required field'
    }),
  name: Joi.string()
    .required()
    .messages({
      'any.required': 'Name is a required field'
    }),
  googleId: Joi.string().optional(),
  picture: Joi.string().optional()
});

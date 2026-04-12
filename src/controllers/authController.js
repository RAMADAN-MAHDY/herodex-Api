import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import { successResponse, errorResponse } from '../utils/responseFormatter.js';
import { registerSchema, loginSchema } from '../validators/userValidator.js';

export const loginUser = async (req, res) => {
  const { error } = loginSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errorMessages = error.details.map((detail) => detail.message);
    return errorResponse(res, 'Validation Error', errorMessages, 400);
  }

  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await user.comparePassword(password))) {
    return successResponse(res, 'Login successful', {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } else {
    return errorResponse(res, 'Invalid email or password', [], 401);
  }
};

export const registerUser = async (req, res) => {
  const { error } = registerSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errorMessages = error.details.map((detail) => detail.message);
    return errorResponse(res, 'Validation Error', errorMessages, 400);
  }

  const { name, email, password, role } = req.body;
  const userExists = await User.findOne({ email });

  if (userExists) return errorResponse(res, 'User already exists', [], 400);

  const user = await User.create({ name, email, password, role });
  if (user) {
    return successResponse(res, 'User registered', {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    }, 201);
  } else {
    return errorResponse(res, 'Invalid user data', [], 400);
  }
};


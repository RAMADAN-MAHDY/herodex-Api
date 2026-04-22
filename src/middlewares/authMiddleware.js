import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { errorResponse } from '../utils/responseFormatter.js';
import crypto from 'crypto';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return errorResponse(res, 'User not found', [], 401);
      }
      return next();
    } catch (error) {
      return errorResponse(res, 'Not authorized, token failed', [], 401);
    }
  }

  if (!token) {
    return errorResponse(res, 'Not authorized, no token', [], 401);
  }
};

/**
 * Middleware to identify either a logged-in user or a guest.
 * If logged in, populates req.user.
 * If guest, populates req.guestId from header or generates a new one.
 */
export const identifyUser = async (req, res, next) => {
  let token;

  // 1. Try to identify as a logged-in user
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      if (req.user) {
        return next();
      }
    } catch (error) {
      // Token exists but invalid, we can treat as guest or error. 
      // Given the requirement, let's treat as guest if token fails.
      console.error('JWT identification failed in identifyUser:', error.message);
    }
  }

  // 2. If not logged in, identify as a guest
  const guestIdHeader = req.headers['x-guest-id'];
  
  if (guestIdHeader) {
    req.guestId = guestIdHeader;
  } else {
    // Generate a new guest ID if none provided
    req.guestId = crypto.randomUUID();
    // Attach to response header so the client can save it
    res.setHeader('x-guest-id', req.guestId);
  }

  next();
};

export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return errorResponse(res, 'Not authorized as an admin', [], 403);
  }
};

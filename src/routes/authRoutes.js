import express from 'express';
import {loginUser,registerUser,
  googleAuthStart,
  googleAuthCallback,
  googleLogin,
  getMe
} from '../controllers/authController.js';

import { createRequire } from 'module';

const router = express.Router();

// Authentication routes
router.post('/login', loginUser);
router.post('/register', registerUser);
// Simple logout endpoint — token-based auth usually handles logout on the client by discarding the token
router.post('/logout', (req, res) => res.status(200).json({ message: 'Logged out' }));

// Google OAuth
router.get('/google', googleAuthStart);
router.get('/google/callback', googleAuthCallback);
router.post('/google', googleLogin);

// Get current user
router.get('/me', getMe);

export default router;

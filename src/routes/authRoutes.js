import express from 'express';
import { loginUser, registerUser, googleLogin, googleAuthStart, googleAuthCallback, getMe } from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/login', loginUser);
router.post('/register', registerUser);
router.post('/google', googleLogin);
router.get('/google', googleAuthStart);
router.get('/google/callback', googleAuthCallback);
router.get('/me', protect, getMe);

export default router;

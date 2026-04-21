import express from 'express';
import { getStats, getTopSelling } from '../controllers/statsController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', protect, admin, getStats);
router.get('/top-selling', protect, admin, getTopSelling);

export default router;

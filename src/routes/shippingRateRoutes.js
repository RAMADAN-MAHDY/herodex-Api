import express from 'express';
import {
  createShippingRate,
  getShippingRates,
  getShippingRateById,
  updateShippingRate,
  deleteShippingRate,
  getPublicShippingDetails,
  seedShippingRatesAdmin,
  getAllShippingRatesPublic,
} from '../controllers/shippingRateController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, admin, createShippingRate)
  .get(protect, admin, getShippingRates);

router.route('/:id')
  .get(protect, admin, getShippingRateById)
  .put(protect, admin, updateShippingRate)
  .delete(protect, admin, deleteShippingRate);

router.route('/public/:id')
  .get(getPublicShippingDetails);

router.route('/public')
  .get(getAllShippingRatesPublic);

router.route('/seed')
  .post(seedShippingRatesAdmin);

export default router;

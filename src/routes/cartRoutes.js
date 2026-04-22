import express from 'express';
import { getCart, addToCart, updateCartItem, removeFromCart, clearCart } from '../controllers/cartController.js';
import { identifyUser } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(identifyUser);

router.route('/')
  .get(getCart)
  .post(addToCart)
  .put(updateCartItem)
  .delete(clearCart);

router.delete('/:productId', removeFromCart);

export default router;

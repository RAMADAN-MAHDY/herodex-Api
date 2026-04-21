import express from 'express';
import { 
  checkout, 
  handleWebhook, 
  handleRedirect, 
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  deleteAllOrders
} from '../controllers/orderController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public routes for Paymob callbacks
// Note: Paymob sends POST to the Process Callback (Webhook) 
// and GET to the Response Callback (Redirect)
router.post('/webhook', handleWebhook);
router.get('/callback', handleRedirect);

// Protected routes
router.post('/checkout', protect, checkout);
router.get('/myorders', protect, getMyOrders);

// Admin routes
router.get('/', protect, admin, getAllOrders);
router.delete('/', protect, admin, deleteAllOrders);
router.put('/:id/status', protect, admin, updateOrderStatus);

export default router;

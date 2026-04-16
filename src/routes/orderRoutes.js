import express from 'express';
import { 
  checkout, 
  handleWebhook, 
  handleRedirect, 
  getMyOrders 
} from '../controllers/orderController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public routes for Paymob callbacks
// Note: Paymob sends POST to the Process Callback (Webhook) 
// and GET to the Response Callback (Redirect)
router.post('/webhook', handleWebhook);
router.get('/callback', handleRedirect);

// Protected routes
router.post('/checkout', protect, checkout);
router.get('/myorders', protect, getMyOrders);

export default router;

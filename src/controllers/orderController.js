import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import paymobService from '../utils/paymob.service.js';
import { successResponse, errorResponse } from '../utils/responseFormatter.js';
import { sendOrderNotification } from '../utils/telegram.service.js';

/**
 * Initiate a checkout process
 */
export const checkout = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod, walletNumber } = req.body;
    const { phone } = shippingAddress || {};

    if (!shippingAddress || !paymentMethod || !phone) {
      return errorResponse(res, 'Shipping address, phone, and payment method are required', [], 400);
    }

    if (paymentMethod === 'wallet' && !walletNumber) {
      return errorResponse(res, 'Wallet number is required for wallet payments', [], 400);
    }

    // 1. Get User's Cart
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return errorResponse(res, 'Cart is empty', [], 400);
    }

    // 2. Calculate totals and prepare items
    const items = cart.items.map(item => ({
      product: item.product._id,
      name: item.product.name,
      image: item.product.image,
      price: item.product.price,
      quantity: item.quantity
    }));

    const totalPrice = items.reduce((total, item) => total + (item.price * item.quantity), 0);
    const amountCents = Math.round(totalPrice * 100);

    // 3. Create local Order (Pending)
    const order = await Order.create({
      user: req.user._id,
      items,
      shippingAddress,
      totalPrice,
      paymentMethod,
      paymentStatus: 'pending'
    });

    // 4. Paymob Integration
    console.log(`Starting Paymob checkout for order ${order._id} via Wallet`);
    const token = await paymobService.authenticate();
    
    // Register Order in Paymob
    const paymobOrderId = await paymobService.registerOrder(token, {
      amountCents,
      items: items.map(i => ({ name: i.name, amount_cents: Math.round(i.price * 100), quantity: i.quantity }))
    });

    order.paymobOrderId = paymobOrderId;
    await order.save();

    console.log(`Paymob Order registered: ${paymobOrderId}. Generating payment key for Wallet integration...`);

    const paymentKey = await paymobService.generatePaymentKey(token, {
      amountCents,
      orderId: paymobOrderId,
      billingData: {
        first_name: req.user.name.split(' ')[0] || 'N/A',
        last_name: req.user.name.split(' ')[1] || 'Guest',
        email: req.user.email,
        phone_number: phone,
        apartment: 'N/A',
        floor: 'N/A',
        street: shippingAddress.address || 'N/A',
        building: 'N/A',
        shipping_method: 'PKG',
        postal_code: shippingAddress.postalCode || '12345',
        city: shippingAddress.city || 'Cairo',
        country: shippingAddress.country || 'Egypt',
        state: 'N/A'
      },
      integrationId: process.env.PAYMOB_WALLET_INTEGRATION_ID
    });

    console.log('Payment key generated. Fetching Wallet redirect URL...');
    const paymentUrl = await paymobService.getWalletRedirectUrl(paymentKey, walletNumber);

    return successResponse(res, 'Payment initialized', { orderId: order._id, paymentUrl });

  } catch (error) {
    console.error('Detailed Checkout Error:', error);
    // Log the specific error from Paymob if it exists
    if (error.response?.data) {
      console.error('Paymob Error Data:', JSON.stringify(error.response.data, null, 2));
    }
    return errorResponse(res, error.message || 'Checkout failed');
  }
};

/**
 * Handle Paymob Webhook (Transaction Process Callback)
 */
export const handleWebhook = async (req, res) => {
  try {
    const { obj: transaction, hmac } = req.body;

    // Verify HMAC
    const isValid = paymobService.verifyHMAC(transaction, hmac);
    if (!isValid) {
      console.error('Invalid HMAC signature from Paymob');
      return res.status(401).send('Invalid signature');
    }

    const paymobOrderId = transaction.order.id;
    const order = await Order.findOne({ paymobOrderId });

    if (!order) {
      console.error('Order not found for Paymob ID:', paymobOrderId);
      return res.status(404).send('Order not found');
    }

    if (transaction.success === true) {
      order.paymentStatus = 'paid';
      order.paymobTransactionId = transaction.id;
      await order.save();

      // Clear the user's cart
      await Cart.findOneAndUpdate({ user: order.user }, { items: [] });
      
      console.log(`Order ${order._id} marked as PAID`);

      // Send Telegram Notification to Admin
      const populatedOrder = await Order.findById(order._id).populate('user');
      sendOrderNotification(populatedOrder);
    } else {
      order.paymentStatus = 'failed';
      await order.save();
      console.log(`Order ${order._id} marked as FAILED`);
    }

    return res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).send('Internal Server Error');
  }
};

/**
 * Handle UI Redirect after payment
 */
export const handleRedirect = (req, res) => {
  const { success, transaction_id, id } = req.query;
  // Use the transaction ID from Paymob (id or transaction_id)
  const finalTransactionId = transaction_id || id;
  
  // Get production frontend URL from env, fallback to localhost for dev
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  console.log(`Payment redirect received: success=${success}, transactionId=${finalTransactionId}`);

  if (success === 'true') {
    return res.redirect(`${frontendUrl}/checkout/success?transaction_id=${finalTransactionId}`);
  } else {
    // Some providers send success as a boolean string or specific code
    if (success === 'true' || req.query.txn_response_code === '200') {
        return res.redirect(`${frontendUrl}/checkout/success?transaction_id=${finalTransactionId}`);
    }
    return res.redirect(`${frontendUrl}/checkout/error`);
  }
};

/**
 * Get logged-in user's orders
 */
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    return successResponse(res, 'Orders fetched', orders);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch orders');
  }
};

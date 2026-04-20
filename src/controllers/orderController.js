import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import User from '../models/User.js';
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

    // 4. Handle Cash on Delivery (COD)
    if (paymentMethod === 'COD') {
      console.log(`Order ${order._id} created with COD. Skipping Paymob.`);

      // Clear user's cart
      await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

      // Send notification to Admin
      const populatedOrder = await Order.findById(order._id).populate('user');
      sendOrderNotification(populatedOrder);

      return successResponse(res, 'Order placed successfully (Cash on Delivery)', { orderId: order._id });
    }

    // 5. Paymob Integration
    console.log(`Starting Paymob checkout for order ${order._id} via ${paymentMethod}`);
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
    const transaction = req.body.obj;
    const hmac = req.query.hmac || req.body.hmac;

    if (!transaction || !hmac) {
      console.error('Missing transaction data or HMAC');
      return res.status(400).send('Missing data');
    }

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
    // console.log('transaction:----------------------');
    // console.log(transaction);

    if (transaction.success === true) {
      order.paymentStatus = 'paid';
      order.paymobTransactionId = transaction.id;
      await order.save();

      // Clear the user's cart
      await Cart.findOneAndUpdate({ user: order.user }, { items: [] });

      console.log(`Order ${order._id} marked as PAID`);

      console.log({
        success: transaction.success,
        pending: transaction.pending,
        amount_cents: transaction.amount.amount_cents,
        order_id: transaction.order.order_id,
        integration_id: transaction.order.integration_id
      })

      // ✅ Send notification to Admin immediately when Webhook confirms payment
      // const populatedOrder = await Order.findById(order._id).populate('user');
      // sendOrderNotification(populatedOrder);
    } else {
      order.paymentStatus = 'failed';
      await order.save();
      
      console.log(`Order ${order._id} marked as FAILED`);
      
      console.log({
        success: transaction.success,
        pending: transaction.pending,
        amount_cents: transaction.amount.amount_cents,
        order_id: transaction.order.order_id,
        integration_id: transaction.order.integration_id
      })
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
    // Notify admin - Use req.query.order (which is the Paymob Order ID) 
    // because it's already in our DB before the webhook hits.
    const paymobOrderId = req.query.order;

    Order.findOne({ paymobOrderId })
      .populate('user')
      .then(order => {
        if (order) {
          console.log(`Found order ${order._id} for notification via Redirect`);
          sendOrderNotification(order);
        } else {
          console.log(`Order not found for Paymob Order ID: ${paymobOrderId} in Redirect`);
        }
      });

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

/**
 * Get all orders (Admin only)
 */
export const getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { search } = req.query;
    let query = {};

    if (search) {
      // 1. Find users matching the search name/email
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id').lean();

      const userIds = users.map(u => u._id);

      // 2. Build order query: search by user IDs OR shipping phone
      query = {
        $or: [
          { user: { $in: userIds } },
          { 'shippingAddress.phone': { $regex: search, $options: 'i' } }
        ]
      };
    }

    const count = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    return successResponse(res, 'Orders fetched', {
      orders,
      page,
      pages: Math.ceil(count / limit),
      totalItems: count
    });
  } catch (error) {
    console.error('GetAllOrders Error:', error);
    return errorResponse(res, 'Failed to fetch orders');
  }
};

/**
 * Update Order Status (Admin only)
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return errorResponse(res, 'Order not found', [], 404);
    }

    // You could add validation for status values here if not already handled by Mongoose enum
    order.orderStatus = status;
    const updatedOrder = await order.save();

    return successResponse(res, 'Order status updated successfully', updatedOrder);
  } catch (error) {
    console.error('UpdateOrderStatus Error:', error);
    return errorResponse(res, 'Failed to update order status');
  }
};

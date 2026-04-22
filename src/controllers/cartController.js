import Cart from '../models/Cart.js';
import { successResponse, errorResponse } from '../utils/responseFormatter.js';

export const getCart = async (req, res) => {
  const query = req.user ? { user: req.user._id } : { guestId: req.guestId };
  let cart = await Cart.findOne(query).populate('items.product').lean();
  
  if (!cart) {
    cart = await Cart.create({ ...query, items: [] });
  }

  return successResponse(res, 'Cart fetched', cart);
};

export const addToCart = async (req, res) => {
  const { productId, quantity } = req.body;
  
  const query = req.user ? { user: req.user._id } : { guestId: req.guestId };
  let cart = await Cart.findOne(query);

  if (!cart) {
    cart = await Cart.create({ ...query, items: [] });
  }

  const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);

  if (itemIndex > -1) {
    cart.items[itemIndex].quantity += (quantity || 1);
  } else {
    cart.items.push({ product: productId, quantity: quantity || 1 });
  }

  await cart.save();
  const updatedCart = await Cart.findById(cart._id).populate('items.product').lean();
  
  return successResponse(res, 'Product added to cart', updatedCart);
};

export const updateCartItem = async (req, res) => {
  const { productId, quantity } = req.body;
  
  if (quantity < 1) return errorResponse(res, 'Quantity must be at least 1', [], 400);

  const query = req.user ? { user: req.user._id } : { guestId: req.guestId };
  const cart = await Cart.findOne(query);
  if (!cart) return errorResponse(res, 'Cart not found', [], 404);

  const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);

  if (itemIndex > -1) {
    cart.items[itemIndex].quantity = quantity;
    await cart.save();
    const updatedCart = await Cart.findById(cart._id).populate('items.product').lean();
    return successResponse(res, 'Cart updated', updatedCart);
  } else {
    return errorResponse(res, 'Product not in cart', [], 404);
  }
};

export const removeFromCart = async (req, res) => {
  const { productId } = req.params;

  const query = req.user ? { user: req.user._id } : { guestId: req.guestId };
  const cart = await Cart.findOne(query);
  if (!cart) return errorResponse(res, 'Cart not found', [], 404);

  cart.items = cart.items.filter(item => item.product.toString() !== productId);
  await cart.save();
  
  const updatedCart = await Cart.findById(cart._id).populate('items.product').lean();
  return successResponse(res, 'Product removed from cart', updatedCart);
};

export const clearCart = async (req, res) => {
  const query = req.user ? { user: req.user._id } : { guestId: req.guestId };
  const cart = await Cart.findOne(query);
  if (cart) {
    cart.items = [];
    await cart.save();
  }
  return successResponse(res, 'Cart cleared');
};

/**
 * Merge a guest cart into a user's cart
 */
export const mergeGuestCart = async (userId, guestId) => {
  if (!guestId) return;

  const guestCart = await Cart.findOne({ guestId });
  if (!guestCart || guestCart.items.length === 0) return;

  let userCart = await Cart.findOne({ user: userId });
  if (!userCart) {
    userCart = await Cart.create({ user: userId, items: [] });
  }

  // Merge items
  for (const guestItem of guestCart.items) {
    const itemIndex = userCart.items.findIndex(
      item => item.product.toString() === guestItem.product.toString()
    );

    if (itemIndex > -1) {
      userCart.items[itemIndex].quantity += guestItem.quantity;
    } else {
      userCart.items.push({
        product: guestItem.product,
        quantity: guestItem.quantity
      });
    }
  }

  await userCart.save();
  
  // Clear or delete guest cart
  await Cart.deleteOne({ _id: guestCart._id });
};

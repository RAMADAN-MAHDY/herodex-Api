import Cart from '../models/Cart.js';
import { successResponse, errorResponse } from '../utils/responseFormatter.js';

export const getCart = async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id }).populate('items.product').lean();
  
  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  return successResponse(res, 'Cart fetched', cart);
};

export const addToCart = async (req, res) => {
  const { productId, quantity } = req.body;
  
  let cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
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

  const cart = await Cart.findOne({ user: req.user._id });
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

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return errorResponse(res, 'Cart not found', [], 404);

  cart.items = cart.items.filter(item => item.product.toString() !== productId);
  await cart.save();
  
  const updatedCart = await Cart.findById(cart._id).populate('items.product').lean();
  return successResponse(res, 'Product removed from cart', updatedCart);
};

export const clearCart = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    cart.items = [];
    await cart.save();
  }
  return successResponse(res, 'Cart cleared');
};

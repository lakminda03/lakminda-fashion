import { Cart } from "../models/Cart.js";
import { Product } from "../models/Product.js";

const normalizeCartResponse = (cartDoc) => {
  const cart = cartDoc.toObject();
  const subtotal = cart.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  return {
    ...cart,
    subtotal
  };
};

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
};

export const getCart = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user.userId);
    return res.status(200).json(normalizeCartResponse(cart));
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch cart", error: error.message });
  }
};

export const addCartItem = async (req, res) => {
  try {
    const { productId, quantity = 1, size = "", color = "" } = req.body;
    if (!productId) {
      return res.status(400).json({ message: "productId is required" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const qty = Number(quantity);
    if (Number.isNaN(qty) || qty < 1) {
      return res.status(400).json({ message: "quantity must be at least 1" });
    }

    if (product.sizes?.length && size && !product.sizes.includes(size)) {
      return res.status(400).json({ message: "Invalid size for product" });
    }
    if (product.colors?.length && color && !product.colors.includes(color)) {
      return res.status(400).json({ message: "Invalid color for product" });
    }

    const cart = await getOrCreateCart(req.user.userId);
    const totalQtyForProduct = cart.items
      .filter((item) => String(item.product) === String(product._id))
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0);

    if (product.stockCount <= 0) {
      return res.status(400).json({ message: "This product is out of stock" });
    }

    if (totalQtyForProduct + qty > product.stockCount) {
      return res.status(400).json({ message: `Only ${product.stockCount} item(s) in stock` });
    }

    const sizePrice = size && product.sizePrices?.get?.(size) !== undefined ? product.sizePrices.get(size) : null;
    const unitPrice = Number(sizePrice ?? product.price ?? 0);

    const existing = cart.items.find(
      (item) => String(item.product) === String(product._id) && item.size === size && item.color === color
    );

    if (existing) {
      existing.quantity += qty;
      existing.unitPrice = unitPrice;
    } else {
      cart.items.push({
        product: product._id,
        name: product.name,
        image: product.image,
        size,
        color,
        unitPrice,
        quantity: qty
      });
    }

    await cart.save();
    return res.status(200).json(normalizeCartResponse(cart));
  } catch (error) {
    return res.status(500).json({ message: "Failed to add item to cart", error: error.message });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const qty = Number(quantity);
    if (Number.isNaN(qty) || qty < 1) {
      return res.status(400).json({ message: "quantity must be at least 1" });
    }

    const cart = await getOrCreateCart(req.user.userId);
    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    const product = await Product.findById(item.product);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const otherQtyForProduct = cart.items
      .filter((cartItem) => String(cartItem.product) === String(item.product) && String(cartItem._id) !== String(itemId))
      .reduce((sum, cartItem) => sum + Number(cartItem.quantity || 0), 0);

    if (otherQtyForProduct + qty > product.stockCount) {
      return res.status(400).json({ message: `Only ${product.stockCount} item(s) in stock` });
    }

    item.quantity = qty;
    await cart.save();
    return res.status(200).json(normalizeCartResponse(cart));
  } catch (error) {
    return res.status(500).json({ message: "Failed to update cart item", error: error.message });
  }
};

export const removeCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const cart = await getOrCreateCart(req.user.userId);
    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    cart.items.pull(itemId);
    await cart.save();
    return res.status(200).json(normalizeCartResponse(cart));
  } catch (error) {
    return res.status(500).json({ message: "Failed to remove cart item", error: error.message });
  }
};

export const clearCart = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user.userId);
    cart.items = [];
    await cart.save();
    return res.status(200).json(normalizeCartResponse(cart));
  } catch (error) {
    return res.status(500).json({ message: "Failed to clear cart", error: error.message });
  }
};

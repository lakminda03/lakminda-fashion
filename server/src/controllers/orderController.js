import Stripe from "stripe";
import { Cart } from "../models/Cart.js";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";

const stripeSecret = process.env.STRIPE_SECRET_KEY || "";
const stripe = stripeSecret ? new Stripe(stripeSecret) : null;
const DELIVERY_FEE = 1;

const validateShippingAddress = (address) => {
  const requiredFields = ["fullName", "phone", "email", "addressLine", "city", "postalCode", "country"];
  return requiredFields.every((field) => address?.[field] && String(address[field]).trim());
};

const buildTotals = (items) => {
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const tax = 0;
  const total = subtotal + DELIVERY_FEE + tax;
  return { subtotal, deliveryFee: DELIVERY_FEE, tax, total };
};

const normalizeAddress = (address) => ({
  fullName: String(address.fullName).trim(),
  phone: String(address.phone).trim(),
  email: String(address.email).trim().toLowerCase(),
  addressLine: String(address.addressLine).trim(),
  city: String(address.city).trim(),
  postalCode: String(address.postalCode).trim(),
  country: String(address.country).trim()
});

const aggregateCartQuantitiesByProduct = (cartItems) => {
  const quantities = new Map();
  cartItems.forEach((item) => {
    const key = String(item.product);
    const nextQty = (quantities.get(key) || 0) + Number(item.quantity || 0);
    quantities.set(key, nextQty);
  });
  return quantities;
};

const validateCartStock = async (cartItems) => {
  const quantities = aggregateCartQuantitiesByProduct(cartItems);
  const productIds = Array.from(quantities.keys());
  const products = await Product.find({ _id: { $in: productIds } }).select("name stockCount");
  const productMap = new Map(products.map((product) => [String(product._id), product]));

  for (const [productId, requestedQty] of quantities.entries()) {
    const product = productMap.get(productId);
    if (!product) {
      return {
        ok: false,
        message: "One or more products are no longer available"
      };
    }

    if (requestedQty > Number(product.stockCount || 0)) {
      return {
        ok: false,
        message: `${product.name} has only ${product.stockCount} item(s) in stock`
      };
    }
  }

  return { ok: true, quantities, productMap };
};

export const createCheckoutIntent = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ message: "Stripe is not configured on server" });
    }

    const { shippingAddress } = req.body;
    if (!validateShippingAddress(shippingAddress)) {
      return res.status(400).json({ message: "Complete shipping address is required" });
    }

    const cart = await Cart.findOne({ user: req.user.userId });
    if (!cart || !cart.items.length) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const stockCheck = await validateCartStock(cart.items);
    if (!stockCheck.ok) {
      return res.status(400).json({ message: stockCheck.message });
    }

    const totals = buildTotals(cart.items);
    const amount = Math.round(totals.total * 100);
    if (amount < 50) {
      return res.status(400).json({ message: "Checkout amount is too low" });
    }

    const intent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      metadata: {
        userId: String(req.user.userId)
      },
      automatic_payment_methods: { enabled: true }
    });

    return res.status(200).json({
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      totals
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create checkout intent", error: error.message });
  }
};

export const placeOrder = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ message: "Stripe is not configured on server" });
    }

    const { shippingAddress, paymentIntentId } = req.body;
    if (!paymentIntentId) {
      return res.status(400).json({ message: "paymentIntentId is required" });
    }
    if (!validateShippingAddress(shippingAddress)) {
      return res.status(400).json({ message: "Complete shipping address is required" });
    }

    const cart = await Cart.findOne({ user: req.user.userId });
    if (!cart || !cart.items.length) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const stockCheck = await validateCartStock(cart.items);
    if (!stockCheck.ok) {
      return res.status(400).json({ message: stockCheck.message });
    }

    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (!intent || intent.status !== "succeeded") {
      return res.status(400).json({ message: "Payment not completed" });
    }
    if (intent.metadata?.userId !== String(req.user.userId)) {
      return res.status(403).json({ message: "Payment intent does not belong to current user" });
    }

    const existingOrder = await Order.findOne({ stripePaymentIntentId: paymentIntentId });
    if (existingOrder) {
      return res.status(200).json({ order: existingOrder, message: "Order already created" });
    }

    const items = cart.items.map((item) => ({
      product: item.product,
      name: item.name,
      image: item.image,
      size: item.size,
      color: item.color,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      lineTotal: item.unitPrice * item.quantity
    }));

    const totals = buildTotals(cart.items);
    const order = await Order.create({
      user: req.user.userId,
      items,
      shippingAddress: normalizeAddress(shippingAddress),
      subtotal: totals.subtotal,
      deliveryFee: totals.deliveryFee,
      tax: totals.tax,
      total: totals.total,
      paymentStatus: "paid",
      orderStatus: "processing",
      stripePaymentIntentId: paymentIntentId
    });

    for (const [productId, quantity] of stockCheck.quantities.entries()) {
      const product = stockCheck.productMap.get(productId);
      product.stockCount = Math.max(0, Number(product.stockCount || 0) - Number(quantity || 0));
      await product.save();
    }

    cart.items = [];
    await cart.save();

    return res.status(201).json({ order });
  } catch (error) {
    return res.status(500).json({ message: "Failed to place order", error: error.message });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.userId }).sort({ createdAt: -1 });
    return res.status(200).json(orders);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch orders", error: error.message });
  }
};

export const getAllOrdersAdmin = async (_req, res) => {
  try {
    const orders = await Order.find().populate("user", "name email").sort({ createdAt: -1 });
    return res.status(200).json(orders);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch all orders", error: error.message });
  }
};

export const updateOrderStatusAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;
    const allowed = ["processing", "shipped", "delivered", "cancelled"];
    if (!allowed.includes(orderStatus)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.orderStatus = orderStatus;
    await order.save();
    return res.status(200).json(order);
  } catch (error) {
    return res.status(500).json({ message: "Failed to update order status", error: error.message });
  }
};

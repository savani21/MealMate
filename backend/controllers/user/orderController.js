const crypto = require("crypto");

const Cart = require("../../models/user/Cart");
const Order = require("../../models/user/Order");
const User = require("../../models/User");

function generateOrderId() {
  const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const randomPart = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `MM-${datePart}-${randomPart}`;
}

// Checkout the current cart: creates an Order, clears the cart, returns
// everything the receipt needs (order id, date/time, user, delivery time).
exports.checkout = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate(
      "items.product"
    );

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty",
      });
    }

    const items = cart.items.map((entry) => ({
      name: entry.product.name,
      price: entry.product.price,
      quantity: entry.quantity,
      unit: entry.product.unit,
    }));

    const totalAmount = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Simple delivery estimate: 30-60 minutes from now
    const deliveryMinutes = 30 + Math.floor(Math.random() * 31);
    const deliveryTime = new Date(Date.now() + deliveryMinutes * 60 * 1000);

    const order = await Order.create({
      user: req.user.id,
      orderId: generateOrderId(),
      items,
      totalAmount,
      deliveryTime,
    });

    // Empty the cart now that the order has been placed
    cart.items = [];
    await cart.save();

    const user = await User.findById(req.user.id).select("name email");

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order,
      user,
    });
  } catch (err) {
    console.error("Checkout error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to place order",
    });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      orders,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to load orders",
    });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const user = await User.findById(req.user.id).select("name email");

    res.status(200).json({
      success: true,
      order,
      user,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to load order",
    });
  }
};

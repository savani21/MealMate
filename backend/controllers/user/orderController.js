const crypto = require("crypto");

const Cart = require("../../models/user/Cart");
const Order = require("../../models/user/Order");
const User = require("../../models/User");
const StoreProduct = require("../../models/store/StoreProduct");
const { sendOrderReceipt } = require("../../services/emailService");

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

    // Re-check product availability at checkout; cart contents may be stale.
    for (const entry of cart.items) {
      if (!entry.product || !entry.product.isActive) {
        return res.status(409).json({
          success: false,
          message: "A product in your cart is no longer available. Please refresh your cart.",
        });
      }
      if (entry.product.stock < entry.quantity) {
        return res.status(409).json({
          success: false,
          message: `Insufficient stock for ${entry.product.name}. Please update the quantity.`,
        });
      }
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

    // Reserve stock atomically so two customers cannot buy the same final units.
    const reserved = [];
    let order = null;

    try {
      for (const entry of cart.items) {
        const updatedProduct = await StoreProduct.findOneAndUpdate(
          {
            _id: entry.product._id,
            isActive: true,
            stock: { $gte: entry.quantity },
          },
          { $inc: { stock: -entry.quantity } },
          { new: true }
        );

        if (!updatedProduct) {
          const stockError = new Error(
            `Stock changed for ${entry.product.name}. Please refresh your cart.`
          );
          stockError.status = 409;
          throw stockError;
        }

        reserved.push({
          productId: entry.product._id,
          quantity: entry.quantity,
        });
      }

      // Simple delivery estimate: 30-60 minutes from now
      const deliveryMinutes = 30 + Math.floor(Math.random() * 31);
      const deliveryTime = new Date(Date.now() + deliveryMinutes * 60 * 1000);

      order = await Order.create({
        user: req.user.id,
        orderId: generateOrderId(),
        items,
        totalAmount,
        deliveryTime,
      });

      // Empty the cart only after the order has been saved.
      cart.items = [];
      await cart.save();
    } catch (checkoutError) {
      // Restore reserved stock if order creation or cart clearing fails.
      await Promise.all(
        reserved.map(({ productId, quantity }) =>
          StoreProduct.updateOne(
            { _id: productId },
            { $inc: { stock: quantity } }
          )
        )
      );

      if (order) await Order.deleteOne({ _id: order._id });
      throw checkoutError;
    }

    const user = await User.findById(req.user.id).select("name email");

    // Email delivery is best-effort: a mail provider outage must not undo a
    // successfully created order or make the customer submit checkout again.
    let receiptEmail = { sent: false, reason: "No email address is available" };
    try {
      receiptEmail = await sendOrderReceipt({ user, order });
    } catch (emailError) {
      console.error("Order receipt email failed:", emailError.message);
      receiptEmail = { sent: false, reason: "Unable to send receipt email" };
    }

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order,
      user,
      receiptEmail,
    });
  } catch (err) {
    console.error("Checkout error:", err);
    res.status(err.status || 500).json({
      success: false,
      message: err.status ? err.message : "Failed to place order",
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

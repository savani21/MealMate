const crypto = require("crypto");

const Cart = require("../../models/user/Cart");
const Order = require("../../models/user/Order");
const User = require("../../models/User");
const GroceryList = require("../../models/user/GroceryList");
const PantryItem = require("../../models/user/PantryItem");
const Notification = require("../../models/user/Notification");
const { normalizeIngredientName } = require("../../utils/ingredientMatcher");



async function markPurchasedGroceryItems(userId, orderItems) {
  const purchasedNames = new Set(orderItems.map((item) => normalizeIngredientName(item.name)).filter(Boolean));
  if (!purchasedNames.size) return;

  const lists = await GroceryList.find({ user: userId });
  for (const list of lists) {
    let changed = false;
    for (const item of list.items) {
      if (purchasedNames.has(normalizeIngredientName(item.name)) && !item.checked) {
        item.checked = true;
        changed = true;
      }
    }
    if (changed) await list.save();
  }
}


function parseStorePack(unit, count) {
  const value = String(unit || "").trim().toLowerCase();
  const match = value.match(/^([0-9]+(?:\.[0-9]+)?)\s*(kg|kgs|g|gm|gms|grams?|l|litres?|liters?|ml|pieces?|pcs?|bunch(?:es)?)$/i);
  if (!match) return { quantity: Number(count), unit: value || "item" };
  let quantity = Number(match[1]) * Number(count);
  let normalized = match[2].toLowerCase();
  if (/^(kg|kgs)$/.test(normalized)) return { quantity: quantity * 1000, unit: "g" };
  if (/^(g|gm|gms|gram|grams)$/.test(normalized)) return { quantity, unit: "g" };
  if (/^(l|litre|litres|liter|liters)$/.test(normalized)) return { quantity: quantity * 1000, unit: "ml" };
  if (normalized === "ml") return { quantity, unit: "ml" };
  if (/^(piece|pieces|pcs)$/.test(normalized)) return { quantity, unit: "piece" };
  return { quantity, unit: "bunch" };
}

function convertPantryQuantity(quantity, fromUnit, toUnit) {
  const from = String(fromUnit || "").toLowerCase().replace(/\([^)]*\)/g, "").replace(/\./g, "").trim();
  const to = String(toUnit || "").toLowerCase().replace(/\([^)]*\)/g, "").replace(/\./g, "").trim();
  const mass = (unit) => /^(kg|kgs|g|gm|gms|grams?)$/.test(unit);
  const volume = (unit) => /^(l|litre|litres|liter|liters|ml)$/.test(unit);
  if (mass(from) && mass(to)) {
    const grams = /^(kg|kgs)$/.test(from) ? quantity * 1000 : quantity;
    return /^(kg|kgs)$/.test(to) ? grams / 1000 : grams;
  }
  if (volume(from) && volume(to)) {
    const ml = from === "l" || /^(litre|litres|liter|liters)$/.test(from) ? quantity * 1000 : quantity;
    return to === "l" || /^(litre|litres|liter|liters)$/.test(to) ? ml / 1000 : ml;
  }
  if (from === to) return quantity;
  return null;
}

async function addDeliveredOrderItem(userId, orderId, item, index) {
  const originalName = String(item.name || "").trim().toLowerCase();
  const name = normalizeIngredientName(originalName);
  if (!name) return;
  const incoming = parseStorePack(item.unit, item.quantity);
  const receiptKey = `${orderId}:${index}`;
  let pantryItems = await PantryItem.find({ user: userId });
  let existing = pantryItems.find((entry) => normalizeIngredientName(entry.name) === name);
  if (existing) {
    if ((existing.receivedOrderItems || []).includes(receiptKey)) return;
    const amount = convertPantryQuantity(incoming.quantity, incoming.unit, existing.unit);
    if (amount === null) throw new Error(`Cannot combine delivered ${name} units (${incoming.unit} and ${existing.unit}). Please standardize the pantry unit.`);
    await PantryItem.updateOne(
      { _id: existing._id, receivedOrderItems: { $ne: receiptKey } },
      { $inc: { quantity: amount }, $addToSet: { receivedOrderItems: receiptKey } }
    );
    return;
  }
  try {
    await PantryItem.create({
      user: userId, name, quantity: incoming.quantity, unit: incoming.unit,
      receivedOrderItems: [receiptKey],
    });
  } catch (error) {
    if (error.code !== 11000) throw error;
    pantryItems = await PantryItem.find({ user: userId });
    existing = pantryItems.find((entry) => normalizeIngredientName(entry.name) === name);
    if (!existing || (existing.receivedOrderItems || []).includes(receiptKey)) return;
    const amount = convertPantryQuantity(incoming.quantity, incoming.unit, existing.unit);
    if (amount === null) throw new Error(`Cannot combine delivered ${name} units (${incoming.unit} and ${existing.unit}).`);
    await PantryItem.updateOne(
      { _id: existing._id, receivedOrderItems: { $ne: receiptKey } },
      { $inc: { quantity: amount }, $addToSet: { receivedOrderItems: receiptKey } }
    );
  }
}

let deliveryProcessorRunning = false;
exports.processDueOrders = async () => {
  if (deliveryProcessorRunning) return;
  deliveryProcessorRunning = true;
  try {
    while (true) {
      const now = new Date();
      const staleLock = new Date(now.getTime() - 2 * 60 * 1000);
      const order = await Order.findOneAndUpdate(
        {
          deliveryTime: { $lte: now },
          status: { $ne: "delivered" },
          $or: [
            { inventorySyncing: { $ne: true } },
            { inventorySyncingAt: { $lt: staleLock } },
          ],
        },
        { $set: { inventorySyncing: true, inventorySyncingAt: now } },
        { returnDocument: "after", sort: { deliveryTime: 1 } }
      );
      if (!order) break;
      try {
        for (let index = 0; index < order.items.length; index += 1) {
          await addDeliveredOrderItem(order.user, order._id, order.items[index], index);
        }
        await Order.updateOne(
          { _id: order._id },
          { $set: { status: "delivered", inventoryAppliedAt: new Date(), inventorySyncing: false }, $unset: { inventorySyncingAt: 1 } }
        );

        // Persist one delivery notification per order. Notification failures must
        // never undo a successful delivery or pantry update.
        try {
          await Notification.updateOne(
            { user: order.user, type: "order-delivered", referenceId: String(order._id) },
            {
              $setOnInsert: {
                user: order.user,
                type: "order-delivered",
                referenceId: String(order._id),
                title: "Your grocery order has arrived!",
                message: `Order ${order.orderId} has been delivered successfully. Your purchased ingredients have been added to your pantry.`,
                read: false,
              },
            },
            { upsert: true }
          );
        } catch (notificationError) {
          console.error(`Could not create delivery notification for ${order.orderId}:`, notificationError.message);
        }
      } catch (error) {
        await Order.updateOne(
          { _id: order._id },
          { $set: { inventorySyncing: false }, $unset: { inventorySyncingAt: 1 } }
        );
        console.error(`Delivery inventory sync failed for ${order.orderId}:`, error.message);
        break;
      }
    }
  } catch (error) {
    console.error("Due-order processor error:", error.message);
  } finally {
    deliveryProcessorRunning = false;
  }
};

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

    // A completed purchase satisfies matching ingredients in every meal-plan
    // grocery list, so they are not offered for purchase again.
    try {
      await markPurchasedGroceryItems(req.user.id, items);
    } catch (groceryError) {
      // The order is already created; do not turn a successful payment/order
      // into a failed checkout because a grocery-list sync needs retrying.
      console.error("Could not sync purchased ingredients to grocery lists:", groceryError);
    }

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
    await exports.processDueOrders();
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
    await exports.processDueOrders();
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

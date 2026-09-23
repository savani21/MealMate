const StoreProduct = require("../../models/store/StoreProduct");
const Cart = require("../../models/user/Cart");

const DEFAULT_PRODUCTS = [
  ["Rice", "Grains", "1 kg", 70],
  ["Wheat Flour", "Grains", "1 kg", 55],
  ["Paneer", "Dairy", "200 g", 90],
  ["Milk", "Dairy", "1 litre", 60],
  ["Tomato", "Vegetables", "1 kg", 45],
  ["Onion", "Vegetables", "1 kg", 40],
  ["Potato", "Vegetables", "1 kg", 35],
  ["Capsicum", "Vegetables", "500 g", 50],
  ["Carrot", "Vegetables", "500 g", 35],
  ["Spinach", "Vegetables", "1 bunch", 30],
  ["Green Peas", "Vegetables", "500 g", 65],
  ["Eggs", "Protein", "6 pieces", 55],
  ["Chicken", "Protein", "500 g", 160],
  ["Cooking Oil", "Essentials", "1 litre", 140],
  ["Salt", "Essentials", "1 kg", 25],
  ["Ginger", "Vegetables", "250 g", 35],
  ["Garlic", "Vegetables", "250 g", 40],
];

async function ensureCatalog() {
  const count = await StoreProduct.countDocuments();
  if (count > 0) return;

  await StoreProduct.insertMany(
    DEFAULT_PRODUCTS.map(([name, category, unit, price]) => ({
      name,
      category,
      unit,
      price,
      stock: 100,
    }))
  );
}

exports.getProducts = async (req, res) => {
  try {
    await ensureCatalog();

    const search = (req.query.search || "").trim();
    const filter = { isActive: true };

    if (search) {
      const names = search
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

      filter.$or = names.map((name) => ({
        name: { $regex: name, $options: "i" },
      }));
    }

    const products = await StoreProduct.find(filter).sort({ category: 1, name: 1 });

    res.json({ success: true, products });
  } catch (err) {
    console.error("Store products error:", err);
    res.status(500).json({ success: false, message: "Failed to load store products" });
  }
};

exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate("items.product");
    res.json({ success: true, cart: cart || { user: req.user.id, items: [] } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to load cart" });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const amount = Number(quantity);

    if (!productId || !Number.isInteger(amount) || amount < 1) {
      return res.status(400).json({ success: false, message: "Valid product and quantity are required" });
    }

    const product = await StoreProduct.findOne({ _id: productId, isActive: true });
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    if (product.stock < amount) return res.status(400).json({ success: false, message: "Insufficient stock" });

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) cart = await Cart.create({ user: req.user.id, items: [] });

    const existing = cart.items.find((item) => item.product.toString() === productId);
    if (existing) existing.quantity += amount;
    else cart.items.push({ product: productId, quantity: amount });

    await cart.save();
    await cart.populate("items.product");

    res.status(201).json({ success: true, message: "Added to cart", cart });
  } catch (err) {
    console.error("Add cart error:", err);
    res.status(500).json({ success: false, message: "Failed to add item to cart" });
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    const amount = Number(req.body.quantity);
    if (!Number.isInteger(amount) || amount < 1) {
      return res.status(400).json({ success: false, message: "Quantity must be at least 1" });
    }

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    const item = cart.items.find((entry) => entry.product.toString() === req.params.productId);
    if (!item) return res.status(404).json({ success: false, message: "Cart item not found" });

    item.quantity = amount;
    await cart.save();
    await cart.populate("items.product");

    res.json({ success: true, cart });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update cart" });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    cart.items = cart.items.filter((item) => item.product.toString() !== req.params.productId);
    await cart.save();
    await cart.populate("items.product");

    res.json({ success: true, cart });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to remove item" });
  }
};

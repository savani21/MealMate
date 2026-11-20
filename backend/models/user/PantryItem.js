const mongoose = require("mongoose");

const pantryItemSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  name: { type: String, required: true, trim: true, lowercase: true },
  quantity: { type: Number, required: true, min: 0 },
  unit: { type: String, required: true, trim: true, lowercase: true },
  expiryDate: { type: Date, default: null },
  receivedOrderItems: { type: [String], default: [] },
}, { timestamps: true });

// Multiple records per ingredient are intentional: each record represents a stock batch
// with its own expiry date. Never enforce uniqueness on ingredient name.
pantryItemSchema.index({ user: 1, name: 1, expiryDate: 1 });

module.exports = mongoose.model("PantryItem", pantryItemSchema);

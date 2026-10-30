const mongoose = require("mongoose");

const pantryItemSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  name: { type: String, required: true, trim: true, lowercase: true },
  quantity: { type: Number, required: true, min: 0 },
  unit: { type: String, required: true, trim: true, lowercase: true },
}, { timestamps: true });

pantryItemSchema.index({ user: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("PantryItem", pantryItemSchema);

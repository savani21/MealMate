const mongoose = require("mongoose");

const localizationSchema = new mongoose.Schema({
  entityType: { type: String, required: true, enum: ["recipe", "mealPlan", "pantryItem", "groceryList"] },
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
  language: { type: String, required: true, enum: ["gu", "hi"] },
  sourceHash: { type: String, required: true },
  fields: { type: mongoose.Schema.Types.Mixed, required: true, default: {} },
  provider: { type: String, default: "openrouter" },
}, { timestamps: true });

localizationSchema.index({ entityType: 1, entityId: 1, language: 1 }, { unique: true });
module.exports = mongoose.model("Localization", localizationSchema);

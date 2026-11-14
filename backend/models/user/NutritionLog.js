const mongoose = require("mongoose");

const nutritionLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  mealPlan: { type: mongoose.Schema.Types.ObjectId, ref: "MealPlan", required: true },
  dayNumber: { type: Number, required: true, min: 1 },
  mealType: { type: String, enum: ["breakfast", "lunch", "dinner"], required: true },
  mealName: { type: String, required: true, trim: true },
  dateKey: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  servings: { type: Number, default: 1, min: 0.25, max: 20 },
  calories: { type: Number, required: true, min: 0, max: 20000 },
  protein: { type: Number, required: true, min: 0, max: 2000 },
  carbohydrates: { type: Number, required: true, min: 0, max: 2000 },
  fat: { type: Number, required: true, min: 0, max: 2000 },
  nutritionSource: { type: String, enum: ["verified_label", "manual", "local_ingredient_estimate", "unknown"], default: "unknown" },
  nutritionStatus: { type: String, enum: ["verified", "estimated", "partial_estimate", "unavailable"], default: "unavailable" },
  confidence: { type: String, enum: ["high", "moderate", "low", "unknown"], default: "unknown" },
  missingIngredients: { type: [mongoose.Schema.Types.Mixed], default: [] },
}, { timestamps: true });

nutritionLogSchema.index({ user: 1, mealPlan: 1, dayNumber: 1, mealType: 1 }, { unique: true });
nutritionLogSchema.index({ user: 1, dateKey: 1 });

module.exports = mongoose.model("NutritionLog", nutritionLogSchema);

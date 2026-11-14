const mongoose = require("mongoose");

const nutritionGoalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  calories: { type: Number, default: 2000, min: 500, max: 10000 },
  protein: { type: Number, default: 75, min: 0, max: 500 },
  carbohydrates: { type: Number, default: 250, min: 0, max: 1000 },
  fat: { type: Number, default: 65, min: 0, max: 500 },
}, { timestamps: true });

module.exports = mongoose.model("NutritionGoal", nutritionGoalSchema);

const mongoose = require("mongoose");

const recipeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    slogan: { type: String, default: "", trim: true, maxlength: 120 },
    category: { type: String, default: "Other" },
    diet: { type: String, default: "Any" },
    ingredients: { type: [String], default: [] },
    instructions: { type: [String], default: [] },
    prepTime: { type: String, default: "" },
    servings: { type: Number, default: 1, min: 1, max: 50 },
    nutrition: {
      calories: { type: Number, min: 0 },
      protein: { type: Number, min: 0 },
      carbohydrates: { type: Number, min: 0 },
      fat: { type: Number, min: 0 },
      servingSize: { type: String, default: "1 serving" },
      source: { type: String, enum: ["verified_label", "local_ingredient_estimate", "manual", "unknown"], default: "unknown" },
      status: { type: String, enum: ["verified", "estimated", "partial_estimate", "unavailable", "manual"], default: "unavailable" },
      confidence: { type: String, enum: ["high", "moderate", "low", "unknown"], default: "unknown" },
      missingIngredients: { type: [mongoose.Schema.Types.Mixed], default: [] },
      ingredientBreakdown: { type: [mongoose.Schema.Types.Mixed], default: [] },
      calculatedAt: { type: Date, default: null },
    },
    image: { type: String, default: "" },
    imageGeneratedAt: { type: Date, default: null },
    source: { type: String, enum: ["manual", "ai"], default: "manual" },
    generationMealName: { type: String, default: "", trim: true },
    generationInputIngredients: { type: [String], default: [] },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Recipe", recipeSchema);

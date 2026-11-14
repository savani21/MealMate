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
    nutrition: {
      calories: { type: Number, min: 0 },
      protein: { type: Number, min: 0 },
      carbohydrates: { type: Number, min: 0 },
      fat: { type: Number, min: 0 },
      servingSize: { type: String, default: "1 serving" },
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

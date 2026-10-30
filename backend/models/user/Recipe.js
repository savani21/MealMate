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
    image: { type: String, default: "" },
    source: { type: String, enum: ["manual", "ai"], default: "manual" },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Recipe", recipeSchema);

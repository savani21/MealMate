const mongoose = require("mongoose");

const recipeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    category: {
      type: String,
      default: "Other",
    },

    diet: {
      type: String,
      default: "Any",
    },

    ingredients: {
      type: [String],
      default: [],
    },

    instructions: {
      type: [String],
      default: [],
    },

    prepTime: {
      type: String,
      default: "",
    },

    image: {
      type: String,
      default: "",
    },

    source: {
      type: String,
      enum: ["manual", "ai"],
      default: "manual",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Recipe", recipeSchema);
const mongoose = require("mongoose");

const mealPlanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    goal: {
      type: String,
      required: true,
    },

    diet: {
      type: String,
      required: true,
    },

    allergies: {
      type: String,
      default: "",
    },

    ingredients: {
      type: String,
      default: "",
    },

    availableIngredients: {
      type: String,
      default: "",
    },

    duration: {
      type: Number,
      required: true,
    },

    meals: {
      type: Array,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("MealPlan", mealPlanSchema);
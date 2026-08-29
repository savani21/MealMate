const mongoose = require("mongoose");

const groceryListSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    mealPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MealPlan",
      required: true,
    },

    items: [
      {
        name: {
          type: String,
          required: true,
        },

        quantity: {
          type: String,
          default: "",
        },

        checked: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const GroceryList = mongoose.model(
  "GroceryList",
  groceryListSchema
);

module.exports = GroceryList;
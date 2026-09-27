const mongoose = require("mongoose");

const groceryListSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    mealPlan: { type: mongoose.Schema.Types.ObjectId, ref: "MealPlan", required: true },
    items: [
      {
        name: { type: String, required: true },
        quantity: { type: String, default: "" },
        checked: { type: Boolean, default: false },
        day: { type: Number, default: null },
        mealType: { type: String, default: "" },
        mealName: { type: String, default: "" },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("GroceryList", groceryListSchema);

const GroceryList = require("../../models/user/GroceryList");
const MealPlan = require("../../models/MealPlan");

exports.createGroceryList = async (req, res) => {
  try {
    const { mealPlanId } = req.body;

    if (!mealPlanId) {
      return res.status(400).json({
        success: false,
        message: "Meal plan ID is required",
      });
    }

    // Make sure the meal plan belongs to the logged-in user
    const mealPlan = await MealPlan.findOne({
      _id: mealPlanId,
      user: req.user.id,
    });

    if (!mealPlan) {
      return res.status(404).json({
        success: false,
        message: "Meal plan not found",
      });
    }

    // Extract meals from the saved plan
    const items = [];

    mealPlan.meals.forEach((day) => {
      items.push(
        {
          name: day.breakfast,
          quantity: "",
          checked: false,
        },
        {
          name: day.lunch,
          quantity: "",
          checked: false,
        },
        {
          name: day.snack,
          quantity: "",
          checked: false,
        },
        {
          name: day.dinner,
          quantity: "",
          checked: false,
        }
      );
    });

    const groceryList = await GroceryList.create({
      user: req.user.id,
      mealPlan: mealPlan._id,
      items,
    });

    res.status(201).json({
      success: true,
      message: "Grocery list created successfully",
      groceryList,
    });

  } catch (err) {
    console.error("Grocery List Error:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


exports.getMyGroceryLists = async (req, res) => {
  try {
    const groceryLists = await GroceryList.find({
      user: req.user.id,
    })
      .populate("mealPlan")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      groceryLists,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
const GroceryList = require("../../models/user/GroceryList");
const MealPlan = require("../../models/MealPlan");
const Recipe = require("../../models/user/Recipe");

exports.createGroceryList = async (req, res) => {
  try {
    const { mealPlanId } = req.body;

    if (!mealPlanId) {
      return res.status(400).json({
        success: false,
        message: "Meal plan ID is required",
      });
    }

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

    const mealNames = mealPlan.meals
      .flatMap((day) => [day.breakfast, day.lunch, day.snack, day.dinner])
      .filter(Boolean)
      .map((name) => name.trim());

    const recipes = await Recipe.find({
      name: { $in: mealNames },
    });

    const recipeMap = new Map(
      recipes.map((recipe) => [recipe.name.trim().toLowerCase(), recipe])
    );

    const ingredientMap = new Map();

    mealNames.forEach((mealName) => {
      const recipe = recipeMap.get(mealName.toLowerCase());

      if (recipe?.ingredients?.length) {
        recipe.ingredients.forEach((ingredient) => {
          const clean = ingredient.trim();
          if (clean) ingredientMap.set(clean.toLowerCase(), clean);
        });
      } else {
        ingredientMap.set(mealName.toLowerCase(), mealName);
      }
    });

    const items = Array.from(ingredientMap.values()).map((name) => ({
      name,
      quantity: "",
      checked: false,
    }));

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

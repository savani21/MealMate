const GroceryList = require("../../models/user/GroceryList");
const MealPlan = require("../../models/MealPlan");
const Recipe = require("../../models/user/Recipe");

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const getIngredientName = (value) => {
  const text = String(value || "").trim();
  if (!text) return "";

  // Meal plans use simple ingredient names. This also handles older
  // saved recipes that may contain a quantity before the ingredient.
  return text
    .replace(/^\d+(?:\.\d+)?\s*(?:g|kg|mg|ml|l|cup|cups|tbsp|tsp|tablespoons?|teaspoons?)?\s+/i, "")
    .trim();
};

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

    const availableIngredients = String(
      mealPlan.availableIngredients || mealPlan.ingredients || ""
    )
      .split(",")
      .map(getIngredientName)
      .filter(Boolean);

    const availableSet = new Set(availableIngredients.map(normalize));

    const mealNames = mealPlan.meals
      .flatMap((day) => [day.breakfast, day.lunch, day.snack, day.dinner])
      .filter((name) => typeof name === "string" && name.trim())
      .map((name) => name.trim());

    // New meal plans contain the exact ingredients used for every meal.
    // This prevents meal names from ever becoming grocery items.
    const plannedIngredients = mealPlan.meals.flatMap((day) => {
      const mealIngredients = day.mealIngredients || {};
      return [
        ...(Array.isArray(mealIngredients.breakfast) ? mealIngredients.breakfast : []),
        ...(Array.isArray(mealIngredients.lunch) ? mealIngredients.lunch : []),
        ...(Array.isArray(mealIngredients.dinner) ? mealIngredients.dinner : []),
        ...(Array.isArray(mealIngredients.snack) ? mealIngredients.snack : []),
      ];
    });

    let requiredIngredients = plannedIngredients
      .map(getIngredientName)
      .filter(Boolean);

    // Backward compatibility for meal plans created before mealIngredients
    // was added: use matching saved recipes if available.
    if (requiredIngredients.length === 0 && mealNames.length > 0) {
      const recipes = await Recipe.find({
        name: { $in: mealNames },
      });

      const recipeMap = new Map(
        recipes.map((recipe) => [normalize(recipe.name), recipe])
      );

      requiredIngredients = mealNames.flatMap((mealName) => {
        const recipe = recipeMap.get(normalize(mealName));
        return Array.isArray(recipe?.ingredients) ? recipe.ingredients : [];
      });
    }

    const missingMap = new Map();

    requiredIngredients.forEach((ingredient) => {
      const clean = getIngredientName(ingredient);
      const key = normalize(clean);

      if (clean && key && !availableSet.has(key)) {
        missingMap.set(key, clean);
      }
    });

    const items = Array.from(missingMap.values()).map((name) => ({
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
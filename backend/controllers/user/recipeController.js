const Recipe = require("../../models/user/Recipe");
const User = require("../../models/User");
const MealPlan = require("../../models/MealPlan");
const RecipeReview = require("../../models/user/RecipeReview");

const normalizeIngredient = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/^[\s\d./-]+/, "")
    .replace(/^(?:cups?|tbsp|tbsps|tablespoons?|tsp|tsps|teaspoons?|kg|kgs|g|gm|gms|grams?|ml|l|litres?|liters?|pieces?|pcs?|cloves?|slices?)\s+/i, "")
    .replace(/\b(?:large|medium|small|finely|roughly|thinly|thickly|chopped|diced|minced|sliced|grated|crushed|fresh|freshly|cooked|boiled|raw|roasted|optional|to taste)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.,;:]+$/, "")
    .replace(/\b(\w+)s$/, "$1");

const cleanIngredients = (value) =>
  String(value || "")
    .split(",")
    .map((item) => normalizeIngredient(item))
    .filter(Boolean);

const RECIPE_FORBIDDEN = {
  vegetarian: /\b(chicken|mutton|lamb|beef|pork|fish|salmon|tuna|prawn|shrimp|seafood|egg|eggs|bacon|ham|sausage|gelatin)\b/i,
  vegan: /\b(chicken|mutton|lamb|beef|pork|fish|salmon|tuna|prawn|shrimp|seafood|egg|eggs|milk|paneer|cheese|curd|yogurt|butter|ghee|cream|dairy|gelatin)\b/i,
  eggetarian: /\b(chicken|mutton|lamb|beef|pork|fish|salmon|tuna|prawn|shrimp|seafood|bacon|ham|sausage|gelatin)\b/i,
};

const getRecommendedRecipes = async (req, res) => {
  try {
    const [mealPlans, recipes, reviewStats] = await Promise.all([
      MealPlan.find({}, { meals: 1 }).lean(),
      Recipe.find().lean(),
      RecipeReview.aggregate([
        {
          $group: {
            _id: "$recipe",
            ratingCount: { $sum: 1 },
            averageRating: { $avg: "$rating" },
          },
        },
      ]),
    ]);

    const ratingStats = Object.fromEntries(
      reviewStats.map((item) => [
        item._id.toString(),
        {
          ratingCount: item.ratingCount,
          averageRating: Number(item.averageRating.toFixed(1)),
        },
      ])
    );

    // A recipe is considered "frequently used" when its name appears in
    // generated meal plans. This uses the data already stored by MealMate
    // instead of introducing a separate usage-tracking collection.
    const usageCounts = {};
    mealPlans.forEach((plan) => {
      (plan.meals || []).forEach((day) => {
        ["breakfast", "lunch", "snack", "dinner"].forEach((type) => {
          const mealName = normalizeIngredient(day?.[type]);
          if (mealName) usageCounts[mealName] = (usageCounts[mealName] || 0) + 1;
        });
      });
    });

    const available = cleanIngredients(req.query.available);
    const recommended = cleanIngredients(req.query.recommended);
    const diet = ["vegetarian", "vegan", "non-vegetarian", "eggetarian"].includes(req.query.diet)
      ? req.query.diet
      : "";
    const mode = req.query.mode === "recommended" ? "recommended" : "available";
    const allowedIngredients = new Set(
      mode === "recommended"
        ? [...new Set([...available, ...recommended])]
        : available
    );

    const ranked = recipes
      .map((recipe) => {
        const recipeIngredients = [
          ...new Set((recipe.ingredients || []).map(normalizeIngredient).filter(Boolean)),
        ];

        const recipeDiet = normalizeIngredient(recipe.diet);
        const incompatibleRecipeDiet =
          diet === "vegetarian" &&
          ["non-vegetarian", "eggetarian"].includes(recipeDiet)
            ? true
            : diet === "vegan" &&
              ["vegetarian", "non-vegetarian", "eggetarian"].includes(recipeDiet)
              ? true
              : diet === "eggetarian" &&
                recipeDiet === "non-vegetarian"
                ? true
                : false;

        const violatesDiet =
          incompatibleRecipeDiet ||
          Boolean(RECIPE_FORBIDDEN[diet]?.test(recipe.name)) ||
          recipeIngredients.some((ingredient) => RECIPE_FORBIDDEN[diet]?.test(ingredient));

        if (violatesDiet) return null;

        const matchedAvailableIngredients = recipeIngredients.filter((ingredient) =>
          available.some(
            (allowed) =>
              ingredient === allowed ||
              ingredient.includes(allowed) ||
              allowed.includes(ingredient)
          )
        );

        const matchedIngredients = recipeIngredients.filter((ingredient) =>
          [...allowedIngredients].some(
            (allowed) =>
              ingredient === allowed ||
              ingredient.includes(allowed) ||
              allowed.includes(ingredient)
          )
        );

        const missingIngredients = recipeIngredients.filter(
          (ingredient) => !matchedAvailableIngredients.includes(ingredient)
        );

        const matchPercentage = recipeIngredients.length
          ? matchedIngredients.length / recipeIngredients.length
          : 0;
        const ratingCount = ratingStats[recipe._id.toString()]?.ratingCount || 0;
        const averageRating = ratingStats[recipe._id.toString()]?.averageRating || 0;
        const usageCount = usageCounts[normalizeIngredient(recipe.name)] || 0;

        const recommendationScore =
          matchPercentage * 100 +
          matchedIngredients.length * 5 +
          averageRating * 4 +
          ratingCount * 2 +
          usageCount * 2;

        return {
          ...recipe,
          ratingCount,
          averageRating,
          usageCount,
          matchedIngredients,
          matchedAvailableIngredients,
          missingIngredients,
          matchCount: matchedIngredients.length,
          matchPercentage: Math.round(matchPercentage * 100),
          canCookWithAvailable: missingIngredients.length === 0,
          recommendationScore,
        };
      })
      .filter(Boolean)
      .filter((recipe) => allowedIngredients.size === 0 || recipe.matchCount > 0)
      .sort((a, b) =>
        b.ratingCount - a.ratingCount ||
        b.averageRating - a.averageRating ||
        b.recommendationScore - a.recommendationScore ||
        b.matchPercentage - a.matchPercentage
      );

    const topRecipes = ranked.slice(0, 3);

    // Keep the existing recommended-ingredient response compatible with the
    // Meal Planner while making it reflect the highest-ranked recipes.
    const ingredients = [
      ...new Set(
        ranked
          .slice(0, 10)
          .flatMap((recipe) => recipe.ingredients || [])
          .map((ingredient) => String(ingredient).trim())
          .filter(Boolean)
      ),
    ].slice(0, 15);

    res.status(200).json({
      recipes: topRecipes,
      ingredients,
      mode,
      diet,
      availableIngredients: available,
      recommendedIngredients: recommended,
    });
  } catch (error) {
    console.error("RECOMMENDED RECIPES ERROR:", error);
    res.status(500).json({ message: "Failed to get recommended recipes" });
  }
};

const getRecipes = async (req, res) => {
  try {
    const [recipes, reviewStats] = await Promise.all([
      Recipe.find().sort({ createdAt: -1 }).lean(),
      RecipeReview.aggregate([
        {
          $group: {
            _id: "$recipe",
            ratingCount: { $sum: 1 },
            averageRating: { $avg: "$rating" },
          },
        },
      ]),
    ]);

    const statsByRecipe = Object.fromEntries(
      reviewStats.map((item) => [
        item._id.toString(),
        {
          ratingCount: item.ratingCount,
          averageRating: Number(item.averageRating.toFixed(1)),
        },
      ])
    );

    const recipesWithRatings = recipes.map((recipe) => ({
      ...recipe,
      ratingCount: statsByRecipe[recipe._id.toString()]?.ratingCount || 0,
      averageRating: statsByRecipe[recipe._id.toString()]?.averageRating || 0,
    }));

    res.status(200).json({ recipes: recipesWithRatings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get recipes" });
  }
};

const getRecipeById = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id).lean();

    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    const reviewStats = await RecipeReview.aggregate([
      { $match: { recipe: recipe._id } },
      {
        $group: {
          _id: "$recipe",
          ratingCount: { $sum: 1 },
          averageRating: { $avg: "$rating" },
        },
      },
    ]);

    const rating = reviewStats[0];

    res.status(200).json({
      recipe: {
        ...recipe,
        ratingCount: rating?.ratingCount || 0,
        averageRating: rating ? Number(rating.averageRating.toFixed(1)) : 0,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get recipe" });
  }
};

const createRecipe = async (req, res) => {
  try {
    const recipe = new Recipe({
      name: req.body.name,
      description: req.body.description,
      category: req.body.category,
      diet: req.body.diet,
      ingredients: req.body.ingredients,
      instructions: req.body.instructions,
      prepTime: req.body.prepTime,
      image: req.body.image,
      createdBy: req.user.id,
    });

    await recipe.save();

    res.status(201).json({
      message: "Recipe created successfully",
      recipe,
    });
  } catch (error) {
    console.error("CREATE RECIPE ERROR:", error);
    res.status(500).json({ message: "Failed to create recipe", error: error.message });
  }
};

const deleteRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!recipe) {
      return res.status(404).json({
        message: "Recipe not found or you do not have permission to delete it",
      });
    }

    await User.updateMany(
      { favorites: recipe._id },
      { $pull: { favorites: recipe._id } }
    );

    res.status(200).json({ message: "Recipe deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete recipe" });
  }
};

module.exports = {
  getRecipes,
  getRecommendedRecipes,
  getRecipeById,
  createRecipe,
  deleteRecipe,
};

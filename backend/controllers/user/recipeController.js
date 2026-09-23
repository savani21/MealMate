const Recipe = require("../../models/user/Recipe");
const User = require("../../models/User");

// GET all recipes
const getRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find().sort({ createdAt: -1 });

    res.status(200).json({
      recipes,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to get recipes",
    });
  }
};

// GET recipes liked by the most users + their ingredients
const getRecommendedRecipes = async (req, res) => {
  try {
    const users = await User.find({}, { favorites: 1 }).lean();
    const likeCounts = {};

    users.forEach((user) => {
      (user.favorites || []).forEach((recipeId) => {
        const id = recipeId.toString();
        likeCounts[id] = (likeCounts[id] || 0) + 1;
      });
    });

    const rankedIds = Object.entries(likeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    if (rankedIds.length === 0) {
      return res.status(200).json({
        recipes: [],
        ingredients: [],
      });
    }

    const recipes = await Recipe.find({
      _id: { $in: rankedIds.map(([id]) => id) },
    }).lean();

    const rankMap = Object.fromEntries(rankedIds);
    recipes.sort((a, b) => (rankMap[b._id.toString()] || 0) - (rankMap[a._id.toString()] || 0));

    const ingredients = [
      ...new Set(
        recipes
          .flatMap((recipe) => recipe.ingredients || [])
          .map((ingredient) => ingredient.trim())
          .filter(Boolean)
      ),
    ].slice(0, 15);

    res.status(200).json({
      recipes,
      ingredients,
    });
  } catch (error) {
    console.error("RECOMMENDED RECIPES ERROR:", error);

    res.status(500).json({
      message: "Failed to get recommended recipes",
    });
  }
};

// GET single recipe
const getRecipeById = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({
        message: "Recipe not found",
      });
    }

    res.status(200).json({
      recipe,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to get recipe",
    });
  }
};

// CREATE recipe
const createRecipe = async (req, res) => {
  try {
    console.log("BODY RECEIVED:", req.body);
    console.log("NAME RECEIVED:", req.body.name);

    const recipe = new Recipe({
      name: req.body.name,
      description: req.body.description,
      category: req.body.category,
      diet: req.body.diet,
      ingredients: req.body.ingredients,
      instructions: req.body.instructions,
      prepTime: req.body.prepTime,
      image: req.body.image,
    });

    await recipe.save();

    res.status(201).json({
      message: "Recipe created successfully",
      recipe,
    });

  } catch (error) {
    console.error("CREATE RECIPE ERROR:", error);

    res.status(500).json({
      message: "Failed to create recipe",
      error: error.message,
    });
  }
};

// DELETE recipe
const deleteRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findByIdAndDelete(req.params.id);

    if (!recipe) {
      return res.status(404).json({
        message: "Recipe not found",
      });
    }

    res.status(200).json({
      message: "Recipe deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to delete recipe",
    });
  }
};

module.exports = {
  getRecipes,
  getRecommendedRecipes,
  getRecipeById,
  createRecipe,
  deleteRecipe,
};
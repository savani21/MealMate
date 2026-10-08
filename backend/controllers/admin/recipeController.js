const Recipe = require("../../models/user/Recipe");
const RecipeReview = require("../../models/user/RecipeReview");
const RecipeReview = require("../../models/user/RecipeReview");

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

    res.status(200).json({ success: true, recipes: recipesWithRatings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to get recipes" });
  }
};

const getRecipeById = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ success: false, message: "Recipe not found" });
    }
    res.status(200).json({ success: true, recipe });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to get recipe" });
  }
};

const createRecipe = async (req, res) => {
  try {
    const { name, description, category, diet, ingredients, instructions, prepTime, image } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Recipe name is required" });
    }

    const recipe = await Recipe.create({
      name, description, category, diet, ingredients, instructions, prepTime, image,
    });

    res.status(201).json({ success: true, message: "Recipe created successfully", recipe });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to create recipe" });
  }
};

const updateRecipe = async (req, res) => {
  try {
    const { name, description, category, diet, ingredients, instructions, prepTime, image } = req.body;

    const recipe = await Recipe.findByIdAndUpdate(
      req.params.id,
      { name, description, category, diet, ingredients, instructions, prepTime, image },
      { returnDocument: "after", runValidators: true }
    );

    if (!recipe) {
      return res.status(404).json({ success: false, message: "Recipe not found" });
    }

    res.status(200).json({ success: true, message: "Recipe updated successfully", recipe });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to update recipe" });
  }
};

const deleteRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findByIdAndDelete(req.params.id);
    if (!recipe) {
      return res.status(404).json({ success: false, message: "Recipe not found" });
    }
    await RecipeReview.deleteMany({ recipe: recipe._id });
    res.status(200).json({ success: true, message: "Recipe deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to delete recipe" });
  }
};

module.exports = { getRecipes, getRecipeById, createRecipe, updateRecipe, deleteRecipe };

const Recipe = require("../../models/user/Recipe");
const RecipeReview = require("../../models/user/RecipeReview");
const ArchivedRecipe = require("../../models/user/ArchivedRecipe");
const User = require("../../models/User");

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
    const { name, description, slogan, category, diet, ingredients, instructions, prepTime, image } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Recipe name is required" });
    }

    const recipe = await Recipe.create({
      name, description, slogan, category, diet, ingredients, instructions, prepTime, image,
    });

    res.status(201).json({ success: true, message: "Recipe created successfully", recipe });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to create recipe" });
  }
};

const updateRecipe = async (req, res) => {
  try {
    const { name, description, slogan, category, diet, ingredients, instructions, prepTime, image } = req.body;

    const recipe = await Recipe.findByIdAndUpdate(
      req.params.id,
      { name, description, slogan, category, diet, ingredients, instructions, prepTime, image },
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
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ success: false, message: "Recipe not found" });
    }

    await ArchivedRecipe.create({
      recipeId: recipe._id,
      recipeData: recipe.toObject(),
      deletedBy: req.user.id,
      deletedByRole: "admin",
    });
    await Recipe.deleteOne({ _id: recipe._id });
    res.status(200).json({ success: true, message: "Recipe moved to archive" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to archive recipe" });
  }
};

const getArchivedRecipes = async (req, res) => {
  try {
    const archivedRecipes = await ArchivedRecipe.find().populate("deletedBy", "name email").sort({ deletedAt: -1 }).lean();
    res.status(200).json({ success: true, archivedRecipes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to load archived recipes" });
  }
};

const restoreArchivedRecipe = async (req, res) => {
  try {
    const archived = await ArchivedRecipe.findById(req.params.id);
    if (!archived) return res.status(404).json({ success: false, message: "Archived recipe not found" });
    const existing = await Recipe.findById(archived.recipeId);
    if (existing) return res.status(409).json({ success: false, message: "A recipe with this ID already exists" });
    await Recipe.create({ ...archived.recipeData, _id: archived.recipeId });
    await ArchivedRecipe.deleteOne({ _id: archived._id });
    res.status(200).json({ success: true, message: "Recipe restored successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to restore recipe" });
  }
};

const permanentlyDeleteArchivedRecipe = async (req, res) => {
  try {
    const archived = await ArchivedRecipe.findByIdAndDelete(req.params.id);
    if (!archived) return res.status(404).json({ success: false, message: "Archived recipe not found" });
    await RecipeReview.deleteMany({ recipe: archived.recipeId });
    await User.updateMany(
      { $or: [{ favorites: archived.recipeId }, { dislikes: archived.recipeId }] },
      { $pull: { favorites: archived.recipeId, dislikes: archived.recipeId } }
    );
    res.status(200).json({ success: true, message: "Archived recipe permanently deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to permanently delete recipe" });
  }
};nst Recipe = require("../../models/user/Recipe");
const RecipeReview = require("../../models/user/RecipeReview");\nconst ArchivedRecipe = require("../../models/user/ArchivedRecipe");

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
    const { name, description, slogan, category, diet, ingredients, instructions, prepTime, image } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Recipe name is required" });
    }

    const recipe = await Recipe.create({
      name, description, slogan, category, diet, ingredients, instructions, prepTime, image,
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
      { name, description, slogan, category, diet, ingredients, instructions, prepTime, image },
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

module.exports = { getRecipes, getRecipeById, createRecipe, updateRecipe, deleteRecipe, getArchivedRecipes, restoreArchivedRecipe, permanentlyDeleteArchivedRecipe };

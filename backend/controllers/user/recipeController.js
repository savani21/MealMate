const Recipe = require("../../models/user/Recipe");

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
  getRecipeById,
  createRecipe,
  deleteRecipe,
};
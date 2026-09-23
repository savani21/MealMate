const Recipe = require("../../models/user/Recipe");

const getRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, recipes });
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
      { new: true, runValidators: true }
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
    res.status(200).json({ success: true, message: "Recipe deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to delete recipe" });
  }
};

module.exports = { getRecipes, getRecipeById, createRecipe, updateRecipe, deleteRecipe };

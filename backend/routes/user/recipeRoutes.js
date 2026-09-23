const express = require("express");

const {
  getRecipes,
  getRecommendedRecipes,
  getRecipeById,
  createRecipe,
  deleteRecipe,
} = require("../../controllers/user/recipeController");

const router = express.Router();

router.get("/", getRecipes);
router.get("/recommended", getRecommendedRecipes);
router.get("/:id", getRecipeById);
router.post("/", createRecipe);
router.delete("/:id", deleteRecipe);

module.exports = router;
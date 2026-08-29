const express = require("express");

const {
  getRecipes,
  getRecipeById,
  createRecipe,
  deleteRecipe,
} = require("../../controllers/user/recipeController");

const router = express.Router();

router.get("/", getRecipes);
router.get("/:id", getRecipeById);
router.post("/", createRecipe);
router.delete("/:id", deleteRecipe);

module.exports = router;
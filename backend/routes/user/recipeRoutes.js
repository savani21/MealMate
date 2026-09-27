const express = require("express");
const auth = require("../../middleware/auth");

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
router.get("/:id", auth, getRecipeById);
router.post("/", auth, createRecipe);
router.delete("/:id", auth, deleteRecipe);

module.exports = router;

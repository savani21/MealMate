const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const {
  createGroceryList,
  getMyGroceryLists,
  updateGroceryItem,
  addRecipeIngredientsToGroceryList,
} = require("../../controllers/user/groceryController");

// Create or regenerate grocery list from a meal plan
router.post("/", auth, createGroceryList);

// Add only user-selected missing ingredients from a recipe to its meal-plan list
router.post("/from-recipe", auth, addRecipeIngredientsToGroceryList);

// Get the user's recipe-wise grocery lists
router.get("/", auth, getMyGroceryLists);

// Save checked/unchecked state for one grocery item
router.patch("/:listId/items/:itemId", auth, updateGroceryItem);

module.exports = router;

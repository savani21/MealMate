const router = require("express").Router();

const auth = require("../../middleware/auth");

const {
  createGroceryList,
  getMyGroceryLists,
} = require("../../controllers/user/groceryController");

// Create grocery list from a meal plan
router.post("/", auth, createGroceryList);

// Get logged-in user's grocery lists
router.get("/", auth, getMyGroceryLists);

module.exports = router;
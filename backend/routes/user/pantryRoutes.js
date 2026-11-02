const express = require("express");
const auth = require("../../middleware/auth");
const { listPantry, addPantryItem, updatePantryItem, deletePantryItem, compareRecipeWithPantry, consumeRecipeIngredients } = require("../../controllers/user/pantryController");
const router = express.Router();

router.use(auth);
router.get("/", listPantry);
router.get("/compare/:recipeId", compareRecipeWithPantry);
router.post("/consume/:recipeId", consumeRecipeIngredients);
router.post("/", addPantryItem);
router.patch("/:id", updatePantryItem);
router.delete("/:id", deletePantryItem);

module.exports = router;

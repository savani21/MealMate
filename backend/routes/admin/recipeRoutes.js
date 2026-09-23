const router = require("express").Router();

const auth = require("../../middleware/auth");
const admin = require("../../middleware/admin");

const {
  getRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
} = require("../../controllers/admin/recipeController");

router.get("/", auth, admin, getRecipes);
router.get("/:id", auth, admin, getRecipeById);
router.post("/", auth, admin, createRecipe);
router.put("/:id", auth, admin, updateRecipe);
router.delete("/:id", auth, admin, deleteRecipe);

module.exports = router;

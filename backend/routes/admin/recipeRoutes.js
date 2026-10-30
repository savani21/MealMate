const router = require("express").Router();

const auth = require("../../middleware/auth");
const admin = require("../../middleware/admin");

const {
  getRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  getArchivedRecipes,
  restoreArchivedRecipe,
  permanentlyDeleteArchivedRecipe,
} = require("../../controllers/admin/recipeController");

router.get("/archived", auth, admin, getArchivedRecipes);
router.post("/archived/:id/restore", auth, admin, restoreArchivedRecipe);
router.delete("/archived/:id", auth, admin, permanentlyDeleteArchivedRecipe);
router.get("/", auth, admin, getRecipes);
router.get("/:id", auth, admin, getRecipeById);
router.post("/", auth, admin, createRecipe);
router.put("/:id", auth, admin, updateRecipe);
router.delete("/:id", auth, admin, deleteRecipe);

module.exports = router;

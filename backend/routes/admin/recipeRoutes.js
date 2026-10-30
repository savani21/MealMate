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

router.get("/archived", auth, admin, getArchivedRecipes);\nrouter.post("/archived/:id/restore", auth, admin, restoreArchivedRecipe);\nrouter.delete("/archived/:id", auth, admin, permanentlyDeleteArchivedRecipe);\nrouter.get("/", auth, admin, getRecipes);
router.get("/:id", auth, admin, getRecipeById);
router.post("/", auth, admin, createRecipe);
router.put("/:id", auth, admin, updateRecipe);
router.delete("/:id", auth, admin, deleteRecipe);

module.exports = router;

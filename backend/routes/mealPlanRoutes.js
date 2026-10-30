const router = require("express").Router();

const auth = require("../middleware/auth");

const {
  createMealPlan,
  updateMealSelection,
  getMyMealPlans,
  getMyMealPlanById,
  archiveMyMealPlan,
  restoreMyMealPlan,
  deleteMyMealPlan,
} = require("../controllers/mealPlanController");

router.post("/", auth, createMealPlan);
router.get("/", auth, getMyMealPlans);
router.get("/:id", auth, getMyMealPlanById);
router.patch("/:id/selection", auth, updateMealSelection);
router.patch("/:id/archive", auth, archiveMyMealPlan);
router.patch("/:id/restore", auth, restoreMyMealPlan);
router.delete("/:id", auth, deleteMyMealPlan);

module.exports = router;

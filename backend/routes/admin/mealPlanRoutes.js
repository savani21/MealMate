const router = require("express").Router();

const auth = require("../../middleware/auth");
const admin = require("../../middleware/admin");

const {
  getAllMealPlans,
  getMealPlanById,
  deleteMealPlan,
} = require("../../controllers/admin/mealPlanController");

router.get("/", auth, admin, getAllMealPlans);
router.get("/:id", auth, admin, getMealPlanById);
router.delete("/:id", auth, admin, deleteMealPlan);

module.exports = router;

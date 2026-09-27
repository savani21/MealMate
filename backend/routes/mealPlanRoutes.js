const router = require("express").Router();

const auth = require("../middleware/auth");

const {
  createMealPlan,
  getMyMealPlans,
  getMyMealPlanById,
} = require("../controllers/mealPlanController");

// Create a meal plan
router.post("/", auth, createMealPlan);

// Get logged-in user's meal plans
router.get("/", auth, getMyMealPlans);

// Get one meal plan belonging to the logged-in user
router.get("/:id", auth, getMyMealPlanById);

module.exports = router;

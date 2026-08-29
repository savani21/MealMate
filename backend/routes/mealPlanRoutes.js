const router = require("express").Router();

const auth = require("../middleware/auth");

const {
  createMealPlan,
  getMyMealPlans,
} = require("../controllers/mealPlanController");


// Create a meal plan
router.post("/", auth, createMealPlan);


// Get logged-in user's meal plans
router.get("/", auth, getMyMealPlans);


module.exports = router;
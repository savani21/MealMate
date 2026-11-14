const router = require("express").Router();
const auth = require("../../middleware/auth");
const {
  getDashboard,
  saveGoals,
  logPlannedMeal,
  getPlanLogs,
  removeLog,
  getRecipeNutrition,
} = require("../../controllers/user/nutritionController");

router.get("/dashboard", auth, getDashboard);
router.get("/recipe/:recipeId", auth, getRecipeNutrition);
router.put("/goals", auth, saveGoals);
router.post("/logs", auth, logPlannedMeal);
router.get("/plan/:planId", auth, getPlanLogs);
router.delete("/logs/:id", auth, removeLog);

module.exports = router;

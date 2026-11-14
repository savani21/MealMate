const router = require("express").Router();
const auth = require("../../middleware/auth");
const {
  getDashboard,
  getTodayPlan,
  getReminderPreferences,
  saveReminderPreferences,
  saveDailyCheckin,
  saveGoals,
  logPlannedMeal,
  getPlanLogs,
  removeLog,
  getRecipeNutrition,
} = require("../../controllers/user/nutritionController");

router.get("/dashboard", auth, getDashboard);
router.get("/today-plan", auth, getTodayPlan);
router.get("/reminders", auth, getReminderPreferences);
router.put("/reminders", auth, saveReminderPreferences);
router.post("/daily-checkin", auth, saveDailyCheckin);
router.get("/recipe/:recipeId", auth, getRecipeNutrition);
router.put("/goals", auth, saveGoals);
router.post("/logs", auth, logPlannedMeal);
router.get("/plan/:planId", auth, getPlanLogs);
router.delete("/logs/:id", auth, removeLog);

module.exports = router;

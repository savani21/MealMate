const mongoose = require("mongoose");
const NutritionLog = require("../../models/user/NutritionLog");
const NutritionGoal = require("../../models/user/NutritionGoal");
const MealPlan = require("../../models/MealPlan");

const DEFAULT_GOALS = { calories: 2000, protein: 75, carbohydrates: 250, fat: 65 };
const MEAL_TYPES = ["breakfast", "lunch", "dinner"];
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function shiftDateKey(dateKey, offset) {
  const date = new Date(`${dateKey}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

function validDateKey(value) {
  if (!datePattern.test(String(value || ""))) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function totals(logs) {
  return logs.reduce((sum, log) => {
    sum.calories += Number(log.calories) || 0;
    sum.protein += Number(log.protein) || 0;
    sum.carbohydrates += Number(log.carbohydrates) || 0;
    sum.fat += Number(log.fat) || 0;
    return sum;
  }, { calories: 0, protein: 0, carbohydrates: 0, fat: 0 });
}

exports.getDashboard = async (req, res) => {
  try {
    const dateKey = req.query.dateKey || new Date().toISOString().slice(0, 10);
    if (!validDateKey(dateKey)) return res.status(400).json({ message: "A valid date is required." });
    const startDate = shiftDateKey(dateKey, -6);
    const [logs, goals] = await Promise.all([
      NutritionLog.find({ user: req.user.id, dateKey: { $gte: startDate, $lte: dateKey } }).sort({ dateKey: 1, createdAt: 1 }).lean(),
      NutritionGoal.findOne({ user: req.user.id }).lean(),
    ]);
    const todayLogs = logs.filter((log) => log.dateKey === dateKey);
    const weekly = Array.from({ length: 7 }, (_, index) => {
      const key = shiftDateKey(startDate, index);
      return { dateKey: key, ...totals(logs.filter((log) => log.dateKey === key)) };
    });
    res.json({
      success: true,
      dateKey,
      goals: goals || DEFAULT_GOALS,
      today: { totals: totals(todayLogs), meals: todayLogs },
      weekly,
      logs,
    });
  } catch (error) {
    console.error("Nutrition dashboard error:", error);
    res.status(500).json({ message: "Could not load nutrition dashboard." });
  }
};

exports.saveGoals = async (req, res) => {
  try {
    const fields = ["calories", "protein", "carbohydrates", "fat"];
    const values = {};
    for (const field of fields) {
      const value = Number(req.body[field]);
      if (!Number.isFinite(value) || value < 0 || value > (field === "calories" ? 10000 : 1000)) {
        return res.status(400).json({ message: `Enter a valid ${field} target.` });
      }
      values[field] = value;
    }
    const goals = await NutritionGoal.findOneAndUpdate(
      { user: req.user.id }, { $set: values }, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true, goals });
  } catch (error) {
    console.error("Nutrition goals error:", error);
    res.status(500).json({ message: "Could not save nutrition goals." });
  }
};

exports.logPlannedMeal = async (req, res) => {
  try {
    const { mealPlanId, dayNumber, mealType, dateKey, mealName, servings = 1 } = req.body;
    if (!mongoose.isValidObjectId(mealPlanId)) return res.status(400).json({ message: "Invalid meal plan." });
    if (!MEAL_TYPES.includes(mealType)) return res.status(400).json({ message: "Choose a valid meal type." });
    if (!validDateKey(dateKey)) return res.status(400).json({ message: "Choose a valid eaten date." });
    const plan = await MealPlan.findOne({ _id: mealPlanId, user: req.user.id }).lean();
    if (!plan) return res.status(404).json({ message: "Meal plan not found." });
    const day = (plan.meals || []).find((item) => Number(item.day) === Number(dayNumber));
    const expectedName = day?.[mealType];
    if (!day || !expectedName || expectedName !== mealName) {
      return res.status(400).json({ message: "This meal no longer matches the selected meal plan." });
    }

    const nutrition = {};
    for (const field of ["calories", "protein", "carbohydrates", "fat"]) {
      const value = Number(req.body[field]);
      if (!Number.isFinite(value) || value < 0 || value > (field === "calories" ? 20000 : 2000)) {
        return res.status(400).json({ message: `Enter a valid ${field} amount.` });
      }
      nutrition[field] = value;
    }
    const servingCount = Number(servings);
    if (!Number.isFinite(servingCount) || servingCount <= 0 || servingCount > 20) {
      return res.status(400).json({ message: "Servings must be between 0.25 and 20." });
    }

    const log = await NutritionLog.findOneAndUpdate(
      { user: req.user.id, mealPlan: mealPlanId, dayNumber: Number(dayNumber), mealType },
      { $set: { ...nutrition, user: req.user.id, mealPlan: mealPlanId, dayNumber: Number(dayNumber), mealType, dateKey, mealName, servings: servingCount } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.status(200).json({ success: true, message: "Meal nutrition saved.", log });
  } catch (error) {
    console.error("Nutrition log error:", error);
    res.status(500).json({ message: "Could not save this meal. Please try again." });
  }
};

exports.getPlanLogs = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.planId)) return res.status(400).json({ message: "Invalid meal plan." });
    const plan = await MealPlan.findOne({ _id: req.params.planId, user: req.user.id }).select("_id").lean();
    if (!plan) return res.status(404).json({ message: "Meal plan not found." });
    const logs = await NutritionLog.find({ user: req.user.id, mealPlan: plan._id }).lean();
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ message: "Could not load meal completion status." });
  }
};

exports.removeLog = async (req, res) => {
  try {
    const log = await NutritionLog.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!log) return res.status(404).json({ message: "Nutrition entry not found." });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Could not remove nutrition entry." });
  }
};

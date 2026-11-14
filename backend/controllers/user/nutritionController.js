const mongoose = require("mongoose");
const NutritionLog = require("../../models/user/NutritionLog");
const NutritionGoal = require("../../models/user/NutritionGoal");
const MealPlan = require("../../models/MealPlan");
const Recipe = require("../../models/user/Recipe");
const { estimateRecipeNutritionWithUSDA } = require("../../services/nutritionEstimator");
const MealReminderPreference = require("../../models/user/MealReminderPreference");

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

exports.getReminderPreferences = async (req, res) => {
  try {
    const preferences = await MealReminderPreference.findOne({ user: req.user.id }).lean();
    res.json({ success: true, preferences: preferences || { enabled: false, timezone: "Asia/Kolkata", breakfast: "08:00", lunch: "13:00", dinner: "19:00" } });
  } catch (error) {
    res.status(500).json({ message: "Could not load reminder preferences." });
  }
};

exports.saveReminderPreferences = async (req, res) => {
  try {
    const { enabled = false, timezone = "Asia/Kolkata", breakfast = "08:00", lunch = "13:00", dinner = "19:00" } = req.body;
    if (typeof enabled !== "boolean" || !["breakfast", "lunch", "dinner"].every((key) => /^([01]\\d|2[0-3]):[0-5]\\d$/.test(String({ breakfast, lunch, dinner }[key]))) ) {
      return res.status(400).json({ message: "Choose valid reminder times." });
    }
    try { new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(new Date()); }
    catch { return res.status(400).json({ message: "Choose a valid timezone." }); }
    const preferences = await MealReminderPreference.findOneAndUpdate(
      { user: req.user.id },
      { $set: { enabled, timezone, breakfast, lunch, dinner } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true, preferences });
  } catch (error) {
    res.status(500).json({ message: "Could not save reminder preferences." });
  }
};

exports.getTodayPlan = async (req, res) => {
  try {
    const dateKey = req.query.dateKey || new Date().toISOString().slice(0, 10);
    if (!validDateKey(dateKey)) return res.status(400).json({ message: "A valid date is required." });
    const plans = await MealPlan.find({ user: req.user.id, isArchived: { $ne: true } })
      .sort({ createdAt: -1 }).limit(20).lean();
    if (!plans.length) return res.json({ success: true, plan: null, day: null });
    const requestedDate = new Date(`${dateKey}T00:00:00.000Z`);
    let plan = null;
    let day = null;
    for (const candidate of plans) {
      const planStartKey = new Date(candidate.createdAt).toISOString().slice(0, 10);
      const startDate = new Date(`${planStartKey}T00:00:00.000Z`);
      const dayNumber = Math.floor((requestedDate - startDate) / 86400000) + 1;
      if (dayNumber >= 1 && dayNumber <= Number(candidate.duration)) {
        const matchingDay = (candidate.meals || []).find((item) => Number(item.day) === dayNumber);
        if (matchingDay) { plan = candidate; day = matchingDay; break; }
      }
    }
    if (!plan || !day) return res.json({ success: true, plan: null, day: null });
    const mealTypes = ["breakfast", "lunch", "dinner"];
    const meals = mealTypes.map((mealType) => {
      const name = day[mealType] || "";
      const options = Array.isArray(day[mealType + "Options"]) ? day[mealType + "Options"] : [];
      const selected = options.find((option) => option?.name === name) || null;
      return {
        mealType, name, servings: Number(selected?.servings) || 1,
        ingredients: selected?.ingredients || day[mealType + "Ingredients"] || [],
        nutrition: selected?.nutrition || null,
      };
    }).filter((meal) => meal.name);
    const logs = await NutritionLog.find({ user: req.user.id, mealPlan: plan._id, dayNumber: Number(day.day), dateKey }).lean();
    res.json({ success: true, plan: { _id: plan._id, goal: plan.goal, diet: plan.diet, createdAt: plan.createdAt }, day: { dayNumber: day.day, meals, logs } });
  } catch (error) {
    console.error("Today's meal plan lookup error:", error);
    res.status(500).json({ message: "Could not load today's meal plan." });
  }
};

exports.saveDailyCheckin = async (req, res) => {
  try {
    const { mealPlanId, dayNumber = 1, dateKey, entries = [] } = req.body;
    if (!mongoose.isValidObjectId(mealPlanId)) return res.status(400).json({ message: "Invalid meal plan." });
    if (!validDateKey(dateKey)) return res.status(400).json({ message: "Choose a valid check-in date." });
    if (!Array.isArray(entries) || entries.length > 3) return res.status(400).json({ message: "Invalid meal check-in." });
    const plan = await MealPlan.findOne({ _id: mealPlanId, user: req.user.id }).lean();
    if (!plan) return res.status(404).json({ message: "Meal plan not found." });
    const day = (plan.meals || []).find((item) => Number(item.day) === Number(dayNumber));
    if (!day) return res.status(404).json({ message: "Meal-plan day not found." });
    const saved = [];
    const selectedTypes = new Set();
    for (const entry of entries) {
      const { mealType, mealName, servings = 1 } = entry;
      if (!MEAL_TYPES.includes(mealType) || selectedTypes.has(mealType)) {
        return res.status(400).json({ message: "Each meal category can be selected only once." });
      }
      selectedTypes.add(mealType);
      if (day[mealType] !== mealName) return res.status(400).json({ message: "A selected meal no longer matches today's plan." });
      const servingCount = Number(servings);
      if (!Number.isFinite(servingCount) || servingCount < 0.25 || servingCount > 20) {
        return res.status(400).json({ message: "Servings must be between 0.25 and 20." });
      }
      const options = Array.isArray(day[mealType + "Options"]) ? day[mealType + "Options"] : [];
      const option = options.find((item) => item?.name === mealName);
      const nutrition = option?.nutrition;
      const fields = ["calories", "protein", "carbohydrates", "fat"];
      const complete = nutrition && nutrition.status !== "unavailable" &&
        fields.every((field) => Number.isFinite(Number(nutrition[field])) && nutrition[field] !== null && nutrition[field] !== undefined);
      if (!complete) {
        return res.status(422).json({ message: `Nutrition is not ready for ${mealName}. Open this meal to review its ingredients and add missing nutrition data.`, needsNutrition: [mealName] });
      }
      const values = {};
      for (const field of fields) values[field] = Math.round(Number(nutrition[field]) * servingCount * 10) / 10;
      const log = await NutritionLog.findOneAndUpdate(
        { user: req.user.id, mealPlan: plan._id, dayNumber: Number(dayNumber), mealType },
        { $set: {
          ...values, user: req.user.id, mealPlan: plan._id, dayNumber: Number(dayNumber),
          mealType, dateKey, mealName, servings: servingCount,
          nutritionSource: nutrition.source || "unknown", nutritionStatus: nutrition.status || "unavailable",
          confidence: nutrition.confidence || "unknown", missingIngredients: nutrition.missingIngredients || [],
        } },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
      );
      saved.push(log);
    }
    // Unchecked planned meals are not counted as consumed; remove an earlier
    // check-in for this same plan/day/date if the user changes their answer.
    const unchecked = MEAL_TYPES.filter((type) => !selectedTypes.has(type));
    if (unchecked.length) await NutritionLog.deleteMany({
      user: req.user.id, mealPlan: plan._id, dayNumber: Number(dayNumber),
      dateKey, mealType: { $in: unchecked },
    });
    res.json({ success: true, message: "Today's food check-in saved.", logs: saved, totals: totals(saved) });
  } catch (error) {
    console.error("Daily nutrition check-in error:", error);
    res.status(500).json({ message: "Could not save today's check-in." });
  }
};

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
      if (!Number.isFinite(value) || value < (field === "calories" ? 500 : 0) || value > (field === "calories" ? 10000 : field === "protein" || field === "fat" ? 500 : 1000)) {
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
    const { mealPlanId, dayNumber, mealType, dateKey, mealName, servings = 1, nutritionSource = "unknown", nutritionStatus = "unavailable", confidence = "unknown", missingIngredients = [] } = req.body;
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

    const servingCount = Number(servings);
    if (!Number.isFinite(servingCount) || servingCount < 0.25 || servingCount > 20) {
      return res.status(400).json({ message: "Servings must be between 0.25 and 20." });
    }

    // Prefer server-stored nutrition from the exact selected generated option.
    // Client nutrient values are used only for an explicit manual correction or
    // for legacy plans that predate embedded nutrition metadata.
    const options = Array.isArray(day[mealType + "Options"]) ? day[mealType + "Options"] : [];
    const plannedOption = options.find((option) => option?.name === mealName);
    const storedNutrition = plannedOption?.nutrition;
    const hasStoredNutrition = storedNutrition &&
      storedNutrition.status !== "unavailable" &&
      ["calories", "protein", "carbohydrates", "fat"].every((field) =>
        Number.isFinite(Number(storedNutrition[field])) && storedNutrition[field] !== null && storedNutrition[field] !== undefined
      );
    const useManualValues = nutritionStatus === "manual" || !hasStoredNutrition;
    const nutrition = {};
    for (const field of ["calories", "protein", "carbohydrates", "fat"]) {
      const value = Number(useManualValues ? req.body[field] : storedNutrition[field]);
      if (!Number.isFinite(value) || value < 0 || value > (field === "calories" ? 20000 : 2000)) {
        return res.status(400).json({ message: `Enter a valid ${field} amount.` });
      }
      nutrition[field] = Math.round(value * servingCount * 10) / 10;
    }
    const finalNutritionSource = useManualValues ? "manual" : storedNutrition.source || nutritionSource;
    const finalNutritionStatus = useManualValues ? "manual" : storedNutrition.status || nutritionStatus;
    const finalConfidence = useManualValues ? "unknown" : storedNutrition.confidence || confidence;
    const finalMissingIngredients = useManualValues ? [] : (storedNutrition.missingIngredients || []);

    const log = await NutritionLog.findOneAndUpdate(
      { user: req.user.id, mealPlan: mealPlanId, dayNumber: Number(dayNumber), mealType },
      { $set: { ...nutrition, nutritionSource: finalNutritionSource, nutritionStatus: finalNutritionStatus, confidence: finalConfidence, missingIngredients: finalMissingIngredients, user: req.user.id, mealPlan: mealPlanId, dayNumber: Number(dayNumber), mealType, dateKey, mealName, servings: servingCount } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.status(200).json({ success: true, message: "Meal nutrition saved.", log });
  } catch (error) {
    console.error("Nutrition log error:", error);
    res.status(500).json({ message: "Could not save this meal. Please try again." });
  }
};

exports.getRecipeNutrition = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.recipeId)) return res.status(400).json({ message: "Invalid recipe." });
    const recipe = await Recipe.findById(req.params.recipeId);
    if (!recipe) return res.status(404).json({ message: "Recipe not found." });
    const current = recipe.nutrition || {};
    const hasCompleteValues = ["calories", "protein", "carbohydrates", "fat"].every((key) =>
      Number.isFinite(Number(current[key])) && current[key] !== null && current[key] !== undefined
    );
    if (hasCompleteValues && ["verified_label", "manual", "usda_fdc", "mixed_estimate"].includes(current.source)) {
      return res.json({ success: true, nutrition: current, servings: recipe.servings || 1, recipeName: recipe.name });
    }
    const estimate = await estimateRecipeNutritionWithUSDA(recipe.ingredients || [], recipe.servings || 1);
    recipe.nutrition = estimate;
    await recipe.save();
    res.json({ success: true, nutrition: estimate, servings: recipe.servings || 1, recipeName: recipe.name });
  } catch (error) {
    console.error("Recipe nutrition estimate error:", error);
    res.status(500).json({ message: "Could not calculate recipe nutrition." });
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

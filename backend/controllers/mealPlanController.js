const { GoogleGenAI } = require("@google/genai");
const MealPlan = require("../models/MealPlan");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

exports.createMealPlan = async (req, res) => {
  try {
    const { goal, diet, allergies, ingredients, duration } = req.body;
    if (!goal || !diet || !duration) return res.status(400).json({ success: false, message: "Goal, diet and duration are required" });

    const prompt = `Create a personalized ${duration}-day meal plan.\n\nUser goal: ${goal}\nDiet type: ${diet}\nFood allergies: ${allergies || "None"}\nAvailable ingredients: ${ingredients || "No specific ingredients"}\n\nFor every day provide:\n- Breakfast\n- Lunch\n- Dinner\n- Snack\n\nReturn ONLY valid JSON in this exact structure:\n{\n  "days": [\n    {\n      "day": 1,\n      "breakfast": "meal name",\n      "lunch": "meal name",\n      "dinner": "meal name",\n      "snack": "meal name"\n    }\n  ]\n}\n\nDo not include markdown.\nDo not include explanations outside the JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });

    const generatedMeals = JSON.parse(response.text);
    const mealPlan = await MealPlan.create({
      user: req.user.id,
      goal,
      diet,
      allergies: allergies || "",
      ingredients: ingredients || "",
      duration: Number(duration),
      meals: generatedMeals.days,
    });

    res.status(201).json({ success: true, message: "AI meal plan generated successfully", mealPlan });
  } catch (err) {
    console.error("AI Meal Plan Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMyMealPlans = async (req, res) => {
  try {
    const includeArchived = req.query.includeArchived === "true";
    const filter = { user: req.user.id };
    if (!includeArchived) filter.isArchived = false;

    const mealPlans = await MealPlan.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, mealPlans });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMyMealPlanById = async (req, res) => {
  try {
    const mealPlan = await MealPlan.findOne({ _id: req.params.id, user: req.user.id });
    if (!mealPlan) return res.status(404).json({ success: false, message: "Meal plan not found" });
    res.status(200).json({ success: true, mealPlan });
  } catch (err) {
    console.error("Get Meal Plan Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.archiveMyMealPlan = async (req, res) => {
  try {
    const mealPlan = await MealPlan.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id, isArchived: false },
      { isArchived: true },
      { new: true }
    );
    if (!mealPlan) return res.status(404).json({ success: false, message: "Active meal plan not found" });
    res.status(200).json({ success: true, message: "Meal plan archived successfully", mealPlan });
  } catch (err) {
    console.error("Archive Meal Plan Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.restoreMyMealPlan = async (req, res) => {
  try {
    const mealPlan = await MealPlan.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id, isArchived: true },
      { isArchived: false },
      { new: true }
    );
    if (!mealPlan) return res.status(404).json({ success: false, message: "Archived meal plan not found" });
    res.status(200).json({ success: true, message: "Meal plan restored successfully", mealPlan });
  } catch (err) {
    console.error("Restore Meal Plan Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteMyMealPlan = async (req, res) => {
  try {
    const mealPlan = await MealPlan.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!mealPlan) return res.status(404).json({ success: false, message: "Meal plan not found" });
    res.status(200).json({ success: true, message: "Meal plan deleted successfully" });
  } catch (err) {
    console.error("Delete Meal Plan Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

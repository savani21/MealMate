const { generateText } = require("../config/openrouter");
const MealPlan = require("../models/MealPlan");

const handleAIError = (error, res) => {
  console.error("OpenRouter Meal Plan Error:", error);

  if (error.status === 401) {
    return res.status(502).json({ success: false, message: "MealMate AI configuration is invalid." });
  }

  if (error.status === 429) {
    return res.status(429).json({ success: false, message: "MealMate AI usage limit has been reached. Please try again later." });
  }

  if (error.status >= 500) {
    return res.status(503).json({ success: false, message: "MealMate AI is temporarily unavailable. Please try again later." });
  }

  return res.status(500).json({ success: false, message: "Failed to generate meal plan." });
};

exports.createMealPlan = async (req, res) => {
  try {
    const { goal, diet, allergies, ingredients, duration } = req.body;

    if (!goal || !diet || !duration) {
      return res.status(400).json({
        success: false,
        message: "Goal, diet and duration are required",
      });
    }

    const prompt = `
Create a personalized ${duration}-day meal plan.

User goal: ${goal}
Diet type: ${diet}
Food allergies: ${allergies || "None"}
Available ingredients: ${ingredients || "No specific ingredients"}

For every day provide:
- Breakfast
- Lunch
- Dinner
- Snack

Return ONLY valid JSON in this exact structure:
{
  "days": [
    {
      "day": 1,
      "breakfast": "meal name",
      "lunch": "meal name",
      "dinner": "meal name",
      "snack": "meal name"
    }
  ]
}

Do not include markdown or explanations outside the JSON.
`;

    const raw = await generateText({
      messages: [{ role: "user", content: prompt }],
      json: true,
    });

    const cleaned = raw.trim().replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
    const generatedMeals = JSON.parse(cleaned);

    const mealPlan = await MealPlan.create({
      user: req.user.id,
      goal,
      diet,
      allergies: allergies || "",
      ingredients: ingredients || "",
      duration: Number(duration),
      meals: generatedMeals.days,
    });

    return res.status(201).json({
      success: true,
      message: "AI meal plan generated successfully",
      mealPlan,
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return res.status(502).json({
        success: false,
        message: "MealMate AI returned an invalid meal plan. Please try again.",
      });
    }

    return handleAIError(error, res);
  }
};

exports.getMyMealPlans = async (req, res) => {
  try {
    const mealPlans = await MealPlan.find({ user: req.user.id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      mealPlans,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

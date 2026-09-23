const { GoogleGenAI } = require("@google/genai");
const MealPlan = require("../models/MealPlan");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

exports.createMealPlan = async (req, res) => {
  try {
    const {
      goal,
      diet,
      allergies,
      ingredients,
      availableIngredients,
      duration,
    } = req.body;

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
Available ingredients: ${availableIngredients || ingredients || "No specific ingredients"}
Additional recommended ingredients allowed: ${ingredients || "None"}

Use the available ingredients as the primary ingredients. If additional recommended ingredients are provided, they may be used when helpful.

For every day provide:
- Breakfast
- Lunch
- Dinner
- Snack

Also provide the ingredient list required for each meal. Keep the ingredient names simple and practical, for example: "Rice", "Tomato", "Paneer", "Milk".

Return ONLY valid JSON in this exact structure:
{
  "days": [
    {
      "day": 1,
      "breakfast": "meal name",
      "lunch": "meal name",
      "dinner": "meal name",
      "snack": "meal name",
      "mealIngredients": {
        "breakfast": ["ingredient 1", "ingredient 2"],
        "lunch": ["ingredient 1", "ingredient 2"],
        "dinner": ["ingredient 1", "ingredient 2"],
        "snack": ["ingredient 1", "ingredient 2"]
      }
    }
  ]
}

Do not include markdown.
Do not include explanations outside the JSON.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const aiText = response.text;
    const generatedMeals = JSON.parse(aiText);

    const mealPlan = await MealPlan.create({
      user: req.user.id,
      goal,
      diet,
      allergies: allergies || "",
      ingredients: ingredients || "",
      availableIngredients: availableIngredients || ingredients || "",
      duration: Number(duration),
      meals: generatedMeals.days,
    });

    res.status(201).json({
      success: true,
      message: "AI meal plan generated successfully",
      mealPlan,
    });

  } catch (err) {
    console.error("AI Meal Plan Error:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getMyMealPlans = async (req, res) => {
  try {
    const mealPlans = await MealPlan.find({
      user: req.user.id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      mealPlans,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
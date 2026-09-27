const { GoogleGenAI } = require("@google/genai");
const MealPlan = require("../models/MealPlan");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const DIET_RULES = {
  vegetarian: "No meat, chicken, fish, seafood, eggs, or gelatin. Dairy is allowed.",
  vegan: "No meat, chicken, fish, seafood, eggs, dairy, or gelatin.",
  "non-vegetarian": "Meat, chicken, fish, seafood and eggs are allowed when suitable.",
  eggetarian: "No meat, chicken, fish, or seafood. Eggs and dairy are allowed.",
};

const DIET_FORBIDDEN = {
  vegetarian: /\b(chicken|mutton|lamb|beef|pork|fish|salmon|tuna|prawn|shrimp|seafood|egg|eggs|bacon|ham|sausage|gelatin)\b/i,
  vegan: /\b(chicken|mutton|lamb|beef|pork|fish|salmon|tuna|prawn|shrimp|seafood|egg|eggs|milk|paneer|cheese|curd|yogurt|butter|ghee|cream|dairy|gelatin)\b/i,
  eggetarian: /\b(chicken|mutton|lamb|beef|pork|fish|salmon|tuna|prawn|shrimp|seafood|bacon|ham|sausage|gelatin)\b/i,
};

function cleanList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function mealViolatesDiet(meal, diet) {
  const forbidden = DIET_FORBIDDEN[diet];
  if (!forbidden) return false;

  return ["breakfast", "lunch", "snack", "dinner"].some((type) => {
    const name = String(meal?.[type] || "");
    const ingredients = Array.isArray(meal?.[type + "Ingredients"])
      ? meal[type + "Ingredients"].map((item) => typeof item === "string" ? item : item?.name || "").join(" ")
      : "";
    return forbidden.test(name + " " + ingredients);
  });
}

exports.createMealPlan = async (req, res) => {
  try {
    const { goal, diet, allergies, ingredients, duration } = req.body;
    if (!goal || !diet || !duration) return res.status(400).json({ success: false, message: "Goal, diet and duration are required" });

    const prompt = `Create a personalized ${duration}-day meal plan.\n\nUser goal: ${goal}\nDiet type: ${diet}\nFood allergies: ${allergies || "None"}\nAvailable ingredients: ${ingredients || "No specific ingredients"}\n\nFor every day provide:\n- Breakfast\n- Lunch\n- Dinner\n- Snack\n\nReturn ONLY valid JSON in this exact structure:\n{\n  "days": [\n    {\n      "day": 1,\n      "breakfast": "meal name",\n      "lunch": "meal name",\n      "dinner": "meal name",\n      "snack": "meal name"\n    }\n  ]\n}\n\nDo not include markdown.\nDo not include explanations outside the JSON.`;
    const {
      goal,
      diet,
      allergies,
      ingredients,
      availableIngredients,
      recommendedIngredients,
      ingredientMode,
      duration,
    } = req.body;

    if (!goal || !diet || !duration) {
      return res.status(400).json({
        success: false,
        message: "Goal, diet and duration are required",
      });
    }

    const available = cleanList(availableIngredients || ingredients);
    const recommended = cleanList(recommendedIngredients);
    const allowedPool = ingredientMode === "recommended"
      ? [...new Set([...available, ...recommended])]
      : available;

    if (!available.length) {
      return res.status(400).json({
        success: false,
        message: "At least one available ingredient is required",
      });
    }

    const prompt = `
Create a practical personalized ${duration}-day meal plan.

User goal: ${goal}
Diet type: ${diet}
Diet restriction: ${DIET_RULES[diet] || "Follow the selected diet type exactly."}
Food allergies: ${allergies || "None"}

Ingredients the user ALREADY HAS in their pantry:
${JSON.stringify(available)}

Ingredients the user is willing to buy if needed:
${JSON.stringify(recommended)}

Allowed ingredient pool for this plan:
${JSON.stringify(allowedPool)}

Planning mode: ${ingredientMode === "recommended" ? "Available + Recommended Ingredients" : "Only Available Ingredients"}

Rules:
1. Every meal must have its own complete ingredient list.
2. Use pantry ingredients first whenever practical.
3. In Available + Recommended mode, use ingredients only from the allowed ingredient pool. Recommended ingredients are NOT owned by the user; if a recipe uses one and it is not in the pantry, it becomes a grocery item.
4. In Only Available mode, use ONLY pantry ingredients.
5. Never add an ingredient outside the allowed ingredient pool.
6. Follow the diet restriction strictly. Do not use a forbidden ingredient even if it appears in the recommended list.
7. Do not put the recipe name in its ingredient list. Use simple shopping names such as "rice", "tuver dal", "salt", "onion", "tomato", "paneer".
8. Include basic ingredients such as salt only when the meal actually needs them.
9. Keep ingredients specific to the meal. Do not create one global ingredient list.
10. Quantities should be short and practical, such as "1 cup", "100 g", or "1 tsp".

Return ONLY valid JSON in exactly this structure:
{
  "days": [
    {
      "day": 1,
      "breakfast": "meal name",
      "breakfastIngredients": [{"name": "ingredient", "quantity": "quantity"}],
      "lunch": "meal name",
      "lunchIngredients": [{"name": "ingredient", "quantity": "quantity"}],
      "dinner": "meal name",
      "dinnerIngredients": [{"name": "ingredient", "quantity": "quantity"}],
      "snack": "meal name",
      "snackIngredients": [{"name": "ingredient", "quantity": "quantity"}]
    }
  ]
}
Do not include markdown or explanations outside JSON.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });

    const generatedMeals = JSON.parse(response.text);
    const days = Array.isArray(generatedMeals.days) ? generatedMeals.days : [];

    if (days.some((day) => mealViolatesDiet(day, diet))) {
      return res.status(422).json({
        success: false,
        message: `The AI returned a meal that does not match the selected ${diet} diet. Please generate the plan again.`,
      });
    }

    const mealPlan = await MealPlan.create({
      user: req.user.id,
      goal,
      diet,
      allergies: allergies || "",
      availableIngredients: available.join(", "),
      recommendedIngredients: recommended.join(", "),
      ingredients: allowedPool.join(", "),
      duration: Number(duration),
      meals: days,
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

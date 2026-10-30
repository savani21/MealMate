const MealPlan = require("../models/MealPlan");
const {
  upsertGroceryListForMealPlan,
} = require("./user/groceryController");

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
      ? meal[type + "Ingredients"]
          .map((item) => typeof item === "string" ? item : item?.name || "")
          .join(" ")
      : "";
    const options = Array.isArray(meal?.[type + "Options"]) ? meal[type + "Options"] : [];
    const optionText = options.map((option) => `${option?.name || ""} ${(option?.ingredients || []).map((item) => typeof item === "string" ? item : item?.name || "").join(" ")}`).join(" ");
    return forbidden.test(name + " " + ingredients + " " + optionText);
  });
}

async function generateWithOpenRouter(prompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) return null;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:5173",
      "X-Title": "MealMate AI",
    },
    body: JSON.stringify({
      model: "openrouter/free",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message ||
        `OpenRouter API request failed with status ${response.status}`
    );
  }

  const text = data?.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error("OpenRouter returned an empty AI response");
  }

  try {
    return JSON.parse(text);
  } catch (parseError) {
    // Some routed/free models can return non-JSON status or safety text even
    // when JSON output was requested. Try extracting a JSON object first.
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");

    if (jsonStart !== -1 && jsonEnd > jsonStart) {
      try {
        return JSON.parse(text.slice(jsonStart, jsonEnd + 1));
      } catch {
        // Fall through to the clean application error below.
      }
    }

    console.error("Invalid OpenRouter meal plan response:", text);

    throw new Error(
      "AI returned an invalid meal plan response. Please try again."
    );
  }
}

function makeIngredient(name, quantity) {
  return { name, quantity };
}

function pickIngredients(pool, keywords, count = 3) {
  const lower = pool.map((item) => item.toLowerCase());
  const picked = [];

  keywords.forEach((keyword) => {
    const index = lower.findIndex(
      (item) => item.includes(keyword) && !picked.includes(pool[index])
    );
    if (index >= 0) picked.push(pool[index]);
  });

  for (const item of pool) {
    if (picked.length >= count) break;
    if (!picked.includes(item)) picked.push(item);
  }

  return picked.slice(0, Math.max(1, count)).map((name) =>
    makeIngredient(name, "as needed")
  );
}

function localMeal(name, pool, keywords, count = 3) {
  return {
    name,
    ingredients: pickIngredients(pool, keywords, count),
  };
}

function generateLocalMealPlan({ duration, diet, allowedPool }) {
  const pool = allowedPool.filter(
    (item) => !DIET_FORBIDDEN[diet]?.test(item)
  );

  if (!pool.length) {
    throw new Error(
      `No allowed ingredients are available for the selected ${diet} diet.`
    );
  }

  const lower = pool.map((item) => item.toLowerCase());
  const has = (term) => lower.some((item) => item.includes(term));

  const breakfast = has("oat")
    ? localMeal("Oatmeal Bowl", pool, ["oat", "milk", "banana", "salt"])
    : has("bread")
      ? localMeal("Healthy Bread Sandwich", pool, ["bread", "tomato", "onion", "paneer"])
      : has("banana") && has("milk")
        ? localMeal("Banana Milk Smoothie", pool, ["banana", "milk"])
        : localMeal("Healthy Ingredient Bowl", pool, ["fruit", "milk", "oat", "bread"]);

  const lunch = has("rice") && has("dal")
    ? localMeal("Dal Rice", pool, ["rice", "dal", "tomato", "onion"])
    : has("rice")
      ? localMeal("Vegetable Rice Bowl", pool, ["rice", "vegetable", "onion", "tomato"])
      : has("roti") || has("atta") || has("wheat")
        ? localMeal("Roti with Mixed Vegetables", pool, ["roti", "atta", "wheat", "vegetable", "tomato"])
        : has("paneer")
          ? localMeal("Paneer Stir-Fry", pool, ["paneer", "capsicum", "onion", "tomato"])
          : localMeal("Mixed Ingredient Bowl", pool, ["vegetable", "onion", "tomato"]);

  const dinner = has("paneer")
    ? localMeal("Paneer and Vegetable Stir-Fry", pool, ["paneer", "capsicum", "onion", "tomato"])
    : has("rice") && has("dal")
      ? localMeal("Simple Khichdi", pool, ["rice", "dal", "salt", "turmeric"])
      : has("bread")
        ? localMeal("Light Vegetable Sandwich", pool, ["bread", "tomato", "onion", "vegetable"])
        : localMeal("Simple Dinner Bowl", pool, ["vegetable", "rice", "dal", "paneer"]);

  const snack = has("banana")
    ? localMeal("Banana Snack", pool, ["banana", "milk", "oat"])
    : has("fruit")
      ? localMeal("Fresh Fruit Snack", pool, ["fruit"])
      : has("bread")
        ? localMeal("Light Toast", pool, ["bread"])
        : localMeal("Simple Snack", pool, pool.slice(0, 2), 2);

  const templates = [breakfast, lunch, dinner, snack];
  const days = [];

  for (let day = 1; day <= Number(duration); day += 1) {
    const offset = (day - 1) % templates.length;
    const get = (index) => templates[(index + offset) % templates.length];

    const b = get(0);
    const l = get(1);
    const d = get(2);
    const s = get(3);

    days.push({
      day,
      breakfast: b.name,
      breakfastIngredients: b.ingredients,
      lunch: l.name,
      lunchIngredients: l.ingredients,
      dinner: d.name,
      dinnerIngredients: d.ingredients,
      snack: s.name,
      snackIngredients: s.ingredients,
    });
  }

  return { days };
}

exports.createMealPlan = async (req, res) => {
  try {
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

Cuisine preference:
- Prefer Indian cuisine and familiar Indian home-style dishes by default, whenever they can be made realistically from the allowed ingredients.
- Suggest a varied mix of regional Indian dishes rather than repeating the same generic rice or vegetable bowl.
- Consider dishes such as poha, upma, idli-sambar, dosa, thepla, paratha, dhokla, dal-khichdi, rajma-chawal, chole, pulao, jeera rice, roti-sabzi, paneer dishes, and Indian-style soups, adapting to the user's diet.
- These are examples, not mandatory recipes. Choose dishes only when their required ingredients are available in the allowed ingredient pool and compatible with the user's diet and allergies.
- Do not invent missing ingredients or force an Indian dish when the available ingredients do not support one. In that case, suggest the closest practical recipe and retain Indian flavors where appropriate.
- Keep the three choices in each meal category meaningfully different from one another.

Rules:
1. Every meal must have its own complete ingredient list.
2. Use pantry ingredients first whenever practical.
3. In Available + Recommended mode, use ingredients only from the allowed ingredient pool.
4. In Only Available mode, use ONLY pantry ingredients.
5. Never add an ingredient outside the allowed ingredient pool.
6. Follow the diet restriction strictly.
7. Do not put the recipe name in its ingredient list.
8. Keep ingredients specific to the meal.
9. Quantities should be short and practical.
10. Return exactly 3 distinct recipe options for breakfast, lunch and dinner. Keep every option within the allowed ingredient pool and selected diet.
11. The first option must be the default meal name and ingredient list. Give each option a distinct name, short description, preparation time and complete ingredient list.

Return ONLY valid JSON in exactly this structure:
{
  "days": [
    {
      "day": 1,
      "breakfast": "selected recipe name (same as first option)",
      "breakfastIngredients": [{"name": "ingredient", "quantity": "quantity"}],
      "breakfastOptions": [{"name":"recipe name","description":"short description","prepTime":"15 minutes","ingredients":[{"name":"ingredient","quantity":"quantity"}]}],
      "lunch": "selected recipe name (same as first option)",
      "lunchIngredients": [{"name": "ingredient", "quantity": "quantity"}],
      "lunchOptions": [{"name":"recipe name","description":"short description","prepTime":"30 minutes","ingredients":[{"name":"ingredient","quantity":"quantity"}]}],
      "dinner": "selected recipe name (same as first option)",
      "dinnerIngredients": [{"name": "ingredient", "quantity": "quantity"}],
      "dinnerOptions": [{"name":"recipe name","description":"short description","prepTime":"30 minutes","ingredients":[{"name":"ingredient","quantity":"quantity"}]}],
      "snack": "meal name",
      "snackIngredients": [{"name": "ingredient", "quantity": "quantity"}]
    }
  ]
}
Do not include markdown or explanations outside JSON.
`;

    // A preview request returns recipe choices without saving a meal plan.
    // The final save request sends the exact selected options back to this endpoint.
    let generatedMeals;
    let generatedBy = "openrouter";
    if (Array.isArray(req.body.selectedDays) && req.body.selectedDays.length) {
      generatedMeals = { days: req.body.selectedDays };
      generatedBy = "user-selected";
    } else {
      generatedMeals = await generateWithOpenRouter(prompt);
      if (!generatedMeals) {
        generatedMeals = generateLocalMealPlan({ duration, diet, allowedPool });
        generatedBy = "local-fallback";
      }
    }

    const days = Array.isArray(generatedMeals.days) ? generatedMeals.days : [];

    if (!generatedMeals) {
      generatedMeals = generateLocalMealPlan({
        duration,
        diet,
        allowedPool,
      });
      generatedBy = "local-fallback";
    }

    const days = Array.isArray(generatedMeals.days) ? generatedMeals.days : [];

    // Keep the legacy selected-meal fields in sync with the first suggested option.
    // Older saved meal plans without option arrays remain fully compatible.
    days.forEach((day) => {
      ["breakfast", "lunch", "dinner"].forEach((type) => {
        const options = Array.isArray(day[type + "Options"]) ? day[type + "Options"].filter((item) => item?.name && Array.isArray(item.ingredients)) : [];
        if (options.length) {
          day[type + "Options"] = options.slice(0, 3);
          const selected = options.find((item) => item.name === day[type]) || options[0];
          day[type] = selected.name;
          day[type + "Ingredients"] = selected.ingredients;
        } else {
          day[type + "Options"] = [{
            name: day[type] || "Meal option",
            description: "Current generated meal",
            prepTime: "",
            ingredients: day[type + "Ingredients"] || [],
          }];
        }
      });
    });

    if (days.some((day) => ["breakfast", "lunch", "dinner"].some((type) => {
      const options = day[type + "Options"] || [];
      return options.length < 2;
    }))) {
      return res.status(422).json({
        success: false,
        message: "MealMate could not create at least two choices for every meal. Please try generating the options again.",
      });
    }

    if (!days.length) {
      return res.status(422).json({
        success: false,
        message: "Meal plan generation returned no valid days. Please try again.",
      });
    }

    if (days.some((day) => mealViolatesDiet(day, diet))) {
      return res.status(422).json({
        success: false,
        message: `The generated meal plan does not match the selected ${diet} diet. Please generate the plan again.`,
      });
    }

    if (req.body.previewOnly === true) {
      return res.status(200).json({
        success: true,
        preview: true,
        generatedBy,
        days,
        message: "Choose one recipe for breakfast, lunch and dinner.",
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

    try {
      await upsertGroceryListForMealPlan(mealPlan);
    } catch (groceryError) {
      await MealPlan.deleteOne({ _id: mealPlan._id, user: req.user.id });
      throw new Error(
        `Meal plan was generated, but the grocery list could not be created: ${groceryError.message}`
      );
    }

    res.status(201).json({
      success: true,
      message:
        generatedBy === "openrouter"
          ? "AI meal plan generated successfully"
          : "Meal plan generated successfully",
      generatedBy,
      mealPlan,
    });
  } catch (err) {
    console.error("Meal Plan Error:", err);
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
    const mealPlan = await MealPlan.findOne({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!mealPlan) {
      return res.status(404).json({
        success: false,
        message: "Meal plan not found",
      });
    }
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
      { returnDocument: "after" }
    );
    if (!mealPlan) {
      return res.status(404).json({
        success: false,
        message: "Active meal plan not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Meal plan archived successfully",
      mealPlan,
    });
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
      { returnDocument: "after" }
    );
    if (!mealPlan) {
      return res.status(404).json({
        success: false,
        message: "Archived meal plan not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Meal plan restored successfully",
      mealPlan,
    });
  } catch (err) {
    console.error("Restore Meal Plan Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteMyMealPlan = async (req, res) => {
  try {
    const mealPlan = await MealPlan.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!mealPlan) {
      return res.status(404).json({
        success: false,
        message: "Meal plan not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Meal plan deleted successfully",
    });
  } catch (err) {
    console.error("Delete Meal Plan Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateMealSelection = async (req, res) => {
  try {
    const { day, mealType, option } = req.body;
    const allowedTypes = ["breakfast", "lunch", "dinner"];
    if (!allowedTypes.includes(mealType) || !option || !option.name || !Array.isArray(option.ingredients)) {
      return res.status(400).json({ success: false, message: "A valid meal type and recipe option are required." });
    }
    const mealPlan = await MealPlan.findOne({ _id: req.params.id, user: req.user.id });
    if (!mealPlan) return res.status(404).json({ success: false, message: "Meal plan not found." });
    const dayPlan = mealPlan.meals.find((item) => Number(item.day) === Number(day));
    if (!dayPlan) return res.status(404).json({ success: false, message: "Meal-plan day not found." });
    const options = dayPlan[mealType + "Options"] || [];
    const selected = options.find((item) => item.name === option.name);
    if (!selected) return res.status(400).json({ success: false, message: "The selected option is not part of this meal plan." });
    dayPlan[mealType] = selected.name;
    dayPlan[mealType + "Ingredients"] = selected.ingredients;
    mealPlan.markModified("meals");
    await mealPlan.save();
    res.json({ success: true, message: "Meal selection saved.", mealPlan });
  } catch (error) {
    console.error("UPDATE MEAL SELECTION ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to save meal selection." });
  }
};

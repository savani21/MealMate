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

function normalizeGeneratedIngredient(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/^[\s\d./-]+/, "")
    .replace(/^(?:cups?|tbsp|tbsps|tablespoons?|tsp|tsps|teaspoons?|kg|kgs|g|gm|gms|grams?|ml|l|litres?|liters?|pieces?|pcs?|cloves?|slices?)\s+/i, "")
    .replace(/\b(?:large|medium|small|finely|roughly|thinly|thickly|chopped|diced|minced|sliced|grated|crushed|fresh|freshly|cooked|boiled|raw|roasted|optional|to taste)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.,;:]+$/, "")
    .replace(/\b(\w+)s$/, "$1");
}

function canonicalGeneratedIngredient(value) {
  const name = normalizeGeneratedIngredient(value);
  const aliases = {
    "basmati rice": "rice",
    "long grain rice": "rice",
    "atta": "wheat flour",
    "whole wheat flour": "wheat flour",
    "wheat atta": "wheat flour",
    "green chilli": "green chili",
    "green chillies": "green chili",
    "green chilies": "green chili",
  };
  return aliases[name] || name;
}

function generatedIngredients(day) {
  return ["breakfast", "lunch", "snack", "dinner"].flatMap((type) =>
    Array.isArray(day?.[type + "Ingredients"])
      ? day[type + "Ingredients"]
          .map((item) => typeof item === "string" ? item : item?.name || "")
          .filter(Boolean)
      : []
  );
}

function mealUsesIngredientOutsidePool(day, allowedPool) {
  const allowed = new Set(allowedPool.map(canonicalGeneratedIngredient));
  return generatedIngredients(day).some(
    (ingredient) => !allowed.has(canonicalGeneratedIngredient(ingredient))
  );
}

function mealRepeatsRecommendedIngredientTooOften(day, available, recommended) {
  const pantry = new Set(available.map(canonicalGeneratedIngredient));
  const recommendedOnly = new Set(
    recommended
      .map(canonicalGeneratedIngredient)
      .filter((ingredient) => ingredient && !pantry.has(ingredient))
  );

  if (!recommendedOnly.size) return false;

  const usage = new Map();
  for (const type of ["breakfast", "lunch", "snack", "dinner"]) {
    const entries = Array.isArray(day?.[type + "Ingredients"])
      ? day[type + "Ingredients"]
      : [];

    const usedThisMeal = new Set(
      entries
        .map((item) => typeof item === "string" ? item : item?.name || "")
        .map(canonicalGeneratedIngredient)
        .filter((ingredient) => recommendedOnly.has(ingredient))
    );

    usedThisMeal.forEach((ingredient) => {
      usage.set(ingredient, (usage.get(ingredient) || 0) + 1);
    });
  }

  return [...usage.values()].some((count) => count > 2);
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
    return forbidden.test(name + " " + ingredients);
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

  // Do not fill a meal with unrelated ingredients just because they exist
  // in the user's allowed pool. This prevents ingredients such as paneer or
  // capsicum from appearing in unrelated meals.
  if (!picked.length && pool.length) picked.push(pool[0]);

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

  const days = [];

  for (let day = 1; day <= Number(duration); day += 1) {
    // Keep each meal in its correct semantic slot for every day.
    // Do not rotate breakfast/lunch/snack/dinner templates between days.
    const b = breakfast;
    const l = lunch;
    const s = snack;
    const d = dinner;

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
10. Do not force every allowed ingredient into every meal. Select only ingredients that make culinary sense for that specific meal.
11. Prefer the user's pantry ingredients. Use recommended ingredients selectively when they genuinely fit the meal.
12. Avoid repeating the same recommended-only ingredient across breakfast, lunch, snack and dinner on the same day. It should normally appear in no more than two meal slots.
13. Never use paneer, capsicum, or another optional ingredient merely because it is present in the allowed pool.

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

    let generatedMeals = await generateWithOpenRouter(prompt);
    let generatedBy = "openrouter";

    if (!generatedMeals) {
      generatedMeals = generateLocalMealPlan({
        duration,
        diet,
        allowedPool,
      });
      generatedBy = "local-fallback";
    }

    const days = Array.isArray(generatedMeals.days) ? generatedMeals.days : [];

    if (!days.length) {
      return res.status(422).json({
        success: false,
        message: "Meal plan generation returned no valid days. Please try again.",
      });
    }

    const invalidGeneratedPlan = days.some(
      (day) =>
        mealViolatesDiet(day, diet) ||
        mealUsesIngredientOutsidePool(day, allowedPool) ||
        mealRepeatsRecommendedIngredientTooOften(day, available, recommended)
    );

    if (invalidGeneratedPlan && generatedBy === "openrouter") {
      console.warn("AI meal plan used an invalid or overly repetitive ingredient. Using local fallback.");
      generatedMeals = generateLocalMealPlan({
        duration,
        diet,
        allowedPool,
      });
      generatedBy = "local-fallback";
    }

    const validatedDays = Array.isArray(generatedMeals.days) ? generatedMeals.days : [];

    if (!validatedDays.length) {
      return res.status(422).json({
        success: false,
        message: "Meal plan generation returned no valid days. Please try again.",
      });
    }

    if (validatedDays.some((day) => mealViolatesDiet(day, diet))) {
      return res.status(422).json({
        success: false,
        message: `The generated meal plan does not match the selected ${diet} diet. Please try again.`,
      });
    }

    if (validatedDays.some((day) => mealUsesIngredientOutsidePool(day, allowedPool))) {
      return res.status(422).json({
        success: false,
        message: "The generated meal plan used an ingredient outside your selected ingredient list. Please try again.",
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
      meals: validatedDays,
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

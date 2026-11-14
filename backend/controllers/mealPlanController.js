const MealPlan = require("../models/MealPlan");
const { normalizeIngredientName } = require("../utils/ingredientMatcher");
const Recipe = require("../models/user/Recipe");
const { estimateRecipeNutrition, estimateRecipeNutritionWithUSDA } = require("../services/nutritionEstimator");
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

function normalizeMealIngredientLines(ingredients) {
  return (Array.isArray(ingredients) ? ingredients : []).map((item) => {
    if (typeof item === "string") return item;
    if (!item || typeof item !== "object") return String(item || "");
    return `${String(item.quantity || "").trim()} ${String(item.name || "").trim()}`.trim();
  }).filter(Boolean);
}

async function attachMealNutrition(option, useUSDA = false) {
  if (!option || typeof option !== "object") return option;
  const ingredients = normalizeMealIngredientLines(option.ingredients);
  const servings = Math.max(1, Math.min(20, Number(option.servings) || 1));
  const nutrition = useUSDA
    ? await estimateRecipeNutritionWithUSDA(ingredients, servings)
    : estimateRecipeNutrition(ingredients, servings);
  option.servings = servings;
  option.nutrition = {
    ...nutrition,
    ingredientCount: ingredients.length,
    calculatedAt: nutrition.calculatedAt || new Date(),
  };
  return option;
}

function cleanList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function mealViolatesDiet(meal, diet) {
  const forbidden = DIET_FORBIDDEN[diet];
  if (!forbidden) return false;

  return ["breakfast", "lunch", "dinner"].some((type) => {
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

async function generateWithOpenRouter(prompt, duration = 1, maxTokensOverride = null) {
  const apiKey = String(process.env.OPENROUTER_API_KEY || "").trim();
  if (!apiKey || apiKey === "your_openrouter_api_key_here") return null;

  // Use OpenRouter's free-model router by default. It selects a currently
  // available free model instead of pinning every request to one overloaded
  // free provider. A paid model can still be selected through .env.
  const configuredModel = String(process.env.OPENROUTER_MODEL || "").trim();
  // Migrate the two previously recommended single-provider free models to
  // OpenRouter's live free-model router. Existing local .env files may still
  // contain these older values and would otherwise keep selecting them.
  const legacyFreeModels = new Set([
    "xingchen-agi/xing4.0-29b-a4b:free",
    "recursive/flint-v1.0:free",
  ]);
  const model =
    !configuredModel || legacyFreeModels.has(configuredModel)
      ? "openrouter/free"
      : configuredModel;
  const timeoutMs = Math.max(
    75000,
    Number(process.env.OPENROUTER_TIMEOUT_MS) || 75000
  );
  const dayCount = Math.max(1, Math.min(7, Number(duration) || 1));
  // Three candidates for breakfast, lunch and dinner produce a sizeable JSON
  // response. A fixed 3,500-token budget truncates even short plans, while
  // multi-day plans need a larger output allowance. Treat the env value as an
  // optional extra budget, not a low ceiling that silently breaks generation.
  const configuredTokenBudget = Number(process.env.OPENROUTER_MAX_TOKENS) || 0;
  const maxTokens = Number.isFinite(Number(maxTokensOverride)) && Number(maxTokensOverride) > 0
    ? Math.min(32000, Math.max(1000, Number(maxTokensOverride)))
    : Math.min(
        32000,
        Math.max(12000, dayCount * 9000, configuredTokenBudget)
      );

  const startedAt = Date.now();
  let response;
  try {
    response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.APP_URL || "http://localhost:5173",
        "X-OpenRouter-Title": "MealMate AI",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: "You are MealMate, a practical Indian home-cooking meal planner. Follow the user's ingredient and diet restrictions exactly. Return valid JSON only.",
          },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: maxTokens,
        stream: false,
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    const elapsed = Math.round((Date.now() - startedAt) / 1000);
    if (error.name === "TimeoutError" || error.name === "AbortError") {
      throw new Error(
        `OpenRouter timed out after ${elapsed}s (limit ${timeoutMs / 1000}s, model ${model}). Check OpenRouter model capacity, free-tier limits, and network access.`
      );
    }
    throw new Error(`OpenRouter connection failed after ${elapsed}s: ${error.message}`);
  }

  const responseText = await response.text();
  let data;
  try {
    data = responseText ? JSON.parse(responseText) : {};
  } catch {
    throw new Error(`OpenRouter returned non-JSON data (HTTP ${response.status}).`);
  }

  if (!response.ok) {
    const detail = data?.error?.message || data?.message || "Unknown API error";
    const code = data?.error?.code ? ` [${data.error.code}]` : "";
    throw new Error(`OpenRouter HTTP ${response.status}${code}: ${detail}`);
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    const finishReason = data?.choices?.[0]?.finish_reason;
    throw new Error(
      finishReason === "length"
        ? `OpenRouter response was truncated at ${maxTokens} tokens. Reduce plan duration or increase OPENROUTER_MAX_TOKENS.`
        : "OpenRouter returned an empty AI response."
    );
  }

  try {
    return typeof content === "string" ? JSON.parse(content) : content;
  } catch {
    const jsonStart = content.indexOf("{");
    const jsonEnd = content.lastIndexOf("}");
    if (jsonStart !== -1 && jsonEnd > jsonStart) {
      try {
        return JSON.parse(content.slice(jsonStart, jsonEnd + 1));
      } catch {
        // Fall through to a clear response-format error.
      }
    }
    throw new Error("OpenRouter returned invalid meal-plan JSON. Please retry.");
  }
}

function makeIngredient(name, quantity) {
  return { name, quantity };
}

function isPlanDayEditable(mealPlan, dayNumber, now = new Date()) {
  if (!mealPlan || mealPlan.isArchived || !mealPlan.createdAt) return false;
  const start = new Date(mealPlan.createdAt);
  if (Number.isNaN(start.getTime())) return false;
  const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const elapsedDays = Math.floor((todayDate - startDate) / 86400000);
  const day = Number(dayNumber);
  return Number.isInteger(day) && day >= Math.max(1, elapsedDays + 1) && day <= Number(mealPlan.duration);
}

const CANONICAL_RECIPE_INGREDIENTS = {
  "vegetable pulao": [
    ["Rice", "1/2 cup"], ["Mixed vegetables (carrot, peas, beans)", "3/4 cup"],
    ["Onion", "1/2 medium"], ["Ginger-garlic", "1 tsp"], ["Cumin seeds", "1/2 tsp"],
    ["Bay leaf", "1"], ["Cloves", "2"], ["Cardamom", "1"], ["Cinnamon", "1 small piece"],
    ["Turmeric", "1/4 tsp"], ["Garam masala", "1/4 tsp"], ["Oil or ghee", "1 tbsp"],
    ["Salt", "to taste"], ["Water", "1 cup"], ["Coriander leaves", "1 tbsp"]
  ],
  "poha": [
    ["Poha (flattened rice)", "1 cup"], ["Onion", "1/2 medium"], ["Potato", "1/2 medium"],
    ["Peanuts", "1 tbsp"], ["Oil", "1 tbsp"], ["Mustard seeds", "1/2 tsp"],
    ["Cumin seeds", "1/4 tsp"], ["Turmeric", "1/4 tsp"], ["Green chilli", "1"],
    ["Curry leaves", "5-6"], ["Salt", "to taste"], ["Lemon juice", "1 tsp"], ["Coriander leaves", "1 tbsp"]
  ],
  "paneer sandwich": [
    ["Bread slices", "2"], ["Paneer", "75 g"], ["Onion", "2 tbsp, chopped"],
    ["Tomato", "2 slices"], ["Green chilli", "1/2, optional"], ["Butter", "1 tsp"],
    ["Salt", "to taste"], ["Black pepper", "1/4 tsp"]
  ],
  "paneer bhurji with roti": [
    ["Paneer", "100 g"], ["Wheat flour", "1/2 cup"], ["Onion", "1/2 medium"],
    ["Tomato", "1 small"], ["Green chilli", "1"], ["Ginger-garlic", "1 tsp"],
    ["Turmeric", "1/4 tsp"], ["Red chilli powder", "1/4 tsp"], ["Garam masala", "1/4 tsp"],
    ["Oil", "2 tsp"], ["Salt", "to taste"], ["Coriander leaves", "1 tbsp"], ["Water", "as required"]
  ],
  "paneer rice bowl": [
    ["Paneer", "100 g"], ["Rice", "1/2 cup"], ["Onion", "1/2 medium"],
    ["Tomato", "1 small"], ["Ginger-garlic", "1 tsp"], ["Cumin seeds", "1/2 tsp"],
    ["Turmeric", "1/4 tsp"], ["Garam masala", "1/4 tsp"], ["Oil", "1 tbsp"],
    ["Salt", "to taste"], ["Coriander leaves", "1 tbsp"], ["Water", "1 cup"]
  ],
  "chana masala": [
    ["Chickpeas (chana)", "3/4 cup cooked"], ["Onion", "1 medium"], ["Tomato", "1 medium"],
    ["Ginger-garlic", "1 tsp"], ["Chana masala", "1 tsp"], ["Cumin seeds", "1/2 tsp"],
    ["Turmeric", "1/4 tsp"], ["Oil", "1 tbsp"], ["Salt", "to taste"],
    ["Water", "1/2 cup"], ["Coriander leaves", "1 tbsp"], ["Lemon juice", "1 tsp"]
  ],
  "dal rice": [
    ["Rice", "1/2 cup"], ["Toor dal", "1/3 cup"], ["Onion", "1/2 medium"],
    ["Tomato", "1 small"], ["Garlic", "2 cloves"], ["Turmeric", "1/4 tsp"],
    ["Cumin seeds", "1/2 tsp"], ["Ghee or oil", "1 tsp"], ["Salt", "to taste"], ["Water", "as required"]
  ],
  "tomato pulao": [
    ["Rice", "1/2 cup"], ["Tomato", "2 medium"], ["Onion", "1/2 medium"],
    ["Ginger-garlic", "1 tsp"], ["Green chilli", "1"], ["Cumin seeds", "1/2 tsp"],
    ["Garam masala", "1/4 tsp"], ["Oil", "1 tbsp"], ["Salt", "to taste"],
    ["Water", "1 cup"], ["Coriander leaves", "1 tbsp"]
  ],
  "vegetable khichdi": [
    ["Rice", "1/3 cup"], ["Moong dal", "1/3 cup"], ["Mixed vegetables", "1/2 cup"],
    ["Onion", "1/2 medium"], ["Turmeric", "1/4 tsp"], ["Cumin seeds", "1/2 tsp"],
    ["Ghee", "1 tsp"], ["Salt", "to taste"], ["Water", "2 cups"]
  ],
  "roti with aloo sabzi": [
    ["Wheat flour", "1/2 cup"], ["Potatoes", "2 small"], ["Tomato", "1 small"],
    ["Onion", "1/2 medium"], ["Cumin seeds", "1/2 tsp"], ["Turmeric", "1/4 tsp"],
    ["Red chilli powder", "1/4 tsp"], ["Oil", "1 tbsp"], ["Salt", "to taste"],
    ["Water", "as required"], ["Coriander leaves", "1 tbsp"]
  ],
  "vegetable upma": [
    ["Semolina (rava)", "1/2 cup"], ["Onion", "1/2 medium"], ["Mixed vegetables", "1/3 cup"],
    ["Green chilli", "1"], ["Mustard seeds", "1/2 tsp"], ["Curry leaves", "5-6"],
    ["Oil or ghee", "1 tbsp"], ["Salt", "to taste"], ["Water", "1 1/2 cups"], ["Lemon juice", "1 tsp"]
  ]
};

function getCanonicalRecipeIngredients(recipeName) {
  const key = String(recipeName || "").trim().toLowerCase();
  const list = CANONICAL_RECIPE_INGREDIENTS[key];
  return list ? list.map(([name, quantity]) => makeIngredient(name, quantity)) : null;
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

function buildLocalOptions(pool, type, dayNumber, diet) {
  // Each recipe has defining ingredient groups. A recipe is offered only
  // when every defining group is present in the user's allowed ingredient pool.
  // Additional ingredients are included only when the user selected them.
  const recipes = {
    breakfast: [
      { name: "Poha", required: [["poha", "flattened rice"]] },
      { name: "Vegetable Upma", required: [["rava", "sooji", "semolina"]] },
      { name: "Besan Chilla", required: [["besan", "gram flour"]] },
      { name: "Aloo Paratha", required: [["wheat", "atta"], ["potato", "aloo"]] },
      { name: "Paneer Bhurji", required: [["paneer"], ["onion", "tomato"]] },
      { name: "Paneer Sandwich", required: [["paneer"], ["bread"]] },
      { name: "Vegetable Sandwich", required: [["bread"], ["potato", "carrot", "cucumber", "tomato"]] },
      { name: "Dalia Upma", required: [["dalia", "broken wheat"]] },
      { name: "Moong Dal Chilla", required: [["moong dal", "mung dal"]] },
      { name: "Thepla", required: [["wheat", "atta"], ["methi", "fenugreek"]] },
      { name: "Masala Vegetable Noodles", required: [["noodles"], ["vegetable", "carrot", "peas", "capsicum"]] },
      { name: "Indian Vegetable Pasta", required: [["pasta"], ["vegetable", "carrot", "peas", "capsicum"]] },
      { name: "Vegetable Rice", required: [["rice"], ["vegetable", "carrot", "peas", "capsicum"]] },
    ],
    lunch: [
      { name: "Dal Rice", required: [["rice"], ["dal", "lentil"]] },
      { name: "Vegetable Pulao", required: [["rice"], ["vegetable", "carrot", "peas", "beans"]] },
      { name: "Rajma Chawal", required: [["rajma", "kidney bean"], ["rice"]] },
      { name: "Chole Chawal", required: [["chana", "chickpea"], ["rice"]] },
      { name: "Vegetable Khichdi", required: [["rice"], ["dal", "lentil"]] },
      { name: "Tomato Rice", required: [["rice"], ["tomato"]] },
      { name: "Jeera Rice", required: [["rice"], ["cumin", "jeera"]] },
      { name: "Paneer Masala", required: [["paneer"], ["tomato"]] },
      { name: "Aloo Roti", required: [["potato", "aloo"], ["wheat", "atta"]] },
      { name: "Kadhi Chawal", required: [["curd", "yogurt"], ["besan", "gram flour"], ["rice"]] },
      { name: "Masala Vegetable Noodles", required: [["noodles"], ["vegetable", "carrot", "peas", "capsicum"]] },
      { name: "Indian Vegetable Pasta", required: [["pasta"], ["vegetable", "carrot", "peas", "capsicum"]] },
      { name: "Vegetable Fried Rice", required: [["rice"], ["vegetable", "carrot", "peas", "capsicum"]] },
    ],
    dinner: [
      { name: "Dal Khichdi", required: [["rice"], ["dal", "lentil"]] },
      { name: "Roti with Aloo Sabzi", required: [["wheat", "atta"], ["potato", "aloo"]] },
      { name: "Paneer Bhurji with Roti", required: [["paneer"], ["wheat", "atta"]] },
      { name: "Tomato Pulao", required: [["rice"], ["tomato"]] },
      { name: "Vegetable Dalia", required: [["dalia", "broken wheat"], ["vegetable", "carrot", "peas"]] },
      { name: "Curd Rice", required: [["rice"], ["curd", "yogurt"]] },
      { name: "Moong Dal Khichdi", required: [["rice"], ["moong dal", "mung dal"]] },
      { name: "Chana Masala with Roti", required: [["chana", "chickpea"], ["wheat", "atta"]] },
      { name: "Vegetable Pulao", required: [["rice"], ["vegetable", "carrot", "peas", "beans"]] },
      { name: "Jeera Rice with Dal", required: [["rice"], ["cumin", "jeera"], ["dal", "lentil"]] },
      { name: "Masala Vegetable Noodles", required: [["noodles"], ["vegetable", "carrot", "peas", "capsicum"]] },
      { name: "Indian Vegetable Pasta", required: [["pasta"], ["vegetable", "carrot", "peas", "capsicum"]] },
      { name: "Vegetable Fried Rice", required: [["rice"], ["vegetable", "carrot", "peas", "capsicum"]] },
      { name: "Capsicum Rice", required: [["rice"], ["capsicum"]] },
    ],
  };

  const normalizedPool = pool.map((name) => ({
    name,
    normalized: normalizeIngredientName(name),
    lower: String(name).toLowerCase(),
  }));
  const matches = (entry, aliases) => aliases.some((alias) =>
    entry.lower.includes(alias) || entry.normalized.includes(normalizeIngredientName(alias))
  );

  const valid = (recipes[type] || recipes.lunch)
    .filter((recipe) =>
      !DIET_FORBIDDEN[diet]?.test(recipe.name) &&
      recipe.required.every((group) => normalizedPool.some((entry) => matches(entry, group)))
    )
    .map((recipe) => {
      const relevant = normalizedPool
        .filter((entry) => recipe.required.some((group) => matches(entry, group)))
        .map((entry) => entry.name);
      // Include other selected pantry ingredients that can reasonably be used
      // in the dish, but never add an ingredient the user did not select.
      const optional = normalizedPool
        .filter((entry) => /onion|tomato|garlic|ginger|chilli|pepper|salt|oil|ghee|cumin|turmeric|coriander|peas|carrot|beans|potato|lemon/i.test(entry.lower))
        .map((entry) => entry.name);
      const ingredients = [...new Map([...relevant, ...optional].map((name) => [
        normalizeIngredientName(name), name
      ])).values()];
      return { ...recipe, ingredients };
    });

  // Do not invent dish names or append artificial "Bowl 1/2/3" labels.
  // If the selected pantry cannot support three distinct Indian recipes,
  // return the genuine recipes that can be prepared from those ingredients.
  return valid.slice(0, 3).map((recipe, index) => ({
    name: recipe.name,
    description: `${recipe.name} prepared with your selected pantry ingredients.`,
    prepTime: index === 0 ? "20 minutes" : "25 minutes",
    ingredients: recipe.ingredients.map((name) => ({
      name,
      quantity: "as needed",
    })),
  }));
}

function generateLocalMealPlan({ duration, diet, allowedPool }) {
  const pool = [...new Set(allowedPool)].filter((item) =>
    !DIET_FORBIDDEN[diet]?.test(item)
  );
  if (!pool.length) {
    throw new Error(`No allowed ingredients are available for the selected ${diet} diet.`);
  }
  const days = [];
  for (let day = 1; day <= Number(duration); day += 1) {
    const breakfastOptions = buildLocalOptions(pool, "breakfast", day, diet);
    const lunchOptions = buildLocalOptions(pool, "lunch", day, diet);
    const dinnerOptions = buildLocalOptions(pool, "dinner", day, diet);
    days.push({
      day,
      breakfast: breakfastOptions[0].name,
      breakfastIngredients: breakfastOptions[0].ingredients,
      breakfastOptions,
      lunch: lunchOptions[0].name,
      lunchIngredients: lunchOptions[0].ingredients,
      lunchOptions,
      dinner: dinnerOptions[0].name,
      dinnerIngredients: dinnerOptions[0].ingredients,
      dinnerOptions,
    });
  }
  return { days };
}

exports.createMealPlan = async (req, res) => {
  try {
    const {
      goal,
      diet,
      ingredients,
      availableIngredients,
      recommendedIngredients,
      ingredientMode,
      duration,
    } = req.body;

    if (!["vegetarian", "vegan", "non-vegetarian", "eggetarian"].includes(diet)) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid diet type.",
      });
    }

    if (!goal || !diet || !duration) {
      return res.status(400).json({
        success: false,
        message: "Goal, diet and duration are required",
      });
    }

    if (![1, 3, 7].includes(Number(duration))) {
      return res.status(400).json({
        success: false,
        message: "Meal plan duration must be 1, 3 or 7 days.",
      });
    }

    const available = cleanList(availableIngredients || ingredients);
    // Pantry ingredients are user-confirmed; recommended ingredients are filtered
    // to the selected diet so stale or unfiltered suggestions cannot block planning.
    const recommended = cleanList(recommendedIngredients).filter(
      (ingredient) => !DIET_FORBIDDEN[diet]?.test(ingredient)
    );
    const allowedPool = ingredientMode === "recommended"
      ? [...new Set([...available, ...recommended])]
      : available;

    const invalidDietIngredients = available.filter(
      (ingredient) => DIET_FORBIDDEN[diet]?.test(ingredient)
    );
    if (invalidDietIngredients.length > 0) {
      return res.status(400).json({
        success: false,
        message: `These selected ingredients are not allowed with the selected ${diet} diet: ${invalidDietIngredients.join(", ")}.`,
        invalidIngredients: invalidDietIngredients,
      });
    }

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
- These are examples, not mandatory recipes. Choose dishes only when their required ingredients are available in the allowed ingredient pool and compatible with the user's diet.
- ${ingredientMode === "recommended" ? "Use only ingredients from the allowed ingredient pool (pantry + recommended). Do not add ingredients outside that pool." : "STRICT MODE: every ingredient in every recipe MUST exist in the selected pantry ingredient list. Never add an unselected ingredient, even as a garnish, spice, oil, salt or optional item. If a dish needs an ingredient not in the list, choose another dish."}.
- Generate up to THREE candidate recipes for each meal category so server-side validation can retain the best three valid options. Make candidates meaningfully different from one another. Every candidate must strictly follow the allowed ingredient pool; do not add any outside ingredient.
- Within the same day, breakfast, lunch and dinner MUST have different recipe names and must not repeat the same dish under different meal categories.
- Across a 3-day or 7-day plan, avoid repeating a recipe name wherever practical; prioritize variety.

Rules:
1. Every meal must have its own complete ingredient list.
2. Use pantry ingredients first whenever practical.
3. Treat the allowed ingredient pool as ingredients the user already has; prioritize these ingredients in every meal.
4. Every recipe ingredient must come from the allowed ingredient pool. Do not add ingredients outside the pool.
5. In "Only Available Ingredients" mode, every recipe must be fully cookable using only selected pantry ingredients. In "Available + Recommended Ingredients" mode, use pantry and recommended ingredients only.
6. Follow the selected diet restriction strictly for every ingredient.
7. Do not put the recipe name in its ingredient list.
8. Keep ingredients specific to the meal and include realistic quantities.
9. Quantities should be short and practical.
10. Return up to 3 distinct recipe candidates for breakfast, lunch and dinner. Each candidate must have a complete ingredient list using ONLY ingredients from the allowed ingredient pool. The server will keep up to 3 valid candidates per meal.
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
      "dinnerOptions": [{"name":"recipe name","description":"short description","prepTime":"30 minutes","ingredients":[{"name":"ingredient","quantity":"quantity"}]}]
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
      // Try the configured AI provider for previews and direct generation.
      // If the key is missing or the provider fails, keep planning available
      // with the deterministic local recipe templates.
      let aiErrorMessage = null;
      try {
        // Generate each day/category independently. This keeps every response
        // small enough for model output limits while preserving one combined
        // response for the existing frontend.
        const mealTypes = ["breakfast", "lunch", "dinner"];
        const dayCount = Number(duration);
        const jobs = [];
        for (let dayNumber = 1; dayNumber <= dayCount; dayNumber += 1) {
          for (const type of mealTypes) jobs.push({ dayNumber, type });
        }

        // Run a bounded pool across all days instead of waiting for each day's
        // three requests to finish before starting the next day.
        const resultsByDay = Array.from({ length: dayCount }, () => ({}));
        let nextJobIndex = 0;
        const workerCount = Math.min(6, jobs.length);
        const workers = Array.from({ length: workerCount }, async () => {
          while (nextJobIndex < jobs.length) {
            const job = jobs[nextJobIndex++];
            const { dayNumber, type } = job;
            const categoryPrompt = `
You are MealMate, an expert Indian home-cooking meal planner.
Generate ONLY 3 distinct ${type} recipe options for day ${dayNumber}.
User goal: ${goal}
Diet: ${diet}. Restriction: ${DIET_RULES[diet] || "Follow the selected diet exactly."}
Planning mode: ${ingredientMode === "recommended" ? "Pantry + recommended ingredients" : "Selected pantry ingredients only"}.
Allowed ingredients (the complete permitted list): ${JSON.stringify(allowedPool)}
Rules:
- Use ONLY ingredients from the permitted list. Do not add oil, salt, spices, garnish, water or any other unlisted ingredient.
- Prefer practical, familiar Indian home-style recipes that can genuinely be made from the permitted ingredients.
- Follow the diet restriction exactly.
- Return exactly 3 meaningfully different recipes, each with a short description, prepTime, a servings integer (usually 1 or 2), and a complete ingredient list with explicit measurable quantities. Do not use "as needed" or "to taste" for ingredients that contribute meaningful calories or macros. Use grams/ml where practical and cups/tbsp/tsp/pieces only when appropriate.
- Do not include a recipe name in its own ingredient list.
- Return valid JSON only, with this exact shape:
{"options":[{"name":"recipe name","description":"short description","prepTime":"20 minutes","servings":2,"ingredients":[{"name":"ingredient from permitted list","quantity":"120 g"}]}]}
`;
            let result;
            let lastError;
            // Retry only the failed category once.
            for (let attempt = 1; attempt <= 2; attempt += 1) {
              try {
                result = await generateWithOpenRouter(categoryPrompt, 1, 12000);
                const candidateOptions = Array.isArray(result?.options)
                  ? result.options
                  : Array.isArray(result?.[type + "Options"])
                    ? result[type + "Options"]
                    : [];
                if (candidateOptions.length) {
                  resultsByDay[dayNumber - 1][type] = candidateOptions;
                  break;
                }
                lastError = new Error(`AI returned no valid ${type} options for day ${dayNumber}.`);
              } catch (error) {
                lastError = error;
              }
            }
            if (!resultsByDay[dayNumber - 1][type]) {
              throw lastError || new Error(`AI failed to generate ${type} for day ${dayNumber}.`);
            }
          }
        });
        await Promise.all(workers);

        const generatedDays = resultsByDay.map((categoryResults, index) => {
          const day = { day: index + 1 };
          mealTypes.forEach((type) => {
            const options = categoryResults[type];
            day[type + "Options"] = options;
            day[type] = options[0]?.name || "";
            day[type + "Ingredients"] = options[0]?.ingredients || [];
          });
          return day;
        });
        generatedMeals = { days: generatedDays };
      } catch (aiError) {
        aiErrorMessage = aiError?.message || "Unknown OpenRouter error";
        console.error("AI meal generation failed:", aiErrorMessage);
        generatedMeals = null;
      }

      if (!generatedMeals) {
        // Keep meal planning usable when OpenRouter is slow, unavailable,
        // rate-limited, or the API key is not configured. Local recipes are
        // still validated against the same selected ingredient pool below.
        generatedMeals = generateLocalMealPlan({ duration, diet, allowedPool });
        generatedBy = process.env.OPENROUTER_API_KEY
          ? "local-fallback"
          : "local-no-api-key";
        if (aiErrorMessage) {
          console.warn("Using local meal fallback:", aiErrorMessage);
        }
      }
    }

    const days = Array.isArray(generatedMeals.days) ? generatedMeals.days : [];

    if (days.length !== Number(duration) || days.some((day, index) => Number(day?.day) !== index + 1)) {
      return res.status(422).json({
        success: false,
        message: "Meal plan response does not contain the correct number of ordered days. Please generate it again.",
      });
    }

    // Validate ingredients BEFORE selecting the best three options. This prevents
    // invalid AI candidates from occupying slots and hiding otherwise valid recipes.
    const allowedIngredientNames = new Set(
      allowedPool.map((item) => normalizeIngredientName(item))
    );

    days.forEach((day) => {
      const usedNames = new Set();
      ["breakfast", "lunch", "dinner"].forEach((type) => {
        const original = Array.isArray(day[type + "Options"])
          ? day[type + "Options"]
          : [];
        const preferred = original.find((item) => item?.name === day[type]);
        const ordered = preferred
          ? [preferred, ...original.filter((item) => item !== preferred)]
          : original;

        const validOptions = [];
        ordered.forEach((option) => {
          if (!option?.name || !Array.isArray(option.ingredients) || !option.ingredients.length) {
            return;
          }

          const optionIngredients = option.ingredients.map((item) =>
            normalizeIngredientName(typeof item === "string" ? item : item?.name)
          );
          const allIngredientsAvailable = optionIngredients.every(
            (name) => name && allowedIngredientNames.has(name)
          );
          const optionText = `${option.name} ${option.ingredients
            .map((item) => typeof item === "string" ? item : item?.name || "")
            .join(" ")} `;
          const forbidden = DIET_FORBIDDEN[diet];
          const violatesDiet = forbidden ? forbidden.test(optionText) : false;
          const nameKey = String(option.name).trim().toLowerCase();

          if (
            !allIngredientsAvailable ||
            violatesDiet ||
            usedNames.has(nameKey) ||
            validOptions.length >= 3
          ) {
            return;
          }

          validOptions.push(option);
          usedNames.add(nameKey);
        });

        // Complete short AI option lists with pantry-only local choices.
        // This also recovers when every AI candidate fails strict validation.
        // These options are built exclusively from allowedPool.
        if (validOptions.length < 3 && generatedBy === "openrouter") {
          const pantryFallback = buildLocalOptions(allowedPool, type, day.day, diet);
          pantryFallback.forEach((option) => {
            const key = String(option.name).trim().toLowerCase();
            if (!usedNames.has(key) && validOptions.length < 3) {
              validOptions.push(option);
              usedNames.add(key);
            }
          });
          if (validOptions.length) {
            console.warn(`AI options for ${type} on day ${day.day}: completed to three choices with pantry-only options where needed.`);
          }
        }

        day[type + "Options"] = validOptions;
        if (validOptions[0]) {
          day[type] = validOptions[0].name;
          day[type + "Ingredients"] = validOptions[0].ingredients;
        }
      });
    });

    // Keep legacy selected-meal fields in sync with the first valid option.
    // If fewer than three candidates pass strict pantry validation, show only
    // those valid candidates; never pad the list with recipes needing other items.
    days.forEach((day) => {
      ["breakfast", "lunch", "dinner"].forEach((type) => {
        const options = Array.isArray(day[type + "Options"])
          ? day[type + "Options"]
          : [];
        if (options.length) {
          const selected = options.find((item) => item.name === day[type]) || options[0];
          day[type] = selected.name;
          day[type + "Ingredients"] = selected.ingredients;
        }
      });
    });

    if (days.some((day) => ["breakfast", "lunch", "dinner"].some((type) => {
      const options = day[type + "Options"] || [];
      return options.length < 1;
    }))) {
      return res.status(422).json({
        success: false,
        message: "MealMate could not find a complete recipe for every meal using only your selected ingredients. Select more ingredients or switch to Available + Recommended Ingredients.",
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

    // Calculate nutrition as part of generation, before preview or persistence.
    // Every alternative gets an immediate local estimate; the default selected
    // meal also receives USDA enrichment when a configured API key is available.
    const selectedNutritionJobs = [];
    for (const day of days) {
      for (const type of ["breakfast", "lunch", "dinner"]) {
        const options = Array.isArray(day[type + "Options"]) ? day[type + "Options"] : [];
        for (const option of options) {
          await attachMealNutrition(option, false);
        }
        const selected = options.find((option) => option.name === day[type]) || options[0];
        if (selected) {
          selectedNutritionJobs.push({ day, type, selected });
          day[type] = selected.name;
          day[type + "Ingredients"] = selected.ingredients || [];
        }
      }
    }
    // USDA lookups run in small batches to avoid flooding the external API on
    // 3- or 7-day plans. Local estimates are already attached to every option.
    for (let index = 0; index < selectedNutritionJobs.length; index += 4) {
      const batch = selectedNutritionJobs.slice(index, index + 4);
      await Promise.all(batch.map(({ selected }) => attachMealNutrition(selected, true)));
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
    const { day, option, recipeId } = req.body;
    const rawMealType = String(req.body.mealType || "").trim().toLowerCase();
    const mealTypeAliases = { morning: "breakfast", noon: "lunch", evening: "dinner" };
    const mealType = mealTypeAliases[rawMealType] || rawMealType;
    const allowedTypes = ["breakfast", "lunch", "dinner"];
    if (!allowedTypes.includes(mealType)) {
      console.error("Invalid meal selection payload:", { day, mealType: req.body.mealType, hasRecipeId: Boolean(recipeId), hasOption: Boolean(option?.name) });
      return res.status(400).json({ success: false, message: "A valid meal type (breakfast, lunch or dinner) is required." });
    }
    const mealPlan = await MealPlan.findOne({ _id: req.params.id, user: req.user.id });
    if (!mealPlan) return res.status(404).json({ success: false, message: "Meal plan not found." });
    const dayPlan = mealPlan.meals.find((item) => Number(item.day) === Number(day));
    if (!dayPlan) return res.status(404).json({ success: false, message: "Meal-plan day not found." });
    if (!isPlanDayEditable(mealPlan, day)) {
      return res.status(403).json({
        success: false,
        message: "Only today's and upcoming meals in an active plan can be changed.",
      });
    }
    let selected;
    if (recipeId) {
      const recipe = await Recipe.findById(recipeId).lean();
      if (!recipe) return res.status(404).json({ success: false, message: "Recipe not found." });
      const recipeDiet = String(recipe.diet || "").toLowerCase();
      const planDiet = String(mealPlan.diet || "").toLowerCase();
      if (recipeDiet && recipeDiet !== "any" && recipeDiet !== planDiet) {
        return res.status(400).json({ success: false, message: "This recipe does not match your meal plan diet." });
      }
      selected = {
        name: recipe.name,
        description: recipe.description || "Selected from MealMate recipes",
        prepTime: recipe.prepTime || "",
        ingredients: (recipe.ingredients || []).map((name) => ({ name, quantity: "as needed" })),
        servings: Number(recipe.servings) || 1,
        nutrition: recipe.nutrition || null,
      };
      if (!selected.nutrition) await attachMealNutrition(selected, true);
      const options = Array.isArray(dayPlan[mealType + "Options"]) ? dayPlan[mealType + "Options"] : [];
      dayPlan[mealType + "Options"] = [selected, ...options.filter((item) => item.name !== selected.name)].slice(0, 3);
    } else {
      if (!option || !option.name) return res.status(400).json({ success: false, message: "A valid alternative meal is required." });
      const options = dayPlan[mealType + "Options"] || [];
      selected = options.find((item) => item.name === option.name);
      if (!selected) return res.status(400).json({ success: false, message: "The selected option is not part of this meal plan." });
    }
    if (!recipeId) await attachMealNutrition(selected, true);
    else if (!selected.nutrition) await attachMealNutrition(selected, true);
    dayPlan[mealType] = selected.name;
    dayPlan[mealType + "Ingredients"] = selected.ingredients || [];
    mealPlan.markModified("meals");
    await mealPlan.save();
    try {
      await upsertGroceryListForMealPlan(mealPlan);
    } catch (groceryError) {
      console.error("Meal selection saved, but grocery synchronization failed:", groceryError);
    }
    res.json({ success: true, message: "Meal selection saved.", mealPlan });
  } catch (error) {
    console.error("UPDATE MEAL SELECTION ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to save meal selection." });
  }
};

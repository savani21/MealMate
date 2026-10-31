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

const ALLERGEN_ALIASES = {
  peanut: ["peanut", "peanuts", "groundnut", "groundnuts", "peanut oil"],
  milk: ["milk", "dairy", "whey", "casein", "lactose", "butter", "ghee", "paneer", "cheese", "curd", "yogurt", "yoghurt", "cream", "buttermilk"],
  egg: ["egg", "eggs", "albumin"],
  soy: ["soy", "soya", "soybean", "soybeans", "tofu", "tempeh", "edamame"],
  wheat: ["wheat", "wheat flour", "atta", "maida", "semolina", "suji", "rava", "durum"],
  gluten: ["wheat", "barley", "rye", "malt", "semolina", "durum", "couscous"],
  sesame: ["sesame", "sesame seeds", "til", "tahini"],
  fish: ["fish", "salmon", "tuna", "cod", "sardine", "anchovy"],
  shellfish: ["shellfish", "shrimp", "prawn", "crab", "lobster", "crayfish", "mussel", "clam", "oyster"],
  "tree nuts": ["nut", "nuts", "almond", "almonds", "cashew", "cashews", "walnut", "walnuts", "pistachio", "pistachios", "hazelnut", "pecan", "brazil nut", "macadamia"],
};

function normalizeFoodText(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function getAllergyTerms(allergies) {
  return cleanList(String(allergies || "").replace(/;/g, ","))
    .map((item) => normalizeFoodText(item))
    .filter(Boolean);
}

function findAllergenConflicts(value, allergies) {
  const text = ` ${normalizeFoodText(value)} `;
  const conflicts = [];
  getAllergyTerms(allergies).forEach((allergy) => {
    const aliases = ALLERGEN_ALIASES[allergy] || [allergy];
    if (aliases.some((alias) => text.includes(` ${normalizeFoodText(alias)} `))) {
      conflicts.push(allergy);
    }
  });
  return [...new Set(conflicts)];
}

function mealAllergyConflicts(meal, allergies) {
  const conflicts = [];
  ["breakfast", "lunch", "dinner"].forEach((type) => {
    const parts = [meal?.[type]];
    const ingredients = meal?.[type + "Ingredients"];
    if (Array.isArray(ingredients)) {
      parts.push(...ingredients.map((item) => typeof item === "string" ? item : item?.name || ""));
    }
    const options = Array.isArray(meal?.[type + "Options"]) ? meal[type + "Options"] : [];
    options.forEach((option) => {
      parts.push(option?.name, option?.description);
      if (Array.isArray(option?.ingredients)) {
        parts.push(...option.ingredients.map((item) => typeof item === "string" ? item : item?.name || ""));
      }
    });
    parts.forEach((part) => conflicts.push(...findAllergenConflicts(part, allergies)));
  });
  return [...new Set(conflicts)];
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

function buildLocalOptions(pool, type, dayNumber, diet, allergies) {
  const templates = {
    breakfast: [
      ["Poha", ["poha", "flattened rice", "onion", "potato", "peanut"]],
      ["Aloo Paratha", ["wheat", "atta", "flour", "potato", "curd"]],
      ["Vegetable Upma", ["rava", "sooji", "semolina", "onion", "vegetable"]],
      ["Besan Chilla", ["besan", "gram flour", "onion", "tomato"]],
      ["Idli Sambar", ["idli", "batter", "urad", "dal", "rice"]],
      ["Sweet Wheat Porridge", ["wheat", "atta", "flour", "sugar", "milk"]],
      ["Banana Milk Smoothie", ["banana", "milk", "curd"]],
      ["Paneer Sandwich", ["bread", "paneer", "tomato", "onion"]],
    ],
    lunch: [
      ["Vegetable Pulao", ["rice", "vegetable", "carrot", "peas", "onion"]],
      ["Dal Rice", ["rice", "dal", "lentil", "tomato"]],
      ["Chana Masala", ["chana", "chickpea", "tomato", "onion"]],
      ["Paneer Bhurji with Roti", ["paneer", "wheat", "atta", "flour", "tomato"]],
      ["Tomato Rice", ["rice", "tomato", "onion"]],
      ["Aloo Roti", ["potato", "wheat", "atta", "flour"]],
      ["Vegetable Khichdi", ["rice", "dal", "lentil", "vegetable"]],
    ],
    dinner: [
      ["Dal Khichdi", ["rice", "dal", "lentil", "turmeric"]],
      ["Roti with Aloo Sabzi", ["wheat", "atta", "flour", "potato", "tomato"]],
      ["Paneer Rice Bowl", ["paneer", "rice", "tomato", "onion"]],
      ["Tomato Pulao", ["rice", "tomato", "onion"]],
      ["Vegetable Dalia", ["dalia", "broken wheat", "vegetable", "onion"]],
      ["Curd Rice", ["rice", "curd", "yogurt"]],
    ],
  };
  const normalized = pool.map((item) => item.toLowerCase());
  const candidates = (templates[type] || templates.lunch).filter(([name]) =>
    !DIET_FORBIDDEN[diet]?.test(name) && findAllergenConflicts(name, allergies).length === 0
  );
  const ranked = candidates.map(([name, keywords], index) => {
    const matched = pool.filter((item, i) =>
      keywords.some((keyword) => normalized[i].includes(keyword))
    );
    return { name, keywords, matched, score: matched.length, index };
  }).sort((a, b) => b.score - a.score || a.index - b.index);

  const chosen = [];
  for (const candidate of ranked) {
    if (chosen.length === 3) break;
    if (candidate.score > 0 && !chosen.some((item) => item.name === candidate.name)) {
      chosen.push(candidate);
    }
  }

  // Always return three distinct, usable options, even when the pantry is sparse.
  const fallbacks = [
    ["Indian Masala Bowl", ["rice", "potato", "tomato", "onion"]],
    ["Homestyle Spiced Roti", ["wheat", "atta", "flour", "potato", "tomato"]],
    ["Simple Indian Veggie Mix", ["vegetable", "potato", "tomato", "onion"]],
  ];
  for (const [name, keywords] of fallbacks) {
    if (chosen.length >= 3) break;
    if (!chosen.some((item) => item.name === name)) {
      chosen.push({
        name,
        keywords,
        matched: pool.filter((item) => keywords.some((keyword) => item.toLowerCase().includes(keyword))),
        score: 0,
      });
    }
  }

  return chosen.slice(0, 3).map((candidate, index) => {
    const picked = candidate.matched.length
      ? candidate.matched.slice(0, 4)
      : pool.slice(index % pool.length, index % pool.length + 3);
    const ingredients = (picked.length ? picked : pool.slice(0, 3)).map((name) => ({
      name,
      quantity: "as needed",
    }));
    return {
      name: candidate.name,
      description: "A quick Indian home-style meal using your selected ingredients.",
      prepTime: index === 0 ? "20 minutes" : "25 minutes",
      ingredients,
    };
  });
}

function generateLocalMealPlan({ duration, diet, allowedPool, allergies }) {
  const pool = [...new Set(allowedPool)].filter((item) =>
    !DIET_FORBIDDEN[diet]?.test(item) && findAllergenConflicts(item, allergies).length === 0
  );
  if (!pool.length) {
    throw new Error(`No allowed ingredients are available for the selected ${diet} diet.`);
  }
  const days = [];
  for (let day = 1; day <= Number(duration); day += 1) {
    const breakfastOptions = buildLocalOptions(pool, "breakfast", day, diet, allergies);
    const lunchOptions = buildLocalOptions(pool, "lunch", day, diet, allergies);
    const dinnerOptions = buildLocalOptions(pool, "dinner", day, diet, allergies);
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
      allergies,
      ingredients,
      availableIngredients,
      recommendedIngredients,
      ingredientMode,
      duration,
    } = req.body;

    const allergyList = getAllergyTerms(allergies);
    const allergyText = allergyList.join(", ");

    if (!["vegetarian", "vegan", "non-vegetarian", "eggetarian"].includes(diet)) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid diet type.",
      });
    }

    if (allergyText.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Please keep allergy information within 500 characters.",
      });
    }

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

    const allergenConflicts = [...new Set(
      allowedPool.flatMap((ingredient) => findAllergenConflicts(ingredient, allergyText))
    )];
    if (allergenConflicts.length) {
      return res.status(400).json({
        success: false,
        message: `Your selected ingredients conflict with these listed allergies: ${allergenConflicts.join(", ")}. Remove them before generating a meal plan.`,
        allergenConflicts,
      });
    }

    const invalidDietIngredients = allowedPool.filter(
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
Food allergies (STRICT exclusions; do not use these ingredients or their common forms): ${allergyText || "None"}

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
7. Never use any listed allergen, including aliases and derived ingredients.
8. Do not put the recipe name in its ingredient list.
9. Keep ingredients specific to the meal.
10. Quantities should be short and practical.
11. Return exactly 3 distinct recipe options for breakfast, lunch and dinner. Keep every option within the allowed ingredient pool, selected diet and allergy restrictions.
12. The first option must be the default meal name and ingredient list. Give each option a distinct name, short description, preparation time and complete ingredient list.

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
      // Preview must be fast and predictable: use local Indian meal templates
      // instead of waiting on variable-latency free AI model routing.
      if (req.body.previewOnly === true) {
        generatedMeals = generateLocalMealPlan({ duration, diet, allowedPool, allergies: allergyText });
        generatedBy = "local-fast";
      } else {
        generatedMeals = await generateWithOpenRouter(prompt);
        if (!generatedMeals) {
          generatedMeals = generateLocalMealPlan({ duration, diet, allowedPool, allergies: allergyText });
          generatedBy = "local-fallback";
        }
      }
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

    const generatedAllergenConflicts = [...new Set(
      days.flatMap((day) => mealAllergyConflicts(day, allergyText))
    )];
    if (generatedAllergenConflicts.length) {
      return res.status(422).json({
        success: false,
        message: `The generated meal choices contain ingredients that conflict with your listed allergies: ${generatedAllergenConflicts.join(", ")}. No meal plan was saved. Please try again or update your ingredient list.`,
        allergenConflicts: generatedAllergenConflicts,
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
      allergies: allergyText,
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

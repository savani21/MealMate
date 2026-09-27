const GroceryList = require("../../models/user/GroceryList");
const MealPlan = require("../../models/MealPlan");
const Recipe = require("../../models/user/Recipe");

const DIET_FORBIDDEN = {
  vegetarian: /\b(chicken|mutton|lamb|beef|pork|fish|salmon|tuna|prawn|shrimp|seafood|egg|eggs|bacon|ham|sausage|gelatin)\b/i,
  vegan: /\b(chicken|mutton|lamb|beef|pork|fish|salmon|tuna|prawn|shrimp|seafood|egg|eggs|milk|paneer|cheese|curd|yogurt|butter|ghee|cream|dairy|gelatin)\b/i,
  eggetarian: /\b(chicken|mutton|lamb|beef|pork|fish|salmon|tuna|prawn|shrimp|seafood|bacon|ham|sausage|gelatin)\b/i,
};

function normalizeIngredient(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/^[\s\d./-]+/, "")
    .replace(/^(?:cups?|tbsp|tbsps|tablespoons?|tsp|tsps|teaspoons?|kg|kgs|g|gm|gms|grams?|ml|l|litres?|liters?|pieces?|pcs?|cloves?|slices?|bunch(?:es)?|pack(?:s)?|cans?|can)\s+/i, "")
    .replace(/^[\s\d./-]+/, "")
    .replace(/\b(?:large|medium|small|finely|roughly|thinly|thickly|chopped|diced|minced|sliced|grated|crushed|fresh|freshly|cooked|boiled|raw|roasted|optional|to taste)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.,;:]+$/, "")
    .replace(/\b(\w+)s$/, "$1");
}

function canonicalIngredient(value) {
  const name = normalizeIngredient(value);
  const aliases = {
    "tuver dal": "toor dal",
    "tuvar dal": "toor dal",
    "tur dal": "toor dal",
    "arhar dal": "toor dal",
    "basmati rice": "rice",
    "long grain rice": "rice",
    "atta": "wheat flour",
    "whole wheat flour": "wheat flour",
    "wheat atta": "wheat flour",
    "vegetable oil": "oil",
    "sunflower oil": "oil",
    "green chilli": "green chili",
    "green chillies": "green chili",
    "green chilies": "green chili",
  };
  return aliases[name] || name;
}

function parseIngredients(value) {
  return String(value || "").split(",").map(normalizeIngredient).filter(Boolean);
}

function isForbiddenForDiet(name, diet) {
  const rule = DIET_FORBIDDEN[String(diet || "").toLowerCase()];
  return Boolean(rule && rule.test(String(name || "")));
}

function removeAvailable(requiredIngredients, availableIngredients) {
  const available = new Set(availableIngredients.map(canonicalIngredient));
  return requiredIngredients.filter((item) => !available.has(canonicalIngredient(item.name)));
}

async function getAIIngredientsForMeals(mealNames) {
  if (!mealNames.length) return {};

  try {
    const prompt = `For each meal name below, return 4-8 main ingredients required to cook it.
Meals: ${JSON.stringify(mealNames)}
Return ONLY JSON in this exact shape:
{"Meal Name":[{"name":"ingredient","quantity":"quantity"}]}
Use simple shopping ingredient names. Include salt when it is normally required. Do not use the meal name as an ingredient.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
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
        data?.error?.message || `OpenRouter API request failed with status ${response.status}`
      );
    }

    const text = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error("OpenRouter returned an empty AI response");

    return JSON.parse(text.trim());
  } catch (error) {
    console.error("AI ingredient lookup failed:", error.message);
    return {};
  }
}

async function buildGroceryItems(mealPlan) {
  const mealTypes = [["breakfast","Breakfast"],["lunch","Lunch"],["snack","Snack"],["dinner","Dinner"]];
  const mealNames = [];
  for (const day of mealPlan.meals || []) {
    for (const [key] of mealTypes) if (day[key]) mealNames.push(String(day[key]).trim());
  }

  const uniqueMealNames = [...new Set(mealNames)];
  const recipes = await Recipe.find({ name: { $in: uniqueMealNames } }).lean();
  const recipeMap = new Map(recipes.map((r) => [r.name.trim().toLowerCase(), r]));

  const legacyMeals = [];
  for (const day of mealPlan.meals || []) {
    for (const [key] of mealTypes) {
      if (day[key] && !Array.isArray(day[key + "Ingredients"])) {
        const name = String(day[key]).trim();
        if (!recipeMap.get(name.toLowerCase())?.ingredients?.length) legacyMeals.push(name);
      }
    }
  }
  const aiIngredients = await getAIIngredientsForMeals([...new Set(legacyMeals)]);
  const availableIngredients = parseIngredients(mealPlan.availableIngredients || "");
  const items = [];

  for (const day of mealPlan.meals || []) {
    for (const [key, label] of mealTypes) {
      const mealName = String(day[key] || "").trim();
      if (!mealName) continue;

      let entries = Array.isArray(day[key + "Ingredients"]) ? day[key + "Ingredients"] : [];
      if (!entries.length) {
        const recipe = recipeMap.get(mealName.toLowerCase());
        if (recipe?.ingredients?.length) entries = recipe.ingredients.map((name) => ({ name, quantity: "" }));
        else if (Array.isArray(aiIngredients[mealName])) entries = aiIngredients[mealName];
      }

      const cleanEntries = [];
      const seen = new Set();
      for (const raw of entries) {
        const name = typeof raw === "string" ? raw : raw?.name;
        const quantity = typeof raw === "string" ? "" : raw?.quantity || "";
        const normalized = normalizeIngredient(name);
        const canonical = canonicalIngredient(normalized);
        if (!normalized || !canonical || seen.has(canonical) || isForbiddenForDiet(normalized, mealPlan.diet)) continue;
        seen.add(canonical);
        cleanEntries.push({ name: normalized, quantity });
      }

      for (const item of removeAvailable(cleanEntries, availableIngredients)) {
        items.push({
          name: item.name,
          quantity: item.quantity || "",
          checked: false,
          day: Number(day.day),
          mealType: label,
          mealName,
        });
      }
    }
  }
  return items;
}

function mergeCheckedState(freshItems, oldItems) {
  const checked = new Map((oldItems || []).map((item) => [
    `${item.day || ""}|${item.mealType || ""}|${canonicalIngredient(item.name)}`,
    Boolean(item.checked),
  ]));
  return freshItems.map((item) => ({
    ...item,
    checked: checked.get(`${item.day}|${item.mealType}|${canonicalIngredient(item.name)}`) || false,
  }));
}

exports.createGroceryList = async (req, res) => {
  try {
    const { mealPlanId } = req.body;
    if (!mealPlanId) return res.status(400).json({ success: false, message: "Meal plan ID is required" });

    const mealPlan = await MealPlan.findOne({ _id: mealPlanId, user: req.user.id });
    if (!mealPlan) return res.status(404).json({ success: false, message: "Meal plan not found" });

    const existing = await GroceryList.findOne({ user: req.user.id, mealPlan: mealPlan._id });
    const items = await buildGroceryItems(mealPlan);
    const groceryList = await GroceryList.findOneAndUpdate(
      { user: req.user.id, mealPlan: mealPlan._id },
      { $set: { items: mergeCheckedState(items, existing?.items || []) } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    await groceryList.populate("mealPlan");
    res.status(201).json({ success: true, message: "Grocery list created successfully", groceryList });
  } catch (err) {
    console.error("Grocery List Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMyGroceryLists = async (req, res) => {
  try {
    const lists = await GroceryList.find({ user: req.user.id }).populate("mealPlan").sort({ createdAt: -1 });
    const refreshed = [];
    for (const list of lists) {
      if (!list.mealPlan) continue;
      const items = await buildGroceryItems(list.mealPlan);
      list.items = mergeCheckedState(items, list.items);
      await list.save();
      refreshed.push(list);
    }
    res.status(200).json({ success: true, groceryLists: refreshed });
  } catch (err) {
    console.error("Get Grocery Lists Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateGroceryItem = async (req, res) => {
  try {
    const { checked } = req.body;
    const groceryList = await GroceryList.findOne({ _id: req.params.listId, user: req.user.id });
    if (!groceryList) return res.status(404).json({ success: false, message: "Grocery list not found" });
    const item = groceryList.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ success: false, message: "Grocery item not found" });
    item.checked = Boolean(checked);
    await groceryList.save();
    res.json({ success: true, groceryList });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

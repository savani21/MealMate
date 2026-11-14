const { normalizeIngredientName } = require("../utils/ingredientMatcher");

// Approximate generic-food values per 100 g. These are a local fallback,
// not brand-specific label values. Unknown ingredients are never silently ignored.
const FOODS = {
  rice: [365, 7.1, 80, 0.7, 185],
  "wheat flour": [340, 13.2, 72, 2.5, 120],
  banana: [89, 1.1, 22.8, 0.3, 118],
  milk: [61, 3.2, 4.8, 3.3, 240],
  egg: [143, 12.6, 0.7, 9.5, 50],
  oil: [884, 0, 0, 100, 14],
  onion: [40, 1.1, 9.3, 0.1, 110],
  tomato: [18, 0.9, 3.9, 0.2, 120],
  potato: [77, 2, 17.5, 0.1, 170],
  chickpeas: [364, 19.3, 60.7, 6, 200],
  "cooked chickpeas": [164, 8.9, 27.4, 2.6, 165],
  "chana dal": [360, 22, 60, 5, 190],
  "moong dal": [347, 24, 63, 1.2, 190],
  "urad dal": [341, 25, 59, 1.6, 190],
  rajma: [333, 23.6, 60, 0.8, 190],
  "kidney beans": [333, 23.6, 60, 0.8, 190],
  besan: [387, 22, 58, 6.7, 92],
  "soy chunks": [345, 52, 33, 0.5, 90],
  tofu: [76, 8, 1.9, 4.8, 100],
  "toor dal": [343, 22, 62, 1.5, 190],
  lentils: [352, 24.6, 63.1, 1.1, 190],
  oats: [389, 16.9, 66.3, 6.9, 80],
  "baking powder": [53, 0, 28, 0, 4],
  "cardamom powder": [311, 11, 68, 7, 2],
  paneer: [265, 18.3, 1.2, 20.8, 100],
  yogurt: [61, 3.5, 4.7, 3.3, 245],
  curd: [61, 3.5, 4.7, 3.3, 245],
  peanuts: [567, 25.8, 16.1, 49.2, 145],
  peas: [81, 5.4, 14.5, 0.4, 145],
  capsicum: [20, 0.9, 4.6, 0.2, 120],
  carrot: [41, 0.9, 9.6, 0.2, 60],
  spinach: [23, 2.9, 3.6, 0.4, 30],
  sugar: [387, 0, 100, 0, 200],
  butter: [717, 0.9, 0.1, 81, 14],
  ghee: [900, 0, 0, 100, 14],
  cheese: [402, 25, 1.3, 33, 28],
  bread: [265, 9, 49, 3.2, 30],
  poha: [350, 7, 77, 1, 30],
  semolina: [360, 12.7, 72.8, 1.1, 167],
  coconut: [354, 3.3, 15.2, 33.5, 45],
  almonds: [579, 21.2, 21.6, 49.9, 1.2],
  cucumber: [15, 0.7, 3.6, 0.1, 300],
  apple: [52, 0.3, 13.8, 0.2, 180],
  mango: [60, 0.8, 15, 0.4, 200],
  orange: [47, 0.9, 11.8, 0.1, 130],
  cauliflower: [25, 1.9, 5, 0.3, 265],
  cabbage: [25, 1.3, 5.8, 0.1, 500],
  broccoli: [34, 2.8, 6.6, 0.4, 90],
  mushroom: [22, 3.1, 3.3, 0.3, 18],
  corn: [86, 3.3, 19, 1.4, 90],
  "sweet potato": [86, 1.6, 20.1, 0.1, 130],
  dates: [282, 2.5, 75, 0.4, 7],
  raisins: [299, 3.1, 79, 0.5, 1],
  lemon: [29, 1.1, 9.3, 0.3, 58],
  "green chili": [40, 2, 9, 0.2, 15],
  coriander: [23, 2.1, 3.7, 0.5, 4],
  "mustard seeds": [508, 26, 28, 36, 3],
  cumin: [375, 18, 44, 22, 2],
  turmeric: [312, 9.7, 67, 3.3, 3],
  "chili powder": [282, 13.5, 50, 14, 2],
  salt: [0, 0, 0, 0, 6],
  water: [0, 0, 0, 0, 240],
  "ginger garlic paste": [80, 3, 18, 0.5, 15],
  garlic: [149, 6.4, 33, 0.5, 3],
  ginger: [80, 1.8, 18, 0.8, 5],
  "curry leaves": [108, 6.1, 18.7, 1, 1],
};

const ALIASES = {
  "flattened rice": "poha", oat: "oats", "baking soda": "baking powder", cardamom: "cardamom powder", "red lentil": "lentils", "masoor dal": "lentils", "mung dal": "moong dal", "green gram": "moong dal", "black gram": "urad dal", "kidney bean": "rajma", "pea": "peas", "lentil": "lentils", "almond": "almonds", "peanut": "peanuts", "apple": "apple", "date": "dates", "raisin": "raisins", "soy chunk": "soy chunks",
  "chickpea": "chickpeas", chana: "chickpeas", "gram flour": "besan", besan: "besan",
  atta: "wheat flour", "whole wheat flour": "wheat flour", "rice flour": "rice",
  "green peas": "peas", "bell pepper": "capsicum", "sweet pepper": "capsicum",
  "plain curd": "curd", "plain yogurt": "yogurt", "vegetable oil": "oil",
  "sunflower oil": "oil", "olive oil": "oil", "cooking oil": "oil",
  "mustard oil": "oil", "chilli powder": "chili powder", "red chili powder": "chili powder",
  "green chilli": "green chili", "green chilies": "green chili",
};

function resolveFood(name) {
  const normalized = normalizeIngredientName(name);
  if (ALIASES[normalized]) return ALIASES[normalized];
  const exact = Object.keys(FOODS).find((key) => normalized === key);
  if (exact) return exact;
  // Prefer the longest known key to avoid matching a generic substring.
  return Object.keys(FOODS).sort((a, b) => b.length - a.length).find((key) => normalized.includes(key) || key.includes(normalized) && normalized.length > 3) || null;
}

function parseAmount(text) {
  const value = String(text || "").trim().toLowerCase();
  const pattern = /(\d+\s*\/\s*\d+|\d+(?:\.\d+)?|½|¼|¾)\s*(kg|kgs|kilograms?|g|gm|grams?|ml|milliliters?|l|liters?|litres?|cups?|tbsp|tablespoons?|tsp|teaspoons?|pieces?|pcs|nos?\.?|medium|large|small)?\b/i;
  const match = value.match(pattern);
  if (!match) return null;
  let quantity = match[1];
  if (quantity.includes("/")) { const [a, b] = quantity.split("/").map(Number); quantity = a / b; }
  else if (quantity === "½") quantity = 0.5;
  else if (quantity === "¼") quantity = 0.25;
  else if (quantity === "¾") quantity = 0.75;
  else quantity = Number(quantity);
  return { quantity, unit: String(match[2] || "piece").toLowerCase(), matchedText: match[0] };
}

function gramsFor(food, amount) {
  const pieceGrams = FOODS[food][4];
  const cupWeights = { rice: 185, "wheat flour": 120, oats: 80, milk: 240, water: 240, "toor dal": 190, "chana dal": 190, "moong dal": 190, "urad dal": 190, lentils: 190, chickpeas: 200, rajma: 190, besan: 92, semolina: 167, poha: 40, sugar: 200, peanuts: 145, peas: 145, "soy chunks": 90 };
  const unit = amount.unit;
  if (/^kg/.test(unit)) return amount.quantity * 1000;
  if (/^(g|gm|gram)/.test(unit)) return amount.quantity;
  if (/^(ml|milliliter)/.test(unit)) return amount.quantity; // approximate water-like density
  if (/^(l|liter|litre)/.test(unit)) return amount.quantity * 1000;
  if (/^cup/.test(unit)) return amount.quantity * (cupWeights[food] || pieceGrams * 1.4);
  if (/^(small|medium|large)$/.test(unit)) return amount.quantity * pieceGrams * (unit === "small" ? 0.75 : unit === "large" ? 1.3 : 1);
  if (/^tbsp|^tablespoon/.test(unit)) return amount.quantity * (food === "oil" || food === "ghee" || food === "butter" ? 14 : food === "sugar" ? 12 : 15);
  if (/^tsp|^teaspoon/.test(unit)) return amount.quantity * (food === "oil" || food === "ghee" ? 4.5 : ["cumin", "turmeric", "chili powder", "salt"].includes(food) ? 2.5 : 5);
  return amount.quantity * pieceGrams;
}

function parseIngredient(line) {
  const original = String(line || "").trim();
  if (!original) return null;
  const amount = parseAmount(original);
  if (!amount) {
    const seasoning = resolveFood(original);
    if (seasoning && ["salt", "cumin", "turmeric", "chili powder", "coriander", "curry leaves"].includes(seasoning)) {
      return { name: seasoning, grams: 1, original, assumedQuantity: true };
    }
    return { name: original, error: "Quantity not recognized" };
  }
  // Accept both "1 cup wheat flour" and "wheat flour 1 cup (have)" formats.
  const remainder = original
    .replace(amount.matchedText, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b(have|available|optional|to taste)\b/gi, " ")
    .replace(/^[\s,.-]+|[\s,.-]+$/g, "");
  const food = resolveFood(remainder);
  if (!food) return { name: remainder || original, error: "Ingredient not in nutrition catalogue" };
  return { name: food, grams: gramsFor(food, amount), original };
}

function estimateRecipeNutrition(ingredients, servings = 1) {
  const lines = Array.isArray(ingredients) ? ingredients : [];
  const breakdown = [];
  const missingIngredients = [];
  const totals = { calories: 0, protein: 0, carbohydrates: 0, fat: 0 };
  for (const line of lines) {
    const parsed = parseIngredient(line);
    if (!parsed || parsed.error) {
      if (parsed) missingIngredients.push({ ingredient: parsed.name, reason: parsed.error });
      continue;
    }
    const [calories, protein, carbohydrates, fat] = FOODS[parsed.name];
    const factor = parsed.grams / 100;
    const values = { calories: calories * factor, protein: protein * factor, carbohydrates: carbohydrates * factor, fat: fat * factor };
    Object.keys(totals).forEach((key) => { totals[key] += values[key]; });
    breakdown.push({ ingredient: parsed.name, sourceText: parsed.original, estimatedGrams: Math.round(parsed.grams), ...Object.fromEntries(Object.entries(values).map(([key, value]) => [key, Math.round(value * 10) / 10])) });
  }
  const servingCount = Math.max(1, Number(servings) || 1);
  const perServing = Object.fromEntries(Object.entries(totals).map(([key, value]) => [key, Math.round((value / servingCount) * 10) / 10]));
  return {
    ...perServing,
    servingSize: "1 serving",
    servings: servingCount,
    source: "local_ingredient_estimate",
    status: missingIngredients.length ? "partial_estimate" : breakdown.length ? "estimated" : "unavailable",
    confidence: missingIngredients.length ? "low" : "moderate",
    missingIngredients,
    ingredientBreakdown: breakdown,
    calculatedAt: new Date(),
  };
}

async function estimateRecipeNutritionWithUSDA(ingredients, servings = 1) {
  const { searchFoodDataCentral } = require("./usdaFoodData");
  const local = estimateRecipeNutrition(ingredients, servings);
  const localBySource = new Map((local.ingredientBreakdown || []).map((item) => [item.sourceText, item]));
  const breakdown = [];
  const missingIngredients = [];
  const totals = { calories: 0, protein: 0, carbohydrates: 0, fat: 0 };
  let usdaCount = 0;
  let localCount = 0;

  const parsedLines = (Array.isArray(ingredients) ? ingredients : []).map((line) => ({ line, parsed: parseIngredient(line) })).filter((item) => item.parsed);
  const enrichedLines = await Promise.all(parsedLines.map(async ({ line, parsed }) => {
    if (parsed.error) return { parsed, line, usda: null };
    return { parsed, line, usda: await searchFoodDataCentral(parsed.name) };
  }));

  for (const { parsed } of enrichedLines) {
    if (parsed.error) {
      missingIngredients.push({ ingredient: parsed.name, reason: parsed.error });
      continue;
    }
    const usda = enrichedLines.find((item) => item.parsed.original === parsed.original)?.usda;
    let values;
    let source;
    if (usda) {
      const factor = parsed.grams / 100;
      values = {
        calories: usda.calories * factor,
        protein: usda.protein * factor,
        carbohydrates: usda.carbohydrates * factor,
        fat: usda.fat * factor,
      };
      source = "USDA FoodData Central";
      usdaCount += 1;
    } else {
      const fallback = localBySource.get(parsed.original);
      if (!fallback) {
        missingIngredients.push({ ingredient: parsed.name, reason: "No matching USDA or local nutrition data" });
        continue;
      }
      values = {
        calories: fallback.calories,
        protein: fallback.protein,
        carbohydrates: fallback.carbohydrates,
        fat: fallback.fat,
      };
      source = "MealMate local food catalogue";
      localCount += 1;
    }

    Object.keys(totals).forEach((key) => { totals[key] += values[key]; });
    breakdown.push({
      ingredient: parsed.name,
      sourceText: parsed.original,
      estimatedGrams: Math.round(parsed.grams),
      source,
      ...Object.fromEntries(Object.entries(values).map(([key, value]) => [key, Math.round(value * 10) / 10])),
    });
  }

  const servingCount = Math.max(1, Number(servings) || 1);
  const perServing = Object.fromEntries(Object.entries(totals).map(([key, value]) => [key, Math.round((value / servingCount) * 10) / 10]));
  const complete = missingIngredients.length === 0 && breakdown.length > 0;
  const source = usdaCount && localCount ? "mixed_estimate" : usdaCount ? "usda_fdc" : "local_ingredient_estimate";
  return {
    ...perServing,
    servingSize: "1 serving",
    servings: servingCount,
    source,
    status: !breakdown.length ? "unavailable" : complete ? "estimated" : "partial_estimate",
    confidence: !breakdown.length ? "unknown" : !complete ? "low" : localCount ? "moderate" : "high",
    missingIngredients,
    ingredientBreakdown: breakdown,
    calculatedAt: new Date(),
  };
}

module.exports = { estimateRecipeNutrition, estimateRecipeNutritionWithUSDA, parseIngredient };

const { estimateRecipeNutrition, estimateRecipeNutritionWithUSDA } = require("../nutritionEstimator");

function normalizeMealIngredientLines(ingredients) {
  return (Array.isArray(ingredients) ? ingredients : []).map((item) => {
    if (typeof item === "string") return item;
    if (!item || typeof item !== "object") return String(item || "");
    return { name: String(item.name || "").trim(), quantity: String(item.quantity || "").trim(), state: String(item.state || "raw").toLowerCase() };
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

module.exports = { normalizeMealIngredientLines, attachMealNutrition };

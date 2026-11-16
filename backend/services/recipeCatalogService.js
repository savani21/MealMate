const RecipeCatalog = require("../models/RecipeCatalog");
const { normalizeIngredientName } = require("../utils/ingredientMatcher");

const DIET_BLOCKED = {
  vegetarian: /\b(chicken|beef|pork|lamb|mutton|fish|salmon|tuna|prawn|shrimp|seafood|egg|eggs|bacon|ham|gelatin)\b/i,
  vegan: /\b(chicken|beef|pork|lamb|mutton|fish|salmon|tuna|prawn|shrimp|seafood|egg|eggs|milk|cream|butter|cheese|yogurt|curd|paneer|ghee|honey|gelatin)\b/i,
  eggetarian: /\b(chicken|beef|pork|lamb|mutton|fish|salmon|tuna|prawn|shrimp|seafood|bacon|ham|gelatin)\b/i,
};

function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function ingredientMatches(recipeIngredient, allowedNames) {
  const target = normalizeIngredientName(recipeIngredient);
  if (!target) return false;
  return allowedNames.some((allowed) =>
    allowed && (target === allowed || target.includes(allowed) || allowed.includes(target))
  );
}

function toOption(recipe, matchedIngredients, missingIngredients) {
  return {
    name: recipe.name,
    description: recipe.description || `A ${recipe.cuisine || "global"} recipe from MealMate's recipe catalogue.`,
    prepTime: "See recipe instructions",
    servings: 2,
    recipeCatalogId: String(recipe._id),
    image: recipe.image || "",
    source: recipe.source?.provider || "catalog",
    // Keep the complete source recipe. Missing items are explicitly identified
    // so the grocery list can account for them rather than silently dropping them.
    ingredients: recipe.ingredients.map((item) => ({
      name: item.name,
      quantity: item.quantity || "quantity not provided",
    })),
    matchedIngredients,
    missingIngredients,
    instructions: recipe.instructions || [],
  };
}

async function generateCatalogMealPlan({
  duration,
  diet,
  allowedPool,
  ingredientMode = "available",
  excludedNames = [],
}) {
  if (!allowedPool?.length) return null;

  const normalizedAllowed = [...new Set(allowedPool.map(normalizeIngredientName).filter(Boolean))];
  const blocked = DIET_BLOCKED[diet];
  const recipes = await RecipeCatalog.find({ isActive: true })
    .select("name description cuisine category mealTypes dietaryTags ingredients instructions image source")
    .lean();

  const eligible = recipes.flatMap((recipe) => {
    if (!recipe.ingredients?.length || !recipe.instructions?.length) return [];
    const allText = `${recipe.name} ${recipe.ingredients.map((item) => item.name).join(" ")}`;
    if (blocked?.test(allText)) return [];
    if (["vegan", "vegetarian"].includes(diet) && recipe.dietaryTags?.includes("non-vegetarian")) return [];

    const matched = recipe.ingredients
      .filter((ingredient) => ingredientMatches(ingredient.normalizedName || ingredient.name, normalizedAllowed))
      .map((ingredient) => ingredient.name);
    const missing = recipe.ingredients
      .filter((ingredient) => !ingredientMatches(ingredient.normalizedName || ingredient.name, normalizedAllowed))
      .map((ingredient) => ingredient.name);
    const coverage = matched.length / recipe.ingredients.length;

    // Pantry-only mode remains strict. In Available + Recommended mode, allow
    // sensible partial matches and expose every missing ingredient to shopping.
    const pantryOnly = ingredientMode !== "recommended";
    if (pantryOnly && missing.length) return [];
    if (!pantryOnly && (matched.length < 2 || coverage < 0.35)) return [];

    return [{
      ...recipe,
      matchedIngredients: matched,
      missingIngredients: missing,
      coverage,
    }];
  });

  if (!eligible.length) return null;

  const used = new Set(excludedNames.map((name) => String(name).trim().toLowerCase()));
  const days = [];
  for (let day = 1; day <= Number(duration); day += 1) {
    const result = { day };
    for (const type of ["breakfast", "lunch", "dinner"]) {
      const candidates = eligible.filter((recipe) =>
        recipe.mealTypes?.includes(type) && !used.has(recipe.name.trim().toLowerCase())
      );
      const options = shuffle(candidates)
        .slice(0, 3)
        .map((recipe) => toOption(recipe, recipe.matchedIngredients, recipe.missingIngredients));

      if (!options.length) continue;
      result[type] = options[0].name;
      result[type + "Ingredients"] = options[0].ingredients;
      result[type + "Options"] = options;
      options.forEach((option) => used.add(option.name.trim().toLowerCase()));
    }
    days.push(result);
  }

  return days.every((day) =>
    ["breakfast", "lunch", "dinner"].every((type) => day[type + "Options"]?.length)
  ) ? { days } : null;
}

module.exports = { generateCatalogMealPlan };

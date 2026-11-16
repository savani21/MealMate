const RecipeCatalog = require("../models/RecipeCatalog");
const { normalizeIngredientName } = require("../utils/ingredientMatcher");

const DIET_BLOCKED = {
  vegetarian: /\\b(chicken|beef|pork|lamb|mutton|fish|salmon|tuna|prawn|shrimp|seafood|egg|eggs|bacon|ham|gelatin)\\b/i,
  vegan: /\\b(chicken|beef|pork|lamb|mutton|fish|salmon|tuna|prawn|shrimp|seafood|egg|eggs|milk|cream|butter|cheese|yogurt|curd|paneer|ghee|honey|gelatin)\\b/i,
  eggetarian: /\\b(chicken|beef|pork|lamb|mutton|fish|salmon|tuna|prawn|shrimp|seafood|bacon|ham|gelatin)\\b/i,
};

function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function matchesPoolIngredient(recipeName, allowed) {
  const target = normalizeIngredientName(recipeName);
  return allowed.some((item) => {
    const candidate = normalizeIngredientName(item);
    return candidate === target || candidate.includes(target) || target.includes(candidate);
  });
}

function classifyMealTypes(category, name) {
  const value = `${category || ""} ${name || ""}`.toLowerCase();
  if (/breakfast|starter|side|dessert|snack/.test(value)) return ["breakfast", "snack"];
  if (/soup|salad|pasta|seafood|beef|chicken|lamb|pork|vegetarian|vegan|miscellaneous/.test(value)) return ["lunch", "dinner"];
  return ["lunch", "dinner"];
}

function toOption(recipe) {
  return {
    name: recipe.name,
    description: recipe.description || `A ${recipe.cuisine || "global"} recipe from MealMate's recipe catalogue.`,
    prepTime: "See recipe instructions",
    servings: 2,
    recipeCatalogId: String(recipe._id),
    image: recipe.image || "",
    source: recipe.source?.provider || "catalog",
    ingredients: recipe.ingredients.map((item) => ({
      name: item.name,
      quantity: item.quantity || "quantity not provided",
    })),
    instructions: recipe.instructions || [],
  };
}

async function generateCatalogMealPlan({ duration, diet, allowedPool, excludedNames = [] }) {
  if (!allowedPool?.length) return null;
  const normalizedAllowed = allowedPool.map(normalizeIngredientName).filter(Boolean);
  const blocked = DIET_BLOCKED[diet];
  const recipes = await RecipeCatalog.find({ isActive: true })
    .select("name description cuisine category mealTypes dietaryTags ingredients instructions image source")
    .lean();

  const eligible = recipes.filter((recipe) => {
    if (!recipe.ingredients?.length || !recipe.instructions?.length) return false;
    const allText = `${recipe.name} ${recipe.ingredients.map((i) => i.name).join(" ")}`;
    if (blocked?.test(allText)) return false;
    if (diet === "vegan" && recipe.dietaryTags?.includes("non-vegetarian")) return false;
    if (diet === "vegetarian" && recipe.dietaryTags?.includes("non-vegetarian")) return false;
    // In pantry-only mode, do not recommend recipes that require ingredients
    // the user has not selected. Alias normalization is intentionally conservative.
    return recipe.ingredients.every((ingredient) =>
      normalizedAllowed.some((allowed) => {
        const item = normalizeIngredientName(ingredient.normalizedName || ingredient.name);
        return item === allowed || item.includes(allowed) || allowed.includes(item);
      })
    );
  });

  if (!eligible.length) return null;
  const used = new Set(excludedNames.map((name) => String(name).toLowerCase()));
  const days = [];
  for (let day = 1; day <= Number(duration); day += 1) {
    const result = { day };
    for (const type of ["breakfast", "lunch", "dinner"]) {
      const candidates = eligible.filter((recipe) =>
        recipe.mealTypes?.includes(type) && !used.has(recipe.name.toLowerCase())
      );
      const pool = candidates.length ? candidates : eligible.filter((recipe) =>
        recipe.mealTypes?.includes(type) && !used.has(recipe.name.toLowerCase())
      );
      const options = shuffle(pool).slice(0, 3).map(toOption);
      if (!options.length) continue;
      result[type] = options[0].name;
      result[type + "Ingredients"] = options[0].ingredients;
      result[type + "Options"] = options;
      options.forEach((option) => used.add(option.name.toLowerCase()));
    }
    days.push(result);
  }
  return days.every((day) => ["breakfast", "lunch", "dinner"].every((type) => day[type + "Options"]?.length))
    ? { days }
    : null;
}

module.exports = { generateCatalogMealPlan };

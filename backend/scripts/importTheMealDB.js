require("dotenv").config();
const mongoose = require("mongoose");
const RecipeCatalog = require("../models/RecipeCatalog");

const API_KEY = process.env.THEMEALDB_API_KEY || "1";
const TARGET = Math.max(1, Math.min(500, Number(process.env.RECIPE_IMPORT_LIMIT) || 500));
const BASE = `https://www.themealdb.com/api/json/v1/${API_KEY}`;

function splitInstructions(value) {
  return String(value || "").split(/\\r?\\n+/).map((line) => line.trim()).filter(Boolean);
}

function normalizeMeal(meal) {
  const ingredients = [];
  for (let i = 1; i <= 20; i += 1) {
    const name = String(meal[`strIngredient${i}`] || "").trim();
    if (!name) continue;
    ingredients.push({
      name,
      normalizedName: name.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\\s+/g, " ").trim(),
      quantity: String(meal[`strMeasure${i}`] || "").trim(),
    });
  }
  const category = meal.strCategory || "Other";
  const area = meal.strArea || "International";
  const name = String(meal.strMeal || "").trim();
  const tags = String(meal.strTags || "").split(",").map((tag) => tag.trim().toLowerCase()).filter(Boolean);
  const allIngredients = ingredients.map((item) => item.name.toLowerCase()).join(" ");
  const dietaryTags = /chicken|beef|pork|lamb|mutton|fish|prawn|shrimp|bacon|ham|gelatin/.test(allIngredients)
    ? ["non-vegetarian"]
    : /egg|milk|cream|butter|cheese|yogurt|curd|paneer|ghee|honey/.test(allIngredients)
      ? ["vegetarian"]
      : ["vegetarian", "vegan"];
  const mealTypes = /dessert/.test(category.toLowerCase()) ? ["snack"] :
    /starter|side/.test(category.toLowerCase()) ? ["breakfast", "snack"] :
    /breakfast/.test(category.toLowerCase()) ? ["breakfast", "snack"] : ["breakfast", "lunch", "dinner"];
  return {
    name,
    description: `${name} — ${area} cuisine`,
    cuisine: area,
    category,
    mealTypes,
    dietaryTags,
    ingredients,
    instructions: splitInstructions(meal.strInstructions),
    image: meal.strMealThumb || "",
    source: {
      provider: "TheMealDB",
      sourceId: String(meal.idMeal),
      sourceUrl: `https://www.themealdb.com/meal/${meal.idMeal}`,
      attribution: "Recipe data provided by TheMealDB",
      license: "TheMealDB API terms; retain source attribution",
    },
    isActive: true,
  };
}

async function main() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required in backend/.env");
  await mongoose.connect(process.env.MONGO_URI);
  const found = new Map();
  for (const letter of "abcdefghijklmnopqrstuvwxyz") {
    if (found.size >= TARGET) break;
    const response = await fetch(`${BASE}/search.php?f=${letter}`, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`TheMealDB returned HTTP ${response.status} for letter ${letter}`);
    const payload = await response.json();
    for (const meal of payload.meals || []) {
      if (meal?.idMeal && meal?.strMeal && meal?.strInstructions) {
        found.set(String(meal.idMeal), meal);
      }
      if (found.size >= TARGET) break;
    }
    console.log(`Fetched letter ${letter}: ${found.size}/${TARGET} unique recipes`);
  }

  const records = [...found.values()].slice(0, TARGET).map(normalizeMeal)
    .filter((recipe) => recipe.ingredients.length && recipe.instructions.length);
  let imported = 0;
  for (const recipe of records) {
    await RecipeCatalog.updateOne(
      { "source.provider": recipe.source.provider, "source.sourceId": recipe.source.sourceId },
      { $set: recipe },
      { upsert: true }
    );
    imported += 1;
  }
  console.log(`Recipe import complete. Upserted ${imported} recipes (requested target: ${TARGET}).`);
  if (imported < TARGET) console.warn("The provider returned fewer than 500 usable recipes; no recipes were fabricated.");
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error("Recipe import failed:", error.message);
  try { await mongoose.disconnect(); } catch {}
  process.exitCode = 1;
});

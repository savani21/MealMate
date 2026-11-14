const cache = new Map();
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

function getNutrient(food, nutrientNumber, names) {
  const entries = food.foodNutrients || [];
  const entry = entries.find((item) =>
    String(item.nutrientNumber || item.nutrient?.number || "") === String(nutrientNumber) ||
    names.includes(String(item.nutrientName || item.nutrient?.name || "").toLowerCase())
  );
  if (!entry) return null;
  const value = Number(entry.value ?? entry.amount);
  if (!Number.isFinite(value)) return null;
  const unit = String(entry.unitName || entry.nutrient?.unitName || "").toLowerCase();
  if (nutrientNumber === 1008 && unit === "kj") return value / 4.184;
  return value;
}

function scoreFood(food, query) {
  const description = String(food.description || "").toLowerCase();
  const words = String(query).toLowerCase().split(/\s+/).filter((word) => word.length > 2);
  if (!words.length) return 0;
  const matches = words.filter((word) => description.includes(word)).length;
  const exactBonus = description === query.toLowerCase() ? 1 : 0;
  const dataTypeBonus = food.dataType === "Foundation" || food.dataType === "SR Legacy" ? 0.2 : 0;
  return matches / words.length + exactBonus + dataTypeBonus;
}

async function searchFoodDataCentral(foodName) {
  const apiKey = String(process.env.USDA_FDC_API_KEY || "").trim();
  if (!apiKey || apiKey === "your_usda_fdc_api_key_here") return null;
  const query = String(foodName || "").trim().toLowerCase();
  if (!query) return null;
  const cached = cache.get(query);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  try {
    const response = await fetch(
      "https://api.nal.usda.gov/fdc/v1/foods/search?api_key=" + encodeURIComponent(apiKey),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, dataType: ["Foundation", "SR Legacy", "Survey (FNDDS)"], pageSize: 10 }),
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!response.ok) {
      if (response.status === 429) console.warn("USDA FoodData Central rate limit reached.");
      else console.warn("USDA FoodData Central request failed:", response.status);
      return null;
    }
    const data = await response.json();
    const ranked = (data.foods || [])
      .map((food) => ({ food, score: scoreFood(food, query) }))
      .filter((item) => item.score >= 0.75)
      .sort((a, b) => b.score - a.score);
    const selected = ranked[0]?.food;
    if (!selected) return null;

    const nutrients = {
      calories: getNutrient(selected, 1008, ["energy"]),
      protein: getNutrient(selected, 1003, ["protein"]),
      carbohydrates: getNutrient(selected, 1005, ["carbohydrate, by difference", "carbohydrate"]),
      fat: getNutrient(selected, 1004, ["total lipid (fat)", "total lipid"]),
    };
    if (Object.values(nutrients).some((value) => value === null)) return null;
    const result = {
      ...nutrients,
      source: "USDA FoodData Central",
      fdcId: selected.fdcId,
      description: selected.description,
      dataType: selected.dataType,
    };
    cache.set(query, { value: result, expiresAt: Date.now() + CACHE_TTL_MS });
    return result;
  } catch (error) {
    console.warn("USDA FoodData Central lookup unavailable; using local estimate:", error.message);
    return null;
  }
}

module.exports = { searchFoodDataCentral };

const cache = new Map();

function nutrientValue(food, names) {
  const nutrients = food.foodNutrients || [];
  const item = nutrients.find((entry) => names.includes(String(entry.nutrientName || entry.nutrient?.name || "").toLowerCase()));
  if (!item) return null;
  const value = Number(item.value ?? item.amount);
  if (!Number.isFinite(value)) return null;
  const unit = String(item.unitName || item.nutrient?.unitName || "").toLowerCase();
  if (names[0] === "energy" && unit === "kj") return value / 4.184;
  return value;
}

async function searchFoodDataCentral(foodName) {
  const apiKey = String(process.env.USDA_FDC_API_KEY || "").trim();
  if (!apiKey) return null;
  const key = String(foodName || "").trim().toLowerCase();
  if (!key) return null;
  if (cache.has(key)) return cache.get(key);

  const request = (async () => {
    try {
      const response = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${encodeURIComponent(apiKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: key, dataType: ["Foundation", "SR Legacy"], pageSize: 8 }),
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) return null;
      const data = await response.json();
      const foods = (data.foods || []).filter((food) => ["Foundation", "SR Legacy"].includes(food.dataType));
      const tokens = key.split(/\s+/).filter((token) => token.length > 2);
      const ranked = foods.map((food) => {
        const description = String(food.description || "").toLowerCase();
        const matches = tokens.filter((token) => description.includes(token)).length;
        const typeBonus = food.dataType === "Foundation" ? 0.25 : 0;
        return { food, score: tokens.length ? matches / tokens.length + typeBonus : typeBonus };
      }).filter((entry) => entry.score >= (tokens.length > 1 ? 0.75 : 1))
        .sort((a, b) => b.score - a.score);
      const selected = ranked[0]?.food;
      if (!selected) return null;
      const calories = nutrientValue(selected, ["energy"]);
      const protein = nutrientValue(selected, ["protein"]);
      const carbohydrates = nutrientValue(selected, ["carbohydrate, by difference", "carbohydrate"]);
      const fat = nutrientValue(selected, ["total lipid (fat)", "total lipid"]);
      if ([calories, protein, carbohydrates, fat].some((value) => value === null)) return null;
      return {
        calories, protein, carbohydrates, fat,
        source: "usda_fdc",
        sourceName: "USDA FoodData Central",
        fdcId: selected.fdcId,
        description: selected.description,
        dataType: selected.dataType,
      };
    } catch (error) {
      // Keep the local catalogue available if USDA is temporarily unreachable.
      return null;
    }
  })();
  cache.set(key, request);
  return request;
}

module.exports = { searchFoodDataCentral };

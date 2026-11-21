const { normalizeIngredientName, isCommonHouseholdIngredient } = require("./ingredientMatcher");
const { isPantryItemExpired } = require("./pantryExpiry");

const UNIT_MAP = {
  kg: { unit: "g", factor: 1000, dimension: "mass" },
  kgs: { unit: "g", factor: 1000, dimension: "mass" },
  kilogram: { unit: "g", factor: 1000, dimension: "mass" },
  kilograms: { unit: "g", factor: 1000, dimension: "mass" },
  g: { unit: "g", factor: 1, dimension: "mass" },
  gm: { unit: "g", factor: 1, dimension: "mass" },
  gms: { unit: "g", factor: 1, dimension: "mass" },
  gram: { unit: "g", factor: 1, dimension: "mass" },
  grams: { unit: "g", factor: 1, dimension: "mass" },
  l: { unit: "ml", factor: 1000, dimension: "volume" },
  litre: { unit: "ml", factor: 1000, dimension: "volume" },
  litres: { unit: "ml", factor: 1000, dimension: "volume" },
  liter: { unit: "ml", factor: 1000, dimension: "volume" },
  liters: { unit: "ml", factor: 1000, dimension: "volume" },
  ml: { unit: "ml", factor: 1, dimension: "volume" },
  milliliter: { unit: "ml", factor: 1, dimension: "volume" },
  milliliters: { unit: "ml", factor: 1, dimension: "volume" },
  millilitre: { unit: "ml", factor: 1, dimension: "volume" },
  millilitres: { unit: "ml", factor: 1, dimension: "volume" },
  cup: { unit: "ml", factor: 250, dimension: "volume" },
  cups: { unit: "ml", factor: 250, dimension: "volume" },
  tbsp: { unit: "ml", factor: 15, dimension: "volume" },
  tbsps: { unit: "ml", factor: 15, dimension: "volume" },
  tablespoon: { unit: "ml", factor: 15, dimension: "volume" },
  tablespoons: { unit: "ml", factor: 15, dimension: "volume" },
  tsp: { unit: "ml", factor: 5, dimension: "volume" },
  tsps: { unit: "ml", factor: 5, dimension: "volume" },
  teaspoon: { unit: "ml", factor: 5, dimension: "volume" },
  teaspoons: { unit: "ml", factor: 5, dimension: "volume" },
  piece: { unit: "piece", factor: 1, dimension: "count" },
  pieces: { unit: "piece", factor: 1, dimension: "count" },
  pc: { unit: "piece", factor: 1, dimension: "count" },
  pcs: { unit: "piece", factor: 1, dimension: "count" },
};

function parseQuantity(value) {
  const text = String(value || "").trim().toLowerCase();
  const match = text.match(/^(\d+(?:\.\d+)?|\d+\/\d+)\s*([a-z]+)?$/i);
  if (!match) return null;

  const amount = match[1].includes("/")
    ? Number(match[1].split("/")[0]) / Number(match[1].split("/")[1])
    : Number(match[1]);
  if (!Number.isFinite(amount) || amount < 0) return null;

  const rawUnit = match[2] || "";
  if (!rawUnit) return { amount, unit: "", dimension: "unknown", baseAmount: amount };
  const mapped = UNIT_MAP[rawUnit];
  if (!mapped) return null;
  return { amount, unit: mapped.unit, dimension: mapped.dimension, baseAmount: amount * mapped.factor };
}

function pantryAmount(item) {
  const mapped = UNIT_MAP[String(item.unit || "").toLowerCase().trim()];
  const quantity = Number(item.quantity);
  if (!mapped || !Number.isFinite(quantity) || quantity <= 0) return null;
  return { dimension: mapped.dimension, unit: mapped.unit, baseAmount: quantity * mapped.factor };
}

function formatAmount(value) {
  return Number(value.toFixed(2)).toString();
}

function calculateSmartGroceryItems({ requiredItems = [], pantryItems = [], availableIngredients = [] }) {
  const allPantryNames = new Set(
    pantryItems.map((item) => normalizeIngredientName(item.name)).filter(Boolean)
  );
  const usablePantry = pantryItems.filter((item) =>
    Number(item.quantity) > 0 && !isPantryItemExpired(item)
  );
  const pantryByName = new Map();
  for (const item of usablePantry) {
    const name = normalizeIngredientName(item.name);
    if (!name) continue;
    if (!pantryByName.has(name)) pantryByName.set(name, []);
    pantryByName.get(name).push(item);
  }

  // These names are explicit user-confirmed available ingredients from the
  // meal planner. Pantry quantities, however, are always checked separately.
  const explicitlyAvailable = new Set(
    availableIngredients.map(normalizeIngredientName).filter(Boolean)
  );

  const groupedRequirements = new Map();
  for (const item of requiredItems) {
    const name = normalizeIngredientName(item.name);
    if (!name || isCommonHouseholdIngredient(name)) continue;

    const parsed = parseQuantity(item.quantity);
    const key = parsed && parsed.dimension !== "unknown"
      ? `${name}|${parsed.dimension}`
      : `${name}|unmeasured`;

    if (!groupedRequirements.has(key)) {
      groupedRequirements.set(key, {
        name,
        dimension: parsed?.dimension || "unknown",
        unit: parsed?.unit || "",
        requiredAmount: parsed ? parsed.baseAmount : null,
        originalQuantity: String(item.quantity || "").trim(),
        meals: [],
      });
    } else {
      const group = groupedRequirements.get(key);
      if (parsed && group.requiredAmount !== null) group.requiredAmount += parsed.baseAmount;
    }
    groupedRequirements.get(key).meals.push(item);
  }

  const output = [];
  for (const group of groupedRequirements.values()) {
    const batches = pantryByName.get(group.name) || [];
    if (explicitlyAvailable.has(group.name) && !allPantryNames.has(group.name)) continue;
    if (group.requiredAmount === null) {
      // An unmeasured recipe ingredient is considered available only when a
      // positive Pantry batch exists; otherwise retain it in the shopping list.
      if (batches.length) continue;
    } else {
      const availableAmount = batches.reduce((sum, batch) => {
        const amount = pantryAmount(batch);
        return amount?.dimension === group.dimension ? sum + amount.baseAmount : sum;
      }, 0);
      const shortage = Math.max(0, group.requiredAmount - availableAmount);
      if (shortage <= 1e-6) continue;
      group.requiredAmount = shortage;
    }

    const uniqueMeals = [...new Set(group.meals.map((meal) => meal.mealName).filter(Boolean))];
    const first = group.meals[0] || {};
    const quantity = group.requiredAmount === null
      ? group.originalQuantity
      : `${formatAmount(group.requiredAmount)} ${group.unit}`.trim();

    output.push({
      name: group.name,
      quantity,
      checked: false,
      day: uniqueMeals.length === 1 ? (first.day || null) : null,
      mealType: uniqueMeals.length === 1 ? (first.mealType || "Meal") : "Combined",
      mealName: uniqueMeals.length === 1 ? uniqueMeals[0] : `Used in ${uniqueMeals.length} meals`,
    });
  }

  return output.sort((a, b) => a.name.localeCompare(b.name));
}

module.exports = { calculateSmartGroceryItems, parseQuantity };

const { normalizeIngredientName } = require("./ingredientMatcher");

const UNIT_MAP = {
  kg: { unit: "g", factor: 1000, dimension: "weight" },
  kgs: { unit: "g", factor: 1000, dimension: "weight" },
  kilogram: { unit: "g", factor: 1000, dimension: "weight" },
  kilograms: { unit: "g", factor: 1000, dimension: "weight" },
  g: { unit: "g", factor: 1, dimension: "weight" },
  gm: { unit: "g", factor: 1, dimension: "weight" },
  gms: { unit: "g", factor: 1, dimension: "weight" },
  gram: { unit: "g", factor: 1, dimension: "weight" },
  grams: { unit: "g", factor: 1, dimension: "weight" },
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
  const mapped = UNIT_MAP[rawUnit];
  if (!mapped) return rawUnit ? null : { amount, unit: "", dimension: "unknown", baseAmount: amount };
  return { amount, unit: mapped.unit, dimension: mapped.dimension, baseAmount: amount * mapped.factor };
}

function formatAmount(value) {
  return Number(value.toFixed(2)).toString();
}

function pantryAmount(item) {
  const mapped = UNIT_MAP[String(item.unit || "").toLowerCase().trim()];
  if (!mapped || !Number.isFinite(Number(item.quantity))) return null;
  return {
    dimension: mapped.dimension,
    unit: mapped.unit,
    baseAmount: Number(item.quantity) * mapped.factor,
  };
}

function calculateSmartGroceryItems({ requiredItems = [], pantryItems = [], availableIngredients = [] }) {
  const available = new Set(availableIngredients.map(normalizeIngredientName).filter(Boolean));
  const pantryByName = new Map();

  for (const item of pantryItems) {
    const name = normalizeIngredientName(item.name);
    if (!name) continue;
    const amount = pantryAmount(item);
    if (!pantryByName.has(name)) pantryByName.set(name, []);
    if (amount) pantryByName.get(name).push(amount);
  }

  const groups = new Map();
  for (const item of requiredItems) {
    const name = normalizeIngredientName(item.name);
    if (!name || available.has(name)) continue;
    const parsed = parseQuantity(item.quantity);
    const groupKey = parsed
      ? `${name}| ${parsed.dimension}|${parsed.unit}`
      : `${name}|unknown|${String(item.quantity || "").trim()}`;
    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        name: String(item.name).trim(),
        canonicalName: name,
        quantity: parsed ? parsed.baseAmount : null,
        unit: parsed?.unit || "",
        dimension: parsed?.dimension || "unknown",
        originalQuantity: parsed ? "" : String(item.quantity || "").trim(),
        meals: [],
      });
    } else if (parsed && groups.get(groupKey).quantity !== null) {
      groups.get(groupKey).quantity += parsed.baseAmount;
    }
    const group = groups.get(groupKey);
    group.meals.push(item);
  }

  const output = [];
  const remainingPantry = new Map();
  for (const [name, amounts] of pantryByName) {
    remainingPantry.set(name, amounts.map((amount) => ({ ...amount })));
  }

  for (const group of groups.values()) {
    if (group.quantity !== null && group.dimension !== "unknown") {
      const stocks = remainingPantry.get(group.canonicalName) || [];
      let needed = group.quantity;
      for (const stock of stocks) {
        if (stock.dimension !== group.dimension || needed <= 0) continue;
        const used = Math.min(stock.baseAmount, needed);
        stock.baseAmount -= used;
        needed -= used;
      }
      if (needed <= 0.000001) continue;
      group.quantity = needed;
    }

    const uniqueMeals = [...new Set(group.meals.map((meal) => meal.mealName).filter(Boolean))];
    const first = group.meals[0] || {};
    let quantity = group.originalQuantity;
    if (group.quantity !== null) {
      quantity = `${formatAmount(group.quantity)} ${group.unit}`.trim();
    }

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

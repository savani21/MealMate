const PantryItem = require("../../models/user/PantryItem");
const { processDueOrders } = require("./orderController");

exports.listPantry = async (req, res) => {
  try {
    await processDueOrders();
    const items = await PantryItem.find({ user: req.user.id }).sort({ name: 1 }).lean();
    res.json({ items });
  } catch (error) {
    res.status(500).json({ message: "Failed to load pantry", error: error.message });
  }
};

exports.addPantryItem = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim().toLowerCase();
    const quantity = Number(req.body.quantity);
    const unit = String(req.body.unit || "").trim().toLowerCase();
    if (!name || !unit || !Number.isFinite(quantity) || quantity <= 0) {
      return res.status(400).json({ message: "Ingredient name, positive quantity and unit are required." });
    }
    const existing = await PantryItem.findOne({ user: req.user.id, name });
    if (existing) {
      if (existing.unit !== unit) return res.status(409).json({ message: "This ingredient already exists with a different unit. Edit the existing item instead." });
      existing.quantity += quantity;
      await existing.save();
      return res.status(200).json({ message: "Pantry quantity updated", item: existing });
    }
    const item = await PantryItem.create({ user: req.user.id, name, quantity, unit });
    res.status(201).json({ message: "Ingredient added to pantry", item });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "Ingredient already exists in your pantry." });
    res.status(500).json({ message: "Failed to add ingredient", error: error.message });
  }
};

exports.updatePantryItem = async (req, res) => {
  try {
    const updates = {};
    if (req.body.name !== undefined) updates.name = String(req.body.name).trim().toLowerCase();
    if (req.body.unit !== undefined) updates.unit = String(req.body.unit).trim().toLowerCase();
    if (req.body.quantity !== undefined) {
      const quantity = Number(req.body.quantity);
      if (!Number.isFinite(quantity) || quantity < 0) return res.status(400).json({ message: "Quantity must be zero or greater." });
      updates.quantity = quantity;
    }
    const item = await PantryItem.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id }, { $set: updates },
      { returnDocument: "after", runValidators: true }
    );
    if (!item) return res.status(404).json({ message: "Pantry ingredient not found." });
    res.json({ message: "Pantry ingredient updated", item });
  } catch (error) {
    res.status(500).json({ message: "Failed to update ingredient", error: error.message });
  }
};

exports.deletePantryItem = async (req, res) => {
  try {
    const item = await PantryItem.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!item) return res.status(404).json({ message: "Pantry ingredient not found." });
    res.json({ message: "Ingredient removed from pantry" });
  } catch (error) {
    res.status(500).json({ message: "Failed to remove ingredient", error: error.message });
  }
};

const Recipe = require("../../models/user/Recipe");

function parseRequiredIngredient(raw) {
  const value = String(raw || "").trim();
  const match = value.match(/^([0-9]+(?:\.[0-9]+)?|[0-9]+\/[0-9]+)\s*(kg|kgs|kilograms?|g|gm|gms|grams?|ml|millilit(?:er|re)s?|l|lit(?:er|re)s?|cups?|tbsp|tablespoons?|tsp|teaspoons?|pieces?|piece)?\s+(?:of\s+)?(.+)$/i);
  if (!match) return { name: value.toLowerCase(), quantity: null, unit: null };
  const quantity = match[1].includes("/") ? match[1].split("/").reduce((a, b) => Number(a) / Number(b)) : Number(match[1]);
  return { name: match[3].toLowerCase().trim(), quantity, unit: (match[2] || "piece").toLowerCase() };
}

function normalizeAmount(quantity, unit) {
  const normalizedUnit = String(unit || "")
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/\./g, "")
    .trim()
    .replace(/\s+/g, " ");

  if (/^(kg|kgs|kilogram|kilograms)$/.test(normalizedUnit)) return { quantity: quantity * 1000, unit: "g" };
  if (/^(g|gm|gms|gram|grams)$/.test(normalizedUnit)) return { quantity, unit: "g" };
  if (/^(l|liter|liters|litre|litres)$/.test(normalizedUnit)) return { quantity: quantity * 1000, unit: "ml" };
  if (/^(ml|milliliter|milliliters|millilitre|millilitres)$/.test(normalizedUnit)) return { quantity, unit: "ml" };
  if (/^(cup|cups)$/.test(normalizedUnit)) return { quantity, unit: "cup" };
  if (/^(piece|pieces)$/.test(normalizedUnit)) return { quantity, unit: "piece" };
  if (/^(tbsp|tablespoon|tablespoons)$/.test(normalizedUnit)) return { quantity, unit: "tbsp" };
  if (/^(tsp|teaspoon|teaspoons)$/.test(normalizedUnit)) return { quantity, unit: "tsp" };
  return { quantity, unit: normalizedUnit };
}

function normalizeIngredientName(value) {
  const cleaned = String(value || "").toLowerCase()
    .replace(/\\([^)]*\\)/g, " ")
    .replace(/\\b(large|medium|small|finely|roughly|thinly|thickly|chopped|diced|minced|sliced|grated|crushed|fresh|freshly|cooked|boiled|raw|roasted|optional)\\b/g, " ")
    .replace(/[^a-z0-9 ]/g, " ").replace(/\\s+/g, " ").trim();
  const words = cleaned.split(" ").filter(Boolean);
  if (words.length && /s$/.test(words[words.length - 1]) && !/ss$/.test(words[words.length - 1])) words[words.length - 1] = words[words.length - 1].slice(0, -1);
  const name = words.join(" ");
  const aliases = { "basmati rice":"rice", "long grain rice":"rice", atta:"wheat flour", "whole wheat flour":"wheat flour", "wheat atta":"wheat flour", "tuver dal":"toor dal", "tuvar dal":"toor dal", "tur dal":"toor dal", "arhar dal":"toor dal", "green chilli":"green chili", "sunflower oil":"oil", "vegetable oil":"oil" };
  return aliases[name] || name;
}

const COMMON_HOUSEHOLD_INGREDIENTS = new Set(["water"]);

function isCommonHouseholdIngredient(name) {
  return COMMON_HOUSEHOLD_INGREDIENTS.has(String(name || "").toLowerCase().trim());
}


exports.consumeRecipeIngredients = async (req, res) => {
  const changed = [];
  try {
    const [recipe, pantry] = await Promise.all([
      Recipe.findById(req.params.recipeId).lean(),
      PantryItem.find({ user: req.user.id }),
    ]);
    if (!recipe) return res.status(404).json({ message: "Recipe not found." });

    const canonical = normalizeIngredientName;
    const toStoredUnit = (amount, normalizedUnit, targetUnit) => {
      const target = String(targetUnit || "").toLowerCase().replace(/\([^)]*\)/g, "").replace(/\./g, "").trim();
      if (normalizedUnit === "g" && /^(kg|kgs|kilogram|kilograms)$/.test(target)) return amount / 1000;
      if (normalizedUnit === "ml" && /^(l|litre|litres|liter|liters)$/.test(target)) return amount / 1000;
      return amount;
    };
    const skipped = [];
    const requirements = [];
    for (const raw of recipe.ingredients || []) {
      const required = parseRequiredIngredient(raw);
      if (isCommonHouseholdIngredient(required.name)) continue;
      if (required.quantity === null) {
        skipped.push(raw);
        continue;
      }
      const item = pantry.find((entry) => canonical(entry.name) === canonical(required.name) ||
        canonical(required.name).includes(canonical(entry.name)) ||
        canonical(entry.name).includes(canonical(required.name)));
      if (!item) return res.status(409).json({ message: "Some recipe ingredients are not in your pantry.", unavailable: [raw], skipped });
      const need = normalizeAmount(required.quantity, required.unit);
      const have = normalizeAmount(item.quantity, item.unit);
      if (need.unit !== have.unit) return res.status(409).json({ message: `Cannot convert ${raw} to your pantry unit (${item.unit}).`, unavailable: [raw], skipped });
      if (have.quantity + 0.000001 < need.quantity) {
        return res.status(409).json({ message: "You do not have enough ingredients to cook this recipe.", unavailable: [raw], skipped });
      }
      const remainingBase = Math.max(0, have.quantity - need.quantity);
      requirements.push({
        item,
        deductQuantity: toStoredUnit(need.quantity, need.unit, item.unit),
        ingredient: raw,
      });
    }

    const grouped = new Map();
    for (const requirement of requirements) {
      const key = String(requirement.item._id);
      const current = grouped.get(key) || { item: requirement.item, deductQuantity: 0, ingredients: [] };
      current.deductQuantity += requirement.deductQuantity;
      current.ingredients.push(requirement.ingredient);
      grouped.set(key, current);
    }
    const deductions = [...grouped.values()];
    for (const deduction of deductions) {
      if (deduction.item.quantity + 0.000001 < deduction.deductQuantity) {
        return res.status(409).json({
          message: "You do not have enough total stock for all quantities required by this recipe.",
          unavailable: deduction.ingredients,
          skipped,
        });
      }
    }

    for (const deduction of deductions) {
      const updated = await PantryItem.findOneAndUpdate(
        { _id: deduction.item._id, user: req.user.id, quantity: { $gte: deduction.deductQuantity } },
        { $inc: { quantity: -deduction.deductQuantity } },
        { returnDocument: "after" }
      );
      if (!updated) {
        for (const previous of changed) {
          await PantryItem.updateOne({ _id: previous.item._id, user: req.user.id }, { $inc: { quantity: previous.deductQuantity } });
        }
        return res.status(409).json({ message: "Pantry stock changed while cooking. Please refresh and try again." });
      }
      changed.push(deduction);
    }

    const items = await PantryItem.find({ user: req.user.id }).sort({ name: 1 }).lean();
    return res.json({
      message: requirements.length ? "Recipe marked as cooked and pantry quantities updated." : "No measurable ingredient quantities were found, so pantry stock was not changed.",
      deducted: deductions.flatMap((item) => item.ingredients),
      skipped,
      items,
    });
  } catch (error) {
    for (const previous of changed) {
      await PantryItem.updateOne({ _id: previous.item._id, user: req.user.id }, { $inc: { quantity: previous.deductQuantity } }).catch(() => {});
    }
    console.error("Consume recipe ingredients error:", error);
    res.status(500).json({ message: "Could not update pantry quantities.", error: error.message });
  }
};

exports.compareRecipeWithPantry = async (req, res) => {
  try {
    const [recipe, pantry] = await Promise.all([
      Recipe.findById(req.params.recipeId).lean(),
      PantryItem.find({ user: req.user.id }).lean(),
    ]);
    if (!recipe) return res.status(404).json({ message: "Recipe not found." });
    const rows = (recipe.ingredients || []).map((raw) => {
      const required = parseRequiredIngredient(raw);
      if (isCommonHouseholdIngredient(required.name)) {
        return { ingredient: raw, status: "available", message: "As needed" };
      }
      const match = pantry.find((item) => normalizeIngredientName(item.name) === normalizeIngredientName(required.name));
      if (!match) return { ingredient: raw, available: 0, availableUnit: required.unit || "", status: "missing", message: "Not in pantry" };
      if (required.quantity === null) return { ingredient: raw, available: match.quantity, availableUnit: match.unit, status: "quantity-unknown", message: "Check required quantity" };
      const need = normalizeAmount(required.quantity, required.unit);
      const have = normalizeAmount(match.quantity, match.unit);
      if (need.unit !== have.unit) return { ingredient: raw, available: match.quantity, availableUnit: match.unit, status: "unit-mismatch", message: "Units do not match" };
      const remaining = Math.max(0, need.quantity - have.quantity);
      return {
        ingredient: raw, required: required.quantity, requiredUnit: required.unit,
        available: match.quantity, availableUnit: match.unit,
        missing: remaining, status: remaining === 0 ? "available" : "insufficient",
        message: remaining === 0 ? "Available" : `Need ${remaining} ${need.unit} more`,
      };
    });
    res.json({ recipeId: recipe._id, comparison: rows });
  } catch (error) {
    res.status(500).json({ message: "Failed to compare recipe ingredients", error: error.message });
  }
};

const PantryItem = require("../../models/user/PantryItem");

exports.listPantry = async (req, res) => {
  try {
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
      { new: true, runValidators: true }
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
  const match = value.match(/^([0-9]+(?:\.[0-9]+)?|[0-9]+\/[0-9]+)\s*(kg|g|ml|l|pieces?|piece|cups?|tbsp|tsp)?\s+(.+)$/i);
  if (!match) return { name: value.toLowerCase(), quantity: null, unit: null };
  const quantity = match[1].includes("/") ? match[1].split("/").reduce((a, b) => Number(a) / Number(b)) : Number(match[1]);
  return { name: match[3].toLowerCase().trim(), quantity, unit: (match[2] || "piece").toLowerCase() };
}

function normalizeAmount(quantity, unit) {
  if (unit === "kg") return { quantity: quantity * 1000, unit: "g" };
  if (unit === "l") return { quantity: quantity * 1000, unit: "ml" };
  if (unit === "pieces" || unit === "pieces") return { quantity, unit: "piece" };
  if (unit === "cups") return { quantity, unit: "cup" };
  return { quantity, unit };
}

exports.compareRecipeWithPantry = async (req, res) => {
  try {
    const [recipe, pantry] = await Promise.all([
      Recipe.findById(req.params.recipeId).lean(),
      PantryItem.find({ user: req.user.id }).lean(),
    ]);
    if (!recipe) return res.status(404).json({ message: "Recipe not found." });
    const rows = (recipe.ingredients || []).map((raw) => {
      const required = parseRequiredIngredient(raw);
      const match = pantry.find((item) => item.name === required.name || required.name.includes(item.name) || item.name.includes(required.name));
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

const { localizeRecord, SUPPORTED_LANGUAGES } = require("../services/localizationService");
const Recipe = require("../models/user/Recipe");
const MealPlan = require("../models/MealPlan");
const PantryItem = require("../models/user/PantryItem");
const GroceryList = require("../models/user/GroceryList");

const MODELS = { recipe: Recipe, mealPlan: MealPlan, pantryItem: PantryItem, groceryList: GroceryList };

exports.getLocalizedRecord = async (req, res) => {
  try {
    const { type, id } = req.params;
    const language = String(req.query.language || req.user?.preferences?.language || "en");
    if (!Object.hasOwn(MODELS, type)) return res.status(400).json({ success: false, message: "Unsupported record type." });
    if (!SUPPORTED_LANGUAGES.has(language) && language !== "en") return res.status(400).json({ success: false, message: "Unsupported language." });

    const query = { _id: id };
    if (type === "pantryItem" || type === "groceryList" || type === "mealPlan") query.user = req.user.id;
    const record = await MODELS[type].findOne(query).lean();
    if (!record) return res.status(404).json({ success: false, message: "Record not found." });

    const localized = await localizeRecord(record, type, language);
    return res.json({ success: true, language, record: localized });
  } catch (error) {
    console.error("Localization request failed:", error);
    return res.status(500).json({ success: false, message: "Unable to localize this record. Original data remains available." });
  }
};

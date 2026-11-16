const User = require("../../models/User");
const Recipe = require("../../models/user/Recipe");
const MealPlan = require("../../models/MealPlan");
const GroceryList = require("../../models/user/GroceryList");
const Order = require("../../models/user/Order");
const NutritionLog = require("../../models/user/NutritionLog");
const RecipeReview = require("../../models/user/RecipeReview");
const StoreProduct = require("../../models/store/StoreProduct");

const REPORTS = {
  users: { model: User, select: "name email role createdAt", label: "Users" },
  recipes: { model: Recipe, select: "name category diet source prepTime createdAt", label: "Recipes" },
  mealPlans: { model: MealPlan, select: "user goal diet duration isArchived createdAt", populate: { path: "user", select: "name email" }, label: "Meal plans" },
  orders: { model: Order, select: "orderId user items totalAmount status deliveryTime deliveredAt createdAt", populate: { path: "user", select: "name email" }, label: "Orders" },
  groceryLists: { model: GroceryList, select: "user mealPlan items createdAt", populate: [{ path: "user", select: "name email" }, { path: "mealPlan", select: "goal diet duration" }], label: "Grocery lists" },
  nutrition: { model: NutritionLog, select: "user mealName mealType dateKey servings calories protein carbohydrates fat nutritionSource nutritionStatus confidence createdAt", populate: { path: "user", select: "name email" }, label: "Nutrition logs" },
  reviews: { model: RecipeReview, select: "user recipe rating feedback createdAt", populate: [{ path: "user", select: "name email" }, { path: "recipe", select: "name category" }], label: "Recipe reviews" },
  products: { model: StoreProduct, select: "name category unit price stock isActive createdAt", label: "Store products" },
};

const getReport = async (req, res) => {
  try {
    const config = REPORTS[req.params.type];
    if (!config) return res.status(400).json({ success: false, message: "Unsupported report type." });

    const { from, to } = req.query;
    const filter = {};
    if (from || to) {
      filter.createdAt = {};
      if (from) {
        const fromDate = new Date(from);
        if (Number.isNaN(fromDate.getTime())) return res.status(400).json({ success: false, message: "Invalid start date." });
        fromDate.setHours(0, 0, 0, 0);
        filter.createdAt.$gte = fromDate;
      }
      if (to) {
        const toDate = new Date(to);
        if (Number.isNaN(toDate.getTime())) return res.status(400).json({ success: false, message: "Invalid end date." });
        toDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = toDate;
      }
      if (filter.createdAt.$gte && filter.createdAt.$lte && filter.createdAt.$gte > filter.createdAt.$lte) {
        return res.status(400).json({ success: false, message: "Start date must be before end date." });
      }
    }

    let query = config.model.find(filter).select(config.select).sort({ createdAt: -1 }).lean();
    if (config.populate) query = query.populate(config.populate);
    const rows = await query;
    res.status(200).json({
      success: true,
      report: { type: req.params.type, title: config.label, from: from || null, to: to || null, generatedAt: new Date(), rowCount: rows.length, truncated: false },
      rows,
    });
  } catch (error) {
    console.error("Admin report generation error:", error);
    res.status(500).json({ success: false, message: "Failed to generate report." });
  }
};

module.exports = { getReport };

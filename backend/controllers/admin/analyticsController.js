const User = require("../../models/User");
const Recipe = require("../../models/user/Recipe");
const RecipeReview = require("../../models/user/RecipeReview");
const MealPlan = require("../../models/MealPlan");
const GroceryList = require("../../models/user/GroceryList");
const Order = require("../../models/user/Order");
const NutritionLog = require("../../models/user/NutritionLog");
const StoreProduct = require("../../models/store/StoreProduct");
const Notification = require("../../models/user/Notification");

const getStats = async (req, res) => {
  try {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [
      totalUsers,
      totalAdmins,
      totalAccounts,
      totalRecipes,
      aiRecipes,
      manualRecipes,
      totalMealPlans,
      activeMealPlans,
      totalGroceryLists,
      groceryItemStats,
      totalOrders,
      orderStats,
      nutritionLogCount,
      nutritionAverages,
      activeStoreProducts,
      lowStockProducts,
      reviewStats,
      recipeCategories,
      mealPlanGoals,
      mealPlanDiets,
      userGrowth,
      orderStatuses,
      recentUsers,
      recentMealPlans,
      unreadNotifications,
    ] = await Promise.all([
      User.countDocuments({ role: "user" }),
      User.countDocuments({ role: "admin" }),
      User.countDocuments(),
      Recipe.countDocuments(),
      Recipe.countDocuments({ source: "ai" }),
      Recipe.countDocuments({ source: { $ne: "ai" } }),
      MealPlan.countDocuments(),
      MealPlan.countDocuments({ isArchived: { $ne: true } }),
      GroceryList.countDocuments(),
      GroceryList.aggregate([
        { $unwind: { path: "$items", preserveNullAndEmptyArrays: false } },
        { $group: { _id: null, totalItems: { $sum: 1 }, checkedItems: { $sum: { $cond: ["$items.checked", 1, 0] } } } },
      ]),
      Order.countDocuments(),
      Order.aggregate([
        { $group: { _id: null, orderValue: { $sum: "$totalAmount" }, averageOrderValue: { $avg: "$totalAmount" } } },
      ]),
      NutritionLog.countDocuments(),
      NutritionLog.aggregate([
        { $group: { _id: null, averageCaloriesPerLoggedMeal: { $avg: "$calories" }, verifiedLogs: { $sum: { $cond: [{ $in: ["$nutritionStatus", ["verified", "manual"]] }, 1, 0] } }, estimatedLogs: { $sum: { $cond: [{ $in: ["$nutritionStatus", ["estimated", "partial_estimate"]] }, 1, 0] } } } },
      ]),
      StoreProduct.countDocuments({ isActive: true }),
      StoreProduct.countDocuments({ isActive: true, stock: { $lte: 5 } }),
      RecipeReview.aggregate([
        { $group: { _id: null, averageRating: { $avg: "$rating" }, totalReviews: { $sum: 1 }, fiveStar: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } }, oneStar: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } } } },
      ]),
      Recipe.aggregate([
        { $group: { _id: { $ifNull: ["$category", "Other"] }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      MealPlan.aggregate([
        { $group: { _id: { $ifNull: ["$goal", "Unspecified"] }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      MealPlan.aggregate([
        { $group: { _id: { $ifNull: ["$diet", "Unspecified"] }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      User.aggregate([
        { $match: { role: "user", createdAt: { $gte: sixMonthsAgo } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      User.find().select("name email role createdAt").sort({ createdAt: -1 }).limit(8).lean(),
      MealPlan.find().populate("user", "name email").sort({ createdAt: -1 }).limit(8).lean(),
      Notification.countDocuments({ read: false }),
    ]);

    const review = reviewStats[0] || {};
    const grocery = groceryItemStats[0] || {};
    const orders = orderStats[0] || {};
    const nutrition = nutritionAverages[0] || {};

    res.status(200).json({
      success: true,
      generatedAt: now,
      stats: {
        totalUsers,
        totalAdmins,
        totalAccounts,
        totalRecipes,
        aiRecipes,
        manualRecipes,
        totalMealPlans,
        activeMealPlans,
        totalGroceryLists,
        totalGroceryItems: grocery.totalItems || 0,
        checkedGroceryItems: grocery.checkedItems || 0,
        groceryCompletionRate: grocery.totalItems ? Number((grocery.checkedItems / grocery.totalItems * 100).toFixed(1)) : 0,
        totalOrders,
        totalOrderValue: Number((orders.orderValue || 0).toFixed(2)),
        averageOrderValue: Number((orders.averageOrderValue || 0).toFixed(2)),
        totalNutritionLogs: nutritionLogCount,
        averageCaloriesPerLoggedMeal: Number((nutrition.averageCaloriesPerLoggedMeal || 0).toFixed(1)),
        verifiedNutritionLogs: nutrition.verifiedLogs || 0,
        estimatedNutritionLogs: nutrition.estimatedLogs || 0,
        activeStoreProducts,
        lowStockProducts,
        averageRecipeRating: review.averageRating ? Number(review.averageRating.toFixed(2)) : 0,
        totalReviews: review.totalReviews || 0,
        fiveStarReviews: review.fiveStar || 0,
        oneStarReviews: review.oneStar || 0,
        unreadNotifications,
      },
      charts: {
        userGrowth: userGrowth.map((item) => ({ month: item._id, users: item.count })),
        recipeCategories: recipeCategories.map((item) => ({ category: item._id || "Other", recipes: item.count })),
        mealPlanGoals: mealPlanGoals.map((item) => ({ goal: item._id || "Unspecified", plans: item.count })),
        mealPlanDiets: mealPlanDiets.map((item) => ({ diet: item._id || "Unspecified", plans: item.count })),
        orderStatuses: orderStatuses.map((item) => ({ status: item._id || "Unknown", orders: item.count })),
      },
      recentUsers,
      recentMealPlans,
    });
  } catch (error) {
    console.error("Admin analytics error:", error);
    res.status(500).json({ success: false, message: "Failed to get analytics" });
  }
};

module.exports = { getStats };

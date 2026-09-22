const User = require("../../models/User");
const Recipe = require("../../models/user/Recipe");
const MealPlan = require("../../models/MealPlan");
const GroceryList = require("../../models/user/GroceryList");

const getStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalAdmins,
      totalRecipes,
      totalMealPlans,
      totalGroceryLists,
      recentUsers,
      recentMealPlans,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "admin" }),
      Recipe.countDocuments(),
      MealPlan.countDocuments(),
      GroceryList.countDocuments(),
      User.find().select("name email role createdAt").sort({ createdAt: -1 }).limit(5),
      MealPlan.find().populate("user", "name email").sort({ createdAt: -1 }).limit(5),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalAdmins,
        totalRecipes,
        totalMealPlans,
        totalGroceryLists,
      },
      recentUsers,
      recentMealPlans,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to get analytics" });
  }
};

module.exports = { getStats };

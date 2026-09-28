const Recipe = require("../../models/user/Recipe");
const MealPlan = require("../../models/MealPlan");

const getAIStatus = async (req, res) => {
  try {
    const [aiRecipes, manualRecipes, totalMealPlans] = await Promise.all([
      Recipe.countDocuments({ source: "ai" }),
      Recipe.countDocuments({ source: { $ne: "ai" } }),
      MealPlan.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      status: {
        configured: Boolean(process.env.OPENROUTER_API_KEY),
        model: process.env.OPENROUTER_API_KEY ? "openrouter/free" : "local fallback",
        aiRecipes,
        manualRecipes,
        aiMealPlans: totalMealPlans,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to get AI status" });
  }
};

module.exports = { getAIStatus };

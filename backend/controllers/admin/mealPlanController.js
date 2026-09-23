const MealPlan = require("../../models/MealPlan");

const getAllMealPlans = async (req, res) => {
  try {
    const mealPlans = await MealPlan.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, mealPlans });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to get meal plans" });
  }
};

const getMealPlanById = async (req, res) => {
  try {
    const mealPlan = await MealPlan.findById(req.params.id).populate("user", "name email");

    if (!mealPlan) {
      return res.status(404).json({ success: false, message: "Meal plan not found" });
    }

    res.status(200).json({ success: true, mealPlan });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to get meal plan" });
  }
};

const deleteMealPlan = async (req, res) => {
  try {
    const mealPlan = await MealPlan.findByIdAndDelete(req.params.id);

    if (!mealPlan) {
      return res.status(404).json({ success: false, message: "Meal plan not found" });
    }

    res.status(200).json({ success: true, message: "Meal plan deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to delete meal plan" });
  }
};

module.exports = { getAllMealPlans, getMealPlanById, deleteMealPlan };

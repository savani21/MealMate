const User = require("../../models/User");
const MealPlan = require("../../models/MealPlan");
const GroceryList = require("../../models/user/GroceryList");
const Cart = require("../../models/user/Cart");
const PantryItem = require("../../models/user/PantryItem");
const Notification = require("../../models/user/Notification");
const NutritionLog = require("../../models/user/NutritionLog");
const NutritionGoal = require("../../models/user/NutritionGoal");
const MealReminderPreference = require("../../models/user/MealReminderPreference");
const RecipeReview = require("../../models/user/RecipeReview");
const Recipe = require("../../models/user/Recipe");
const Order = require("../../models/user/Order");

// GET all users
const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to get users" });
  }
};

// GET single user, with their activity summary (used by the user detail view)
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("favorites", "name category");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const [mealPlans, groceryLists] = await Promise.all([
      MealPlan.find({ user: user._id }).sort({ createdAt: -1 }),
      GroceryList.countDocuments({ user: user._id }),
    ]);

    res.status(200).json({ success: true, user, mealPlans, groceryListCount: groceryLists });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to get user" });
  }
};

// UPDATE user role
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ success: false, message: "Role must be 'user' or 'admin'" });
    }

    if (req.params.id === req.user.id && role !== "admin") {
      return res.status(400).json({ success: false, message: "You cannot remove your own admin access" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { returnDocument: "after" }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, message: "User role updated successfully", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to update user role" });
  }
};

// DELETE user and clean up personal data while retaining order history.
const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, message: "You cannot delete your own account" });
    }

    const user = await User.findById(req.params.id).select("_id role");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(400).json({
        success: false,
        message: "Revoke this account's admin role before deleting it.",
      });
    }

    const userId = user._id;

    // Remove records that contain user-specific preferences, activity or personal content.
    // Keep order records for operational history, but detach them from the deleted account.
    await Promise.all([
      Cart.deleteMany({ user: userId }),
      PantryItem.deleteMany({ user: userId }),
      Notification.deleteMany({ user: userId }),
      NutritionGoal.deleteMany({ user: userId }),
      MealReminderPreference.deleteMany({ user: userId }),
      RecipeReview.deleteMany({ user: userId }),
      NutritionLog.deleteMany({ user: userId }),
      GroceryList.deleteMany({ user: userId }),
      MealPlan.deleteMany({ user: userId }),
      Recipe.updateMany({ createdBy: userId }, { $set: { createdBy: null } }),
      Order.updateMany({ user: userId }, { $set: { user: null } }),
    ]);

    await User.deleteOne({ _id: userId });

    res.status(200).json({
      success: true,
      message: "User deleted. Personal data was removed; order history was retained without the user link.",
    });
  } catch (error) {
    console.error("Admin delete user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete user and clean up linked data. Please verify database state before retrying.",
    });
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUserRole,
  deleteUser,
};

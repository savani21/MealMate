const User = require("../../models/User");
const MealPlan = require("../../models/MealPlan");
const GroceryList = require("../../models/user/GroceryList");

// GET all users
const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to get users",
    });
  }
};

// GET single user, with their activity summary (used by the user detail view)
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("favorites", "name category");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const [mealPlans, groceryLists] = await Promise.all([
      MealPlan.find({ user: user._id }).sort({ createdAt: -1 }),
      GroceryList.countDocuments({ user: user._id }),
    ]);

    res.status(200).json({
      success: true,
      user,
      mealPlans,
      groceryListCount: groceryLists,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to get user",
    });
  }
};

// UPDATE user role
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be 'user' or 'admin'",
      });
    }

    // Prevent an admin from demoting their own account
    if (req.params.id === req.user.id && role !== "admin") {
      return res.status(400).json({
        success: false,
        message: "You cannot remove your own admin access",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User role updated successfully",
      user,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to update user role",
    });
  }
};

// DELETE user
const deleteUser = async (req, res) => {
  try {
    // Prevent an admin from deleting their own account
    if (req.params.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUserRole,
  deleteUser,
};

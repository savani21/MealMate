const User = require("../models/User");

const admin = async (req, res, next) => {
  try {
    // req.user.id comes from auth middleware
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.role !== "admin") {
      return res.status(403).json({
        message: "Access denied. Admin only.",
      });
    }

    next();

  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

module.exports = admin;
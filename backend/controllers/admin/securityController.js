const User = require("../../models/User");

// GET a security overview: admin accounts + static posture info
const getSecurityOverview = async (req, res) => {
  try {
    const admins = await User.find({ role: "admin" })
      .select("-password")
      .sort({ createdAt: -1 });

    const totalUsers = await User.countDocuments();

    res.status(200).json({
      success: true,
      admins,
      totalUsers,
      totalAdmins: admins.length,
      posture: {
        passwordHashing: "bcrypt (10 salt rounds)",
        authMethod: "JWT (7 day expiry)",
        adminGuard: "role-based middleware on every /api/admin/* route",
        cors: "enabled",
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to get security overview" });
  }
};

module.exports = { getSecurityOverview };

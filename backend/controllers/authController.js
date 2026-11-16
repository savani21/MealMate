const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { createAdminAlert } = require("../services/adminAlertService");

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });
    const userResponse = await User.findById(user._id).select("-password");
    await createAdminAlert({ type: "user-registered", severity: "info", title: "New user registered", message: `${user.name} created a MealMate account.`, source: "User registration", referenceId: String(user._id), actionUrl: "/admin/users", dedupeKey: `user-registered:${user._id}` });

    res.status(201).json({
      success: true,
      message: "Registration successful",
      user: userResponse,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid Password" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        preferences: { theme: user.preferences?.theme || "light" },
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { foodPreference } = req.body;
    const allowedPreferences = ["vegetarian", "vegan", "non-vegetarian", "eggetarian"];
    if (!allowedPreferences.includes(foodPreference)) {
      return res.status(400).json({ message: "Invalid food preference" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { foodPreference },
      { returnDocument: "after", runValidators: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateThemePreference = async (req, res) => {
  try {
    const { theme } = req.body;
    if (!["light", "dark"].includes(theme)) {
      return res.status(400).json({ message: "Theme must be light or dark" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { "preferences.theme": theme } },
      { returnDocument: "after", runValidators: true }
    ).select("_id name email role preferences");

    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({
      success: true,
      preferences: { theme: user.preferences?.theme || "light" },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

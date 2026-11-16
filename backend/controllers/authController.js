const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Escape user input before using it in an exact, case-insensitive email regex.
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

exports.register = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = req.body.password;

    if (!name || !email || typeof password !== "string" || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const emailPattern = new RegExp(`^${escapeRegex(email)}$`, "i");
    const existingUser = await User.findOne({ email: emailPattern });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });
    const userResponse = await User.findById(user._id).select("-password");

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      user: userResponse,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const email = String(req.body.email || "").trim();
    const password = req.body.password;

    if (!email || typeof password !== "string" || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Match legacy accounts even if their stored email has different casing.
    const emailPattern = new RegExp(`^${escapeRegex(email)}$`, "i");
    const user = await User.findOne({ email: emailPattern });

    if (!user) {
      return res.status(404).json({ message: "User not found in the connected database" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: "Invalid password" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "JWT_SECRET is not configured on the backend" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
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
    return res.status(200).json({ success: true, user });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ success: true, user });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

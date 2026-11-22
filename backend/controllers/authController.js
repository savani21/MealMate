const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });
    const userResponse = await User.findById(user._id).select("-password");

    res.status(201).json({ success: true, message: "Registration successful", user: userResponse });
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
      user: { _id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    if (!email) return res.status(400).json({ message: "Please enter your email address." });

    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
    if (!gmailUser || !gmailAppPassword) {
      console.error("Password reset email is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD.");
      return res.status(503).json({ message: "Password reset email is temporarily unavailable. Please try again later." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If an account exists for that email, a password reset link has been sent.",
      });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
    const resetUrl = `${frontendUrl}/reset-password/${rawToken}`;
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: gmailUser, pass: gmailAppPassword.replace(/\s/g, "") },
    });

    try {
      await transporter.sendMail({
        from: `MealMate Support <${gmailUser}>`,
        to: user.email,
        subject: "Reset your MealMate password",
        text: `We received a request to reset your MealMate password. This link expires in 15 minutes and can only be used once: ${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
        html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#17211b;line-height:1.6"><h2 style="color:#15803d">Reset your MealMate password</h2><p>We received a request to reset the password for your MealMate account.</p><p><a href="${resetUrl}" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:bold">Reset Password</a></p><p>This link expires in <strong>15 minutes</strong> and can only be used once.</p><p>If you did not request a password reset, you can safely ignore this email.</p></div>`,
      });
    } catch (mailError) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      console.error("MealMate password reset email failed:", mailError.message);
      // Keep the response identical to the unknown-email case to avoid account enumeration.
      return res.status(200).json({
        success: true,
        message: "If an account exists for that email, a password reset link has been sent.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "If an account exists for that email, a password reset link has been sent.",
    });
  } catch (err) {
    console.error("Forgot password error:", err.message);
    return res.status(500).json({ message: "Unable to process your request right now. Please try again later." });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const password = String(req.body.password || "");
    if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({ message: "This reset link is invalid or has expired." });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long." });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const hashedPassword = await bcrypt.hash(password, 10);
    const updatedUser = await User.findOneAndUpdate(
      { passwordResetToken: hashedToken, passwordResetExpires: { $gt: new Date() } },
      { $set: { password: hashedPassword }, $unset: { passwordResetToken: 1, passwordResetExpires: 1 } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(400).json({
        message: "This reset link is invalid or has expired. Please request a new one.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Your password has been reset successfully. You can now log in.",
    });
  } catch (err) {
    console.error("Reset password error:", err.message);
    return res.status(500).json({ message: "Unable to reset your password right now. Please try again." });
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

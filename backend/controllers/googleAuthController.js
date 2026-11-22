const { OAuth2Client } = require("google-auth-library");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

module.exports = async function googleAuth(req, res) {
  try {
    const { credential } = req.body;
    if (!credential || !process.env.GOOGLE_CLIENT_ID) {
      return res.status(400).json({ message: "Google sign-up is not configured correctly." });
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      return res.status(401).json({ message: "Google could not verify this email address." });
    }

    const email = payload.email.trim().toLowerCase();
    let user = await User.findOne({ $or: [{ googleId: payload.sub }, { email }] });

    if (!user) {
      const randomPassword = crypto.randomBytes(32).toString("hex");
      const password = await bcrypt.hash(randomPassword, 10);
      user = await User.create({
        name: payload.name || email.split("@")[0],
        email,
        password,
        googleId: payload.sub,
      });
    } else if (!user.googleId) {
      // Google has verified ownership of this email, so link the existing account.
      user.googleId = payload.sub;
      await user.save();
    } else if (user.googleId !== payload.sub) {
      return res.status(409).json({ message: "This email is already linked to another Google account." });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Google authentication failed:", error.message);
    return res.status(401).json({ message: "Google authentication failed. Please try again." });
  }
};

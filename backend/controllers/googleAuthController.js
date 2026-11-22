const { OAuth2Client } = require("google-auth-library");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async function googleAuth(req, res) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const { credential } = req.body || {};

    if (!clientId || !credential) {
      return res.status(400).json({
        success: false,
        message: "Google sign-in is not configured correctly.",
      });
    }
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing from the backend environment.");
      return res.status(500).json({
        success: false,
        message: "Server authentication is not configured.",
      });
    }

    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });
    const payload = ticket.getPayload();

    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      return res.status(401).json({
        success: false,
        message: "Google could not verify this email address.",
      });
    }

    const email = payload.email.trim().toLowerCase();
    let user = await User.findOne({
      $or: [{ googleId: payload.sub }, { email }],
    });

    if (!user) {
      const randomPassword = crypto.randomBytes(32).toString("hex");
      const password = await bcrypt.hash(randomPassword, 12);
      user = await User.create({
        name: payload.name || email.split("@")[0],
        email,
        password,
        googleId: payload.sub,
      });
    } else if (user.googleId && user.googleId !== payload.sub) {
      return res.status(409).json({
        success: false,
        message: "This email is already linked to another Google account.",
      });
    } else if (!user.googleId) {
      // Link an existing account only after Google has verified the same email.
      user.googleId = payload.sub;
      await user.save();
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
        preferences: { theme: user.preferences?.theme || "light" },
      },
    });
  } catch (error) {
    console.error("Google authentication failed:", error);
    return res.status(401).json({
      success: false,
      message: "Google authentication failed. Please try again.",
    });
  }
};

const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { createAdminAlert } = require("../services/adminAlertService");
const crypto = require("crypto");
const { sendPasswordResetEmail } = require("../services/emailService");

// Used for unknown accounts so login attempts perform a password hash comparison
// before returning the same response as an incorrect password.
const DUMMY_PASSWORD_HASH = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validPassword(password) {
  return typeof password === "string" && password.length >= 8 && Buffer.byteLength(password, "utf8") <= 72;
}

exports.register = async (req, res) => {
  try {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const { password } = req.body || {};

    if (name.length < 2 || name.length > 80) {
      return res.status(400).json({ success: false, message: "Name must be between 2 and 80 characters." });
    }
    if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
      return res.status(400).json({ success: false, message: "Please provide a valid email address." });
    }
    if (!validPassword(password)) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters and no more than 72 bytes." });
    }

    const existingUser = await User.findOne({ email }).select("_id");
    if (existingUser) {
      return res.status(409).json({ success: false, message: "Unable to create an account with these details." });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hashedPassword });
    const userResponse = await User.findById(user._id).select("-password");

    // Alert delivery must not turn a successfully-created account into a failed
    // registration response.
    try {
      await createAdminAlert({
        type: "user-registered",
        severity: "info",
        title: "New user registered",
        message: `${user.name} created a MealMate account.`,
        source: "User registration",
        referenceId: String(user._id),
        actionUrl: "/admin/users",
        dedupeKey: `user-registered:${user._id}`,
      });
    } catch (alertError) {
      console.error("Registration admin alert failed:", alertError);
    }

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      user: userResponse,
    });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ success: false, message: "Unable to create an account with these details." });
    }
    console.error("Registration error:", err);
    return res.status(500).json({ success: false, message: "Registration failed. Please try again." });
  }
};

exports.login = async (req, res) => {
  try {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const { password } = req.body || {};
    if (email.length > 254 || !EMAIL_PATTERN.test(email) || typeof password !== "string" || !password.length || Buffer.byteLength(password, "utf8") > 72) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const user = await User.findOne({ email });
    const passwordMatches = await bcrypt.compare(password, user?.password || DUMMY_PASSWORD_HASH);
    if (!user || !passwordMatches) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
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
        preferences: { theme: user.preferences?.theme || "light" },
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ success: false, message: "Login failed. Please try again." });
  }
};

exports.requestPasswordReset = async (req, res) => {
 const message="If an account exists for that email, a password reset link has been sent.";
 try {
  const email=typeof req.body?.email==="string"?req.body.email.trim().toLowerCase():"";
  if(!EMAIL_PATTERN.test(email)||email.length>254)return res.json({success:true,message});
  const user=await User.findOne({email});
  if(user){
   const token=crypto.randomBytes(32).toString("hex");
   user.resetPasswordTokenHash=crypto.createHash("sha256").update(token).digest("hex");
   user.resetPasswordExpires=new Date(Date.now()+30*60*1000); await user.save();
   const resetUrl=`${(process.env.CLIENT_URL||"http://localhost:5173").replace(/\/$/,"")}/reset-password/${token}`;
   try{await sendPasswordResetEmail({to:user.email,name:user.name,resetUrl});}
   catch(e){user.resetPasswordTokenHash=undefined;user.resetPasswordExpires=undefined;await user.save();console.error("Password reset email failed:",e.message);return res.status(503).json({success:false,message:"Unable to send the reset email right now. Please try again later."});}
  }
  return res.json({success:true,message});
 }catch(e){console.error("Password reset request failed:",e);return res.status(500).json({success:false,message:"Unable to process the request. Please try again."});}
};
exports.resetPassword = async (req,res) => {
 try{
  const {token,password}=req.body||{};
  if(typeof token!=="string"||!/^[a-f0-9]{64}$/i.test(token)||!validPassword(password))return res.status(400).json({success:false,message:"The reset link is invalid or expired."});
  const tokenHash=crypto.createHash("sha256").update(token).digest("hex");
  const user=await User.findOne({resetPasswordTokenHash:tokenHash,resetPasswordExpires:{$gt:new Date()}}).select("+resetPasswordTokenHash +resetPasswordExpires");
  if(!user)return res.status(400).json({success:false,message:"The reset link is invalid or expired."});
  user.password=await bcrypt.hash(password,12);user.resetPasswordTokenHash=undefined;user.resetPasswordExpires=undefined;await user.save();
  return res.json({success:true,message:"Password updated successfully. You can now log in."});
 }catch(e){console.error("Password reset failed:",e);return res.status(500).json({success:false,message:"Unable to reset the password. Please try again."});}
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

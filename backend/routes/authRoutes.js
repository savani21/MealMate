const auth = require("../middleware/auth");
const router = require("express").Router();
const admin = require("../middleware/admin");
const { createRateLimiter } = require("../middleware/rateLimiter");
const {
  register,
  login,
  updateProfile,
  getProfile,
  updateThemePreference,
} = require("../controllers/authController");

const authAttemptLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many authentication attempts. Please try again in 15 minutes.",
});

router.post("/register", authAttemptLimiter, register);
router.post("/login", authAttemptLimiter, login);
router.get("/profile", auth, getProfile);
router.patch("/profile", auth, updateProfile);
router.patch("/preferences/theme", auth, updateThemePreference);
router.get("/admin", auth, admin, (req, res) => {
  res.status(200).json({ success: true, message: "Welcome Admin!" });
});

module.exports = router;

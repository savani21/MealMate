const auth = require("../middleware/auth");
const router = require("express").Router();
const admin = require("../middleware/admin");
const {
  register,
  login,
  updateProfile,
  getProfile,
  updateThemePreference,
} = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.get("/profile", auth, getProfile);
router.patch("/profile", auth, updateProfile);
router.patch("/preferences/theme", auth, updateThemePreference);
router.get("/admin", auth, admin, (req, res) => {
  res.status(200).json({ success: true, message: "Welcome Admin!" });
});

module.exports = router;

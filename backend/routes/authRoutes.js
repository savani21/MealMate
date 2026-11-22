const auth = require("../middleware/auth");

const router=require("express").Router();

const admin = require("../middleware/admin");

const {
  register,
  login,
  getProfile,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");


router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.get("/profile", auth, getProfile);
router.get("/admin", auth, admin, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome Admin!",
  });
});

module.exports=router;
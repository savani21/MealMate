const router = require("express").Router();
const auth = require("../../middleware/auth");
const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearNotifications,
} = require("../../controllers/user/notificationController");

router.use(auth, (req, res, next) => {\n  if (req.user?.role !== "user") return res.status(403).json({ success: false, message: "Personal notifications are only available to user accounts." });\n  next();\n});
router.get("/", getMyNotifications);
router.patch("/read-all", markAllAsRead);
router.delete("/", clearNotifications);
router.patch("/:id/read", markAsRead);
router.delete("/:id", deleteNotification);

module.exports = router;

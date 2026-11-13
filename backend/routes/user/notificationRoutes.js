const router = require("express").Router();
const auth = require("../../middleware/auth");
const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearNotifications,
} = require("../../controllers/user/notificationController");

router.use(auth);
router.get("/", getMyNotifications);
router.patch("/read-all", markAllAsRead);
router.delete("/", clearNotifications);
router.patch("/:id/read", markAsRead);
router.delete("/:id", deleteNotification);

module.exports = router;

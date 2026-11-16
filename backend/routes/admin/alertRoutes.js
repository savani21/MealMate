const router = require("express").Router();
const auth = require("../../middleware/auth");
const admin = require("../../middleware/admin");
const controller = require("../../controllers/admin/alertController");

router.use(auth, admin);
router.get("/", controller.getAlerts);
router.patch("/read-all", controller.markAllRead);
router.patch("/:id/read", controller.markRead);
router.delete("/:id", controller.deleteAlert);

module.exports = router;

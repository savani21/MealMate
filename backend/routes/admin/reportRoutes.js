const router = require("express").Router();
const auth = require("../../middleware/auth");
const admin = require("../../middleware/admin");
const { getReport } = require("../../controllers/admin/reportController");

router.get("/:type", auth, admin, getReport);

module.exports = router;

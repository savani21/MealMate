const router = require("express").Router();

const auth = require("../../middleware/auth");
const admin = require("../../middleware/admin");

const { getStats } = require("../../controllers/admin/analyticsController");

router.get("/stats", auth, admin, getStats);

module.exports = router;

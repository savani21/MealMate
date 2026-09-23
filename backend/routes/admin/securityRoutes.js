const router = require("express").Router();

const auth = require("../../middleware/auth");
const admin = require("../../middleware/admin");

const { getSecurityOverview } = require("../../controllers/admin/securityController");

router.get("/overview", auth, admin, getSecurityOverview);

module.exports = router;

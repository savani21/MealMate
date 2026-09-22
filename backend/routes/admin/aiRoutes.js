const router = require("express").Router();

const auth = require("../../middleware/auth");
const admin = require("../../middleware/admin");

const { getAIStatus } = require("../../controllers/admin/aiController");

router.get("/status", auth, admin, getAIStatus);

module.exports = router;

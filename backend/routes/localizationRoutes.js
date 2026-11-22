const router = require("express").Router();
const auth = require("../middleware/auth");
const { getLocalizedRecord } = require("../controllers/localizationController");

router.get("/:type/:id", auth, getLocalizedRecord);
module.exports = router;

const router = require("express").Router();
const auth = require("../../middleware/auth");
const { addDislike, removeDislike, getDislikes } = require("../../controllers/user/dislikeController");

router.get("/", auth, getDislikes);
router.post("/:recipeId", auth, addDislike);
router.delete("/:recipeId", auth, removeDislike);

module.exports = router;

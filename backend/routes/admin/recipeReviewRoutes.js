const router = require("express").Router();

const auth = require("../../middleware/auth");
const admin = require("../../middleware/admin");
const { getRecipeReviewsForAdmin } = require("../../controllers/admin/recipeReviewController");

router.get("/:recipeId", auth, admin, getRecipeReviewsForAdmin);

module.exports = router;

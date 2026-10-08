const express = require("express");
const router = express.Router();

const auth = require("../../middleware/auth");
const {
  getRecipeReviews,
  upsertRecipeReview,
  getMyRecipeReview,
} = require("../../controllers/user/recipeReviewController");

router.get("/:recipeId", getRecipeReviews);
router.get("/:recipeId/me", auth, getMyRecipeReview);
router.post("/:recipeId", auth, upsertRecipeReview);

module.exports = router;

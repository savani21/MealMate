const RecipeReview = require("../../models/user/RecipeReview");

const getRecipeReviewsForAdmin = async (req, res) => {
  try {
    const reviews = await RecipeReview.find({ recipe: req.params.recipeId })
      .populate("user", "name email")
      .populate("recipe", "name")
      .sort({ createdAt: -1 })
      .lean();

    const ratingCount = reviews.length;
    const averageRating = ratingCount
      ? Number((reviews.reduce((sum, review) => sum + review.rating, 0) / ratingCount).toFixed(1))
      : 0;

    res.status(200).json({
      success: true,
      reviews,
      ratingCount,
      averageRating,
    });
  } catch (error) {
    console.error("ADMIN GET RECIPE REVIEWS ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to get recipe reviews" });
  }
};

module.exports = { getRecipeReviewsForAdmin };

const RecipeReview = require("../../models/user/RecipeReview");
const Recipe = require("../../models/user/Recipe");

const getRecipeReviews = async (req, res) => {
  try {
    const reviews = await RecipeReview.find({ recipe: req.params.recipeId })
      .populate("user", "name")
      .sort({ createdAt: -1 })
      .lean();

    const ratingCount = reviews.length;
    const averageRating = ratingCount
      ? Number((reviews.reduce((sum, review) => sum + review.rating, 0) / ratingCount).toFixed(1))
      : 0;

    const ratingBreakdown = [5, 4, 3, 2, 1].reduce((result, rating) => {
      result[rating] = reviews.filter((review) => review.rating === rating).length;
      return result;
    }, {});

    res.status(200).json({
      reviews,
      ratingCount,
      averageRating,
      ratingBreakdown,
    });
  } catch (error) {
    console.error("GET RECIPE REVIEWS ERROR:", error);
    res.status(500).json({ message: "Failed to get recipe reviews" });
  }
};

const upsertRecipeReview = async (req, res) => {
  try {
    const { rating, feedback = "" } = req.body;
    const numericRating = Number(rating);

    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5 stars." });
    }

    const recipe = await Recipe.findById(req.params.recipeId);

    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    const review = await RecipeReview.findOneAndUpdate(
      {
        recipe: recipe._id,
        user: req.user.id,
      },
      {
        rating: numericRating,
        feedback: String(feedback || "").trim().slice(0, 1000),
      },
      {
        upsert: true,
        returnDocument: "after",
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    ).populate("user", "name");

    res.status(200).json({
      message: "Recipe rating saved successfully",
      review,
    });
  } catch (error) {
    console.error("SAVE RECIPE REVIEW ERROR:", error);
    res.status(500).json({ message: "Failed to save recipe rating" });
  }
};

const getMyRecipeReview = async (req, res) => {
  try {
    const review = await RecipeReview.findOne({
      recipe: req.params.recipeId,
      user: req.user.id,
    }).lean();

    res.status(200).json({ review: review || null });
  } catch (error) {
    console.error("GET MY RECIPE REVIEW ERROR:", error);
    res.status(500).json({ message: "Failed to get your recipe rating" });
  }
};

module.exports = {
  getRecipeReviews,
  upsertRecipeReview,
  getMyRecipeReview,
};

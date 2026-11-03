const Recipe = require("../models/user/Recipe");
const User = require("../models/User");
const StoreProduct = require("../models/store/StoreProduct");
const RecipeReview = require("../models/user/RecipeReview");

exports.getPublicStats = async (req, res) => {
  try {
    const [recipeCount, userCount, groceryProductCount, ratingStats] = await Promise.all([
      Recipe.countDocuments(),
      User.countDocuments({ role: "user" }),
      StoreProduct.countDocuments({ isActive: true }),
      RecipeReview.aggregate([
        {
          $group: {
            _id: null,
            averageRating: { $avg: "$rating" },
            ratingCount: { $sum: 1 },
          },
        },
      ]),
    ]);

    const rating = ratingStats[0] || { averageRating: null, ratingCount: 0 };

    res.status(200).json({
      recipes: recipeCount,
      registeredUsers: userCount,
      groceryProducts: groceryProductCount,
      averageRecipeRating: rating.averageRating === null
        ? null
        : Number(rating.averageRating.toFixed(1)),
      recipeRatingCount: rating.ratingCount,
    });
  } catch (error) {
    console.error("PUBLIC STATS ERROR:", error);
    res.status(500).json({ message: "Failed to load MealMate statistics" });
  }
};

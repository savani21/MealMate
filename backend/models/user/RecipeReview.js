const mongoose = require("mongoose");

const recipeReviewSchema = new mongoose.Schema(
  {
    recipe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recipe",
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    feedback: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

recipeReviewSchema.index({ recipe: 1, user: 1 }, { unique: true });
recipeReviewSchema.index({ recipe: 1, rating: -1 });

module.exports = mongoose.model("RecipeReview", recipeReviewSchema);

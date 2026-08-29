const User = require("../../models/User");
const Recipe = require("../../models/user/Recipe");

const addFavorite = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const recipe = await Recipe.findById(req.params.recipeId);

    if (!user || !recipe) {
      return res.status(404).json({
        message: "User or recipe not found",
      });
    }

    if (!user.favorites.includes(recipe._id)) {
      user.favorites.push(recipe._id);
      await user.save();
    }

    res.json({
      message: "Recipe added to favorites",
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: error.message,
    });
  }
};


const removeFavorite = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    user.favorites = user.favorites.filter(
      (id) => id.toString() !== req.params.recipeId
    );

    await user.save();

    res.json({
      message: "Recipe removed from favorites",
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: error.message,
    });
  }
};


// GET FAVORITES
const getFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("favorites");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({
      favorites: user.favorites,
    });

  } catch (error) {
    console.log("GET FAVORITES ERROR:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};


module.exports = {
  addFavorite,
  removeFavorite,
  getFavorites,
};
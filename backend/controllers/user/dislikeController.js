const User = require("../../models/User");
const Recipe = require("../../models/user/Recipe");

const addDislike = async (req, res) => {
  try {
    const [user, recipe] = await Promise.all([
      User.findById(req.user.id),
      Recipe.findById(req.params.recipeId),
    ]);
    if (!user || !recipe) return res.status(404).json({ message: "User or recipe not found" });

    user.dislikes = user.dislikes || [];
    user.favorites = user.favorites || [];
    if (!user.dislikes.some((id) => id.toString() === recipe._id.toString())) {
      user.dislikes.push(recipe._id);
    }
    user.favorites = user.favorites.filter((id) => id.toString() !== recipe._id.toString());
    await user.save();
    res.status(200).json({ success: true, message: "Recipe marked as not interested" });
  } catch (error) {
    console.error("ADD DISLIKE ERROR:", error);
    res.status(500).json({ message: "Failed to save dislike" });
  }
};

const removeDislike = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.dislikes = (user.dislikes || []).filter((id) => id.toString() !== req.params.recipeId);
    await user.save();
    res.status(200).json({ success: true, message: "Dislike removed" });
  } catch (error) {
    console.error("REMOVE DISLIKE ERROR:", error);
    res.status(500).json({ message: "Failed to remove dislike" });
  }
};

const getDislikes = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("dislikes");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ dislikes: user.dislikes || [] });
  } catch (error) {
    console.error("GET DISLIKES ERROR:", error);
    res.status(500).json({ message: "Failed to load dislikes" });
  }
};

module.exports = { addDislike, removeDislike, getDislikes };

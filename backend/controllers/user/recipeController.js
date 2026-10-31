const Recipe = require("../../models/user/Recipe");
const User = require("../../models/User");

const HIGHLY_LIKED_MIN_LIKES = Math.max(1, Number(process.env.HIGHLY_LIKED_MIN_LIKES) || 5);

async function buildLikeCounts() {
  const users = await User.find({}, { favorites: 1 }).lean();
  const counts = {};
  users.forEach((user) => (user.favorites || []).forEach((id) => {
    const key = id.toString();
    counts[key] = (counts[key] || 0) + 1;
  }));
  return counts;
}

function attachEngagement(recipe, counts, likedIds = []) {
  const id = recipe._id.toString();
  const likesCount = counts[id] || 0;
  return {
    ...recipe,
    likesCount,
    isHighlyLiked: likesCount >= HIGHLY_LIKED_MIN_LIKES,
    isLiked: likedIds.includes(id),
  };
}

const getRecipes = async (req, res) => {
  try {
    const [recipes, likeCounts] = await Promise.all([Recipe.find().sort({ createdAt: -1 }).lean(), buildLikeCounts()]);
    res.status(200).json({ recipes: recipes.map((recipe) => attachEngagement(recipe, likeCounts)) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get recipes" });
  }
};

const getRecommendedRecipes = async (req, res) => {
  try {
    const [allRecipes, likeCounts, currentUser] = await Promise.all([
      Recipe.find().lean(),
      buildLikeCounts(),
      req.user?.id ? User.findById(req.user.id, { favorites: 1 }).lean() : null,
    ]);
    const likedIds = (currentUser?.favorites || []).map((id) => id.toString());
    const likedRecipes = allRecipes.filter((recipe) => likedIds.includes(recipe._id.toString()));
    const likedTokens = new Set(likedRecipes.flatMap((recipe) => [
      String(recipe.category || "").toLowerCase(),
      ...(recipe.ingredients || []).map((item) => String(item).toLowerCase().replace(/[0-9.,]/g, "").trim()),
    ]).filter(Boolean));

    const ranked = allRecipes
      .filter((recipe) => !likedIds.includes(recipe._id.toString()))
      .map((recipe) => {
        const tokens = [
          String(recipe.category || "").toLowerCase(),
          ...(recipe.ingredients || []).map((item) => String(item).toLowerCase().replace(/[0-9.,]/g, "").trim()),
        ].filter(Boolean);
        const similarity = tokens.reduce((score, token) => score + (likedTokens.has(token) ? 1 : 0), 0);
        const likes = likeCounts[recipe._id.toString()] || 0;
        return { recipe, score: similarity * 2 + Math.log1p(likes), similarity, likes };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    const recipes = ranked.map(({ recipe }) => attachEngagement(recipe, likeCounts, likedIds));
    const ingredientNames = recipes.flatMap((recipe) => recipe.ingredients || []).map((item) =>
      String(item).replace(/^\s*[\d./-]+\s*/, "").trim()
    ).filter(Boolean);
    const ingredients = [...new Set(ingredientNames)].slice(0, 15);
    res.status(200).json({ recipes, ingredients, highlyLikedThreshold: HIGHLY_LIKED_MIN_LIKES });
  } catch (error) {
    console.error("RECOMMENDED RECIPES ERROR:", error);
    res.status(500).json({ message: "Failed to get recommended recipes" });
  }
};

const getRecipeById = async (req, res) => {
  try {
    const [recipe, likeCounts] = await Promise.all([Recipe.findById(req.params.id).lean(), buildLikeCounts()]);
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });
    res.status(200).json({ recipe: attachEngagement(recipe, likeCounts) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get recipe" });
  }
};

const createRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.create({
      name: req.body.name,
      description: req.body.description,
      slogan: req.body.slogan || "",
      category: req.body.category,
      diet: req.body.diet,
      ingredients: req.body.ingredients,
      instructions: req.body.instructions,
      prepTime: req.body.prepTime,
      image: req.body.image,
      createdBy: req.user.id,
    });
    res.status(201).json({ message: "Recipe created successfully", recipe });
  } catch (error) {
    console.error("CREATE RECIPE ERROR:", error);
    res.status(500).json({ message: "Failed to create recipe", error: error.message });
  }
};

const deleteRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id });
    if (!recipe) return res.status(404).json({ message: "Recipe not found or you do not have permission to delete it" });
    await User.updateMany({ favorites: recipe._id }, { $pull: { favorites: recipe._id } });
    res.status(200).json({ message: "Recipe deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete recipe" });
  }
};

module.exports = { getRecipes, getRecommendedRecipes, getRecipeById, createRecipe, deleteRecipe };

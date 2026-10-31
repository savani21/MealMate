const express = require("express");
const auth = require("../../middleware/auth");
const jwt = require("jsonwebtoken");

const optionalAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (token) req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(401).json({ message: "Token is not valid." });
  }
  next();
};

const {
  getRecipes,
  getRecommendedRecipes,
  getRecipeById,
  createRecipe,
  deleteRecipe,
} = require("../../controllers/user/recipeController");

const router = express.Router();

router.get("/", getRecipes);
router.get("/recommended", optionalAuth, getRecommendedRecipes);
router.get("/:id", getRecipeById);
router.post("/", auth, createRecipe);
router.delete("/:id", auth, deleteRecipe);

module.exports = router;

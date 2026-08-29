const express = require("express");
const router = express.Router();

const { addFavorite, removeFavorite,getFavorites } = require("../../controllers/user/favoriteController");
const authMiddleware = require("../../middleware/auth");

router.post("/:recipeId", authMiddleware, addFavorite);
router.delete("/:recipeId", authMiddleware, removeFavorite);
router.get("/", authMiddleware, getFavorites);

module.exports = router;
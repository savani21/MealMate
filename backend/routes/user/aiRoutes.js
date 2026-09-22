const express = require("express");

const router = express.Router();

const {
  chatWithAI,
  generateRecipe,
} = require("../../controllers/user/aiController");

router.post("/chat", chatWithAI);
router.post("/generate-recipe", generateRecipe);

module.exports = router;
const express = require("express");
const auth = require("../../middleware/auth");

const router = express.Router();

const {
  chatWithAI,
  generateRecipe,
} = require("../../controllers/user/aiController");

router.post("/chat", chatWithAI);
router.post("/generate-recipe", auth, generateRecipe);

module.exports = router;

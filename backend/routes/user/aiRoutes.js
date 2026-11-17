const express = require("express");
const auth = require("../../middleware/auth");
const { createRateLimiter } = require("../../middleware/rateLimiter");

const router = express.Router();

const {
  chatWithAI,
  generateRecipe,
} = require("../../controllers/user/aiController");

const aiChatLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: "AI chat limit reached. Please try again later.",
});

// Authenticate before consuming the per-user AI request allowance.
router.post("/chat", auth, aiChatLimiter, chatWithAI);
router.post("/generate-recipe", auth, generateRecipe);

module.exports = router;

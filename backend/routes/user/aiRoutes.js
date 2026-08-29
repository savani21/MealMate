const express = require("express");

const router = express.Router();

const {
  chatWithAI,
} = require("../../controllers/user/aiController");

router.post("/chat", chatWithAI);

module.exports = router;
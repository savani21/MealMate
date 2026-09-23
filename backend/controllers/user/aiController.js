const ai = require("../../config/gemini");

const chatWithAI = async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        message: "Message is required",
      });
    }

    const contents = [];

    // Previous conversation
    history.forEach((msg) => {
      if (!msg.text) return;

      contents.push({
        role: msg.role === "user" ? "user" : "model",
        parts: [
          {
            text: msg.text,
          },
        ],
      });
    });

    // Current message
    contents.push({
      role: "user",
      parts: [
        {
          text: message,
        },
      ],
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.6-flash",
      contents: contents,
      config: {
        systemInstruction: `
You are MealMate AI, a friendly food and meal assistant.

You help users with:
- Recipes
- Meal suggestions
- Meal planning
- Ingredients
- Grocery suggestions
- Healthy food choices
- Cooking ideas

Remember the previous messages in the conversation and use them
to give relevant follow-up answers.

Keep responses simple, practical and friendly.

If the user asks something unrelated to food or MealMate,
politely explain that you specialize in MealMate assistance.

Do not provide medical diagnosis.
        `,
      },
    });

    res.status(200).json({
      reply: response.text,
    });

  } catch (error) {
    console.error("Gemini AI Error:", error);

    res.status(500).json({
      message: "Failed to get AI response",
      error: error.message,
    });
  }
};

module.exports = {
  chatWithAI,
};

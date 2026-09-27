const { generateText } = require("../../config/openrouter");
const Recipe = require("../../models/user/Recipe");

const aiSystemInstruction = `
You are MealMate AI, a friendly food and meal assistant.

You help users with:
- Recipes
- Meal suggestions
- Meal planning
- Ingredients
- Grocery suggestions
- Healthy food choices
- Cooking ideas

Remember previous messages in the conversation and use them for relevant follow-up answers.
Keep responses simple, practical and friendly.
If the user asks something unrelated to food or MealMate, politely explain that you specialize in MealMate assistance.
Do not provide medical diagnosis.
`;

const handleAIError = (error, res, action) => {
  console.error(`OpenRouter ${action} Error:`, error);

  if (error.status === 401) {
    return res.status(502).json({ message: "MealMate AI configuration is invalid." });
  }

  if (error.status === 429) {
    return res.status(429).json({ message: "MealMate AI usage limit has been reached. Please try again later." });
  }

  if (error.status >= 500) {
    return res.status(503).json({ message: "MealMate AI is temporarily unavailable. Please try again later." });
  }

  return res.status(500).json({ message: `Failed to ${action.toLowerCase()}.` });
};

const chatWithAI = async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    const messages = [
      { role: "system", content: aiSystemInstruction },
      ...history
        .filter((msg) => msg.text)
        .map((msg) => ({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.text,
        })),
      { role: "user", content: message },
    ];

    const reply = await generateText({ messages });
    return res.status(200).json({ reply });
  } catch (error) {
    return handleAIError(error, res, "get AI response");
  }
};

const generateRecipe = async (req, res) => {
  try {
    const { ingredients, diet = "Any", category = "Other", mealName = "" } = req.body;

    if (!ingredients || !ingredients.trim()) {
      return res.status(400).json({ message: "Ingredients are required" });
    }

    const mealInstruction = mealName.trim()
      ? `The recipe should be specifically suitable for this planned meal: ${mealName}.`
      : "Create a suitable recipe from the ingredients.";

    const prompt = `
Create one practical recipe using these ingredients: ${ingredients}.
Diet preference: ${diet}.
Category: ${category}.
${mealInstruction}

Return ONLY valid JSON. Do not use markdown or code fences.
Use exactly this structure:
{
  "name": "Recipe name",
  "description": "Short description",
  "category": "Category",
  "diet": "Diet",
  "ingredients": ["ingredient with quantity"],
  "instructions": ["step 1", "step 2"],
  "prepTime": "30 minutes"
}
Do not invent medical claims. Keep the recipe realistic and easy to prepare.
`;

    const raw = await generateText({
      messages: [{ role: "user", content: prompt }],
      json: true,
    });

    const cleaned = raw.trim().replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
    const recipeData = JSON.parse(cleaned);

    const recipe = await Recipe.create({
      name: recipeData.name,
      description: recipeData.description || "",
      category: recipeData.category || category,
      diet: recipeData.diet || diet,
      ingredients: recipeData.ingredients || [],
      instructions: recipeData.instructions || [],
      prepTime: recipeData.prepTime || "",
      source: "ai",
    });

    return res.status(201).json({
      message: "Recipe generated successfully",
      recipe,
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return res.status(502).json({ message: "MealMate AI returned an invalid recipe response. Please try again." });
    }
    return handleAIError(error, res, "generate recipe");
  }
};

module.exports = { chatWithAI, generateRecipe };

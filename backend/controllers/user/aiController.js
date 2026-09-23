const ai = require("../../config/gemini");
const Recipe = require("../../models/user/Recipe");

const chatWithAI = async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    const contents = [];

    history.forEach((msg) => {
      if (!msg.text) return;
      contents.push({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.text }],
      });
    });

    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.6-flash",
      contents,
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

Remember the previous messages in the conversation and use them to give relevant follow-up answers.
Keep responses simple, practical and friendly.
If the user asks something unrelated to food or MealMate, politely explain that you specialize in MealMate assistance.
Do not provide medical diagnosis.
        `,
      },
    });

    res.status(200).json({ reply: response.text });
  } catch (error) {
    console.error("Gemini AI Error:", error);
    res.status(500).json({
      message: "Failed to get AI response",
      error: error.message,
    });
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

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const raw = response.text.trim();
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
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

    res.status(201).json({
      message: "Recipe generated successfully",
      recipe,
    });
  } catch (error) {
    console.error("Recipe Generation Error:", error);
    res.status(500).json({
      message: "Failed to generate recipe",
      error: error.message,
    });
  }
};

module.exports = {
  chatWithAI,
  generateRecipe,
};

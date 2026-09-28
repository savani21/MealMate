const Recipe = require("../../models/user/Recipe");

async function generateWithOpenRouter(messages, responseFormat) {
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "MealMate AI",
      },
      body: JSON.stringify({
        model: "openrouter/free",
        messages,
        ...(responseFormat
          ? { response_format: responseFormat }
          : {}),
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message ||
        `OpenRouter request failed with status ${response.status}`
    );
  }

  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("OpenRouter returned an empty AI response");
  }

  return content;
}

const chatWithAI = async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        message: "Message is required",
      });
    }

    const messages = [
      {
        role: "system",
        content: `You are MealMate AI, a friendly food and meal assistant.

You help users with:
- Recipes
- Meal suggestions
- Meal planning
- Ingredients
- Grocery suggestions
- Healthy food choices
- Cooking ideas

Remember previous messages and use them to give relevant follow-up answers.
Keep responses simple, practical and friendly.
If the user asks something unrelated to food or MealMate, politely explain that you specialize in MealMate assistance.
Do not provide medical diagnosis.`,
      },
    ];

    history.forEach((msg) => {
      if (!msg.text) return;

      messages.push({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.text,
      });
    });

    messages.push({
      role: "user",
      content: message,
    });

    const reply = await generateWithOpenRouter(messages);

    res.status(200).json({ reply });
  } catch (error) {
    console.error("OpenRouter AI Error:", error);

    res.status(500).json({
      message: "Failed to get AI response",
      error: error.message,
    });
  }
};

const generateRecipe = async (req, res) => {
  try {
    const {
      ingredients,
      diet = "Any",
      category = "Other",
      mealName = "",
    } = req.body;

    if (!ingredients || !ingredients.trim()) {
      return res.status(400).json({
        message: "Ingredients are required",
      });
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

Do not invent medical claims.
Keep the recipe realistic and easy to prepare.
`;

    const raw = await generateWithOpenRouter(
      [
        {
          role: "user",
          content: prompt,
        },
      ],
      {
        type: "json_object",
      }
    );

    const recipeData = JSON.parse(raw);

    const recipe = await Recipe.create({
      name: recipeData.name,
      description: recipeData.description || "",
      category: recipeData.category || category,
      diet: recipeData.diet || diet,
      ingredients: recipeData.ingredients || [],
      instructions: recipeData.instructions || [],
      prepTime: recipeData.prepTime || "",
      source: "ai",
      createdBy: req.user.id,
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

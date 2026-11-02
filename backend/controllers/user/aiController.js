const Recipe = require("../../models/user/Recipe");

async function generateWithOpenRouter(messages, responseFormat) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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
      ...(responseFormat ? { response_format: responseFormat } : {}),
    }),
    signal: AbortSignal.timeout(12000),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || `OpenRouter request failed with status ${response.status}`);
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenRouter returned an empty AI response");
  return content;
}

const chatWithAI = async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message || !message.trim()) return res.status(400).json({ message: "Message is required" });
    const messages = [{
      role: "system",
      content: `You are MealMate AI, a friendly food and meal assistant.
Help users with recipes, meal suggestions, meal planning, ingredients, grocery suggestions, healthy food choices and cooking ideas.
Keep responses simple, practical and friendly. If asked about unrelated topics, explain that you specialize in MealMate assistance. Do not provide medical diagnosis.`,
    }];
    history.forEach((msg) => {
      if (msg.text) messages.push({ role: msg.role === "user" ? "user" : "assistant", content: msg.text });
    });
    messages.push({ role: "user", content: message });
    const reply = await generateWithOpenRouter(messages);
    res.status(200).json({ reply });
  } catch (error) {
    console.error("OpenRouter AI Error:", error);
    res.status(500).json({ message: "Failed to get AI response", error: error.message });
  }
};

function buildFallbackRecipe({ ingredients, diet, category, mealName }) {
  const items = [...new Set(String(ingredients || "").split(",").map((item) => item.trim()).filter(Boolean))];
  const mainName = String(mealName || "").trim();
  const recipeName = mainName || (items.length ? items[0].replace(/\b\w/g, (letter) => letter.toUpperCase()) + " Quick Recipe" : "Quick Home-Style Recipe");
  return {
    name: recipeName,
    description: "A quick home-style recipe prepared using the ingredients selected in your meal plan.",
    slogan: "Simple ingredients, a satisfying homemade meal.",
    category: category || "Other",
    diet: diet || "Any",
    ingredients: items.length ? items : ["Available ingredients"],
    instructions: [
      "Wash, clean and prepare the selected ingredients.",
      "Heat a suitable pan or pot and add the required cooking medium if needed.",
      "Add the prepared ingredients and cook using a suitable method for this dish, stirring occasionally.",
      "Adjust seasoning using household staples as needed, check that everything is properly cooked, and serve hot."
    ],
    prepTime: "20 minutes"
  };
}
const generateRecipe = async (req, res) => {
  try {
    const { ingredients, diet = "Any", category = "Other", mealName = "" } = req.body;
    if (!ingredients || !ingredients.trim()) return res.status(400).json({ message: "Ingredients are required" });

    const mealInstruction = mealName.trim()
      ? `The recipe should be specifically suitable for this planned meal: ${mealName}.`
      : "Create a suitable recipe from the ingredients.";

    const prompt = `
Create one practical recipe using these ingredients: ${ingredients}.
Diet preference: ${diet}. Category: ${category}.
${mealInstruction}

Cuisine guidance:
- Prefer Indian home-style and regional Indian recipes by default whenever the supplied ingredients support them.
- Consider suitable options such as poha, upma, idli, dosa, paratha, thepla, dal, khichdi, pulao, rajma, chole, sabzi, paneer preparations, and Indian-style snacks.
- Treat these as examples, not a fixed list. Choose a recipe that genuinely fits the provided ingredients, meal category, diet preference, and allergies.
- Do not add unavailable ingredients just to make a dish Indian. If the ingredients do not suit an Indian recipe, create the best practical recipe from the supplied ingredients instead.
- Use familiar Indian cooking methods and flavors where appropriate, and avoid suggesting the same generic recipe repeatedly.

Return ONLY valid JSON with this exact structure:
{
  "name": "Recipe name",
  "description": "Short description",
  "slogan": "A creative recipe-specific tagline of 5 to 12 words",
  "category": "Category",
  "diet": "Diet",
  "ingredients": ["ingredient with quantity"],
  "instructions": ["step 1", "step 2"],
  "prepTime": "30 minutes"
}
The slogan must be original, specific to this recipe, friendly and no more than 12 words.
Do not invent medical claims. Keep the recipe realistic and easy to prepare.
`;

    let recipeData;
    let usedFallback = false;
    try {
      const raw = await generateWithOpenRouter([{ role: "user", content: prompt }], { type: "json_object" });
      recipeData = JSON.parse(raw);
      if (!recipeData || typeof recipeData !== "object" || !recipeData.name || !Array.isArray(recipeData.ingredients) || !Array.isArray(recipeData.instructions)) {
        throw new Error("AI returned an incomplete recipe");
      }
    } catch (aiError) {
      usedFallback = true;
      console.warn("AI recipe generation unavailable; using quick local fallback:", aiError.message);
      recipeData = buildFallbackRecipe({ ingredients, diet, category, mealName });
    }

    // Do not make a second AI request just to create a slogan.
    const slogan = String(
      recipeData.slogan || `A delicious way to enjoy ${recipeData.name || "everyday meals"}!`
    ).trim().split(/\s+/).slice(0, 12).join(" ");

    const recipe = await Recipe.create({
      name: recipeData.name,
      description: recipeData.description || "",
      slogan,
      category: recipeData.category || category,
      diet: recipeData.diet || diet,
      ingredients: recipeData.ingredients || [],
      instructions: recipeData.instructions || [],
      prepTime: recipeData.prepTime || "",
      source: "ai",
      createdBy: req.user.id,
    });

    res.status(201).json({ message: usedFallback ? "Recipe prepared using quick local generation because the AI service was slow or unavailable." : "Recipe generated successfully", recipe, usedFallback });
  } catch (error) {
    console.error("Recipe Generation Error:", error);
    res.status(500).json({ message: "Failed to generate recipe", error: error.message });
  }
};

module.exports = { chatWithAI, generateRecipe };

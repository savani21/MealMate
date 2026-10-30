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

    const raw = await generateWithOpenRouter([{ role: "user", content: prompt }], { type: "json_object" });
    const recipeData = JSON.parse(raw);
    let slogan = String(recipeData.slogan || "").trim();
    if (!slogan) {
      try {
        const sloganRaw = await generateWithOpenRouter(
          [{ role: "user", content: `Write one original 5-12 word slogan for the recipe "${recipeData.name}" made with ${JSON.stringify(recipeData.ingredients || [])}. Return only the slogan text.` }]
        );
        slogan = sloganRaw.replace(/^["']|["']$/g, "").trim().split(/\s+/).slice(0, 12).join(" ");
      } catch (sloganError) {
        console.warn("Slogan generation unavailable; using safe fallback:", sloganError.message);
        slogan = `A delicious new way to enjoy ${recipeData.name || "everyday meals"}!`;
      }
    }

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

    res.status(201).json({ message: "Recipe generated successfully", recipe });
  } catch (error) {
    console.error("Recipe Generation Error:", error);
    res.status(500).json({ message: "Failed to generate recipe", error: error.message });
  }
};

module.exports = { chatWithAI, generateRecipe };

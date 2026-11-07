const Recipe = require("../../models/user/Recipe");
const { normalizeIngredientName } = require("../../utils/ingredientMatcher");

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
      model: process.env.OPENROUTER_RECIPE_MODEL || "openrouter/free",
      messages,
      provider: { sort: "throughput", allow_fallbacks: true },
      ...(responseFormat ? { response_format: responseFormat } : {}),
    }),
    signal: AbortSignal.timeout(25000),
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
  const knownRecipes = {
    "chana masala": {
      ingredients: ["1 cup chickpeas (chana)", "1 onion, finely chopped", "2 tomatoes, chopped", "1 tsp ginger-garlic paste", "1 tbsp oil", "1 tsp cumin seeds", "1 tsp chana masala", "1/2 tsp turmeric", "1/2 tsp chilli powder", "Salt to taste", "Fresh coriander"],
      instructions: ["Soak chickpeas overnight and pressure-cook until soft; use cooked chickpeas if already prepared.", "Heat oil, add cumin, onion and ginger-garlic paste; sauté until fragrant.", "Add tomatoes, turmeric, chilli powder, chana masala and salt; cook until the masala thickens.", "Add cooked chickpeas with a little water and simmer for 10–12 minutes.", "Garnish with coriander and serve with rice or roti."]
    },
    "poha": {
      ingredients: ["1.5 cups poha (flattened rice)", "1 onion, chopped", "2 tbsp peanuts", "1 small potato, diced", "1 tbsp oil", "1/2 tsp mustard seeds", "1/2 tsp cumin seeds", "Curry leaves", "1/4 tsp turmeric", "Green chilli", "Salt to taste", "Lemon juice", "Fresh coriander"],
      instructions: ["Rinse poha briefly, drain and let it soften.", "Heat oil; add mustard seeds, cumin, curry leaves, peanuts and potato. Cook until the potato softens.", "Add onion, green chilli and turmeric; sauté until the onion turns translucent.", "Add softened poha and salt; mix gently and steam for 2–3 minutes.", "Finish with lemon juice and coriander; serve warm."]
    }
  };
  const known = knownRecipes[recipeName.toLowerCase()];
  const completeIngredients = known?.ingredients || (items.length ? items : ["Available ingredients"]);
  const instructions = known?.instructions || [
    "Wash, clean and prepare the ingredients.",
    "Heat a pan or pot and add oil or another suitable cooking medium.",
    "Cook the main ingredients with suitable seasoning until fully cooked, stirring as needed.",
    "Taste, adjust seasoning and serve hot."
  ];
  return {
    name: recipeName,
    description: `A practical home-style ${recipeName} recipe with clear ingredients and cooking steps.`,
    slogan: `Make ${recipeName} fresh and delicious at home.`,
    category: category || "Other",
    diet: diet || "Any",
    ingredients: completeIngredients,
    instructions,
    prepTime: "25 minutes"
  };
}
const generateRecipe = async (req, res) => {
  try {
    const { ingredients, diet = "Any", category = "Other", mealName = "" } = req.body;
    if (!ingredients || !ingredients.trim()) return res.status(400).json({ message: "Ingredients are required" });

    const mealInstruction = mealName.trim()
      ? `The recipe should be specifically suitable for this planned meal: ${mealName}.`
      : "Create a suitable recipe from the ingredients.";

    const normalizedMealName = normalizeIngredientName(mealName);
    const generationInputIngredients = [...new Set(String(ingredients).split(",").map(normalizeIngredientName).filter(Boolean))].sort();

    // Reuse an existing AI recipe for this user when meal name and input ingredients match.
    if (normalizedMealName && generationInputIngredients.length) {
      const previousRecipes = await Recipe.find({ createdBy: req.user.id, source: "ai" }).sort({ createdAt: -1 }).lean();
      const existingRecipe = previousRecipes.find((recipe) => {
        if (normalizeIngredientName(recipe.name) !== normalizedMealName) return false;
        const previousInputs = [...new Set((recipe.generationInputIngredients?.length ? recipe.generationInputIngredients : recipe.ingredients || []).map(normalizeIngredientName).filter(Boolean))].sort();
        return previousInputs.length === generationInputIngredients.length && previousInputs.every((item, index) => item === generationInputIngredients[index]);
      });
      if (existingRecipe) return res.status(200).json({ message: "You already generated this recipe. Opening your existing recipe.", recipe: existingRecipe, reused: true, usedFallback: false });
    }

    const prompt = `
Create one complete, practical recipe for the planned meal: ${mealName || "a suitable meal"}.
The user's pantry/selected ingredients are: ${ingredients}.
Diet preference: ${diet}. Category: ${category}.
Treat the supplied ingredients as what the user has available, NOT as a strict limit on the recipe. Include all essential ingredients normally required to make this dish properly, even when they are not in the supplied list, and clearly list them so the user can buy missing items.
${mealInstruction}

Cuisine guidance:
- Prefer Indian home-style and regional Indian recipes by default whenever the supplied ingredients support them.
- Consider suitable options such as poha, upma, idli, dosa, paratha, thepla, dal, khichdi, pulao, rajma, chole, sabzi, paneer preparations, and Indian-style snacks.
- Treat these as examples, not a fixed list. Choose a recipe that genuinely fits the provided ingredients, meal category, diet preference, and allergies.
- Do not add unnecessary ingredients just to make a dish Indian. Include essential cooking ingredients and seasonings needed for a complete recipe. If the supplied ingredients do not suit an Indian recipe, create the best practical recipe instead.
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

    // Check the final AI title too, so generated variants cannot create duplicates.
    const normalizedGeneratedName = normalizeIngredientName(recipeData.name);
    const sameTitleRecipes = await Recipe.find({ createdBy: req.user.id, source: "ai" }).sort({ createdAt: -1 }).lean();
    const matchingGeneratedRecipe = sameTitleRecipes.find((recipe) => {
      if (normalizeIngredientName(recipe.name) !== normalizedGeneratedName) return false;
      const previousInputs = [...new Set((recipe.generationInputIngredients || []).map(normalizeIngredientName).filter(Boolean))].sort();
      return previousInputs.length === generationInputIngredients.length && previousInputs.every((item, index) => item === generationInputIngredients[index]);
    });
    if (matchingGeneratedRecipe) return res.status(200).json({ message: "You already generated this recipe. Opening your existing recipe.", recipe: matchingGeneratedRecipe, reused: true, usedFallback });

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
      generationMealName: normalizedGeneratedName,
      generationInputIngredients,
      createdBy: req.user.id,
    });

    res.status(201).json({ message: usedFallback ? "Recipe prepared using quick local generation because the AI service was slow or unavailable." : "Recipe generated successfully", recipe, usedFallback });
  } catch (error) {
    console.error("Recipe Generation Error:", error);
    res.status(500).json({ message: "Failed to generate recipe", error: error.message });
  }
};

module.exports = { chatWithAI, generateRecipe };

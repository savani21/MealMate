const Recipe = require("../../models/user/Recipe");
const RecipeReview = require("../../models/user/RecipeReview");

const getRecipes = async (req, res) => {
  try {
    const [recipes, reviewStats] = await Promise.all([
      Recipe.find().sort({ createdAt: -1 }).lean(),
      RecipeReview.aggregate([
        {
          $group: {
            _id: "$recipe",
            ratingCount: { $sum: 1 },
            averageRating: { $avg: "$rating" },
          },
        },
      ]),
    ]);

    const statsByRecipe = Object.fromEntries(
      reviewStats.map((item) => [
        item._id.toString(),
        {
          ratingCount: item.ratingCount,
          averageRating: Number(item.averageRating.toFixed(1)),
        },
      ])
    );

    const recipesWithRatings = recipes.map((recipe) => ({
      ...recipe,
      ratingCount: statsByRecipe[recipe._id.toString()]?.ratingCount || 0,
      averageRating: statsByRecipe[recipe._id.toString()]?.averageRating || 0,
    }));

    res.status(200).json({ success: true, recipes: recipesWithRatings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to get recipes" });
  }
};

const getRecipeById = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ success: false, message: "Recipe not found" });
    }
    res.status(200).json({ success: true, recipe });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to get recipe" });
  }
};

const createRecipe = async (req, res) => {
  try {
    const { name, description, category, diet, ingredients, instructions, prepTime, image } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Recipe name is required" });
    }

    const recipe = await Recipe.create({
      name, description, category, diet, ingredients, instructions, prepTime, image,
    });

    res.status(201).json({ success: true, message: "Recipe created successfully", recipe });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to create recipe" });
  }
};

const updateRecipe = async (req, res) => {
  try {
    const { name, description, category, diet, ingredients, instructions, prepTime, image } = req.body;

    const recipe = await Recipe.findByIdAndUpdate(
      req.params.id,
      { name, description, category, diet, ingredients, instructions, prepTime, image },
      { returnDocument: "after", runValidators: true }
    );

    if (!recipe) {
      return res.status(404).json({ success: false, message: "Recipe not found" });
    }

    res.status(200).json({ success: true, message: "Recipe updated successfully", recipe });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to update recipe" });
  }
};

const deleteRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findByIdAndDelete(req.params.id);
    if (!recipe) {
      return res.status(404).json({ success: false, message: "Recipe not found" });
    }
    await RecipeReview.deleteMany({ recipe: recipe._id });
    res.status(200).json({ success: true, message: "Recipe deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to delete recipe" });
  }
};


const generateRecipeImage = async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ success: false, message: "Add OPENAI_API_KEY to backend environment variables to enable image generation." });
    }
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ success: false, message: "Recipe not found" });

    const diet = String(recipe.diet || "Any").toLowerCase();
    const vegetarian = diet === "vegetarian" || diet === "vegan";
    const eggetarian = diet === "eggetarian";
    const dietRule = vegetarian
      ? "STRICTLY VEGETARIAN. Do not show meat, poultry, fish, seafood or eggs."
      : eggetarian
        ? "EGGETARIAN. Eggs are allowed, but do not show meat, poultry, fish or seafood."
        : diet === "non-vegetarian"
          ? "Show only animal protein explicitly present in the ingredients."
          : "Follow the ingredients exactly. Do not add animal products not listed.";
    const prompt = [
      "Photorealistic professional food photography for a recipe card.",
      "Exact dish:", recipe.name + ".",
      "Description:", recipe.description || "Not provided.",
      "Ingredients:", (recipe.ingredients || []).join(", ") || "Use ingredients implied by the dish name.",
      "Diet:", recipe.diet || "Not specified.", dietRule,
      "Show the finished dish clearly, matching its name and ingredients. Appetizing natural light, realistic texture, clean plate, tasteful neutral tabletop, 45-degree food photography.",
      "No text, no watermark, no collage, no unrelated food, no people or hands."
    ].join(" ");

    const apiResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-2.5-flare",
        prompt,
        size: "1024x1024",
        quality: "low",
        output_format: "webp",
        output_compression: 82,
        n: 1
      })
    });
    const result = await apiResponse.json();
    if (!apiResponse.ok) {
      console.error("Image API error:", result);
      return res.status(apiResponse.status === 429 ? 429 : 502).json({
        success: false,
        message: result.error?.message || "Image generation failed. Check API key, billing and model access."
      });
    }
    const image = result.data?.[0]?.b64_json;
    if (!image) return res.status(502).json({ success: false, message: "No image was returned." });

    recipe.image = `data:image/webp;base64,${image}`;
    recipe.imageGeneratedAt = new Date();
    await recipe.save();
    return res.json({ success: true, message: "Image generated and saved.", recipe });
  } catch (error) {
    console.error("Generate recipe image error:", error);
    return res.status(500).json({ success: false, message: "Unable to generate recipe image." });
  }
};

module.exports = { getRecipes, getRecipeById, createRecipe, updateRecipe, deleteRecipe, generateRecipeImage };

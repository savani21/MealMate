const { normalizeIngredientName } = require("../../utils/ingredientMatcher");
const { DIET_FORBIDDEN } = require("./validationService");

// Deterministic pantry-only recipe catalogue and fallback generator.
function makeIngredient(name, quantity) {
  return { name, quantity };
}

const CANONICAL_RECIPE_INGREDIENTS = {
  "vegetable pulao": [
    ["Rice", "1/2 cup"], ["Mixed vegetables (carrot, peas, beans)", "3/4 cup"],
    ["Onion", "1/2 medium"], ["Ginger-garlic", "1 tsp"], ["Cumin seeds", "1/2 tsp"],
    ["Bay leaf", "1"], ["Cloves", "2"], ["Cardamom", "1"], ["Cinnamon", "1 small piece"],
    ["Turmeric", "1/4 tsp"], ["Garam masala", "1/4 tsp"], ["Oil or ghee", "1 tbsp"],
    ["Salt", "to taste"], ["Water", "1 cup"], ["Coriander leaves", "1 tbsp"]
  ],
  "poha": [
    ["Poha (flattened rice)", "1 cup"], ["Onion", "1/2 medium"], ["Potato", "1/2 medium"],
    ["Peanuts", "1 tbsp"], ["Oil", "1 tbsp"], ["Mustard seeds", "1/2 tsp"],
    ["Cumin seeds", "1/4 tsp"], ["Turmeric", "1/4 tsp"], ["Green chilli", "1"],
    ["Curry leaves", "5-6"], ["Salt", "to taste"], ["Lemon juice", "1 tsp"], ["Coriander leaves", "1 tbsp"]
  ],
  "paneer sandwich": [
    ["Bread slices", "2"], ["Paneer", "75 g"], ["Onion", "2 tbsp, chopped"],
    ["Tomato", "2 slices"], ["Green chilli", "1/2, optional"], ["Butter", "1 tsp"],
    ["Salt", "to taste"], ["Black pepper", "1/4 tsp"]
  ],
  "paneer bhurji with roti": [
    ["Paneer", "100 g"], ["Wheat flour", "1/2 cup"], ["Onion", "1/2 medium"],
    ["Tomato", "1 small"], ["Green chilli", "1"], ["Ginger-garlic", "1 tsp"],
    ["Turmeric", "1/4 tsp"], ["Red chilli powder", "1/4 tsp"], ["Garam masala", "1/4 tsp"],
    ["Oil", "2 tsp"], ["Salt", "to taste"], ["Coriander leaves", "1 tbsp"], ["Water", "as required"]
  ],
  "paneer rice bowl": [
    ["Paneer", "100 g"], ["Rice", "1/2 cup"], ["Onion", "1/2 medium"],
    ["Tomato", "1 small"], ["Ginger-garlic", "1 tsp"], ["Cumin seeds", "1/2 tsp"],
    ["Turmeric", "1/4 tsp"], ["Garam masala", "1/4 tsp"], ["Oil", "1 tbsp"],
    ["Salt", "to taste"], ["Coriander leaves", "1 tbsp"], ["Water", "1 cup"]
  ],
  "chana masala": [
    ["Chickpeas (chana)", "3/4 cup cooked"], ["Onion", "1 medium"], ["Tomato", "1 medium"],
    ["Ginger-garlic", "1 tsp"], ["Chana masala", "1 tsp"], ["Cumin seeds", "1/2 tsp"],
    ["Turmeric", "1/4 tsp"], ["Oil", "1 tbsp"], ["Salt", "to taste"],
    ["Water", "1/2 cup"], ["Coriander leaves", "1 tbsp"], ["Lemon juice", "1 tsp"]
  ],
  "dal rice": [
    ["Rice", "1/2 cup"], ["Toor dal", "1/3 cup"], ["Onion", "1/2 medium"],
    ["Tomato", "1 small"], ["Garlic", "2 cloves"], ["Turmeric", "1/4 tsp"],
    ["Cumin seeds", "1/2 tsp"], ["Ghee or oil", "1 tsp"], ["Salt", "to taste"], ["Water", "as required"]
  ],
  "tomato pulao": [
    ["Rice", "1/2 cup"], ["Tomato", "2 medium"], ["Onion", "1/2 medium"],
    ["Ginger-garlic", "1 tsp"], ["Green chilli", "1"], ["Cumin seeds", "1/2 tsp"],
    ["Garam masala", "1/4 tsp"], ["Oil", "1 tbsp"], ["Salt", "to taste"],
    ["Water", "1 cup"], ["Coriander leaves", "1 tbsp"]
  ],
  "vegetable khichdi": [
    ["Rice", "1/3 cup"], ["Moong dal", "1/3 cup"], ["Mixed vegetables", "1/2 cup"],
    ["Onion", "1/2 medium"], ["Turmeric", "1/4 tsp"], ["Cumin seeds", "1/2 tsp"],
    ["Ghee", "1 tsp"], ["Salt", "to taste"], ["Water", "2 cups"]
  ],
  "roti with aloo sabzi": [
    ["Wheat flour", "1/2 cup"], ["Potatoes", "2 small"], ["Tomato", "1 small"],
    ["Onion", "1/2 medium"], ["Cumin seeds", "1/2 tsp"], ["Turmeric", "1/4 tsp"],
    ["Red chilli powder", "1/4 tsp"], ["Oil", "1 tbsp"], ["Salt", "to taste"],
    ["Water", "as required"], ["Coriander leaves", "1 tbsp"]
  ],
  "vegetable upma": [
    ["Semolina (rava)", "1/2 cup"], ["Onion", "1/2 medium"], ["Mixed vegetables", "1/3 cup"],
    ["Green chilli", "1"], ["Mustard seeds", "1/2 tsp"], ["Curry leaves", "5-6"],
    ["Oil or ghee", "1 tbsp"], ["Salt", "to taste"], ["Water", "1 1/2 cups"], ["Lemon juice", "1 tsp"]
  ]
};

function getCanonicalRecipeIngredients(recipeName) {
  const key = String(recipeName || "").trim().toLowerCase();
  const list = CANONICAL_RECIPE_INGREDIENTS[key];
  return list ? list.map(([name, quantity]) => makeIngredient(name, quantity)) : null;
}

function pickIngredients(pool, keywords, count = 3) {
  const lower = pool.map((item) => item.toLowerCase());
  const picked = [];

  keywords.forEach((keyword) => {
    const index = lower.findIndex(
      (item) => item.includes(keyword) && !picked.includes(pool[index])
    );
    if (index >= 0) picked.push(pool[index]);
  });

  for (const item of pool) {
    if (picked.length >= count) break;
    if (!picked.includes(item)) picked.push(item);
  }

  return picked.slice(0, Math.max(1, count)).map((name) =>
    makeIngredient(name, "as needed")
  );
}

function localMeal(name, pool, keywords, count = 3) {
  return {
    name,
    ingredients: pickIngredients(pool, keywords, count),
  };
}

function buildLocalOptions(pool, type, dayNumber, diet) {
  // Each recipe has defining ingredient groups. A recipe is offered only
  // when every defining group is present in the user's allowed ingredient pool.
  // Additional ingredients are included only when the user selected them.
  const recipes = {
    breakfast: [
      { name: "Poha", required: [["poha", "flattened rice"]] },
      { name: "Vegetable Upma", required: [["rava", "sooji", "semolina"]] },
      { name: "Besan Chilla", required: [["besan", "gram flour"]] },
      { name: "Aloo Paratha", required: [["wheat", "atta"], ["potato", "aloo"]] },
      { name: "Paneer Bhurji", required: [["paneer"], ["onion", "tomato"]] },
      { name: "Paneer Sandwich", required: [["paneer"], ["bread"]] },
      { name: "Vegetable Sandwich", required: [["bread"], ["potato", "carrot", "cucumber", "tomato"]] },
      { name: "Dalia Upma", required: [["dalia", "broken wheat"]] },
      { name: "Moong Dal Chilla", required: [["moong dal", "mung dal"]] },
      { name: "Thepla", required: [["wheat", "atta"], ["methi", "fenugreek"]] },
      { name: "Masala Vegetable Noodles", required: [["noodles"], ["vegetable", "carrot", "peas", "capsicum"]] },
      { name: "Indian Vegetable Pasta", required: [["pasta"], ["vegetable", "carrot", "peas", "capsicum"]] },
      { name: "Vegetable Rice", required: [["rice"], ["vegetable", "carrot", "peas", "capsicum"]] },
    ],
    lunch: [
      { name: "Dal Rice", required: [["rice"], ["dal", "lentil"]] },
      { name: "Vegetable Pulao", required: [["rice"], ["vegetable", "carrot", "peas", "beans"]] },
      { name: "Rajma Chawal", required: [["rajma", "kidney bean"], ["rice"]] },
      { name: "Chole Chawal", required: [["chana", "chickpea"], ["rice"]] },
      { name: "Vegetable Khichdi", required: [["rice"], ["dal", "lentil"]] },
      { name: "Tomato Rice", required: [["rice"], ["tomato"]] },
      { name: "Jeera Rice", required: [["rice"], ["cumin", "jeera"]] },
      { name: "Paneer Masala", required: [["paneer"], ["tomato"]] },
      { name: "Aloo Roti", required: [["potato", "aloo"], ["wheat", "atta"]] },
      { name: "Kadhi Chawal", required: [["curd", "yogurt"], ["besan", "gram flour"], ["rice"]] },
      { name: "Masala Vegetable Noodles", required: [["noodles"], ["vegetable", "carrot", "peas", "capsicum"]] },
      { name: "Indian Vegetable Pasta", required: [["pasta"], ["vegetable", "carrot", "peas", "capsicum"]] },
      { name: "Vegetable Fried Rice", required: [["rice"], ["vegetable", "carrot", "peas", "capsicum"]] },
    ],
    dinner: [
      { name: "Dal Khichdi", required: [["rice"], ["dal", "lentil"]] },
      { name: "Roti with Aloo Sabzi", required: [["wheat", "atta"], ["potato", "aloo"]] },
      { name: "Paneer Bhurji with Roti", required: [["paneer"], ["wheat", "atta"]] },
      { name: "Tomato Pulao", required: [["rice"], ["tomato"]] },
      { name: "Vegetable Dalia", required: [["dalia", "broken wheat"], ["vegetable", "carrot", "peas"]] },
      { name: "Curd Rice", required: [["rice"], ["curd", "yogurt"]] },
      { name: "Moong Dal Khichdi", required: [["rice"], ["moong dal", "mung dal"]] },
      { name: "Chana Masala with Roti", required: [["chana", "chickpea"], ["wheat", "atta"]] },
      { name: "Vegetable Pulao", required: [["rice"], ["vegetable", "carrot", "peas", "beans"]] },
      { name: "Jeera Rice with Dal", required: [["rice"], ["cumin", "jeera"], ["dal", "lentil"]] },
      { name: "Masala Vegetable Noodles", required: [["noodles"], ["vegetable", "carrot", "peas", "capsicum"]] },
      { name: "Indian Vegetable Pasta", required: [["pasta"], ["vegetable", "carrot", "peas", "capsicum"]] },
      { name: "Vegetable Fried Rice", required: [["rice"], ["vegetable", "carrot", "peas", "capsicum"]] },
      { name: "Capsicum Rice", required: [["rice"], ["capsicum"]] },
    ],
  };

  const normalizedPool = pool.map((name) => ({
    name,
    normalized: normalizeIngredientName(name),
    lower: String(name).toLowerCase(),
  }));
  const matches = (entry, aliases) => aliases.some((alias) =>
    entry.lower.includes(alias) || entry.normalized.includes(normalizeIngredientName(alias))
  );

  const valid = (recipes[type] || recipes.lunch)
    .filter((recipe) =>
      !DIET_FORBIDDEN[diet]?.test(recipe.name) &&
      recipe.required.every((group) => normalizedPool.some((entry) => matches(entry, group)))
    )
    .map((recipe) => {
      const relevant = normalizedPool
        .filter((entry) => recipe.required.some((group) => matches(entry, group)))
        .map((entry) => entry.name);
      // Include other selected pantry ingredients that can reasonably be used
      // in the dish, but never add an ingredient the user did not select.
      const optional = normalizedPool
        .filter((entry) => /onion|tomato|garlic|ginger|chilli|pepper|salt|oil|ghee|cumin|turmeric|coriander|peas|carrot|beans|potato|lemon/i.test(entry.lower))
        .map((entry) => entry.name);
      const ingredients = [...new Map([...relevant, ...optional].map((name) => [
        normalizeIngredientName(name), name
      ])).values()];
      return { ...recipe, ingredients };
    });

  // Do not invent dish names or append artificial "Bowl 1/2/3" labels.
  // If the selected pantry cannot support three distinct Indian recipes,
  // return the genuine recipes that can be prepared from those ingredients.
  return valid.slice(0, 3).map((recipe, index) => {
    // Use measured quantities from MealMate's canonical recipe catalogue,
    // retaining only ingredients that are actually present in the allowed pool.
    // Never invent "as needed" quantities for nutrition calculations.
    const canonical = getCanonicalRecipeIngredients(recipe.name) || [];
    const measuredIngredients = canonical.flatMap((item) => {
      const canonicalName = String(item.name || "").toLowerCase();
      const normalizedCanonical = normalizeIngredientName(item.name);
      const match = normalizedPool.find((entry) =>
        entry.normalized === normalizedCanonical ||
        canonicalName.includes(entry.lower) ||
        entry.lower.includes(normalizedCanonical)
      );
      return match ? [{ name: match.name, quantity: item.quantity }] : [];
    });
    return {
      name: recipe.name,
      description: `${recipe.name} prepared with your selected pantry ingredients.`,
      prepTime: index === 0 ? "20 minutes" : "25 minutes",
      ingredients: measuredIngredients.length
        ? measuredIngredients
        : recipe.ingredients.map((name) => ({ name, quantity: "quantity not specified" })),
    };
  });
}

function generateLocalMealPlan({ duration, diet, allowedPool }) {
  const pool = [...new Set(allowedPool)].filter((item) =>
    !DIET_FORBIDDEN[diet]?.test(item)
  );
  if (!pool.length) {
    throw new Error(`No allowed ingredients are available for the selected ${diet} diet.`);
  }
  const days = [];
  for (let day = 1; day <= Number(duration); day += 1) {
    const breakfastOptions = buildLocalOptions(pool, "breakfast", day, diet);
    const lunchOptions = buildLocalOptions(pool, "lunch", day, diet);
    const dinnerOptions = buildLocalOptions(pool, "dinner", day, diet);
    days.push({
      day,
      breakfast: breakfastOptions[0].name,
      breakfastIngredients: breakfastOptions[0].ingredients,
      breakfastOptions,
      lunch: lunchOptions[0].name,
      lunchIngredients: lunchOptions[0].ingredients,
      lunchOptions,
      dinner: dinnerOptions[0].name,
      dinnerIngredients: dinnerOptions[0].ingredients,
      dinnerOptions,
    });
  }
  return { days };
}

module.exports = { buildLocalOptions, generateLocalMealPlan };

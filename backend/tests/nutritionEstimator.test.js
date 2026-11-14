const test = require("node:test");
const assert = require("node:assert/strict");
const { estimateRecipeNutrition, parseIngredient } = require("../services/nutritionEstimator");

test("calculates per-serving nutrition from recognized ingredient quantities", () => {
  const result = estimateRecipeNutrition(["1 banana", "1 cup oats"], 2);
  assert.equal(result.status, "estimated");
  assert.ok(result.calories > 0);
  assert.ok(result.protein > 0);
  assert.equal(result.servings, 2);
  assert.equal(result.missingIngredients.length, 0);
});

test("calculates nutrition from structured AI ingredient objects", () => {
  const result = estimateRecipeNutrition([
    { name: "wheat flour", quantity: "1 cup" },
    { name: "banana", quantity: "1 medium" },
    { name: "milk", quantity: "1 cup" },
    { name: "cooking oil", quantity: "1 tsp" },
  ], 2);
  assert.equal(result.status, "estimated");
  assert.ok(result.calories > 0);
  assert.ok(result.protein > 0);
  assert.equal(result.servings, 2);
  assert.equal(result.missingIngredients.length, 0);
});

test("flags fallback ingredients with no measurable quantity", () => {
  const result = parseIngredient({ name: "poha", quantity: "as needed" });
  assert.equal(result.error, "Quantity not recognized");
});

test("parses fractional ingredient quantities", () => {
  const result = estimateRecipeNutrition(["1/2 cup oats"], 1);
  assert.equal(result.status, "estimated");
  assert.ok(result.calories > 0);
});

test("marks unsupported ingredients as a partial estimate instead of ignoring them", () => {
  const result = estimateRecipeNutrition(["1 banana", "2 tbsp unknown herb"], 1);
  assert.equal(result.status, "partial_estimate");
  assert.equal(result.missingIngredients.length, 1);
});

test("parses ingredients when quantity follows the ingredient name", () => {
  const flour = parseIngredient("wheat flour 1 cup (have)");
  const banana = parseIngredient("ripe banana 1 medium (have)");
  const milk = parseIngredient("milk 1 cup (have)");
  const oil = parseIngredient("cooking oil 2 tbsp (have)");
  assert.equal(flour.name, "wheat flour");
  assert.equal(banana.name, "banana");
  assert.equal(milk.name, "milk");
  assert.equal(oil.name, "oil");
  assert.ok(flour.grams > 0 && banana.grams > 0 && milk.grams > 0 && oil.grams > 0);
});

test("calculates non-zero nutrition for the ingredient format used by AI recipes", () => {
  const result = estimateRecipeNutrition([
    "wheat flour 1 cup (have)",
    "ripe banana 1 medium (have)",
    "milk 1 cup (have)",
    "cooking oil 2 tbsp (have)",
    "baking powder 1 tsp",
    "cardamom powder 1/2 tsp",
    "sugar 2 tbsp (missing, for sweetness)"
  ], 1);
  assert.equal(result.status, "estimated");
  assert.ok(result.calories > 0);
  assert.ok(result.protein > 0);
  assert.ok(result.carbohydrates > 0);
  assert.ok(result.fat > 0);
  assert.equal(result.missingIngredients.length, 0);
});

test("USDA estimator falls back to parsed local ingredient values when no API key is configured", async () => {
  const previousKey = process.env.USDA_FDC_API_KEY;
  delete process.env.USDA_FDC_API_KEY;
  try {
    const { estimateRecipeNutritionWithUSDA } = require("../services/nutritionEstimator");
    const result = await estimateRecipeNutritionWithUSDA([
      "wheat flour 1 cup (have)",
      "ripe banana 1 medium (have)",
      "milk 1 cup (have)",
      "cooking oil 2 tbsp (have)",
      "baking powder 1 tsp",
      "cardamom powder 1/2 tsp",
      "sugar 2 tbsp (missing, for sweetness)"
    ], 1);
    assert.equal(result.status, "estimated");
    assert.ok(result.calories > 0);
    assert.ok(result.protein > 0);
    assert.equal(result.missingIngredients.length, 0);
  } finally {
    if (previousKey === undefined) delete process.env.USDA_FDC_API_KEY;
    else process.env.USDA_FDC_API_KEY = previousKey;
  }
});

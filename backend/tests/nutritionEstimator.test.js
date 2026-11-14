const test = require("node:test");
const assert = require("node:assert/strict");
const { estimateRecipeNutrition } = require("../services/nutritionEstimator");

test("calculates per-serving nutrition from recognized ingredient quantities", () => {
  const result = estimateRecipeNutrition(["1 banana", "1 cup oats"], 2);
  assert.equal(result.status, "estimated");
  assert.ok(result.calories > 0);
  assert.ok(result.protein > 0);
  assert.equal(result.servings, 2);
  assert.equal(result.missingIngredients.length, 0);
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

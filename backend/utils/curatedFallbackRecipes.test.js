const test = require("node:test");
const assert = require("node:assert/strict");
const { buildCuratedFallback, curatedRecipeCount } = require("./curatedFallbackRecipes");

test("contains at least 30 curated recipes", () => {
  assert.ok(curatedRecipeCount >= 30, `Expected at least 30 recipes, got ${curatedRecipeCount}`);
});

test("matches breakfast recipes using normalized available ingredients", () => {
  const recipe = buildCuratedFallback({
    ingredients: "flattened rice, onion, peanuts, potato",
    diet: "Vegan",
    category: "Breakfast",
  });
  assert.equal(recipe.name, "Poha");
  assert.equal(recipe.category, "Breakfast");
  assert.equal(recipe.diet, "Vegan");
  assert.ok(recipe.instructions.length >= 4);
});

test("respects vegetarian preference", () => {
  const recipe = buildCuratedFallback({
    ingredients: "paneer, onion, tomato",
    diet: "Vegetarian",
    category: "Dinner",
  });
  assert.ok(recipe);
  assert.notEqual(recipe.diet, "Non-Vegetarian");
});

test("respects vegan preference and excludes dairy recipes", () => {
  const recipe = buildCuratedFallback({
    ingredients: "oats, carrot, peas, onion",
    diet: "Vegan",
    category: "Dinner",
  });
  assert.equal(recipe.name, "Masala Oats");
  assert.equal(recipe.diet, "Vegan");
});

test("prefers the requested meal category when multiple recipes match", () => {
  const recipe = buildCuratedFallback({
    ingredients: "rice, onion, tomato",
    diet: "Any",
    category: "Dinner",
  });
  assert.equal(recipe.category, "Dinner");
});

test("returns null rather than inventing a curated match when ingredients do not match", () => {
  const recipe = buildCuratedFallback({
    ingredients: "dragon fruit, cocoa nibs",
    diet: "Vegan",
    category: "Snacks",
  });
  assert.equal(recipe, null);
});

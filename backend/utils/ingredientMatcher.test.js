const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeIngredientName } = require("./ingredientMatcher");

test("normalizes common ingredient aliases", () => {
  assert.equal(normalizeIngredientName("green chilli"), "green chili");
  assert.equal(normalizeIngredientName("green chili"), "green chili");
  assert.equal(normalizeIngredientName("atta"), "wheat flour");
  assert.equal(normalizeIngredientName("basmati rice"), "rice");
  assert.equal(normalizeIngredientName("cooking oil"), "oil");
});

test("removes preparation descriptors without changing the ingredient", () => {
  assert.equal(normalizeIngredientName("fresh coriander leaves, chopped"), "coriander leaf");
  assert.equal(normalizeIngredientName("finely diced tomatoes"), "tomato");
});

test("normalizes irregular and regular plurals", () => {
  assert.equal(normalizeIngredientName("potatoes"), "potato");
  assert.equal(normalizeIngredientName("tomatoes"), "tomato");
  assert.equal(normalizeIngredientName("green chillies"), "green chili");
  assert.equal(normalizeIngredientName("carrots"), "carrot");
});

test("does not collapse different ingredients into the same name", () => {
  assert.notEqual(normalizeIngredientName("green chili"), normalizeIngredientName("green peas"));
  assert.notEqual(normalizeIngredientName("coriander leaf"), normalizeIngredientName("curry leaf"));
});

test("handles empty and non-string input safely", () => {
  assert.equal(normalizeIngredientName(""), "");
  assert.equal(normalizeIngredientName(null), "");
  assert.equal(normalizeIngredientName(undefined), "");
});

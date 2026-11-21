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

test("matches recipe quantities and units by ingredient identity", () => {
  assert.equal(normalizeIngredientName("1 onion"), "onion");
  assert.equal(normalizeIngredientName("2 medium onions"), "onion");
  assert.equal(normalizeIngredientName("1 cup chopped onion"), "onion");
  assert.equal(normalizeIngredientName("1 tomato"), "tomato");
  assert.equal(normalizeIngredientName("500 gm tomatoes"), "tomato");
  assert.equal(normalizeIngredientName("Tomato 500 g"), "tomato");
});

test("normalizes tablespoon and teaspoon ingredient quantities", () => {
  assert.equal(normalizeIngredientName("2 tbsp oil"), "oil");
  assert.equal(normalizeIngredientName("1 tablespoon butter"), "butter");
  assert.equal(normalizeIngredientName("½ tbsp ginger paste"), "ginger paste");
  assert.equal(normalizeIngredientName("1 tsp salt"), "salt");
  assert.equal(normalizeIngredientName("2 teaspoons cumin"), "cumin");
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

test("water is a common household ingredient, not a grocery item", () => {
  const { isCommonHouseholdIngredient } = require("./ingredientMatcher");
  assert.equal(isCommonHouseholdIngredient("water"), true);
  assert.equal(isCommonHouseholdIngredient("2 cups water"), true);
  assert.equal(isCommonHouseholdIngredient("Water for dough"), true);
  assert.equal(isCommonHouseholdIngredient("water as needed"), true);
  assert.equal(isCommonHouseholdIngredient("water chestnut"), false);
  assert.equal(isCommonHouseholdIngredient("tomato"), false);
});

test("matches common Indian names while keeping misspellings distinct", () => {
  assert.equal(normalizeIngredientName("aloo"), "potato");
  assert.equal(normalizeIngredientName("batata"), "potato");
  assert.equal(normalizeIngredientName("potato"), "potato");
  assert.notEqual(normalizeIngredientName("potato"), normalizeIngredientName("potatto"));
});

test("removes multiple preparation words but preserves recipe wording elsewhere", () => {
  assert.equal(normalizeIngredientName("boiled mashed potatoes"), "potato");
  assert.equal(normalizeIngredientName("finely chopped boiled potato"), "potato");
});

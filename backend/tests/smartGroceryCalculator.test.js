const test = require("node:test");
const assert = require("node:assert/strict");
const { calculateSmartGroceryItems, parseQuantity } = require("../utils/smartGroceryCalculator");

const required = (name, quantity, mealName = "Test meal") => ({
  name, quantity, mealName, day: 1, mealType: "Lunch",
});

test("calculates a partial mass shortage across Pantry batches", () => {
  const result = calculateSmartGroceryItems({
    requiredItems: [required("rice", "500 g")],
    pantryItems: [
      { name: "rice", quantity: 100, unit: "g", expiryDate: null },
      { name: "Rice", quantity: 0.1, unit: "kg", expiryDate: null },
    ],
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].name, "rice");
  assert.equal(result[0].quantity, "300 g");
});

test("combines duplicate requirements before subtracting Pantry stock", () => {
  const result = calculateSmartGroceryItems({
    requiredItems: [required("tomato", "200 g"), required("tomatoes", "300 g", "Dinner")],
    pantryItems: [{ name: "tomato", quantity: 250, unit: "g", expiryDate: null }],
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].quantity, "250 g");
  assert.equal(result[0].mealType, "Combined");
});

test("converts cups, tablespoons and teaspoons to the same volume base", () => {
  assert.equal(parseQuantity("2 cups").baseAmount, 500);
  assert.equal(parseQuantity("2 tbsp").baseAmount, 30);
  assert.equal(parseQuantity("1 tsp").baseAmount, 5);
  const result = calculateSmartGroceryItems({
    requiredItems: [required("milk", "2 cups")],
    pantryItems: [{ name: "milk", quantity: 300, unit: "ml", expiryDate: null }],
  });
  assert.equal(result[0].quantity, "200 ml");
});

test("does not treat expired stock as available", () => {
  const result = calculateSmartGroceryItems({
    requiredItems: [required("onion", "500 g")],
    pantryItems: [{ name: "onion", quantity: 500, unit: "g", expiryDate: new Date("2020-01-01T00:00:00.000Z") }],
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].quantity, "500 g");
});

test("does not convert mass into volume or count", () => {
  const result = calculateSmartGroceryItems({
    requiredItems: [required("oil", "1 litre")],
    pantryItems: [{ name: "oil", quantity: 500, unit: "g", expiryDate: null }],
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].quantity, "1000 ml");
});

test("omits explicit user-confirmed available ingredients and water", () => {
  const result = calculateSmartGroceryItems({
    requiredItems: [required("rice", "500 g"), required("water", "1 litre")],
    availableIngredients: ["rice"],
  });
  assert.deepEqual(result, []);
});

test("does not request an ingredient already fully available across batches", () => {
  const result = calculateSmartGroceryItems({
    requiredItems: [required("potato", "1 kg")],
    pantryItems: [
      { name: "potatoes", quantity: 400, unit: "g", expiryDate: null },
      { name: "potato", quantity: 0.6, unit: "kg", expiryDate: null },
    ],
  });
  assert.deepEqual(result, []);
});

test("retains unmeasured requirements when no usable Pantry batch exists", () => {
  const result = calculateSmartGroceryItems({
    requiredItems: [required("coriander", "as needed")],
    pantryItems: [],
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].name, "coriander");
});

test("uses Pantry quantities even when the ingredient was selected as available", () => {
  const result = calculateSmartGroceryItems({
    requiredItems: [required("onion", "500 g")],
    availableIngredients: ["onion"],
    pantryItems: [{ name: "onion", quantity: 200, unit: "g", expiryDate: null }],
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].quantity, "300 g");
});

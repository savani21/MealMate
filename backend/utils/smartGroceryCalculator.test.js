const test = require("node:test");
const assert = require("node:assert/strict");
const { calculateSmartGroceryItems, parseQuantity } = require("./smartGroceryCalculator");
const { getLocalDayStartUtc } = require("./pantryExpiry");

const item = (name, quantity, mealName = "Test meal", day = 1, mealType = "Lunch") => ({
  name, quantity, mealName, day, mealType,
});

test("parses supported quantities including fractional cups", () => {
  assert.equal(parseQuantity("1/2 cup").baseAmount, 125);
  assert.equal(parseQuantity("1/2 kg").baseAmount, 500);
  assert.equal(parseQuantity("250 g").unit, "g");
});

test("combines duplicate ingredient quantities across meals", () => {
  const result = calculateSmartGroceryItems({
    requiredItems: [
      item("tomatoes", "200 g", "Poha", 1, "Breakfast"),
      item("tomato", "100 g", "Dal", 1, "Lunch"),
    ],
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].name, "tomato");
  assert.equal(result[0].quantity, "300 g");
  assert.equal(result[0].mealType, "Combined");
});

test("subtracts Pantry quantities from combined requirements", () => {
  const result = calculateSmartGroceryItems({
    requiredItems: [item("rice", "1 kg", "Pulao"), item("rice", "500 g", "Khichdi")],
    pantryItems: [{ name: "basmati rice", quantity: 1, unit: "kg", expiryDate: null }],
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].name, "rice");
  assert.equal(result[0].quantity, "500 g");
});

test("omits ingredients fully covered by Pantry or explicit available selection", () => {
  const result = calculateSmartGroceryItems({
    requiredItems: [
      item("rice", "500 g", "Pulao"),
      item("onion", "2 pieces", "Pulao"),
    ],
    pantryItems: [{ name: "rice", quantity: 1, unit: "kg", expiryDate: null }],
    availableIngredients: ["onions"],
  });
  assert.deepEqual(result, []);
});

test("does not treat zero-quantity Pantry items as available", () => {
  const result = calculateSmartGroceryItems({
    requiredItems: [item("onion", "2 pieces", "Sabzi")],
    pantryItems: [{ name: "onion", quantity: 0, unit: "piece", expiryDate: null }],
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].quantity, "2 piece");
});

test("does not guess cross-dimension Pantry conversions", () => {
  const result = calculateSmartGroceryItems({
    requiredItems: [
      item("onion", "2 pieces", "Sabzi"),
      item("tomatoes", "200 g", "Sabzi"),
    ],
    pantryItems: [
      { name: "onion", quantity: 500, unit: "g", expiryDate: null },
      { name: "tomato", quantity: 2, unit: "piece", expiryDate: null },
    ],
  });
  assert.equal(result.length, 2);
  assert.deepEqual(result.map((entry) => entry.quantity), ["2 piece", "200 g"]);
});

test("expired Pantry stock is not overridden by an available ingredient hint", () => {
  const result = calculateSmartGroceryItems({
    requiredItems: [item("onion", "2 pieces", "Sabzi")],
    pantryItems: [{ name: "onion", quantity: 5, unit: "piece", expiryDate: "2020-01-01" }],
    availableIngredients: ["onion"],
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].name, "onion");
  assert.equal(result[0].quantity, "2 piece");
});

test("Pantry stock expiring today remains available for the day", () => {
  const result = calculateSmartGroceryItems({
    requiredItems: [item("tomato", "2 pieces", "Sabzi")],
    pantryItems: [{ name: "tomato", quantity: 5, unit: "piece", expiryDate: getLocalDayStartUtc() }],
  });
  assert.deepEqual(result, []);
});

test("calculates partial mass shortages across Pantry batches", () => {
  const result = calculateSmartGroceryItems({
    requiredItems: [item("rice", "500 g")],
    pantryItems: [
      { name: "rice", quantity: 100, unit: "g", expiryDate: null },
      { name: "Rice", quantity: 0.1, unit: "kg", expiryDate: null },
    ],
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].quantity, "300 g");
});

test("converts cups, tablespoons and teaspoons to a common volume base", () => {
  assert.equal(parseQuantity("2 cups").baseAmount, 500);
  assert.equal(parseQuantity("2 tbsp").baseAmount, 30);
  assert.equal(parseQuantity("1 tsp").baseAmount, 5);
  const result = calculateSmartGroceryItems({
    requiredItems: [item("milk", "2 cups")],
    pantryItems: [{ name: "milk", quantity: 300, unit: "ml", expiryDate: null }],
  });
  assert.equal(result[0].quantity, "200 ml");
});

test("does not convert mass into volume or count", () => {
  const result = calculateSmartGroceryItems({
    requiredItems: [item("oil", "1 litre")],
    pantryItems: [{ name: "oil", quantity: 500, unit: "g", expiryDate: null }],
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].quantity, "1000 ml");
});

test("excludes water and omits explicit available ingredients with no Pantry record", () => {
  const result = calculateSmartGroceryItems({
    requiredItems: [item("rice", "500 g"), item("water", "1 litre")],
    availableIngredients: ["rice"],
  });
  assert.deepEqual(result, []);
});

test("does not request an ingredient already fully available across batches", () => {
  const result = calculateSmartGroceryItems({
    requiredItems: [item("potato", "1 kg")],
    pantryItems: [
      { name: "potatoes", quantity: 400, unit: "g", expiryDate: null },
      { name: "potato", quantity: 0.6, unit: "kg", expiryDate: null },
    ],
  });
  assert.deepEqual(result, []);
});

test("retains unmeasured requirements when no usable Pantry batch exists", () => {
  const result = calculateSmartGroceryItems({
    requiredItems: [item("coriander", "as needed")],
    pantryItems: [],
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].name, "coriander");
});

test("uses Pantry quantities even when the ingredient was selected as available", () => {
  const result = calculateSmartGroceryItems({
    requiredItems: [item("onion", "500 g")],
    availableIngredients: ["onion"],
    pantryItems: [{ name: "onion", quantity: 200, unit: "g", expiryDate: null }],
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].quantity, "300 g");
});

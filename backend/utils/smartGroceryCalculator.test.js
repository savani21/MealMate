const test = require("node:test");
const assert = require("node:assert/strict");
const { calculateSmartGroceryItems, parseQuantity } = require("./smartGroceryCalculator");

test("parses supported quantities and normalizes fractions", () => {
  assert.deepEqual(parseQuantity("1/2 cup"), null);
  assert.equal(parseQuantity("1/2 kg").baseAmount, 500);
  assert.equal(parseQuantity("250 g").unit, "g");
});

test("combines duplicate ingredient quantities across meals", () => {
  const items = calculateSmartGroceryItems({
    requiredItems: [
      { name: "tomatoes", quantity: "200 g", mealName: "Poha", day: 1, mealType: "Breakfast" },
      { name: "tomato", quantity: "100 g", mealName: "Dal", day: 1, mealType: "Lunch" },
    ],
  });
  assert.equal(items.length, 1);
  assert.equal(items[0].name, "tomato");
  assert.equal(items[0].quantity, "300 g");
  assert.equal(items[0].mealType, "Combined");
});

test("omits pantry ingredients by identity without estimating remaining stock", () => {
  const items = calculateSmartGroceryItems({
    requiredItems: [
      { name: "rice", quantity: "1 kg", mealName: "Pulao" },
      { name: "rice", quantity: "500 g", mealName: "Khichdi" },
    ],
    pantryItems: [{ name: "basmati rice", quantity: 1, unit: "kg" }],
  });
  assert.deepEqual(items, []);
});

test("omits ingredients fully covered by pantry or available ingredient selection", () => {
  const items = calculateSmartGroceryItems({
    requiredItems: [
      { name: "rice", quantity: "500 g", mealName: "Pulao" },
      { name: "onion", quantity: "2 pieces", mealName: "Pulao" },
    ],
    pantryItems: [{ name: "rice", quantity: 1, unit: "kg" }],
    availableIngredients: ["onions"],
  });
  assert.deepEqual(items, []);
});

test("does not treat zero-quantity pantry items as available", () => {
  const items = calculateSmartGroceryItems({
    requiredItems: [{ name: "onion", quantity: "2 pieces", mealName: "Sabzi" }],
    pantryItems: [{ name: "onion", quantity: 0, unit: "piece" }],
  });
  assert.equal(items.length, 1);
  assert.equal(items[0].name, "onion");
});

test("matches pantry ingredients even when recipe and pantry units differ", () => {
  const items = calculateSmartGroceryItems({
    requiredItems: [
      { name: "1 onion", quantity: "2 pieces", mealName: "Sabzi" },
      { name: "tomatoes", quantity: "200 g", mealName: "Sabzi" },
    ],
    pantryItems: [
      { name: "onion", quantity: 500, unit: "g" },
      { name: "tomato", quantity: 2, unit: "piece" },
    ],
  });
  assert.deepEqual(items, []);
});

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
  assert.equal(items[0].name, "tomatoes");
  assert.equal(items[0].quantity, "300 g");
  assert.equal(items[0].mealType, "Combined");
});

test("subtracts compatible pantry stock from combined requirements", () => {
  const items = calculateSmartGroceryItems({
    requiredItems: [
      { name: "rice", quantity: "1 kg", mealName: "Pulao" },
      { name: "rice", quantity: "500 g", mealName: "Khichdi" },
    ],
    pantryItems: [{ name: "basmati rice", quantity: 750, unit: "g" }],
  });
  assert.equal(items.length, 1);
  assert.equal(items[0].quantity, "750 g");
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

test("does not subtract pantry stock across incompatible units", () => {
  const items = calculateSmartGroceryItems({
    requiredItems: [{ name: "milk", quantity: "2 cups", mealName: "Oats" }],
    pantryItems: [{ name: "milk", quantity: 500, unit: "ml" }],
  });
  assert.equal(items.length, 1);
  assert.equal(items[0].quantity, "2 cups");
});

const test = require("node:test");
const assert = require("node:assert/strict");
const { toComparableQuantity } = require("./quantityConversion");

test("converts compatible mass units", () => {
  assert.deepEqual(toComparableQuantity(1, "kg"), { amount: 1000, dimension: "mass", unit: "g" });
  assert.equal(toComparableQuantity(500, "g").amount, 500);
});

test("converts compatible volume units", () => {
  assert.equal(toComparableQuantity(1, "litre").amount, 1000);
  assert.equal(toComparableQuantity(2, "cups").amount, 500);
});

test("does not guess cross-dimension conversions", () => {
  assert.notEqual(toComparableQuantity(100, "g").dimension, toComparableQuantity(1, "cup").dimension);
  assert.equal(toComparableQuantity(1, "unknown"), null);
});

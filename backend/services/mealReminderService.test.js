const test = require("node:test");
const assert = require("node:assert/strict");
const {
  datePartsInZone,
  dateKeyInZone,
  calendarDayDifference,
} = require("./mealReminderService");

test("meal reminder calendar dates use the user's timezone", () => {
  const instant = new Date("2026-11-18T20:00:00.000Z");
  assert.equal(dateKeyInZone(instant, "Asia/Kolkata"), "2026-11-19");
  assert.equal(datePartsInZone(instant, "Asia/Kolkata").hour, "01");
});

test("meal plan day calculation handles month boundaries", () => {
  assert.equal(calendarDayDifference("2026-11-30", "2026-12-01"), 1);
  assert.equal(calendarDayDifference("2026-12-31", "2027-01-01"), 1);
  assert.equal(calendarDayDifference("2026-11-19", "2026-11-19"), 0);
});

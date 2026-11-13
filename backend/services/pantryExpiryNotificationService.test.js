const test = require("node:test");
const assert = require("node:assert/strict");
const { getTwoDayExpiryWindow } = require("./pantryExpiryNotificationService");

test("expiry reminder window targets the UTC calendar day two days ahead", () => {
  const now = new Date("2026-11-13T18:30:00.000Z");
  const window = getTwoDayExpiryWindow(now);
  assert.equal(window.dateKey, "2026-11-15");
  assert.equal(window.start.toISOString(), "2026-11-15T00:00:00.000Z");
  assert.equal(window.end.toISOString(), "2026-11-16T00:00:00.000Z");
});

test("expiry reminder window handles month and year boundaries", () => {
  const window = getTwoDayExpiryWindow(new Date("2026-12-30T12:00:00.000Z"));
  assert.equal(window.dateKey, "2027-01-01");
  assert.equal(window.end.toISOString(), "2027-01-02T00:00:00.000Z");
});

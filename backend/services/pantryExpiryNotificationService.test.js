const test = require("node:test");
const assert = require("node:assert/strict");
const {
  getExpiryReminderWindows,
  getExpiryReminderCopy,
} = require("./pantryExpiryNotificationService");

test("expiry reminders cover two days before, one day before, and the expiry date", () => {
  const windows = getExpiryReminderWindows(new Date("2026-11-13T18:30:00.000Z"));
  assert.deepEqual(windows.map(({ dateKey, daysRemaining }) => ({ dateKey, daysRemaining })), [
    { dateKey: "2026-11-15", daysRemaining: 2 },
    { dateKey: "2026-11-14", daysRemaining: 1 },
    { dateKey: "2026-11-13", daysRemaining: 0 },
  ]);
  assert.equal(windows[0].start.toISOString(), "2026-11-15T00:00:00.000Z");
  assert.equal(windows[0].end.toISOString(), "2026-11-16T00:00:00.000Z");
});

test("expiry reminder windows handle month and year boundaries", () => {
  const windows = getExpiryReminderWindows(new Date("2026-12-31T12:00:00.000Z"));
  assert.deepEqual(windows.map((window) => window.dateKey), ["2027-01-02", "2027-01-01", "2026-12-31"]);
});

test("expiry reminder copy distinguishes each reminder day", () => {
  const item = { name: "Potato", quantity: 2, unit: "kg" };
  assert.equal(getExpiryReminderCopy(item, 2, "2026-11-15").title, "Potato expires in 2 days");
  assert.equal(getExpiryReminderCopy(item, 1, "2026-11-14").title, "Potato expires tomorrow");
  assert.equal(getExpiryReminderCopy(item, 0, "2026-11-13").title, "Potato expires today");
});

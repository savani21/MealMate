const test = require("node:test");
const assert = require("node:assert/strict");
const {
  getInactivityCutoff,
  getLastUsedAt,
  INACTIVITY_DAYS,
} = require("./pantryInactivityNotificationService");

test("pantry inactivity reminder threshold defaults to 15 days", () => {
  assert.equal(INACTIVITY_DAYS, 15);
  const now = new Date("2026-11-21T12:00:00.000Z");
  assert.equal(getInactivityCutoff(now).toISOString(), "2026-11-06T12:00:00.000Z");
});

test("actual last-used timestamp takes precedence over batch creation", () => {
  const createdAt = new Date("2026-10-01T00:00:00.000Z");
  const lastUsedAt = new Date("2026-11-15T00:00:00.000Z");
  assert.equal(getLastUsedAt({ createdAt, lastUsedAt }), lastUsedAt);
});

test("never-used stock uses its creation timestamp as the inactivity baseline", () => {
  const createdAt = new Date("2026-11-01T00:00:00.000Z");
  assert.equal(getLastUsedAt({ createdAt, lastUsedAt: null }), createdAt);
  assert.equal(getLastUsedAt({ createdAt: null, lastUsedAt: null }), null);
});

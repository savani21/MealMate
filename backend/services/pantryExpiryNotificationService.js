const PantryItem = require("../models/user/PantryItem");
const Notification = require("../models/user/Notification");

function getUtcDayWindow(now, daysFromNow) {
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() + daysFromNow);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end, dateKey: start.toISOString().slice(0, 10), daysRemaining: daysFromNow };
}

function getExpiryReminderWindows(now = new Date()) {
  return [2, 1, 0].map((daysRemaining) => getUtcDayWindow(now, daysRemaining));
}

function getExpiryReminderCopy(item, daysRemaining, dateKey) {
  const timing = daysRemaining === 2
    ? "in 2 days"
    : daysRemaining === 1
      ? "tomorrow"
      : "today";
  return {
    title: `${item.name} expires ${timing}`,
    message: `${item.quantity} ${item.unit} of ${item.name} is due to expire on ${dateKey}. Use it soon to avoid food waste.`,
  };
}

async function createPantryExpiryNotifications(now = new Date()) {
  const windows = getExpiryReminderWindows(now);
  let checked = 0;
  let created = 0;

  for (const window of windows) {
    const items = await PantryItem.find({
      quantity: { $gt: 0 },
      expiryDate: { $gte: window.start, $lt: window.end },
    }).select("_id user name quantity unit expiryDate").lean();

    checked += items.length;
    for (const item of items) {
      const referenceId = window.daysRemaining === 2
        ? `pantry-expiry:${item._id}:${window.dateKey}`
        : `pantry-expiry:${item._id}:${window.dateKey}:${window.daysRemaining}`;
      const copy = getExpiryReminderCopy(item, window.daysRemaining, window.dateKey);
      const result = await Notification.updateOne(
        { user: item.user, type: "pantry-expiry", referenceId },
        {
          $setOnInsert: {
            user: item.user,
            type: "pantry-expiry",
            title: copy.title,
            message: copy.message,
            referenceId,
            read: false,
          },
        },
        { upsert: true }
      );
      if (result.upsertedCount) created += 1;
    }
  }

  return { checked, created, windows: windows.map(({ dateKey, daysRemaining }) => ({ dateKey, daysRemaining })) };
}

module.exports = {
  createPantryExpiryNotifications,
  getExpiryReminderWindows,
  getExpiryReminderCopy,
};

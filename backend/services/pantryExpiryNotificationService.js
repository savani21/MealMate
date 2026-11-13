const PantryItem = require("../models/user/PantryItem");
const Notification = require("../models/user/Notification");

function getTwoDayExpiryWindow(now = new Date()) {
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() + 2);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end, dateKey: start.toISOString().slice(0, 10) };
}

async function createPantryExpiryNotifications(now = new Date()) {
  const { start, end, dateKey } = getTwoDayExpiryWindow(now);
  const items = await PantryItem.find({
    quantity: { $gt: 0 },
    expiryDate: { $gte: start, $lt: end },
  }).select("_id user name quantity unit expiryDate").lean();

  let created = 0;
  for (const item of items) {
    const referenceId = `pantry-expiry:${item._id}:${dateKey}`;
    const result = await Notification.updateOne(
      { user: item.user, type: "pantry-expiry", referenceId },
      {
        $setOnInsert: {
          user: item.user,
          type: "pantry-expiry",
          title: `${item.name} expires in 2 days`,
          message: `${item.quantity} ${item.unit} of ${item.name} is due to expire on ${dateKey}. Use it soon to avoid food waste.`,
          referenceId,
          read: false,
        },
      },
      { upsert: true }
    );
    if (result.upsertedCount) created += 1;
  }
  return { checked: items.length, created, dateKey };
}

module.exports = { createPantryExpiryNotifications, getTwoDayExpiryWindow };

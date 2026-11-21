const PantryItem = require("../models/user/PantryItem");
const Notification = require("../models/user/Notification");

const INACTIVITY_DAYS = Math.max(1, Number(process.env.PANTRY_INACTIVITY_DAYS) || 15);

function getInactivityCutoff(now = new Date(), days = INACTIVITY_DAYS) {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

function getLastUsedAt(item) {
  return item.lastUsedAt || item.createdAt || null;
}

async function createPantryInactivityNotifications(now = new Date()) {
  const cutoff = getInactivityCutoff(now);
  const items = await PantryItem.find({
    quantity: { $gt: 0 },
    $or: [
      { lastUsedAt: { $lt: cutoff } },
      { lastUsedAt: null, createdAt: { $lt: cutoff } },
    ],
  }).select("_id user name quantity unit lastUsedAt createdAt").lean();

  let created = 0;
  for (const item of items) {
    const referenceId = `pantry-inactive:${item._id}`;
    const result = await Notification.updateOne(
      { user: item.user, type: "pantry-inactive", referenceId },
      {
        $setOnInsert: {
          user: item.user,
          type: "pantry-inactive",
          title: `Haven't used ${item.name} recently?`,
          message: `${item.quantity} ${item.unit} of ${item.name} has not been used for at least ${INACTIVITY_DAYS} days. Consider adding it to your next meal.`,
          referenceId,
          read: false,
          createdAt: now,
        },
      },
      { upsert: true }
    );
    if (result.upsertedCount) created += 1;
  }

  return { checked: items.length, created, inactivityDays: INACTIVITY_DAYS };
}

module.exports = { createPantryInactivityNotifications, getInactivityCutoff, getLastUsedAt, INACTIVITY_DAYS };

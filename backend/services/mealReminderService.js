const MealReminderPreference = require("../models/user/MealReminderPreference");
const MealPlan = require("../models/MealPlan");
const NutritionLog = require("../models/user/NutritionLog");
const Notification = require("../models/user/Notification");

const MEALS = ["breakfast", "lunch", "dinner"];

function datePartsInZone(date, timezone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone || "Asia/Kolkata",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(date);
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

async function processMealReminders(now = new Date()) {
  const preferences = await MealReminderPreference.find({ enabled: true }).lean();
  let created = 0;
  for (const preference of preferences) {
    let parts;
    try { parts = datePartsInZone(now, preference.timezone); }
    catch { parts = datePartsInZone(now, "Asia/Kolkata"); }
    const dateKey = `${parts.year}-${parts.month}-${parts.day}`;
    const currentMinutes = Number(parts.hour) * 60 + Number(parts.minute);
    const plans = await MealPlan.find({ user: preference.user, isArchived: { $ne: true } }).sort({ createdAt: -1 }).limit(20).lean();
    let activePlan = null;
    let activeDay = null;
    for (const plan of plans) {
      const startKey = new Date(plan.createdAt).toISOString().slice(0, 10);
      const dayNumber = Math.floor((new Date(`${dateKey}T00:00:00Z`) - new Date(`${startKey}T00:00:00Z`)) / 86400000) + 1;
      if (dayNumber >= 1 && dayNumber <= Number(plan.duration)) {
        activeDay = (plan.meals || []).find((day) => Number(day.day) === dayNumber);
        if (activeDay) { activePlan = plan; break; }
      }
    }
    if (!activePlan || !activeDay) continue;
    for (const mealType of MEALS) {
      const [reminderHour, reminderMinute] = String(preference[mealType] || "00:00").split(":").map(Number);
      const reminderAt = reminderHour * 60 + reminderMinute;
      // A two-minute window avoids missing a reminder if the worker starts
      // slightly late; the unique notification reference prevents duplicates.
      if (currentMinutes < reminderAt || currentMinutes > reminderAt + 2 || !activeDay[mealType]) continue;
      const logged = await NutritionLog.exists({
        user: preference.user, mealPlan: activePlan._id,
        dayNumber: Number(activeDay.day), mealType, dateKey,
      });
      if (logged) continue;
      const result = await Notification.updateOne(
        { user: preference.user, type: "meal", referenceId: `meal-reminder:${dateKey}:${mealType}` },
        { $setOnInsert: {
          user: preference.user, type: "meal",
          title: `Time to check in: ${mealType}`,
          message: `Did you eat ${activeDay[mealType]}? Update today's nutrition in MealMate.`,
          referenceId: `meal-reminder:${dateKey}:${mealType}`,
        } },
        { upsert: true }
      );
      if (result.upsertedCount) created += 1;
    }
  }
  return { created };
}

module.exports = { processMealReminders };

const MealReminderPreference = require("../models/user/MealReminderPreference");
const MealPlan = require("../models/MealPlan");
const NutritionLog = require("../models/user/NutritionLog");
const Notification = require("../models/user/Notification");

const MEALS = ["breakfast", "lunch", "dinner"];

function datePartsInZone(date, timezone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone || "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

function dateKeyInZone(date, timezone) {
  const parts = datePartsInZone(date, timezone);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function calendarDayDifference(startKey, endKey) {
  const [startYear, startMonth, startDay] = startKey.split("-").map(Number);
  const [endYear, endMonth, endDay] = endKey.split("-").map(Number);
  const start = Date.UTC(startYear, startMonth - 1, startDay);
  const end = Date.UTC(endYear, endMonth - 1, endDay);
  return Math.round((end - start) / 86400000);
}

async function processMealReminders(now = new Date()) {
  const preferences = await MealReminderPreference.find({ enabled: true }).lean();
  let created = 0;

  for (const preference of preferences) {
    let timezone = preference.timezone || "Asia/Kolkata";
    let todayKey;
    let currentMinutes;
    try {
      const parts = datePartsInZone(now, timezone);
      todayKey = `${parts.year}-${parts.month}-${parts.day}`;
      currentMinutes = Number(parts.hour) * 60 + Number(parts.minute);
    } catch {
      timezone = "Asia/Kolkata";
      const parts = datePartsInZone(now, timezone);
      todayKey = `${parts.year}-${parts.month}-${parts.day}`;
      currentMinutes = Number(parts.hour) * 60 + Number(parts.minute);
    }

    const plans = await MealPlan.find({
      user: preference.user,
      isArchived: { $ne: true },
    }).sort({ createdAt: -1 }).limit(20).lean();

    let activePlan = null;
    let activeDay = null;
    for (const plan of plans) {
      const planStartKey = dateKeyInZone(new Date(plan.createdAt), timezone);
      const dayNumber = calendarDayDifference(planStartKey, todayKey) + 1;
      if (dayNumber < 1 || dayNumber > Number(plan.duration)) continue;
      const matchingDay = (plan.meals || []).find((day) => Number(day.day) === dayNumber);
      if (matchingDay) {
        activePlan = plan;
        activeDay = matchingDay;
        break;
      }
    }

    if (!activePlan || !activeDay) continue;

    for (const mealType of MEALS) {
      const [hour, minute] = String(preference[mealType] || "00:00").split(":").map(Number);
      const reminderAt = hour * 60 + minute;
      // The backend scheduler runs every minute. A small grace window prevents
      // duplicate or late reminders while tolerating minor scheduler delays.
      if (currentMinutes < reminderAt || currentMinutes > reminderAt + 4 || !activeDay[mealType]) continue;

      const logged = await NutritionLog.exists({
        user: preference.user,
        mealPlan: activePlan._id,
        dayNumber: Number(activeDay.day),
        mealType,
        dateKey: todayKey,
      });
      if (logged) continue;

      const referenceId = `meal-reminder:${activePlan._id}:${todayKey}:${mealType}`;
      const result = await Notification.updateOne(
        { user: preference.user, type: "meal", referenceId },
        {
          $setOnInsert: {
            user: preference.user,
            type: "meal",
            title: `Time to check in: ${mealType}`,
            message: `Did you eat ${activeDay[mealType]}? Update today's nutrition in MealMate.`,
            referenceId,
            read: false,
          },
        },
        { upsert: true }
      );
      if (result.upsertedCount) created += 1;
    }
  }

  return { created };
}

module.exports = {
  processMealReminders,
  datePartsInZone,
  dateKeyInZone,
  calendarDayDifference,
};

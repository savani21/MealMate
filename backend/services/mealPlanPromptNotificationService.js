const User = require("../models/User");
const MealPlan = require("../models/MealPlan");
const Notification = require("../models/user/Notification");

const NOTIFICATION_TYPE = "meal-plan-needed";

async function processMealPlanPromptNotifications() {
  const users = await User.find({
    role: "user",
    mealPlanPromptNotifiedAt: null,
  }).select("_id").lean();

  let created = 0;
  for (const user of users) {
    // Only prompt users who have never saved a meal plan.
    const existingPlan = await MealPlan.exists({ user: user._id });
    if (existingPlan) continue;

    const referenceId = `meal-plan-needed:${user._id}`;
    const result = await Notification.updateOne(
      { user: user._id, type: NOTIFICATION_TYPE, referenceId },
      {
        $setOnInsert: {
          user: user._id,
          type: NOTIFICATION_TYPE,
          title: "No Meal Plan Yet!",
          message: "You haven't generated a meal plan yet. Create your personalized meal plan to get started.",
          referenceId,
          read: false,
        },
      },
      { upsert: true }
    );

    // Recheck after the upsert to avoid leaving a prompt behind if a plan
    // was saved concurrently while this scheduled task was running.
    const planAfterUpsert = await MealPlan.exists({ user: user._id });
    if (planAfterUpsert) {
      await Notification.deleteOne({ user: user._id, type: NOTIFICATION_TYPE, referenceId });
      continue;
    }

    await User.updateOne(
      { _id: user._id, role: "user", mealPlanPromptNotifiedAt: null },
      { $set: { mealPlanPromptNotifiedAt: new Date() } }
    );
    if (result.upsertedCount) created += 1;
  }

  return { created, checked: users.length };
}

module.exports = { processMealPlanPromptNotifications };

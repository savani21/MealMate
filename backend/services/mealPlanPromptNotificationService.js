const User = require("../models/User");
const MealPlan = require("../models/MealPlan");
const Notification = require("../models/user/Notification");

const NOTIFICATION_TYPE = "meal-plan-needed";

async function syncMealPlanPromptForUser(userId) {
  const referenceId = `meal-plan-needed:${userId}`;
  const activePlan = await MealPlan.exists({
    user: userId,
    isArchived: false,
  });

  if (activePlan) {
    const deletion = await Notification.deleteOne({
      user: userId,
      type: NOTIFICATION_TYPE,
      referenceId,
    });
    return { created: false, removed: Boolean(deletion.deletedCount), hasActivePlan: true };
  }

  const result = await Notification.updateOne(
    { user: userId, type: NOTIFICATION_TYPE, referenceId },
    {
      $setOnInsert: {
        user: userId,
        type: NOTIFICATION_TYPE,
        title: "No Meal Plan Yet!",
        message: "You don't have an active meal plan. Create your personalized meal plan to get started.",
        referenceId,
        read: false,
      },
    },
    { upsert: true }
  );

  // Avoid leaving a stale prompt if a plan was created concurrently.
  const activePlanAfterUpsert = await MealPlan.exists({
    user: userId,
    isArchived: false,
  });
  if (activePlanAfterUpsert) {
    const deletion = await Notification.deleteOne({
      user: userId,
      type: NOTIFICATION_TYPE,
      referenceId,
    });
    return { created: false, removed: Boolean(deletion.deletedCount), hasActivePlan: true };
  }

  return { created: Boolean(result.upsertedCount), removed: false, hasActivePlan: false };
}

async function processMealPlanPromptNotifications() {
  const users = await User.find({ role: "user" }).select("_id").lean();
  let created = 0;
  let removed = 0;

  for (const user of users) {
    const result = await syncMealPlanPromptForUser(user._id);
    if (result.created) created += 1;
    if (result.removed) removed += 1;
  }

  return { created, removed, checked: users.length };
}

module.exports = { processMealPlanPromptNotifications, syncMealPlanPromptForUser };

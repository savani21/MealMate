const User = require("../models/User");
const MealPlan = require("../models/MealPlan");
const Notification = require("../models/user/Notification");

const NOTIFICATION_TYPE = "meal-plan-needed";

async function processMealPlanPromptNotifications() {
  // A prompt is needed whenever a user has no active plan. Archived plans do
  // not count. Keeping the notification record is the deduplication mechanism:
  // marking it read will not cause it to be recreated on the next poll.
  const users = await User.find({ role: "user" }).select("_id").lean();

  let created = 0;
  let removed = 0;

  for (const user of users) {
    const referenceId = `meal-plan-needed:${user._id}`;
    const activePlan = await MealPlan.exists({
      user: user._id,
      isArchived: false,
    });

    if (activePlan) {
      const deletion = await Notification.deleteOne({
        user: user._id,
        type: NOTIFICATION_TYPE,
        referenceId,
      });
      if (deletion.deletedCount) removed += 1;
      continue;
    }

    const result = await Notification.updateOne(
      { user: user._id, type: NOTIFICATION_TYPE, referenceId },
      {
        $setOnInsert: {
          user: user._id,
          type: NOTIFICATION_TYPE,
          title: "No Meal Plan Yet!",
          message: "You don't have an active meal plan. Create your personalized meal plan to get started.",
          referenceId,
          read: false,
        },
      },
      { upsert: true }
    );

    // Recheck after the upsert in case a plan was created while this task ran.
    const activePlanAfterUpsert = await MealPlan.exists({
      user: user._id,
      isArchived: false,
    });
    if (activePlanAfterUpsert) {
      const deletion = await Notification.deleteOne({
        user: user._id,
        type: NOTIFICATION_TYPE,
        referenceId,
      });
      if (deletion.deletedCount) removed += 1;
      continue;
    }

    if (result.upsertedCount) created += 1;
  }

  return { created, removed, checked: users.length };
}

module.exports = { processMealPlanPromptNotifications };

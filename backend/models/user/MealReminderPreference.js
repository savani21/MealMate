const mongoose = require("mongoose");

const mealReminderPreferenceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  enabled: { type: Boolean, default: false },
  timezone: { type: String, default: "Asia/Kolkata" },
  breakfast: { type: String, default: "08:00", match: /^([01]\d|2[0-3]):[0-5]\d$/ },
  lunch: { type: String, default: "13:00", match: /^([01]\d|2[0-3]):[0-5]\d$/ },
  dinner: { type: String, default: "19:00", match: /^([01]\d|2[0-3]):[0-5]\d$/ },
}, { timestamps: true });

module.exports = mongoose.model("MealReminderPreference", mealReminderPreferenceSchema);

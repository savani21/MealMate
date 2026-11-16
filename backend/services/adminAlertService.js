const AdminAlert = require("../models/AdminAlert");

/**
 * Create a platform-level alert. Pass a stable dedupeKey for repeatable
 * conditions (for example, a low-stock product) to avoid alert spam.
 * Alerts are best-effort and must never break the originating user action.
 */
async function createAdminAlert({ type, severity = "info", title, message, source, referenceId = null, actionUrl = null, dedupeKey = null }) {
  try {
    if (dedupeKey) {
      return await AdminAlert.findOneAndUpdate(
        { dedupeKey },
        { $setOnInsert: { type, severity, title, message, source, referenceId, actionUrl, dedupeKey } },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
      );
    }
    return await AdminAlert.create({ type, severity, title, message, source, referenceId, actionUrl });
  } catch (error) {
    // Duplicate-key means this exact alert has already been recorded.
    if (error.code !== 11000) console.error("Admin alert creation failed:", error.message);
    return null;
  }
}

module.exports = { createAdminAlert };

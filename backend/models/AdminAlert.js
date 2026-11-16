const mongoose = require("mongoose");

const adminAlertSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["user-registered", "recipe-submitted", "recipe-reported", "low-stock", "order-issue", "security", "ai-failure", "system-error"],
    required: true,
    index: true,
  },
  severity: { type: String, enum: ["info", "warning", "critical"], default: "info", index: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  message: { type: String, required: true, trim: true, maxlength: 1000 },
  source: { type: String, required: true, trim: true, maxlength: 80 },
  referenceId: { type: String, default: null, index: true },
  actionUrl: { type: String, default: null, maxlength: 300 },
  dedupeKey: { type: String, default: undefined },
  read: { type: Boolean, default: false, index: true },
  readAt: { type: Date, default: null },
}, { timestamps: true });

adminAlertSchema.index({ dedupeKey: 1 }, { unique: true, sparse: true });
adminAlertSchema.index({ createdAt: -1 });

module.exports = mongoose.model("AdminAlert", adminAlertSchema);

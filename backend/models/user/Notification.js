const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["order-delivered", "meal", "grocery", "recipe", "system"],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    referenceId: { type: String, required: true },
    read: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// One delivery notification per user/order, even if the delivery worker retries.
notificationSchema.index(
  { user: 1, type: 1, referenceId: 1 },
  { unique: true }
);

module.exports = mongoose.model("Notification", notificationSchema);

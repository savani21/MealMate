const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    // Nullable so an order can remain in operational history after its account is deleted.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    orderId: {
      type: String,
      required: true,
      unique: true,
    },

    items: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        unit: { type: String, default: "" },
      },
    ],

    totalAmount: {
      type: Number,
      required: true,
    },

    // Promised ETA shown to the customer at checkout.
    deliveryTime: {
      type: Date,
      required: true,
    },
    // Actual completion time, recorded only after pantry sync succeeds.
    deliveredAt: { type: Date, default: null },
    deliveryOutcome: {
      type: String,
      enum: ["early", "on-time", "late"],
      default: null,
    },

    status: {
      type: String,
      enum: ["placed", "preparing", "out-for-delivery", "delivered"],
      default: "placed",
    },
    inventorySyncing: { type: Boolean, default: false },
    inventorySyncingAt: { type: Date, default: null },
    inventoryAppliedAt: { type: Date, default: null },
    receiptEmailSentAt: { type: Date, default: null },
    receiptEmailLastAttemptAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);

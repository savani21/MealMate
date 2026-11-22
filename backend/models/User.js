const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    resetPasswordTokenHash: { type: String, default: undefined, select: false },
    resetPasswordExpires: { type: Date, default: undefined, select: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Recipe" }],
    foodPreference: {
      type: String,
      enum: ["", "vegetarian", "vegan", "non-vegetarian", "eggetarian"],
      default: "",
    },
    preferences: {
      theme: {
        type: String,
        enum: ["light", "dark"],
        default: "light",
      },
      language: {
        type: String,
        enum: ["en", "gu", "hi"],
        default: undefined,
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);

const mongoose = require("mongoose");

const recipeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    category: {
      type: String,
      default: "Other",
    },

    diet: {
      type: String,
      default: "Any",
    },

    ingredients: {
      type: [String],
      default: [],
    },

    instructions: {
      type: [String],
      default: [],
    },

    prepTime: {
      type: String,
      default: "",
    },

    image: {
      type: String,
      default: "",
    },

    source: {
      type: String,
      enum: ["manual", "ai"],
      default: "manual",
    },

    // Set for recipes created by a logged-in user. Existing shared/admin
    // recipes can remain without this field and cannot be deleted by users.
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Recipe", recipeSchema);

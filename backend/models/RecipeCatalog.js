const mongoose = require("mongoose");

const recipeCatalogSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  cuisine: { type: String, default: "International", index: true },
  category: { type: String, default: "Other", index: true },
  mealTypes: { type: [String], default: ["lunch", "dinner"], index: true },
  dietaryTags: { type: [String], default: [] },
  ingredients: {
    type: [{ name: { type: String, required: true }, normalizedName: { type: String, required: true }, quantity: { type: String, default: "" } }],
    default: [],
  },
  instructions: { type: [String], default: [] },
  image: { type: String, default: "" },
  source: {
    provider: { type: String, required: true },
    sourceId: { type: String, required: true },
    sourceUrl: { type: String, default: "" },
    attribution: { type: String, default: "" },
    license: { type: String, default: "" },
  },
  isActive: { type: Boolean, default: true, index: true },
}, { timestamps: true });

recipeCatalogSchema.index({ "source.provider": 1, "source.sourceId": 1 }, { unique: true });
recipeCatalogSchema.index({ mealTypes: 1, dietaryTags: 1, isActive: 1 });

module.exports = mongoose.model("RecipeCatalog", recipeCatalogSchema);

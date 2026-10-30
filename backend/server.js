const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const recipeRoutes = require("./routes/user/recipeRoutes");
const favoriteRoutes = require("./routes/user/favoriteRoutes");
const dislikeRoutes = require("./routes/user/dislikeRoutes");
const recipeReviewRoutes = require("./routes/user/recipeReviewRoutes");
const aiRoutes = require("./routes/user/aiRoutes");
const storeRoutes = require("./routes/user/storeRoutes");

const adminUserRoutes = require("./routes/admin/userRoutes");
const adminRecipeRoutes = require("./routes/admin/recipeRoutes");
const adminMealPlanRoutes = require("./routes/admin/mealPlanRoutes");
const adminAnalyticsRoutes = require("./routes/admin/analyticsRoutes");
const adminAiRoutes = require("./routes/admin/aiRoutes");
const adminSecurityRoutes = require("./routes/admin/securityRoutes");
const adminRecipeReviewRoutes = require("./routes/admin/recipeReviewRoutes");

const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow server-to-server and local non-browser requests without an Origin.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Origin is not allowed by CORS"));
    },
  })
);
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/meal-plans", require("./routes/mealPlanRoutes"));
app.use("/api/user/grocery", require("./routes/user/groceryRoutes"));
app.use("/api/store", storeRoutes);
app.use("/api/recipes", recipeRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/dislikes", dislikeRoutes);
app.use("/api/recipe-reviews", recipeReviewRoutes);
app.use("/api/ai", aiRoutes);

app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/recipes", adminRecipeRoutes);
app.use("/api/admin/meal-plans", adminMealPlanRoutes);
app.use("/api/admin/analytics", adminAnalyticsRoutes);
app.use("/api/admin/ai", adminAiRoutes);
app.use("/api/admin/security", adminSecurityRoutes);
app.use("/api/admin/recipe-reviews", adminRecipeReviewRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: mongoose.connection.readyState === 1 ? "healthy" : "database-disconnected",
  });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not configured");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");

    app.listen(PORT, () => {
      console.log(`Server Running on ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

startServer();

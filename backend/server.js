const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const recipeRoutes = require("./routes/user/recipeRoutes");
const recipeReviewRoutes = require("./routes/user/recipeReviewRoutes");
const favoriteRoutes = require("./routes/user/favoriteRoutes");
const aiRoutes = require("./routes/user/aiRoutes");
const storeRoutes = require("./routes/user/storeRoutes");
const nutritionRoutes = require("./routes/user/nutritionRoutes");
const { processDueOrders } = require("./controllers/user/orderController");
const { createPantryExpiryNotifications } = require("./services/pantryExpiryNotificationService");
const { processMealReminders } = require("./services/mealReminderService");
const { checkLowStockAlerts } = require("./services/lowStockAlertService");

const adminUserRoutes = require("./routes/admin/userRoutes");
const adminRecipeRoutes = require("./routes/admin/recipeRoutes");
const adminRecipeReviewRoutes = require("./routes/admin/recipeReviewRoutes");
const adminMealPlanRoutes = require("./routes/admin/mealPlanRoutes");
const adminAnalyticsRoutes = require("./routes/admin/analyticsRoutes");
const adminReportRoutes = require("./routes/admin/reportRoutes");
const adminAiRoutes = require("./routes/admin/aiRoutes");
const adminSecurityRoutes = require("./routes/admin/securityRoutes");
const adminAlertRoutes = require("./routes/admin/alertRoutes");

if (!process.env.JWT_SECRET || !process.env.JWT_SECRET.trim()) {
  throw new Error("JWT_SECRET is required. Set it in backend/.env before starting MealMate.");
}
if (!process.env.MONGO_URI || !process.env.MONGO_URI.trim()) {
  throw new Error("MONGO_URI is required. Set it in backend/.env before starting MealMate.");
}

app.set("trust proxy", 1);
app.use(cors({
  origin: process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(",").map((value) => value.trim())
    : true,
}));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({
    status: connected ? "ok" : "starting",
    database: connected ? "connected" : "disconnected",
  });
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/meal-plans", require("./routes/mealPlanRoutes"));
app.use("/api/nutrition", nutritionRoutes);
app.use("/api/user/grocery", require("./routes/user/groceryRoutes"));
app.use("/api/user/pantry", require("./routes/user/pantryRoutes"));
app.use("/api/store", storeRoutes);
app.use("/api/notifications", require("./routes/user/notificationRoutes"));
app.use("/api/recipes", recipeRoutes);
app.use("/api/stats", require("./routes/statsRoutes"));
app.use("/api/recipe-reviews", recipeReviewRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/recipes", adminRecipeRoutes);
app.use("/api/admin/recipe-reviews", adminRecipeReviewRoutes);
app.use("/api/admin/meal-plans", adminMealPlanRoutes);
app.use("/api/admin/analytics", adminAnalyticsRoutes);
app.use("/api/admin/reports", adminReportRoutes);
app.use("/api/admin/ai", adminAiRoutes);
app.use("/api/admin/security", adminSecurityRoutes);
app.use("/api/admin/alerts", adminAlertRoutes);

async function runScheduledTask(label, task) {
  try {
    await task();
  } catch (error) {
    console.error(`${label} failed:`, error);
  }
}

async function startServer() {
  // Do not accept traffic until MongoDB is connected. A failed connection is
  // fatal so process managers can restart the service instead of serving a
  // misleading partially-working API.
  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB Connected");

  const removedMealPlanPrompts = await require("./models/user/Notification").deleteMany({ type: "meal-plan-needed" });
  if (removedMealPlanPrompts.deletedCount) console.log(`Removed ${removedMealPlanPrompts.deletedCount} obsolete meal-plan prompt notification(s).`);

  await runScheduledTask("Initial order processing", processDueOrders);
  const checkPantryExpiries = () => runScheduledTask("Pantry expiry notification check", async () => {
    const result = await createPantryExpiryNotifications();
    if (result.created) console.log(`Created ${result.created} pantry expiry reminder(s).`);
  });
  const checkMealReminders = () => runScheduledTask("Meal reminder check", async () => {
    const result = await processMealReminders();
    if (result.created) console.log(`Created ${result.created} meal reminder(s).`);
  });
  const monitorLowStock = () => runScheduledTask("Admin low-stock monitor", async () => {
    const result = await checkLowStockAlerts();
    if (result.created) console.log(`Created ${result.created} admin low-stock alert(s).`);
  });

  await checkPantryExpiries();
  await checkMealReminders();
  await monitorLowStock();
  setInterval(checkPantryExpiries, 15 * 60 * 1000);
  setInterval(checkMealReminders, 60 * 1000);
  setInterval(monitorLowStock, 60 * 60 * 1000);
  setInterval(() => runScheduledTask("Order processing", processDueOrders), 15000);

  const PORT = process.env.PORT || 5000;
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log("Server Running on " + PORT);
  });

  const shutdown = async (signal) => {
    console.log(`${signal} received. Closing MealMate server...`);
    server.close(async () => {
      await mongoose.connection.close();
      process.exit(0);
    });
  };
  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
}

if (require.main === module) {
  startServer().catch(async (error) => {
    console.error("MealMate startup failed:", error);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  });
}

module.exports = { app, startServer };

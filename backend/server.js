const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
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

const adminUserRoutes = require("./routes/admin/userRoutes");
const adminRecipeRoutes = require("./routes/admin/recipeRoutes");
const adminRecipeReviewRoutes = require("./routes/admin/recipeReviewRoutes");
const adminMealPlanRoutes = require("./routes/admin/mealPlanRoutes");
const adminAnalyticsRoutes = require("./routes/admin/analyticsRoutes");
const adminAiRoutes = require("./routes/admin/aiRoutes");
const adminSecurityRoutes = require("./routes/admin/securityRoutes");

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB Connected");
    await processDueOrders();
    // Persist two-day pantry expiry reminders even when the user is not on the app.
    const checkPantryExpiries = async () => {
      try {
        const result = await createPantryExpiryNotifications();
        if (result.created) console.log(`Created ${result.created} pantry expiry reminder(s).`);
      } catch (error) {
        console.error("Pantry expiry notification check failed:", error);
      }
    };
    await checkPantryExpiries();
    setInterval(checkPantryExpiries, 60 * 60 * 1000);

    // Check due grocery deliveries in the background, even when the user is offline.
    setInterval(() => processDueOrders().catch((error) => console.error("Order processing failed:", error)), 15000);
  })
  .catch((err) => console.log(err));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/meal-plans", require("./routes/mealPlanRoutes"));
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
app.use("/api/admin/ai", adminAiRoutes);
app.use("/api/admin/security", adminSecurityRoutes);

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server Running on ${PORT}`);
});

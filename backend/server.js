const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const recipeRoutes = require("./routes/user/recipeRoutes");
const favoriteRoutes = require("./routes/user/favoriteRoutes");
const aiRoutes = require("./routes/user/aiRoutes");
const storeRoutes = require("./routes/user/storeRoutes");

const adminUserRoutes = require("./routes/admin/userRoutes");
const adminRecipeRoutes = require("./routes/admin/recipeRoutes");
const adminMealPlanRoutes = require("./routes/admin/mealPlanRoutes");
const adminAnalyticsRoutes = require("./routes/admin/analyticsRoutes");
const adminAiRoutes = require("./routes/admin/aiRoutes");
const adminSecurityRoutes = require("./routes/admin/securityRoutes");

app.use(cors());
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
app.use("/api/ai", aiRoutes);

app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/recipes", adminRecipeRoutes);
app.use("/api/admin/meal-plans", adminMealPlanRoutes);
app.use("/api/admin/analytics", adminAnalyticsRoutes);
app.use("/api/admin/ai", adminAiRoutes);
app.use("/api/admin/security", adminSecurityRoutes);

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server Running on ${PORT}`);
});

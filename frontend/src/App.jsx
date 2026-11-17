import { lazy, Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import "@/navbar-layout.css";

const NotFound = lazy(() => import("@/pages/not-found"));
const Home = lazy(() => import("@/pages/Home"));
const Login = lazy(() => import("@/pages/Login"));
const Signup = lazy(() => import("@/pages/Signup"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const MealPlanner = lazy(() => import("@/pages/User/MealPlanner"));
const NutritionDashboard = lazy(() => import("@/pages/User/NutritionDashboard"));
const MyMealPlans = lazy(() => import("@/pages/User/MyMealPlans"));
const MealPlanDetails = lazy(() => import("@/pages/User/MealPlanDetails"));
const GroceryList = lazy(() => import("@/pages/User/GroceryList"));
const GroceryStore = lazy(() => import("@/pages/User/GroceryStore"));
const Pantry = lazy(() => import("@/pages/User/Pantry"));
const Recipes = lazy(() => import("@/pages/User/Recipes"));
const RecipeDetails = lazy(() => import("@/pages/User/RecipeDetails"));
const Favorites = lazy(() => import("@/pages/User/Favorites"));
const Profile = lazy(() => import("@/pages/Profile"));
const Notifications = lazy(() => import("@/pages/Notifications"));
const Settings = lazy(() => import("@/pages/Settings"));
const MealMateAssistant = lazy(() => import("@/components/MealMateAssistant"));
const AdminUsers = lazy(() => import("@/pages/Admin/Users"));
const AdminRecipes = lazy(() => import("@/pages/Admin/Recipes"));
const AdminMealPlans = lazy(() => import("@/pages/Admin/MealPlans"));
const AdminAnalytics = lazy(() => import("@/pages/Admin/Analytics"));
const AdminReports = lazy(() => import("@/pages/Admin/Reports"));
const AdminAIFeatures = lazy(() => import("@/pages/Admin/AIFeatures"));
const AdminSecurity = lazy(() => import("@/pages/Admin/Security"));

const queryClient = new QueryClient();

function AccountThemeController() {
  const [location] = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const isPrivateAppRoute = Boolean(user) && !["/", "/login", "/signup"].includes(location);
    document.getElementById("root")?.classList.toggle(
      "dark",
      isPrivateAppRoute && user?.preferences?.theme === "dark"
    );
  }, [user, location]);

  return null;
}

function Router() {
  return (
    <>
      <AccountThemeController />
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-gray-500">Loading MealMate...</div>}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/login" component={Login} />
          <Route path="/signup" component={Signup} />
          <ProtectedRoute path="/dashboard" component={Dashboard} allowedRoles={["admin", "user"]} />
          <ProtectedRoute path="/meal-planner" component={MealPlanner} allowedRoles={["user"]} />
          <ProtectedRoute path="/nutrition" component={NutritionDashboard} allowedRoles={["user"]} />
          <ProtectedRoute path="/my-meal-plans" component={MyMealPlans} allowedRoles={["user"]} />
          <ProtectedRoute path="/meal-plans/:id" component={MealPlanDetails} allowedRoles={["user"]} />
          <ProtectedRoute path="/user/grocery" component={GroceryList} allowedRoles={["user"]} />
          <ProtectedRoute path="/grocery-store" component={GroceryStore} allowedRoles={["user"]} />
          <ProtectedRoute path="/pantry" component={Pantry} allowedRoles={["user"]} />

          <ProtectedRoute path="/admin/users" component={AdminUsers} allowedRoles={["admin"]} />
          <ProtectedRoute path="/admin/recipes" component={AdminRecipes} allowedRoles={["admin"]} />
          <ProtectedRoute path="/admin/meal-plans" component={AdminMealPlans} allowedRoles={["admin"]} />
          <ProtectedRoute path="/admin/analytics" component={AdminAnalytics} allowedRoles={["admin"]} />
          <ProtectedRoute path="/admin/reports" component={AdminReports} allowedRoles={["admin"]} />
          <ProtectedRoute path="/admin/ai-features" component={AdminAIFeatures} allowedRoles={["admin"]} />
          <ProtectedRoute path="/admin/security" component={AdminSecurity} allowedRoles={["admin"]} />

          <ProtectedRoute path="/profile" component={Profile} allowedRoles={["user", "admin"]} />
          <ProtectedRoute path="/notifications" component={Notifications} allowedRoles={["user"]} />
          <ProtectedRoute path="/settings" component={Settings} allowedRoles={["user", "admin"]} />
          <ProtectedRoute path="/favorites" component={Favorites} allowedRoles={["user"]} />
          <ProtectedRoute path="/recipes" component={Recipes} allowedRoles={["user", "admin"]} />
          <ProtectedRoute path="/recipes/:id" component={RecipeDetails} allowedRoles={["user", "admin"]} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Router />
          <Suspense fallback={null}><MealMateAssistant /></Suspense>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

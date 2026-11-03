import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import Dashboard from '@/pages/Dashboard';
import { Route, Switch } from 'wouter';
import { Leaf, Carrot, Apple, Sprout } from 'lucide-react';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import MealPlanner from "@/pages/User/MealPlanner";
import MyMealPlans from "@/pages/User/MyMealPlans";
import MealPlanDetails from "@/pages/User/MealPlanDetails";
import GroceryList from "@/pages/User/GroceryList";
import GroceryStore from "@/pages/User/GroceryStore";
import Pantry from "@/pages/User/Pantry";
import Recipes from "@/pages/User/Recipes";
import RecipeDetails from "@/pages/User/RecipeDetails";
import Favorites from "@/pages/User/Favorites";
import Profile from "@/pages/Profile";
import Notifications from "@/pages/Notifications";
import Settings from "@/pages/Settings";
import MealMateAssistant from "@/components/MealMateAssistant";
import AdminUsers from "@/pages/Admin/Users";
import AdminRecipes from "@/pages/Admin/Recipes";
import AdminMealPlans from "@/pages/Admin/MealPlans";
import AdminAnalytics from "@/pages/Admin/Analytics";
import AdminAIFeatures from "@/pages/Admin/AIFeatures";
import AdminSecurity from "@/pages/Admin/Security";
import "@/navbar-layout.css";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={ Home } />
      <Route path="/login" component={ Login } />
      <Route path="/signup" component={ Signup } />
      <ProtectedRoute path="/dashboard" component={ Dashboard } allowedRoles={ ['admin', 'user'] } />
      <ProtectedRoute path="/meal-planner" component={ MealPlanner } allowedRoles={ ["user"] } />
      <ProtectedRoute path="/my-meal-plans" component={ MyMealPlans } allowedRoles={ ["user"] } />
      <ProtectedRoute path="/meal-plans/:id" component={ MealPlanDetails } allowedRoles={ ["user"] } />
      <ProtectedRoute path="/user/grocery" component={ GroceryList } allowedRoles={ ["user"] } />
      <ProtectedRoute path="/grocery-store" component={ GroceryStore } allowedRoles={ ["user"] } />
      <ProtectedRoute path="/pantry" component={ Pantry } allowedRoles={ ["user"] } />

      <ProtectedRoute path="/admin/users" component={ AdminUsers } allowedRoles={ ["admin"] } />
      <ProtectedRoute path="/admin/recipes" component={ AdminRecipes } allowedRoles={ ["admin"] } />
      <ProtectedRoute path="/admin/meal-plans" component={ AdminMealPlans } allowedRoles={ ["admin"] } />
      <ProtectedRoute path="/admin/analytics" component={ AdminAnalytics } allowedRoles={ ["admin"] } />
      <ProtectedRoute path="/admin/ai-features" component={ AdminAIFeatures } allowedRoles={ ["admin"] } />
      <ProtectedRoute path="/admin/security" component={ AdminSecurity } allowedRoles={ ["admin"] } />

      <Route path="/profile" component={Profile} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/settings" component={Settings} />
      <Route path="/favorites" component={Favorites} />
      <ProtectedRoute path="/recipes" component={Recipes} allowedRoles={["user", "admin"]} />
      <ProtectedRoute path="/recipes/:id" component={RecipeDetails} allowedRoles={["user", "admin"]} />
      <Route component={ NotFound } />
    </Switch>
  );
}

function GlobalFoodDecorations() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60] hidden xl:block overflow-hidden"
    >
      <Leaf className="absolute left-[2.5%] top-[24%] h-24 w-24 -rotate-12 text-green-700/[0.10]" strokeWidth={1.1} />
      <Carrot className="absolute right-[2.5%] top-[43%] h-28 w-28 rotate-12 text-green-700/[0.10]" strokeWidth={1.1} />
      <Sprout className="absolute left-[3.5%] top-[73%] h-28 w-28 rotate-6 text-green-700/[0.09]" strokeWidth={1.1} />
      <Apple className="absolute right-[4%] top-[82%] h-24 w-24 -rotate-12 text-green-700/[0.09]" strokeWidth={1.1} />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={ queryClient }>
      <AuthProvider>
        <TooltipProvider>
          <Router />
          <GlobalFoodDecorations />
          <MealMateAssistant />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

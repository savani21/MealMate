import { Redirect, Route } from "wouter";
import { useAuth } from "@/context/AuthContext";

// Usage: <ProtectedRoute path="/dashboard" component={Dashboard} allowedRoles={["admin","user"]} />
export function ProtectedRoute({ path, component: Component, allowedRoles }) {
  const { user, loading } = useAuth();

  return (
    <Route path={path}>
      {() => {
        if (loading) {
          return <div className="flex items-center justify-center h-screen text-gray-500">Loading...</div>;
        }
        if (!user) return <Redirect to="/login" />;
        if (allowedRoles && !allowedRoles.includes(user.role)) return <Redirect to="/" />;
        return <Component />;
      }}
    </Route>
  );
}
import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext(null);

function applyAccountTheme(user) {
  const root = document.getElementById("root");
  const enabled = Boolean(user && user.preferences?.theme === "dark");
  root?.classList.toggle("dark", enabled);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Old browser-only theme preferences are intentionally not inherited
        // by other accounts. Theme now belongs to the authenticated profile.
        setUser(parsedUser);
      } catch (error) {
        console.error("Failed to restore user session:", error);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    applyAccountTheme(user);
  }, [user]);

  const login = (userData, token) => {
    const normalizedUser = {
      ...userData,
      preferences: {
        ...(userData.preferences || {}),
        theme: userData.preferences?.theme === "dark" ? "dark" : "light",
      },
    };
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(normalizedUser));
    setUser(normalizedUser);
  };

  const updateTheme = useCallback(async (theme) => {
    if (!user || !["light", "dark"].includes(theme)) {
      throw new Error("You must be logged in to change your theme.");
    }

    const token = localStorage.getItem("token");
    const response = await fetch("/api/auth/preferences/theme", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ theme }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Unable to save theme preference.");
    }

    const updatedUser = {
      ...user,
      preferences: { ...(user.preferences || {}), theme: data.preferences.theme },
    };
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
    return updatedUser.preferences.theme;
  }, [user]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      updateTheme,
      loading,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

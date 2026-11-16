import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      const storedUser = localStorage.getItem("user");
      const token = localStorage.getItem("token");

      if (!storedUser || !token) {
        setLoading(false);
        return;
      }

      try {
        const cachedUser = JSON.parse(storedUser);
        // Rehydrate from the authenticated profile so the database, not a
        // browser-wide preference, is the source of truth for this account.
        const response = await fetch("/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Session profile could not be restored.");
        const data = await response.json();
        const serverUser = data.user || cachedUser;
        const normalizedUser = {
          ...serverUser,
          preferences: {
            ...(serverUser.preferences || {}),
            theme: serverUser.preferences?.theme === "dark" ? "dark" : "light",
          },
        };

        if (!active) return;
        localStorage.setItem("user", JSON.stringify(normalizedUser));
        setUser(normalizedUser);
      } catch (error) {
        console.error("Failed to restore user session:", error);
        if (!active) return;
        // Do not keep a stale browser-only theme if the authenticated profile
        // cannot be verified.
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    restoreSession();
    return () => { active = false; };
  }, []);

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

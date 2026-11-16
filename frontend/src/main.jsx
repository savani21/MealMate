import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";

// Restore the saved theme before the React app first paints.
if (localStorage.getItem("darkMode") === "true") {
  document.documentElement.classList.add("dark");
}

createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
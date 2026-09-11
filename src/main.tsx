import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Initialize dark/light theme based on system preference to prevent FOUC.
(function initTheme() {
  const root = document.documentElement;
  const mode: "dark" | "light" = window.matchMedia(
    "(prefers-color-scheme: dark)",
  ).matches
    ? "dark"
    : "light";
  root.setAttribute("data-theme", mode);
})();

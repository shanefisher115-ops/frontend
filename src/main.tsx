import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Dark/light theme toggle. Default follows system preference; the chosen value
// is kept in a module variable (not localStorage — sandboxed iframes block it).
(function initThemeToggle() {
  const root = document.documentElement;
  let mode: "dark" | "light" = window.matchMedia(
    "(prefers-color-scheme: dark)",
  ).matches
    ? "dark"
    : "light";
  root.setAttribute("data-theme", mode);
})();


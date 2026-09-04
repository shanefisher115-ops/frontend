import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Set initial theme on HTML root element based on system preference if not set.
if (typeof document !== "undefined" && !document.documentElement.hasAttribute("data-theme")) {
  const initialTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", initialTheme);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

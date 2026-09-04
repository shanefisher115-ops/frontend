import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { getInitialTheme, applyTheme } from "./lib/theme";

// Initialize theme on load
const initialTheme = getInitialTheme();
applyTheme(initialTheme);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

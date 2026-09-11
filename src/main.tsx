import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Dark/light theme initialization. Default follows system preference; the chosen value
// is set on the document element (not localStorage — sandboxed iframes block it).
(function initTheme() {
  const root = document.documentElement;
  const mode = window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
  root.setAttribute("data-theme", mode);
})();

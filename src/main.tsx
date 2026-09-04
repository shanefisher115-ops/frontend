import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

import { getInitialTheme, setTheme } from "./lib/theme";

// Dark/light theme initialization. Default follows system preference.
(function initThemeToggle() {
  const initialMode = getInitialTheme();
  setTheme(initialMode);
})();

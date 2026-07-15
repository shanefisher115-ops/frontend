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
  const toggle = document.querySelector<HTMLButtonElement>("[data-theme-toggle]");
  let mode: "dark" | "light" = window.matchMedia(
    "(prefers-color-scheme: dark)",
  ).matches
    ? "dark"
    : "light";
  root.setAttribute("data-theme", mode);
  applyToggleIcon(toggle, mode);

  toggle?.addEventListener("click", () => {
    mode = mode === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", mode);
    applyToggleIcon(toggle, mode);
  });
})();

function applyToggleIcon(
  toggle: HTMLButtonElement | null,
  mode: "dark" | "light",
) {
  if (!toggle) return;
  toggle.setAttribute(
    "aria-label",
    `Switch to ${mode === "dark" ? "light" : "dark"} mode`,
  );
  toggle.innerHTML =
    mode === "dark"
      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
      : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
}

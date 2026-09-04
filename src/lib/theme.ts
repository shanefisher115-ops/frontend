export type ThemeMode = "dark" | "light";

export function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") return "dark";
  const saved = document.documentElement.getAttribute("data-theme") as ThemeMode | null;
  if (saved === "dark" || saved === "light") return saved;
  if (typeof window.matchMedia === "function") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "dark";
}

export function setTheme(mode: ThemeMode): ThemeMode {
  if (typeof document === "undefined") return mode;
  const root = document.documentElement;
  root.setAttribute("data-theme", mode);
  const toggle = document.querySelector<HTMLButtonElement>("[data-theme-toggle]");
  if (toggle) {
    toggle.setAttribute("aria-label", `Switch to ${mode === "dark" ? "light" : "dark"} mode`);
    toggle.setAttribute("aria-pressed", mode === "light" ? "true" : "false");
    toggle.innerHTML =
      mode === "dark"
        ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
        : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  }
  return mode;
}

export function toggleTheme(): ThemeMode {
  const current = (document.documentElement.getAttribute("data-theme") as ThemeMode) || getInitialTheme();
  const next = current === "dark" ? "light" : "dark";
  return setTheme(next);
}

import { useState, useEffect } from "react";
import { CADStudio } from "./components/CADStudio";
import { Dashboard } from "./components/Dashboard";
import { DatabaseStatusBadge } from "./components/DatabaseStatusBadge";

export default function App() {
  const [activeTab, setActiveTab] = useState<"cad" | "database">("cad");
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return document.documentElement.getAttribute("data-theme") === "light"
      ? "light"
      : "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <div className="app-container">
      {/* App Main Header */}
      <header className="app-header">
        <div className="app-header__brand">
          <span className="app-header__logo" aria-hidden="true">
            <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="6" fill="currentColor" opacity="0.9" />
              <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="1.5" opacity="0.45" />
              <circle cx="16" cy="16" r="9.5" stroke="currentColor" strokeWidth="1" opacity="0.25" />
            </svg>
          </span>
          <div>
            <h1 className="app-header__title">Primordia Studio</h1>
            <p className="app-header__subtitle">CAD Parametric Feature Engine & Console</p>
          </div>
        </div>

        {/* View Switching Tabs */}
        <nav className="app-nav-tabs" aria-label="Main Navigation">
          <button
            type="button"
            className={`nav-tab ${activeTab === "cad" ? "nav-tab--active" : ""}`}
            onClick={() => setActiveTab("cad")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
            CAD Feature Tree & Inspector
          </button>
          <button
            type="button"
            className={`nav-tab ${activeTab === "database" ? "nav-tab--active" : ""}`}
            onClick={() => setActiveTab("database")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
            </svg>
            Database Console
          </button>
        </nav>

        {/* Header Right Controls */}
        <div className="app-header__controls">
          <DatabaseStatusBadge />
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Main View Area */}
      <main className="app-main-content">
        {activeTab === "cad" ? <CADStudio /> : <Dashboard />}
      </main>
    </div>
  );
}

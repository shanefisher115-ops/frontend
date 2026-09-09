import { useState, useEffect } from "react";
import { Dashboard } from "./components/Dashboard";
import { CamStudio } from "./components/cam/CamStudio";
import { DatabaseStatusBadge } from "./components/DatabaseStatusBadge";
import { Box, Database, Sun, Moon } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"cam" | "database">("cam");
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <div className="console-app">
      {/* Top Application Header Navigation */}
      <header className="app-header">
        <div className="app-header__brand">
          <div className="app-header__logo">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="6" fill="currentColor" opacity="0.9" />
              <circle
                cx="16"
                cy="16"
                r="13"
                stroke="currentColor"
                strokeWidth="1.5"
                opacity="0.45"
              />
              <circle
                cx="16"
                cy="16"
                r="9.5"
                stroke="currentColor"
                strokeWidth="1"
                opacity="0.25"
              />
            </svg>
          </div>
          <div>
            <h1 className="app-header__title">Primordia · CNC & Database Console</h1>
            <p className="app-header__subtitle">primordialorigin.com</p>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <nav className="app-nav">
          <button
            type="button"
            className={`app-nav__tab ${activeTab === "cam" ? "app-nav__tab--active" : ""}`}
            onClick={() => setActiveTab("cam")}
          >
            <Box size={16} /> 3D CAM Toolpath
          </button>
          <button
            type="button"
            className={`app-nav__tab ${activeTab === "database" ? "app-nav__tab--active" : ""}`}
            onClick={() => setActiveTab("database")}
          >
            <Database size={16} /> Database Console
          </button>
        </nav>

        {/* Right Header Status & Theme Toggle */}
        <div className="app-header__right">
          <DatabaseStatusBadge />
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="app-content">
        {activeTab === "cam" ? <CamStudio /> : <Dashboard />}
      </main>
    </div>
  );
}

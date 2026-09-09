import { useState } from "react";
import { CadWorkspace } from "./components/CadWorkspace";
import { Dashboard } from "./components/Dashboard";
import { DatabaseStatusBadge } from "./components/DatabaseStatusBadge";

export default function App() {
  const [activeTab, setActiveTab] = useState<"cad" | "database">("cad");

  return (
    <div className="app-container">
      <header className="app-global-header">
        <div className="app-brand">
          <span className="app-logo" aria-hidden="true">
            ⚙️
          </span>
          <div>
            <h1 className="app-title">Primordia · Parametric CAD & Console</h1>
            <p className="app-subtitle">
              Feature History, Property Inspector & Database Client
            </p>
          </div>
        </div>

        <nav className="app-tabs" aria-label="Main Navigation">
          <button
            type="button"
            className={`tab-btn ${activeTab === "cad" ? "is-active" : ""}`}
            onClick={() => setActiveTab("cad")}
          >
            🌳 CAD Feature History & Inspector
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === "database" ? "is-active" : ""}`}
            onClick={() => setActiveTab("database")}
          >
            📊 Database Console
          </button>
        </nav>

        <div className="app-header-right">
          <DatabaseStatusBadge />
        </div>
      </header>

      <div className="app-body">
        {activeTab === "cad" ? <CadWorkspace /> : <Dashboard />}
      </div>
    </div>
  );
}

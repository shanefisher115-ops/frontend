import { useEffect, useState, useCallback, useRef } from "react";
import { DashboardHeader } from "./DashboardHeader";
import { ConnectionDiagnostics } from "./ConnectionDiagnostics";
import { SignalsList } from "./SignalsList";
import { databaseMode } from "../lib/supabase";
import { fetchSignals, subscribeToSignals, type FetchResult } from "../lib/database";
export function Dashboard() {
  const [result, setResult] = useState<FetchResult | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const load = useCallback((manual = false) => {
    if (manual) setIsRefreshing(true);
    fetchSignals().then((r) => {
      setResult(r);
      const now = new Date();
      setLastUpdated(now);
      if (manual) {
        setIsRefreshing(false);
        setAnnouncement(`Signals data refreshed at ${now.toLocaleTimeString()}`);
      }
    });
  }, []);

  const toggleTheme = useCallback(() => {
    const root = document.documentElement;
    const currentTheme = root.getAttribute("data-theme") || "dark";
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", nextTheme);

    const toggleBtn = document.querySelector<HTMLButtonElement>("[data-theme-toggle]");
    if (toggleBtn) {
      toggleBtn.setAttribute("aria-label", `Switch to ${currentTheme} mode`);
      toggleBtn.innerHTML =
        nextTheme === "dark"
          ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
          : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    }

    setAnnouncement(`Theme changed to ${nextTheme} mode`);
  }, []);

  const handleRefreshClick = () => {
    load(true);
  };

  const toggleShortcutsModal = useCallback(() => {
    setShowShortcutsModal((prev) => !prev);
  }, []);

  useEffect(() => {
    load();
    const unsubscribe = subscribeToSignals(() => load(false));
    const interval = setInterval(() => load(false), 15000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [load]);

  // Keyboard shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key events when user is typing inside input, textarea, or contentEditable
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === "Escape" && showShortcutsModal) {
        e.preventDefault();
        setShowShortcutsModal(false);
        return;
      }

      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        load(true);
      } else if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        toggleTheme();
      } else if (e.key === "?" || e.key === "h" || e.key === "H") {
        e.preventDefault();
        toggleShortcutsModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [load, toggleTheme, toggleShortcutsModal, showShortcutsModal]);

  // Focus management when shortcuts modal opens
  useEffect(() => {
    if (showShortcutsModal && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [showShortcutsModal]);

  const loading = result === null;
  const showError = result?.error && result.isMock && databaseMode === "live";

  return (
    <div className="console">
      {/* Skip to main content link for keyboard navigation */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Live region for screen reader announcements */}
      <div className="sr-only" role="status" aria-live="polite">
        {announcement}
      </div>

      <DashboardHeader
        isRefreshing={isRefreshing}
        onRefreshClick={handleRefreshClick}
        onToggleTheme={toggleTheme}
        onToggleShortcutsModal={toggleShortcutsModal}
      />

      <main id="main-content">
        <ConnectionDiagnostics />

        {showError && (
          <div className="card alert-card" role="alert" aria-live="assertive">
            <strong>Live query failed — serving mock data.</strong>
            <p>{result?.error}</p>
          </div>
        )}

        <SignalsList
          result={result}
          loading={loading}
          lastUpdated={lastUpdated}
        />
      </main>

      <footer className="console__footer" role="contentinfo">
        <p>
          To go live: create a Supabase project, copy your Project URL + anon
          key into <code>.env</code>, run the <code>signals</code> migration
          (see <code>src/types/signal.ts</code>), then restart the dev server
          or rebuild/redeploy. Press <kbd>?</kbd> for keyboard shortcuts.
        </p>
      </footer>

      {showShortcutsModal && (
        <div
          className="modal-backdrop"
          onClick={toggleShortcutsModal}
        >
          <div
            className="modal-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-dialog-title"
            ref={modalRef}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 id="shortcuts-dialog-title" className="modal-title">
                Keyboard Shortcuts
              </h2>
              <button
                type="button"
                className="btn-icon"
                onClick={toggleShortcutsModal}
                ref={closeButtonRef}
                aria-label="Close keyboard shortcuts modal"
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <dl className="shortcuts-list">
                <div className="shortcut-item">
                  <dt>
                    <kbd>R</kbd>
                  </dt>
                  <dd>Refresh signals data</dd>
                </div>
                <div className="shortcut-item">
                  <dt>
                    <kbd>T</kbd>
                  </dt>
                  <dd>Toggle dark / light theme</dd>
                </div>
                <div className="shortcut-item">
                  <dt>
                    <kbd>?</kbd> or <kbd>H</kbd>
                  </dt>
                  <dd>Open / close keyboard shortcuts help</dd>
                </div>
                <div className="shortcut-item">
                  <dt>
                    <kbd>Esc</kbd>
                  </dt>
                  <dd>Close dialog modal</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


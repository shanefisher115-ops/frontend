import { DatabaseStatusBadge } from "./DatabaseStatusBadge";

export function DashboardHeader({
  isRefreshing,
  onRefreshClick,
  onToggleTheme,
  onToggleShortcutsModal,
}: {
  isRefreshing: boolean;
  onRefreshClick: () => void;
  onToggleTheme: () => void;
  onToggleShortcutsModal: () => void;
}) {
  return (
    <header className="console__header" role="banner">
        <div className="console__brand">
          <span className="console__logo" aria-hidden="true">
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
          </span>
          <div>
            <h1 className="console__title">Primordia · Database Console</h1>
            <p className="console__subtitle">
              primordialorigin.com · Supabase client with mock fallback
            </p>
          </div>
        </div>
        <div className="console__header-right">
          <DatabaseStatusBadge />
          <button
            type="button"
            className="btn-icon"
            onClick={onRefreshClick}
            disabled={isRefreshing}
            aria-label="Refresh signals data (Shortcut: R)"
            title="Refresh signals data (Press 'R')"
          >
            <svg
              className={isRefreshing ? "spin" : ""}
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M21.5 2v6h-6M2.5 22v-6h6" />
              <path d="M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" />
            </svg>
          </button>

          <button
            type="button"
            className="theme-toggle"
            data-theme-toggle
            onClick={onToggleTheme}
            aria-label="Switch theme mode (Shortcut: T)"
            title="Switch theme mode (Press 'T')"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          </button>

          <button
            type="button"
            className="btn-icon"
            onClick={onToggleShortcutsModal}
            aria-label="Keyboard shortcuts (Shortcut: ? or H)"
            title="Keyboard shortcuts (Press '?')"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M8 16h8" />
            </svg>
          </button>
        </div>
      </header>
  );
}

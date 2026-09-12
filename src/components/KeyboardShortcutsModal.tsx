import { useEffect, useRef } from "react";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutInfo {
  key: string;
  description: string;
}

const SHORTCUTS: ShortcutInfo[] = [
  { key: "R / Alt+R", description: "Refresh signal data" },
  { key: "T / Alt+T", description: "Toggle light / dark mode" },
  { key: "/ / S / Alt+S", description: "Focus search filter" },
  { key: "? / H / Alt+H", description: "Toggle keyboard shortcuts help" },
  { key: "Esc", description: "Close modal dialog or clear search filter" },
];

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="presentation"
      data-testid="shortcuts-modal-backdrop"
    >
      <div
        className="modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-dialog-title"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        <div className="modal-dialog__header">
          <h2 id="shortcuts-dialog-title" className="modal-dialog__title">
            Keyboard Shortcuts
          </h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            ref={closeButtonRef}
            aria-label="Close keyboard shortcuts dialog"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="muted" style={{ fontSize: "var(--text-sm)" }}>
          Use the following keyboard shortcuts to quickly navigate and control the Primordia Console:
        </p>
        <div className="shortcuts-list" role="list">
          {SHORTCUTS.map((s) => (
            <div key={s.key} className="shortcut-item" role="listitem">
              <span className="shortcut-item__label">{s.description}</span>
              <kbd>{s.key}</kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

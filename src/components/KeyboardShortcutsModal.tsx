import { useEffect, useRef } from "react";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SHORTCUTS = [
  { key: "R", description: "Refresh signals data" },
  { key: "T", description: "Toggle dark / light theme" },
  { key: "?", description: "Toggle keyboard shortcuts help" },
  { key: "Esc", description: "Close shortcuts dialog" },
];

export function KeyboardShortcutsModal({
  isOpen,
  onClose,
}: KeyboardShortcutsModalProps) {
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
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-dialog-title"
      >
        <div className="modal-header">
          <h2 id="shortcuts-dialog-title" className="card__title">
            Keyboard Shortcuts
          </h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close keyboard shortcuts dialog"
            ref={closeButtonRef}
          >
            ✕
          </button>
        </div>
        <div className="modal-body">
          <ul className="shortcuts-list" aria-label="Available keyboard shortcuts">
            {SHORTCUTS.map((s) => (
              <li key={s.key} className="shortcut-item">
                <kbd className="shortcut-key">{s.key}</kbd>
                <span className="shortcut-desc">{s.description}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

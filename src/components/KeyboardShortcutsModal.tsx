import { useEffect, useRef } from "react";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="presentation"
      data-testid="shortcuts-modal-backdrop"
    >
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="shortcuts-modal-title" className="modal-title">
            Keyboard Shortcuts
          </h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close keyboard shortcuts modal"
            ref={closeButtonRef}
          >
            ✕
          </button>
        </div>
        <div className="modal-body">
          <ul className="shortcuts-list" aria-label="Available keyboard shortcuts">
            <li className="shortcut-item">
              <span className="shortcut-label">Refresh signals data</span>
              <kbd className="kbd-badge">R</kbd>
            </li>
            <li className="shortcut-item">
              <span className="shortcut-label">Toggle color theme</span>
              <kbd className="kbd-badge">T</kbd>
            </li>
            <li className="shortcut-item">
              <span className="shortcut-label">Toggle shortcuts help</span>
              <kbd className="kbd-badge">?</kbd>
            </li>
            <li className="shortcut-item">
              <span className="shortcut-label">Close dialog</span>
              <kbd className="kbd-badge">Esc</kbd>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

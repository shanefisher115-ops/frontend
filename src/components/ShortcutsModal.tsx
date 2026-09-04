import { useEffect, useRef } from "react";

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      closeButtonRef.current?.focus();

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        if (previousActiveElement.current) {
          previousActiveElement.current.focus();
        }
      };
    }
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
        ref={dialogRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-dialog-title"
        aria-describedby="shortcuts-dialog-desc"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        <div className="modal__header">
          <div>
            <h2 id="shortcuts-dialog-title" className="modal__title">
              Keyboard Shortcuts
            </h2>
            <p id="shortcuts-dialog-desc" className="modal__desc">
              Global keyboard controls for quick navigation and actions.
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="modal__close-btn"
            onClick={onClose}
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
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="modal__body">
          <ul className="shortcuts-list" aria-label="Available keyboard shortcuts">
            <li className="shortcut-item">
              <span className="shortcut-item__label">Toggle Dark / Light Theme</span>
              <kbd className="kbd">T</kbd>
            </li>
            <li className="shortcut-item">
              <span className="shortcut-item__label">Refresh Signals Data</span>
              <kbd className="kbd">R</kbd>
            </li>
            <li className="shortcut-item">
              <span className="shortcut-item__label">Toggle Keyboard Shortcuts</span>
              <kbd className="kbd">?</kbd>
            </li>
            <li className="shortcut-item">
              <span className="shortcut-item__label">Close Dialog</span>
              <kbd className="kbd">Esc</kbd>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

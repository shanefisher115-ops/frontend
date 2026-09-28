import { useEffect, useRef } from "react";

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      closeBtnRef.current?.focus();

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          e.preventDefault();
          onClose();
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      data-testid="shortcuts-modal-backdrop"
    >
      <div
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-modal-title"
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="shortcuts-modal-title" className="modal-title">
            Keyboard Shortcuts
          </h2>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            aria-label="Close keyboard shortcuts dialog"
            ref={closeBtnRef}
          >
            ✕
          </button>
        </div>
        <div className="modal-body">
          <ul className="shortcuts-list" role="list">
            <li className="shortcut-item">
              <span className="shortcut-desc">Refresh signals data</span>
              <kbd className="kbd">R</kbd>
            </li>
            <li className="shortcut-item">
              <span className="shortcut-desc">Toggle light / dark theme</span>
              <kbd className="kbd">T</kbd>
            </li>
            <li className="shortcut-item">
              <span className="shortcut-desc">Show / hide keyboard shortcuts</span>
              <kbd className="kbd">?</kbd>
            </li>
            <li className="shortcut-item">
              <span className="shortcut-desc">Close shortcut help / dialogs</span>
              <kbd className="kbd">Esc</kbd>
            </li>
          </ul>
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

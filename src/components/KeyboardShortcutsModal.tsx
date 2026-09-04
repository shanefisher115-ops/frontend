import { useEffect, useRef } from "react";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
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
    >
      <div
        className="modal-card"
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
            ref={closeButtonRef}
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close keyboard shortcuts modal"
          >
            ✕
          </button>
        </div>
        <div className="modal-body">
          <ul className="shortcuts-list">
            <li className="shortcut-item">
              <span className="shortcut-desc">Refresh signals data</span>
              <kbd className="shortcut-key">R</kbd>
            </li>
            <li className="shortcut-item">
              <span className="shortcut-desc">Toggle theme (dark / light)</span>
              <kbd className="shortcut-key">T</kbd>
            </li>
            <li className="shortcut-item">
              <span className="shortcut-desc">Toggle keyboard shortcuts help</span>
              <kbd className="shortcut-key">?</kbd>
            </li>
            <li className="shortcut-item">
              <span className="shortcut-desc">Close modal / dialog</span>
              <kbd className="shortcut-key">Esc</kbd>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useRef } from "react";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({
  isOpen,
  onClose,
}: KeyboardShortcutsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      aria-hidden="false"
      role="presentation"
    >
      <div
        className="modal-content"
        ref={modalRef}
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
            ref={closeButtonRef}
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close keyboard shortcuts dialog"
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          <ul className="shortcuts-list" role="list">
            <li className="shortcut-item">
              <span className="shortcut-desc">Refresh signals data</span>
              <kbd className="shortcut-key">R</kbd>
            </li>
            <li className="shortcut-item">
              <span className="shortcut-desc">Toggle light / dark theme</span>
              <kbd className="shortcut-key">T</kbd>
            </li>
            <li className="shortcut-item">
              <span className="shortcut-desc">Show / hide keyboard shortcuts</span>
              <kbd className="shortcut-key">?</kbd>
            </li>
            <li className="shortcut-item">
              <span className="shortcut-desc">Close dialog / modal</span>
              <kbd className="shortcut-key">Esc</kbd>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

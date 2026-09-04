import { useEffect, useRef } from "react";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: "t", description: "Toggle light / dark mode" },
  { key: "r", description: "Refresh signal data" },
  { key: "/", description: "Focus signal search input" },
  { key: "?", description: "Show keyboard shortcuts" },
  { key: "Esc", description: "Close modal / clear search filter" },
];

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Focus the close button when opened
    closeBtnRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }

      // Trap focus inside modal
      if (e.key === "Tab" && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
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
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-card__header">
          <h2 id="shortcuts-dialog-title" className="card__title">
            Keyboard Shortcuts
          </h2>
          <button
            ref={closeBtnRef}
            type="button"
            className="modal-card__close"
            onClick={onClose}
            aria-label="Close keyboard shortcuts modal"
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
        <div className="modal-card__body">
          <dl className="shortcuts-list">
            {SHORTCUTS.map((item) => (
              <div className="shortcuts-row" key={item.key}>
                <dt>
                  <kbd className="shortcut-kbd">{item.key}</kbd>
                </dt>
                <dd>{item.description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}

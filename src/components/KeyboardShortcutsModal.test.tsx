import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { KeyboardShortcutsModal, SHORTCUTS } from "./KeyboardShortcutsModal";

describe("KeyboardShortcutsModal Accessibility", () => {
  it("does not render when isOpen is false", () => {
    const handleClose = vi.fn();
    render(<KeyboardShortcutsModal isOpen={false} onClose={handleClose} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders accessible modal dialog when isOpen is true", () => {
    const handleClose = vi.fn();
    render(<KeyboardShortcutsModal isOpen={true} onClose={handleClose} />);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby", "shortcuts-dialog-title");

    const heading = screen.getByRole("heading", { name: "Keyboard Shortcuts" });
    expect(heading.id).toBe("shortcuts-dialog-title");

    const closeBtn = screen.getByRole("button", {
      name: "Close keyboard shortcuts dialog",
    });
    expect(closeBtn).toBeInTheDocument();
    expect(closeBtn).toHaveFocus();
  });

  it("renders all defined shortcuts in list with aria label", () => {
    const handleClose = vi.fn();
    render(<KeyboardShortcutsModal isOpen={true} onClose={handleClose} />);

    const list = screen.getByRole("list", { name: "Available keyboard shortcuts" });
    expect(list).toBeInTheDocument();

    SHORTCUTS.forEach((s) => {
      expect(screen.getByText(s.key)).toBeInTheDocument();
      expect(screen.getByText(s.description)).toBeInTheDocument();
    });
  });

  it("calls onClose when close button is clicked", () => {
    const handleClose = vi.fn();
    render(<KeyboardShortcutsModal isOpen={true} onClose={handleClose} />);

    const closeBtn = screen.getByRole("button", {
      name: "Close keyboard shortcuts dialog",
    });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when clicking backdrop presentation layer", () => {
    const handleClose = vi.fn();
    render(<KeyboardShortcutsModal isOpen={true} onClose={handleClose} />);

    const backdrop = screen.getByRole("presentation");
    fireEvent.click(backdrop);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});

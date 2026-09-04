import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { KeyboardShortcutsModal } from "./KeyboardShortcutsModal";

describe("KeyboardShortcutsModal", () => {
  it("does not render when isOpen is false", () => {
    render(<KeyboardShortcutsModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders with correct ARIA attributes when isOpen is true", () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={vi.fn()} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby", "shortcuts-dialog-title");
    expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument();
  });

  it("calls onClose when close button or Escape key is pressed", () => {
    const handleClose = vi.fn();
    render(<KeyboardShortcutsModal isOpen={true} onClose={handleClose} />);

    const closeBtn = screen.getByRole("button", { name: /close keyboard shortcuts modal/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(handleClose).toHaveBeenCalledTimes(2);
  });
});

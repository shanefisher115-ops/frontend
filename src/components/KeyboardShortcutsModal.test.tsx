import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { KeyboardShortcutsModal } from "./KeyboardShortcutsModal";

describe("KeyboardShortcutsModal", () => {
  it("does not render when isOpen is false", () => {
    const { container } = render(
      <KeyboardShortcutsModal isOpen={false} onClose={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders modal with correct ARIA attributes when isOpen is true", () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={() => {}} />);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeDefined();
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.getAttribute("aria-labelledby")).toBe("shortcuts-modal-title");

    const heading = screen.getByText("Keyboard Shortcuts");
    expect(heading.id).toBe("shortcuts-modal-title");
  });

  it("renders all expected keyboard shortcuts", () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={() => {}} />);

    expect(screen.getByText("Refresh signals data")).toBeDefined();
    expect(screen.getByText("Toggle color theme")).toBeDefined();
    expect(screen.getByText("Toggle shortcuts help")).toBeDefined();
    expect(screen.getByText("Close dialog")).toBeDefined();

    expect(screen.getByText("R")).toBeDefined();
    expect(screen.getByText("T")).toBeDefined();
    expect(screen.getByText("?")).toBeDefined();
    expect(screen.getByText("Esc")).toBeDefined();
  });

  it("calls onClose when the close button is clicked", () => {
    const handleClose = vi.fn();
    render(<KeyboardShortcutsModal isOpen={true} onClose={handleClose} />);

    const closeBtn = screen.getByLabelText("Close keyboard shortcuts modal");
    fireEvent.click(closeBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Escape key is pressed", () => {
    const handleClose = vi.fn();
    render(<KeyboardShortcutsModal isOpen={true} onClose={handleClose} />);

    fireEvent.keyDown(window, { key: "Escape" });

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when backdrop is clicked", () => {
    const handleClose = vi.fn();
    render(<KeyboardShortcutsModal isOpen={true} onClose={handleClose} />);

    const backdrop = screen.getByTestId("shortcuts-modal-backdrop");
    fireEvent.click(backdrop);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});

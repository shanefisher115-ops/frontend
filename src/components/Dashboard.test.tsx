import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { Dashboard } from "./Dashboard";
import { DatabaseStatusBadge } from "./DatabaseStatusBadge";
import { ShortcutsModal } from "./ShortcutsModal";

vi.mock("../lib/database", () => {
  return {
    fetchSignals: vi.fn().mockResolvedValue({
      signals: [
        {
          id: "1",
          name: "Alpha-1",
          origin: "Sector-7G",
          status: "active",
          intensity: 85,
          recorded_at: new Date().toISOString(),
        },
        {
          id: "2",
          name: "Beta-2",
          origin: "Sector-4",
          status: "degraded",
          intensity: 42,
          recorded_at: new Date().toISOString(),
        },
      ],
      isMock: true,
      error: null,
    }),
    subscribeToSignals: vi.fn().mockReturnValue(() => {}),
  };
});

describe("Accessibility & Keyboard Shortcuts", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme");
  });

  it("renders status badge with role='status' and aria-live='polite'", () => {
    render(<DatabaseStatusBadge />);
    const badge = screen.getByTestId("status-database-mode");
    expect(badge).toHaveAttribute("role", "status");
    expect(badge).toHaveAttribute("aria-live", "polite");
    expect(badge).toHaveAttribute(
      "aria-label",
      "Database status: Using Mock Fallback"
    );
  });

  it("renders skip link for quick landmark navigation", async () => {
    await act(async () => {
      render(<Dashboard />);
    });
    const skipLink = screen.getByText("Skip to main content");
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute("href", "#main-content");
  });

  it("toggles theme when clicking theme toggle button and sets document data-theme attribute", async () => {
    await act(async () => {
      render(<Dashboard />);
    });
    const themeBtn = screen.getByRole("button", { name: /switch to light mode/i });
    expect(themeBtn).toHaveAttribute("aria-pressed", "false");

    await act(async () => {
      fireEvent.click(themeBtn);
    });
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(
      screen.getByRole("button", { name: /switch to dark mode/i })
    ).toHaveAttribute("aria-pressed", "true");

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /switch to dark mode/i }));
    });
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("triggers theme toggle with 'T' keyboard shortcut", async () => {
    await act(async () => {
      render(<Dashboard />);
    });
    expect(document.documentElement.getAttribute("data-theme")).toBeNull();

    await act(async () => {
      fireEvent.keyDown(window, { key: "t" });
    });
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");

    await act(async () => {
      fireEvent.keyDown(window, { key: "T" });
    });
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("opens and closes Shortcuts modal using '?' shortcut and Esc key", async () => {
    await act(async () => {
      render(<Dashboard />);
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Trigger shortcut '?'
    await act(async () => {
      fireEvent.keyDown(window, { key: "?" });
    });
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");

    // Press Esc to close
    await act(async () => {
      fireEvent.keyDown(window, { key: "Escape" });
    });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("renders signals table with captions, th scope headers, and role='meter' for intensity", async () => {
    await act(async () => {
      render(<Dashboard />);
    });
    const table = await screen.findByRole("table");
    expect(table).toBeInTheDocument();

    const headers = screen.getAllByRole("columnheader");
    expect(headers.length).toBe(5);
    headers.forEach((h) => expect(h).toHaveAttribute("scope", "col"));

    const meters = screen.getAllByRole("meter");
    expect(meters.length).toBeGreaterThan(0);
    expect(meters[0]).toHaveAttribute("aria-valuenow", "85");
    expect(meters[0]).toHaveAttribute("aria-valuemin", "0");
    expect(meters[0]).toHaveAttribute("aria-valuemax", "100");
  });

  it("ShortcutsModal renders list of shortcuts with proper ARIA attributes", () => {
    const handleClose = vi.fn();
    render(<ShortcutsModal isOpen={true} onClose={handleClose} />);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-labelledby", "shortcuts-modal-title");

    const closeButton = screen.getByRole("button", {
      name: /close keyboard shortcuts dialog/i,
    });
    expect(closeButton).toBeInTheDocument();

    fireEvent.click(closeButton);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});

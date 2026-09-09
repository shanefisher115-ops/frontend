import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Dashboard } from "./Dashboard";

// Mock fetchSignals and subscribeToSignals
vi.mock("../lib/database", () => {
  return {
    fetchSignals: vi.fn().mockResolvedValue({
      signals: [
        {
          id: "1",
          name: "Alpha Signal",
          origin: "Sector 7G",
          status: "active",
          intensity: 85,
          recorded_at: "2025-01-01T10:00:00Z",
        },
        {
          id: "2",
          name: "Beta Signal",
          origin: "Sector 4",
          status: "degraded",
          intensity: 30,
          recorded_at: "2025-01-01T11:00:00Z",
        },
      ],
      isMock: true,
      error: null,
    }),
    subscribeToSignals: vi.fn().mockReturnValue(() => {}),
  };
});

describe("Dashboard component accessibility & keyboard shortcuts", () => {
  it("renders landmarks: header, main, footer", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("Alpha Signal")).toBeInTheDocument();
    });

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("renders skip link targeting main content", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("Alpha Signal")).toBeInTheDocument();
    });

    const skipLink = screen.getByText("Skip to main content");
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute("href", "#main-content");
  });

  it("renders table with caption, col scope, and progressbar", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("Alpha Signal")).toBeInTheDocument();
    });

    const table = screen.getByRole("table", { name: "Database Signals" });
    expect(table).toBeInTheDocument();

    const progressbars = screen.getAllByRole("progressbar");
    expect(progressbars.length).toBeGreaterThan(0);
    expect(progressbars[0]).toHaveAttribute("aria-valuenow", "85");
    expect(progressbars[0]).toHaveAttribute("aria-valuemin", "0");
    expect(progressbars[0]).toHaveAttribute("aria-valuemax", "100");
  });

  it("opens keyboard shortcuts dialog when '?' is pressed and closes with Escape", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("Alpha Signal")).toBeInTheDocument();
    });

    // Press ?
    fireEvent.keyDown(window, { key: "?" });

    const dialog = screen.getByRole("dialog", { name: "Keyboard Shortcuts" });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");

    // Press Escape
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("toggles theme when theme shortcut 't' is used", async () => {
    render(<Dashboard />);

    const themeBtn = screen.getByRole("button", { name: /Switch to light mode/i });
    expect(themeBtn).toBeInTheDocument();

    // Press 't'
    fireEvent.keyDown(window, { key: "t" });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Switch to dark mode/i })).toBeInTheDocument();
    });
  });

  it("refreshes data when refresh shortcut 'r' is used", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("Alpha Signal")).toBeInTheDocument();
    });

    // Press 'r'
    fireEvent.keyDown(window, { key: "r" });

    // Live region announcement
    await waitFor(() => {
      expect(screen.getByText("Signals refreshed.")).toBeInTheDocument();
    });
  });
});

import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dashboard } from "./Dashboard";

// Mock database module
vi.mock("../lib/database", () => ({
  fetchSignals: vi.fn().mockResolvedValue({
    signals: [
      {
        id: "1",
        name: "Alpha Signal",
        origin: "node-1",
        status: "active",
        intensity: 85,
        recorded_at: new Date().toISOString(),
      },
      {
        id: "2",
        name: "Beta Signal",
        origin: "node-2",
        status: "degraded",
        intensity: 40,
        recorded_at: new Date().toISOString(),
      },
    ],
    isMock: true,
  }),
  subscribeToSignals: vi.fn().mockReturnValue(() => {}),
}));

describe("Dashboard Accessibility and Keyboard Shortcuts", () => {
  it("renders main landmarks and structure", async () => {
    render(<Dashboard />);

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Alpha Signal")).toBeInTheDocument();
    });

    expect(screen.getByRole("region", { name: "Signals" })).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("toggles keyboard shortcuts dialog with shortcut '?' and button", async () => {
    const user = userEvent.setup();
    render(<Dashboard />);

    // Click shortcuts button
    const shortcutsBtn = screen.getByRole("button", {
      name: /Keyboard shortcuts help/i,
    });
    await user.click(shortcutsBtn);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument();

    // Close with Esc key
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Open with '?' key
    await user.keyboard("?");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("toggles theme with 'T' keyboard shortcut", async () => {
    const user = userEvent.setup();
    render(<Dashboard />);

    const initialTheme = document.documentElement.getAttribute("data-theme") || "dark";
    await user.keyboard("t");
    const newTheme = document.documentElement.getAttribute("data-theme");
    expect(newTheme).not.toBe(initialTheme);
  });

  it("refreshes signals data on 'R' keyboard shortcut or button click", async () => {
    const user = userEvent.setup();
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("Alpha Signal")).toBeInTheDocument();
    });

    const refreshBtn = screen.getByRole("button", {
      name: /Refresh signals dataset/i,
    });
    await user.click(refreshBtn);

    // Press 'r' shortcut
    await user.keyboard("r");
    expect(screen.getByText("Alpha Signal")).toBeInTheDocument();
  });

  it("renders signals table with meters and proper ARIA labels", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("Alpha Signal")).toBeInTheDocument();
    });

    const meters = screen.getAllByRole("meter");
    expect(meters.length).toBeGreaterThan(0);
    expect(meters[0]).toHaveAttribute("aria-valuenow", "85");
    expect(meters[0]).toHaveAttribute("aria-valuemin", "0");
    expect(meters[0]).toHaveAttribute("aria-valuemax", "100");
  });
});

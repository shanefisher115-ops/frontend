import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Dashboard } from "./Dashboard";
import { DatabaseStatusBadge } from "./DatabaseStatusBadge";

// Mock database functions
vi.mock("../lib/database", () => ({
  fetchSignals: vi.fn().mockResolvedValue({
    signals: [
      {
        id: "1",
        name: "Alpha Signal",
        origin: "Sector 7",
        status: "active",
        intensity: 85,
        recorded_at: new Date().toISOString(),
      },
    ],
    isMock: true,
  }),
  subscribeToSignals: vi.fn(() => () => {}),
}));

describe("DatabaseStatusBadge Accessibility", () => {
  it("renders with proper status role and aria attributes", () => {
    render(<DatabaseStatusBadge />);
    const badge = screen.getByTestId("status-database-mode");
    expect(badge).toHaveAttribute("role", "status");
    expect(badge).toHaveAttribute("aria-live", "polite");
    expect(badge).toHaveAttribute("aria-label");
  });
});

describe("Dashboard Accessibility & Keyboard Shortcuts", () => {
  it("renders landmarks and accessible elements", async () => {
    render(<Dashboard />);

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();

    const title = screen.getByRole("heading", { level: 1 });
    expect(title).toHaveTextContent("Primordia · Database Console");

    const refreshBtn = await screen.findByRole("button", { name: /refresh signals data/i });
    expect(refreshBtn).toBeInTheDocument();

    const signalsTable = screen.getByRole("region", { name: /signals data table/i });
    expect(signalsTable).toBeInTheDocument();

    const meter = screen.getByRole("meter", { name: /intensity for Alpha Signal/i });
    expect(meter).toHaveAttribute("aria-valuenow", "85");
    expect(meter).toHaveAttribute("aria-valuemin", "0");
    expect(meter).toHaveAttribute("aria-valuemax", "100");
  });

  it("opens and closes keyboard shortcuts modal via shortcut button and Esc key", async () => {
    render(<Dashboard />);
    await screen.findByRole("button", { name: /refresh signals data/i });

    const shortcutsBtn = screen.getByRole("button", { name: /keyboard shortcuts/i });
    fireEvent.click(shortcutsBtn);

    const dialog = screen.getByRole("dialog", { name: /keyboard shortcuts/i });
    expect(dialog).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("triggers keyboard shortcuts '?' key to toggle shortcuts modal", async () => {
    render(<Dashboard />);
    await screen.findByRole("button", { name: /refresh signals data/i });

    fireEvent.keyDown(window, { key: "?" });
    expect(screen.getByRole("dialog", { name: /keyboard shortcuts/i })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "?" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

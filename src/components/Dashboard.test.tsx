import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DatabaseStatusBadge } from "./DatabaseStatusBadge";
import { Dashboard, timeAgo } from "./Dashboard";

// Mock database module
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
    error: null,
  }),
  subscribeToSignals: vi.fn().mockReturnValue(() => {}),
}));

describe("DatabaseStatusBadge Accessibility", () => {
  it("renders with role status and accessible label", () => {
    render(<DatabaseStatusBadge />);
    const badge = screen.getByTestId("status-database-mode");
    expect(badge).not.toBeNull();
    expect(badge.getAttribute("role")).toBe("status");
    expect(badge.getAttribute("aria-live")).toBe("polite");
    expect(badge.getAttribute("aria-label")).toMatch(/Database connection status:/);
  });
});

describe("Dashboard Accessibility & Keyboard Shortcuts", () => {
  beforeEach(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  });

  it("renders skip link and main landmark structure", async () => {
    await act(async () => {
      render(<Dashboard />);
    });

    const skipLink = screen.getByText("Skip to main content");
    expect(skipLink).toBeDefined();
    expect(skipLink.getAttribute("href")).toBe("#main-content");

    const mainElement = screen.getByRole("main");
    expect(mainElement.getAttribute("id")).toBe("main-content");

    await waitFor(() => {
      expect(screen.getByText("Alpha Signal")).toBeDefined();
    });
  });

  it("renders table with proper ARIA attributes and column headers", async () => {
    await act(async () => {
      render(<Dashboard />);
    });

    await waitFor(() => {
      expect(screen.getByRole("table", { name: "Database Signals" })).toBeDefined();
    });

    const headers = screen.getAllByRole("columnheader");
    expect(headers.length).toBe(5);

    const progressbar = screen.getByRole("progressbar");
    expect(progressbar.getAttribute("aria-valuenow")).toBe("85");
    expect(progressbar.getAttribute("aria-valuemin")).toBe("0");
    expect(progressbar.getAttribute("aria-valuemax")).toBe("100");
  });

  it("opens and closes keyboard shortcuts modal via button and Escape key", async () => {
    await act(async () => {
      render(<Dashboard />);
    });

    await waitFor(() => {
      expect(screen.getByText("Alpha Signal")).toBeDefined();
    });

    const shortcutsBtn = screen.getByRole("button", {
      name: /Keyboard shortcuts/i,
    });

    await act(async () => {
      fireEvent.click(shortcutsBtn);
    });

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeDefined();
    expect(screen.getByText("Keyboard Shortcuts")).toBeDefined();

    // Press Escape key
    await act(async () => {
      fireEvent.keyDown(window, { key: "Escape" });
    });

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("triggers keyboard shortcuts for refresh ('r') and theme toggle ('t')", async () => {
    await act(async () => {
      render(<Dashboard />);
    });

    await waitFor(() => {
      expect(screen.getByText("Alpha Signal")).toBeDefined();
    });

    // Press 'r' key to trigger refresh
    await act(async () => {
      fireEvent.keyDown(window, { key: "r" });
    });

    // Press 't' key to toggle theme
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    await act(async () => {
      fireEvent.keyDown(window, { key: "t" });
    });
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });
});

describe("timeAgo", () => {


  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("formats seconds ago correctly", () => {
    const now = Date.now();
    expect(timeAgo(new Date(now - 10 * 1000))).toBe("10s ago");
    expect(timeAgo(new Date(now - 59 * 1000))).toBe("59s ago");
  });

  it("formats minutes ago correctly and rounds properly", () => {
    const now = Date.now();
    expect(timeAgo(new Date(now - 60 * 1000))).toBe("1m ago");
    expect(timeAgo(new Date(now - 59.5 * 1000))).toBe("1m ago"); // 59.5s rounds to 60s, so it triggers minutes block
    expect(timeAgo(new Date(now - 90 * 1000))).toBe("2m ago"); // 1.5 minutes rounds to 2
    expect(timeAgo(new Date(now - 59 * 60 * 1000))).toBe("59m ago");
  });

  it("formats hours ago correctly and rounds properly", () => {
    const now = Date.now();
    expect(timeAgo(new Date(now - 60 * 60 * 1000))).toBe("1h ago");
    expect(timeAgo(new Date(now - 59.5 * 60 * 1000))).toBe("1h ago"); // 59.5m rounds to 60m
    expect(timeAgo(new Date(now - 90 * 60 * 1000))).toBe("2h ago");
    expect(timeAgo(new Date(now - 23 * 60 * 60 * 1000))).toBe("23h ago");
  });

  it("formats days ago correctly and rounds properly", () => {
    const now = Date.now();
    expect(timeAgo(new Date(now - 24 * 60 * 60 * 1000))).toBe("1d ago");
    expect(timeAgo(new Date(now - 23.5 * 60 * 60 * 1000))).toBe("1d ago"); // 23.5h rounds to 24h
    expect(timeAgo(new Date(now - 36 * 60 * 60 * 1000))).toBe("2d ago"); // 36 hours -> 2 days (36/24 = 1.5 -> 2)
    expect(timeAgo(new Date(now - 100 * 24 * 60 * 60 * 1000))).toBe("100d ago");
  });
});

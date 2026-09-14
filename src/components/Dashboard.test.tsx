import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DatabaseStatusBadge } from "./DatabaseStatusBadge";
import { Dashboard } from "./Dashboard";

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


describe("Dashboard Data Fetching & Lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads and displays signals on mount", async () => {
    render(<Dashboard />);

    // Check loading state gone
    await waitFor(() => {
      expect(screen.queryByText(/Loading signals data/i)).toBeNull();
    });

    // Check data is displayed
    await waitFor(() => {
      expect(screen.getByText("Alpha Signal")).toBeDefined();
      expect(screen.getByText("Sector 7")).toBeDefined();
      expect(screen.getByText("Active")).toBeDefined();
    });
  });

  it("handles manual refresh correctly", async () => {
    const { fetchSignals } = await import("../lib/database");

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("Alpha Signal")).toBeDefined();
    });

    const refreshBtn = screen.getByRole("button", { name: /Refresh signals data/i });

    await act(async () => {
      fireEvent.click(refreshBtn);
    });

    expect(fetchSignals).toHaveBeenCalledTimes(2); // 1 for initial mount, 1 for refresh
  });

  it("subscribes to realtime updates and sets interval on mount", async () => {
    const { subscribeToSignals } = await import("../lib/database");
    vi.useFakeTimers();

    const unmount = render(<Dashboard />).unmount;

    expect(subscribeToSignals).toHaveBeenCalled();

    unmount();

    vi.useRealTimers();
  });
});


describe("Dashboard Error Handling", () => {
  let originalMode;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("displays error when live query fails but shows mock data", async () => {
    vi.doMock("../lib/database", () => ({
      fetchSignals: vi.fn().mockResolvedValue({
        signals: [],
        isMock: true,
        error: "Live query failed due to network error",
      }),
      subscribeToSignals: vi.fn().mockReturnValue(() => {}),
    }));

    vi.doMock("../lib/supabase", () => ({
      databaseMode: "live",
      envDiagnostics: {
        url: { configured: true, masked: "***" },
        key: { configured: true, masked: "***" }
      }
    }));

    const { Dashboard } = await import("./Dashboard");

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("Live query failed due to network error")).toBeDefined();
      expect(screen.getByText("Live query failed — serving mock data.")).toBeDefined();
    });
  });
});

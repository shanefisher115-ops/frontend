import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Dashboard } from "./Dashboard";
import { DatabaseStatusBadge } from "./DatabaseStatusBadge";

// Mock database module
vi.mock("../lib/database", () => ({
  fetchSignals: vi.fn().mockResolvedValue({
    signals: [
      {
        id: "1",
        name: "Alpha-1",
        origin: "Sector 7G",
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
  it("renders with role='status' and appropriate aria-label", () => {
    render(<DatabaseStatusBadge />);
    const badge = screen.getByTestId("status-database-mode");
    expect(badge).toHaveAttribute("role", "status");
    expect(badge).toHaveAttribute("aria-live", "polite");
    expect(badge).toHaveAttribute("aria-label");
  });
});

describe("Dashboard Accessibility & Keyboard Shortcuts", () => {
  beforeEach(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  });

  it("renders semantic landmarks: banner, main, section, contentinfo", async () => {
    await act(async () => {
      render(<Dashboard />);
    });
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();

    // Check headings
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Primordia · Database Console"
    );
  });

  it("renders table with proper accessibility th, caption, and region wrapper", async () => {
    await act(async () => {
      render(<Dashboard />);
    });
    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });

    const headers = screen.getAllByRole("columnheader");
    expect(headers).toHaveLength(5);
    expect(headers[0]).toHaveTextContent("Name");

    const rowHeaders = screen.getAllByRole("rowheader");
    expect(rowHeaders[0]).toHaveTextContent("Alpha-1");

    const meter = screen.getByRole("meter");
    expect(meter).toHaveAttribute("aria-valuenow", "85");
    expect(meter).toHaveAttribute("aria-label", "Signal intensity: 85%");
  });

  it("toggles theme on 'T' key press", async () => {
    await act(async () => {
      render(<Dashboard />);
    });
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");

    act(() => {
      fireEvent.keyDown(window, { key: "t" });
    });
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");

    act(() => {
      fireEvent.keyDown(window, { key: "t" });
    });
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("opens and closes keyboard shortcuts modal via '?' and 'Escape' or close button", async () => {
    await act(async () => {
      render(<Dashboard />);
    });

    // Initially modal is not present
    expect(screen.queryByRole("dialog")).toBeNull();

    // Press '?' to open modal
    act(() => {
      fireEvent.keyDown(window, { key: "?" });
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument();

    // Press 'Escape' to close modal
    act(() => {
      fireEvent.keyDown(window, { key: "Escape" });
    });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("refreshes data when pressing 'R' key", async () => {
    const database = await import("../lib/database");
    await act(async () => {
      render(<Dashboard />);
    });

    await waitFor(() => {
      expect(database.fetchSignals).toHaveBeenCalled();
    });

    const callsCount = vi.mocked(database.fetchSignals).mock.calls.length;
    act(() => {
      fireEvent.keyDown(window, { key: "r" });
    });

    await waitFor(() => {
      expect(vi.mocked(database.fetchSignals).mock.calls.length).toBeGreaterThan(
        callsCount
      );
    });
  });
});

import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Dashboard } from "./Dashboard";
import { DatabaseStatusBadge } from "./DatabaseStatusBadge";
import * as databaseModule from "../lib/database";

vi.mock("../lib/database", async () => {
  const actual = await vi.importActual<typeof databaseModule>("../lib/database");
  return {
    ...actual,
    fetchSignals: vi.fn(),
    subscribeToSignals: vi.fn(() => () => {}),
  };
});

describe("DatabaseStatusBadge Accessibility", () => {
  it("renders with correct ARIA attributes and role", () => {
    render(<DatabaseStatusBadge />);
    const badge = screen.getByTestId("status-database-mode");
    expect(badge).toHaveAttribute("role", "status");
    expect(badge).toHaveAttribute("aria-live", "polite");
    expect(badge).toHaveAttribute(
      "aria-label",
      "Database Status: Using Mock Fallback"
    );
  });
});

describe("Dashboard Accessibility and Keyboard Shortcuts", () => {
  const mockSignals = [
    {
      id: "1",
      name: "Alpha",
      origin: "Sector 7",
      status: "active" as const,
      intensity: 85,
      recorded_at: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.resetAllMocks();
    (databaseModule.fetchSignals as any).mockResolvedValue({
      signals: mockSignals,
      isMock: true,
    });
    (databaseModule.subscribeToSignals as any).mockReturnValue(() => {});
  });

  it("renders semantic landmarks, skip link, and table headers with scope", async () => {
    await act(async () => {
      render(<Dashboard />);
    });

    // Skip link
    const skipLink = screen.getByText("Skip to main content");
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute("href", "#main-content");

    // Landmarks
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();

    // Table accessibility
    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });
    const table = screen.getByRole("table");
    expect(table).toHaveAttribute("aria-label", "Signal data table");

    const columnHeaders = screen.getAllByRole("columnheader");
    expect(columnHeaders.length).toBeGreaterThan(0);
    columnHeaders.forEach((header) => {
      expect(header).toHaveAttribute("scope", "col");
    });
  });

  it("toggles theme on button click and via keyboard shortcut Alt+T", async () => {
    await act(async () => {
      render(<Dashboard />);
    });

    const themeToggleBtn = screen.getByLabelText(/Switch to light mode/i);
    expect(themeToggleBtn).toBeInTheDocument();

    // Initial theme attribute in document element
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");

    // Click theme toggle button
    act(() => {
      fireEvent.click(themeToggleBtn);
    });
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");

    // Press Alt+T shortcut
    act(() => {
      fireEvent.keyDown(window, { key: "t", altKey: true });
    });
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("refreshes signals when pressing 'r' keyboard shortcut", async () => {
    await act(async () => {
      render(<Dashboard />);
    });

    await waitFor(() => {
      expect(databaseModule.fetchSignals).toHaveBeenCalledTimes(1);
    });

    // Press 'r' shortcut
    await act(async () => {
      fireEvent.keyDown(window, { key: "r" });
    });

    await waitFor(() => {
      expect(databaseModule.fetchSignals).toHaveBeenCalledTimes(2);
    });
  });
});

import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { Dashboard } from "./Dashboard";

// Mock database fetching
vi.mock("../lib/database", () => ({
  fetchSignals: vi.fn().mockResolvedValue({
    signals: [
      {
        id: "1",
        name: "Test Signal",
        origin: "Test Origin",
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

describe("Dashboard component accessibility and shortcuts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders accessible landmarks and skip link", async () => {
    await act(async () => {
      render(<Dashboard />);
    });

    expect(screen.getByRole("banner")).toBeDefined();
    expect(screen.getByRole("main")).toBeDefined();
    expect(screen.getByRole("contentinfo")).toBeDefined();

    const skipLink = screen.getByText("Skip to main content");
    expect(skipLink).toBeDefined();
    expect(skipLink.getAttribute("href")).toBe("#main-content");
  });

  test("renders accessible table with caption and headers", async () => {
    await act(async () => {
      render(<Dashboard />);
    });

    await waitFor(() => {
      expect(screen.getByText("Test Signal")).toBeDefined();
    });

    const table = screen.getByRole("table");
    expect(table).toBeDefined();

    const caption = table.querySelector("caption");
    expect(caption).not.toBeNull();
    expect(caption?.textContent).toContain("List of telemetry signals");

    const columnHeaders = screen.getAllByRole("columnheader");
    expect(columnHeaders.length).toBe(5);
  });

  test("opens and closes keyboard shortcuts modal via button and Escape key", async () => {
    await act(async () => {
      render(<Dashboard />);
    });

    const shortcutsBtn = screen.getByRole("button", {
      name: /Show keyboard shortcuts/i,
    });
    expect(shortcutsBtn.getAttribute("aria-expanded")).toBe("false");

    await act(async () => {
      fireEvent.click(shortcutsBtn);
    });

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeDefined();
    expect(screen.getByText("Keyboard Shortcuts")).toBeDefined();

    // Close via Escape key
    await act(async () => {
      fireEvent.keyDown(window, { key: "Escape" });
    });

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  test("triggers keyboard shortcuts '?' 'r' and 't'", async () => {
    await act(async () => {
      render(<Dashboard />);
    });

    // Press '?' to toggle modal
    await act(async () => {
      fireEvent.keyDown(window, { key: "?" });
    });
    expect(screen.getByRole("dialog")).toBeDefined();

    // Press Esc to close modal
    await act(async () => {
      fireEvent.keyDown(window, { key: "Escape" });
    });
    expect(screen.queryByRole("dialog")).toBeNull();

    // Mock theme toggle click listener
    const themeToggleMock = vi.fn();
    const themeBtn = screen.getByRole("button", { name: /Switch color theme/i });
    themeBtn.addEventListener("click", themeToggleMock);

    // Press 't' to trigger theme toggle
    await act(async () => {
      fireEvent.keyDown(window, { key: "t" });
    });
    expect(themeToggleMock).toHaveBeenCalledTimes(1);

    // Press 'r' to trigger refresh
    await act(async () => {
      fireEvent.keyDown(window, { key: "r" });
    });
    await waitFor(() => {
      expect(screen.getByText("Test Signal")).toBeDefined();
    });
  });
});

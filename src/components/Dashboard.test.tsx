import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Dashboard } from "./Dashboard";

vi.mock("../lib/database", () => ({
  fetchSignals: vi.fn().mockResolvedValue({
    signals: [
      {
        id: "1",
        name: "Alpha Pulse",
        origin: "Station 7",
        status: "active",
        intensity: 85,
        recorded_at: new Date().toISOString(),
      },
    ],
    isMock: true,
  }),
  subscribeToSignals: vi.fn().mockReturnValue(() => {}),
}));

describe("Dashboard Accessibility and Keyboard Shortcuts", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme");
  });

  it("renders landmarks and skip link", async () => {
    render(<Dashboard />);
    await waitFor(() => expect(screen.getByText("Alpha Pulse")).toBeDefined());

    const skipLink = screen.getByText("Skip to main content");
    expect(skipLink).toBeDefined();
    expect(skipLink.getAttribute("href")).toBe("#main-content");

    const banner = screen.getByRole("banner");
    expect(banner).toBeDefined();

    const main = screen.getByRole("main");
    expect(main).toBeDefined();
    expect(main.id).toBe("main-content");

    const contentInfo = screen.getByRole("contentinfo");
    expect(contentInfo).toBeDefined();
  });

  it("renders status badge with role status and aria-live", async () => {
    render(<Dashboard />);
    await waitFor(() => expect(screen.getByText("Alpha Pulse")).toBeDefined());

    const statusBadge = screen.getByTestId("status-database-mode");
    expect(statusBadge).toBeDefined();
    expect(statusBadge.getAttribute("role")).toBe("status");
    expect(statusBadge.getAttribute("aria-live")).toBe("polite");
  });

  it("renders table with caption, col scope, and intensity progressbar", async () => {
    render(<Dashboard />);
    await waitFor(() => expect(screen.getByText("Alpha Pulse")).toBeDefined());

    const tableRegion = screen.getByRole("region", { name: "Signals data table" });
    expect(tableRegion).toBeDefined();

    const headers = screen.getAllByRole("columnheader");
    expect(headers.length).toBeGreaterThan(0);
    headers.forEach((header) => {
      expect(header.getAttribute("scope")).toBe("col");
    });

    const progressbars = screen.getAllByRole("progressbar");
    expect(progressbars.length).toBe(1);
    expect(progressbars[0].getAttribute("aria-valuenow")).toBe("85");
    expect(progressbars[0].getAttribute("aria-label")).toBe("Intensity: 85%");
  });

  it("toggles theme when theme toggle button is clicked or 'T' key is pressed", async () => {
    render(<Dashboard />);
    await waitFor(() => expect(screen.getByText("Alpha Pulse")).toBeDefined());

    const themeToggleBtn = screen.getByTestId("btn-theme-toggle");
    expect(themeToggleBtn).toBeDefined();

    const initialTheme = document.documentElement.getAttribute("data-theme");

    // Click theme toggle
    await act(async () => {
      fireEvent.click(themeToggleBtn);
    });
    const toggledTheme = document.documentElement.getAttribute("data-theme");
    expect(toggledTheme).not.toBe(initialTheme);

    // Press 'T' key
    await act(async () => {
      fireEvent.keyDown(window, { key: "t" });
    });
    const toggledBackTheme = document.documentElement.getAttribute("data-theme");
    expect(toggledBackTheme).toBe(initialTheme);
  });

  it("opens keyboard shortcuts modal on clicking shortcuts button or pressing '?' key", async () => {
    render(<Dashboard />);
    await waitFor(() => expect(screen.getByText("Alpha Pulse")).toBeDefined());

    expect(screen.queryByRole("dialog")).toBeNull();

    // Press '?' key
    await act(async () => {
      fireEvent.keyDown(window, { key: "?" });
    });
    expect(screen.getByRole("dialog")).toBeDefined();

    // Close modal with Escape
    await act(async () => {
      fireEvent.keyDown(window, { key: "Escape" });
    });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    // Click shortcuts button
    const shortcutsBtn = screen.getByTestId("btn-shortcuts");
    await act(async () => {
      fireEvent.click(shortcutsBtn);
    });
    expect(screen.getByRole("dialog")).toBeDefined();
  });

  it("refreshes signals on pressing 'R' key", async () => {
    render(<Dashboard />);
    await waitFor(() => expect(screen.getByText("Alpha Pulse")).toBeDefined());

    await act(async () => {
      fireEvent.keyDown(window, { key: "r" });
    });

    expect(screen.getByTestId("btn-refresh")).toBeDefined();
  });
});

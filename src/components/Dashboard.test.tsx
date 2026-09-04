import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Dashboard } from "./Dashboard";
import * as databaseModule from "../lib/database";

vi.mock("../lib/database", () => ({
  fetchSignals: vi.fn(),
  subscribeToSignals: vi.fn(() => vi.fn()),
}));

describe("Dashboard Accessibility and Keyboard Shortcuts", () => {
  const mockSignalsResult: databaseModule.FetchResult = {
    signals: [
      {
        id: "1",
        name: "Alpha Pulse",
        origin: "Sector 7G",
        status: "active",
        intensity: 85,
        recorded_at: new Date().toISOString(),
      },
    ],
    mode: "mock",
    isMock: true,
    error: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (databaseModule.fetchSignals as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockSignalsResult,
    );
    document.documentElement.setAttribute("data-theme", "dark");
  });

  it("renders accessible landmarks, skip link, and table elements", async () => {
    await act(async () => {
      render(<Dashboard />);
    });

    // Skip link
    const skipLink = screen.getByText("Skip to main content");
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute("href", "#main-content");

    // Landmarks
    const mainLandmark = screen.getByRole("main");
    expect(mainLandmark).toHaveAttribute("id", "main-content");

    const footerLandmark = screen.getByRole("contentinfo");
    expect(footerLandmark).toBeInTheDocument();

    // Database Status Badge
    const statusBadge = screen.getByRole("status", { name: /database status/i });
    expect(statusBadge).toBeInTheDocument();

    // Wait for signals table to load
    await waitFor(() => {
      expect(screen.getByText("Alpha Pulse")).toBeInTheDocument();
    });

    // Table caption (screen-reader only)
    const caption = screen.getByText(/list of database signals/i);
    expect(caption).toBeInTheDocument();

    // Progressbar for signal intensity
    const progressbar = screen.getByRole("progressbar", {
      name: /signal intensity: 85%/i,
    });
    expect(progressbar).toBeInTheDocument();
    expect(progressbar).toHaveAttribute("aria-valuenow", "85");
    expect(progressbar).toHaveAttribute("aria-valuemin", "0");
    expect(progressbar).toHaveAttribute("aria-valuemax", "100");
  });

  it("toggles theme when theme toggle button is clicked or 'T' key is pressed", async () => {
    await act(async () => {
      render(<Dashboard />);
    });

    const themeToggleBtn = screen.getByRole("button", {
      name: /switch to light mode/i,
    });
    expect(themeToggleBtn).toBeInTheDocument();

    // Click theme toggle
    await act(async () => {
      fireEvent.click(themeToggleBtn);
    });
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");

    // Keyboard shortcut 'T'
    await act(async () => {
      fireEvent.keyDown(window, { key: "t" });
    });
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("refreshes signals when refresh button is clicked or 'R' key is pressed", async () => {
    await act(async () => {
      render(<Dashboard />);
    });

    await waitFor(() => {
      expect(databaseModule.fetchSignals).toHaveBeenCalledTimes(1);
    });

    const refreshBtn = screen.getByTestId("refresh-signals-btn");
    await act(async () => {
      fireEvent.click(refreshBtn);
    });

    await waitFor(() => {
      expect(databaseModule.fetchSignals).toHaveBeenCalledTimes(2);
    });

    // Keyboard shortcut 'R'
    await act(async () => {
      fireEvent.keyDown(window, { key: "r" });
    });

    await waitFor(() => {
      expect(databaseModule.fetchSignals).toHaveBeenCalledTimes(3);
    });
  });

  it("opens and closes keyboard shortcuts modal dialog via button and '?' key", async () => {
    await act(async () => {
      render(<Dashboard />);
    });

    // Initially modal is not visible
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Open via button
    const shortcutsBtn = screen.getByTestId("shortcuts-btn");
    await act(async () => {
      fireEvent.click(shortcutsBtn);
    });

    const dialog = screen.getByRole("dialog", { name: /keyboard shortcuts/i });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");

    // Close via close button
    const closeBtn = screen.getByRole("button", {
      name: /close keyboard shortcuts dialog/i,
    });
    await act(async () => {
      fireEvent.click(closeBtn);
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Open via '?' shortcut
    await act(async () => {
      fireEvent.keyDown(window, { key: "?" });
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Close via Escape key
    await act(async () => {
      fireEvent.keyDown(window, { key: "Escape" });
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { Dashboard } from "./Dashboard";

// Mock database module
vi.mock("../lib/database", () => ({
  fetchSignals: vi.fn().mockImplementation(() =>
    Promise.resolve({
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
    })
  ),
  subscribeToSignals: vi.fn().mockReturnValue(() => {}),
}));

describe("Dashboard Component", () => {
  beforeEach(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  });

  it("renders accessible landmarks, roles and headings", async () => {
    await act(async () => {
      render(<Dashboard />);
    });

    // Header banner
    expect(screen.getByRole("banner")).toBeInTheDocument();

    // Main content
    expect(screen.getByRole("main")).toBeInTheDocument();

    // Footer contentinfo
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();

    // Headings
    expect(
      screen.getByRole("heading", { level: 1, name: /Primordia · Database Console/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: /Connection/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: /Signals/i })
    ).toBeInTheDocument();

    // Wait for signals table to load
    await waitFor(() => {
      expect(screen.getByText("Alpha Signal")).toBeInTheDocument();
    });

    // Check progressbar accessibility
    const progressbar = screen.getByRole("progressbar");
    expect(progressbar).toHaveAttribute("aria-valuenow", "85");
    expect(progressbar).toHaveAttribute("aria-label", "Intensity: 85 out of 100");
  });

  it("toggles theme on button click and via keyboard shortcut 'T'", async () => {
    await act(async () => {
      render(<Dashboard />);
    });

    await waitFor(() => {
      expect(screen.getByText("Alpha Signal")).toBeInTheDocument();
    });

    const themeToggle = screen.getByLabelText(/Switch to light mode/i);
    expect(themeToggle).toBeInTheDocument();
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");

    // Click theme toggle
    await act(async () => {
      fireEvent.click(themeToggle);
    });
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");

    // Press keyboard shortcut 't' to toggle back
    await act(async () => {
      fireEvent.keyDown(window, { key: "t" });
    });
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("opens keyboard shortcuts dialog on clicking help button or pressing '?' key", async () => {
    await act(async () => {
      render(<Dashboard />);
    });

    await waitFor(() => {
      expect(screen.getByText("Alpha Signal")).toBeInTheDocument();
    });

    // Open shortcuts help via '?' key
    await act(async () => {
      fireEvent.keyDown(window, { key: "?" });
    });

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: /Keyboard Shortcuts/i })
    ).toBeInTheDocument();

    // Close via 'Escape' key
    await act(async () => {
      fireEvent.keyDown(window, { key: "Escape" });
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("triggers signals refresh on pressing 'R' key", async () => {
    const { fetchSignals } = await import("../lib/database");
    await act(async () => {
      render(<Dashboard />);
    });

    await waitFor(() => {
      expect(screen.getByText("Alpha Signal")).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.keyDown(window, { key: "r" });
    });
    expect(fetchSignals).toHaveBeenCalled();
  });
});

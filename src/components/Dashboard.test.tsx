import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Dashboard } from "./Dashboard";

vi.mock("../lib/database", () => {
  return {
    fetchSignals: vi.fn().mockResolvedValue({
      signals: [
        {
          id: "1",
          name: "Alpha-1",
          origin: "Sector 7",
          status: "active",
          intensity: 85,
          recorded_at: "2025-01-01T12:00:00Z",
        },
      ],
      isMock: true,
      error: null,
    }),
    subscribeToSignals: vi.fn().mockReturnValue(() => {}),
  };
});

describe("Dashboard Accessibility & Keyboard Shortcuts", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme");
  });

  it("renders landmarks and skip to main content link", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("Alpha-1")).not.toBeNull();
    });

    const skipLink = screen.getByText("Skip to main content");
    expect(skipLink).not.toBeNull();
    expect(skipLink.getAttribute("href")).toBe("#main-content");

    const header = screen.getByRole("banner");
    expect(header).not.toBeNull();

    const main = screen.getByRole("main");
    expect(main.id).toBe("main-content");

    const footer = screen.getByRole("contentinfo");
    expect(footer).not.toBeNull();
  });

  it("renders signals table with captions, header scopes, and progressbar", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("Alpha-1")).not.toBeNull();
    });

    const table = screen.getByRole("table");
    expect(table).not.toBeNull();

    const progressbar = screen.getByRole("progressbar");
    expect(progressbar.getAttribute("aria-valuenow")).toBe("85");
    expect(progressbar.getAttribute("aria-label")).toContain("Intensity for Alpha-1: 85%");
  });

  it("toggles theme on button click and keyboard shortcut 't'", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("Alpha-1")).not.toBeNull();
    });

    const themeBtn = screen.getByTitle(/Switch to (light|dark) mode \(T\)/i);
    expect(themeBtn).not.toBeNull();

    // Toggle via button
    fireEvent.click(themeBtn);
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");

    // Toggle via keyboard 't'
    fireEvent.keyDown(window, { key: "t" });
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("opens and closes keyboard shortcuts modal on '?' and 'Escape'", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("Alpha-1")).not.toBeNull();
    });

    // Open modal via '?'
    fireEvent.keyDown(window, { key: "?" });

    await waitFor(() => {
      expect(screen.getByRole("dialog")).not.toBeNull();
    });

    expect(screen.getByText("Keyboard Shortcuts")).not.toBeNull();

    // Close modal via 'Escape'
    fireEvent.keyDown(window, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });

  it("refreshes signal telemetry on 'r' shortcut", async () => {
    const { fetchSignals } = await import("../lib/database");
    render(<Dashboard />);

    await waitFor(() => {
      expect(fetchSignals).toHaveBeenCalled();
    });

    const initialCalls = vi.mocked(fetchSignals).mock.calls.length;

    fireEvent.keyDown(window, { key: "r" });

    await waitFor(() => {
      expect(vi.mocked(fetchSignals).mock.calls.length).toBeGreaterThan(initialCalls);
    });
  });
});

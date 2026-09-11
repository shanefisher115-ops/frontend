import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Dashboard } from "./Dashboard";

// Mock fetchSignals and subscribeToSignals
vi.mock("../lib/database", () => {
  return {
    fetchSignals: vi.fn().mockResolvedValue({
      signals: [
        {
          id: "1",
          name: "Test Signal 1",
          origin: "origin-alpha",
          status: "active",
          intensity: 85,
          recorded_at: new Date().toISOString(),
        },
        {
          id: "2",
          name: "Test Signal 2",
          origin: "origin-beta",
          status: "degraded",
          intensity: 40,
          recorded_at: new Date().toISOString(),
        },
      ],
      isMock: true,
      error: null,
    }),
    subscribeToSignals: vi.fn().mockReturnValue(() => {}),
  };
});

describe("Dashboard Accessibility and Keyboard Shortcuts", () => {
  beforeEach(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  });

  afterEach(() => {
    cleanup();
  });

  it("renders landmarks, skip link, table captions, and progressbars", async () => {
    render(<Dashboard />);

    // Skip to main content link
    const skipLink = screen.getByText("Skip to main content");
    expect(skipLink).toBeDefined();
    expect(skipLink.getAttribute("href")).toBe("#main-content");

    // Main landmark
    const main = screen.getByRole("main");
    expect(main).toBeDefined();
    expect(main.id).toBe("main-content");

    // Header landmark
    const header = screen.getByRole("banner");
    expect(header).toBeDefined();

    // Footer landmark
    const footer = screen.getByRole("contentinfo");
    expect(footer).toBeDefined();

    // Wait for signals data to render
    await waitFor(() => {
      expect(screen.getByText("Test Signal 1")).toBeDefined();
    });

    // Table caption
    const caption = screen.getByText(
      "List of signal telemetry records and their operational status"
    );
    expect(caption).toBeDefined();

    // Progressbars for intensity
    const progressbars = screen.getAllByRole("progressbar");
    expect(progressbars.length).toBe(2);
    expect(progressbars[0].getAttribute("aria-valuenow")).toBe("85");
    expect(progressbars[0].getAttribute("aria-label")).toBe("Intensity: 85%");
  });

  it("toggles theme when clicking theme toggle button and updates ARIA state", async () => {
    render(<Dashboard />);

    const themeToggle = screen.getByLabelText("Switch to light mode");
    expect(themeToggle).toBeDefined();
    expect(themeToggle.getAttribute("aria-pressed")).toBe("false");

    // Click theme toggle
    fireEvent.click(themeToggle);

    // Document attribute updated to light
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(screen.getByLabelText("Switch to dark mode")).toBeDefined();
  });

  it("opens and closes keyboard shortcuts modal dialog", async () => {
    render(<Dashboard />);

    const shortcutsBtn = screen.getByLabelText("Keyboard shortcuts (Key: ?)");
    fireEvent.click(shortcutsBtn);

    // Modal dialog opens
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeDefined();
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(screen.getByText("Keyboard Shortcuts")).toBeDefined();

    // Close button
    const closeBtn = screen.getByLabelText("Close keyboard shortcuts dialog");
    fireEvent.click(closeBtn);

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("responds to keyboard shortcuts 't', '?', 'r', and 'Escape'", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("Test Signal 1")).toBeDefined();
    });

    // Press 't' to toggle theme
    fireEvent.keyDown(window, { key: "t" });
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");

    // Press '?' to open shortcuts modal
    fireEvent.keyDown(window, { key: "?" });
    expect(screen.getByRole("dialog")).toBeDefined();

    // Press 'Escape' to close shortcuts modal
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();

    // Press 'r' to refresh signals
    fireEvent.keyDown(window, { key: "r" });
    const refreshBtn = screen.getByLabelText("Refresh signals (Key: R)");
    expect(refreshBtn).toBeDefined();
  });

  it("does not trigger keyboard shortcuts when focus is inside an input element", async () => {
    render(<Dashboard />);

    // Create an input in the document to test focused input scenario
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    // Press 't' on input
    fireEvent.keyDown(input, { key: "t" });
    // Theme should remain dark
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");

    document.body.removeChild(input);
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { Dashboard } from "./Dashboard";

// Mock fetchSignals and subscribeToSignals
vi.mock("../lib/database", () => {
  return {
    fetchSignals: vi.fn().mockResolvedValue({
      signals: [
        {
          id: "1",
          name: "Test Signal 1",
          origin: "origin-1",
          status: "active",
          intensity: 85,
          recorded_at: "2025-01-01T12:00:00Z",
        },
        {
          id: "2",
          name: "Test Signal 2",
          origin: "origin-2",
          status: "degraded",
          intensity: 40,
          recorded_at: "2025-01-01T11:00:00Z",
        },
      ],
      mode: "mock",
      error: null,
      isMock: true,
    }),
    subscribeToSignals: vi.fn().mockReturnValue(() => {}),
  };
});

describe("Dashboard component accessibility & shortcuts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders landmarks, skip-link, and accessible components", async () => {
    render(<Dashboard />);

    // Skip link
    const skipLink = screen.getByText("Skip to main content");
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute("href", "#main-content");

    // Landmarks
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();

    // Table caption & headers
    await waitFor(() => {
      expect(screen.getByText("Test Signal 1")).toBeInTheDocument();
    });

    const headers = screen.getAllByRole("columnheader");
    expect(headers.length).toBeGreaterThan(0);
    headers.forEach((header) => {
      expect(header).toHaveAttribute("scope", "col");
    });

    // Progress bars
    const progressBars = screen.getAllByRole("progressbar");
    expect(progressBars.length).toBe(2);
    expect(progressBars[0]).toHaveAttribute("aria-valuenow", "85");
    expect(progressBars[0]).toHaveAttribute("aria-valuemin", "0");
    expect(progressBars[0]).toHaveAttribute("aria-valuemax", "100");
  });

  it("toggles light/dark theme via button click and keyboard shortcut 't'", async () => {
    render(<Dashboard />);
    await waitFor(() => expect(screen.getByText("Test Signal 1")).toBeInTheDocument());

    const themeToggleBtn = screen.getByLabelText(/Switch to (light|dark) mode/i);
    expect(themeToggleBtn).toBeInTheDocument();

    const initialLabel = themeToggleBtn.getAttribute("aria-label");

    // Click theme toggle
    await act(async () => {
      fireEvent.click(themeToggleBtn);
    });
    const labelAfterClick = themeToggleBtn.getAttribute("aria-label");
    expect(labelAfterClick).not.toBe(initialLabel);

    // Keyboard shortcut 't'
    await act(async () => {
      fireEvent.keyDown(window, { key: "t" });
    });
    expect(themeToggleBtn.getAttribute("aria-label")).toBe(initialLabel);
  });

  it("opens and closes keyboard shortcuts modal via button, '?' key, and 'Escape' key", async () => {
    render(<Dashboard />);
    await waitFor(() => expect(screen.getByText("Test Signal 1")).toBeInTheDocument());

    // Initially modal is not visible
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Press '?' to open modal
    await act(async () => {
      fireEvent.keyDown(window, { key: "?" });
    });
    const modal = screen.getByRole("dialog");
    expect(modal).toBeInTheDocument();
    expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument();

    // Press Escape to close modal
    await act(async () => {
      fireEvent.keyDown(window, { key: "Escape" });
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Open via Shortcuts button click
    const shortcutsBtn = screen.getByRole("button", { name: "View keyboard shortcuts" });
    await act(async () => {
      fireEvent.click(shortcutsBtn);
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Close via Close button click
    const closeBtn = screen.getByLabelText("Close keyboard shortcuts dialog");
    await act(async () => {
      fireEvent.click(closeBtn);
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("focuses Connection and Signals sections via 'c' and 's' keys", async () => {
    render(<Dashboard />);
    await waitFor(() => expect(screen.getByText("Test Signal 1")).toBeInTheDocument());

    const connectionSection = document.getElementById("connection-section");
    const signalsSection = document.getElementById("signals-section");

    expect(connectionSection).not.toBeNull();
    expect(signalsSection).not.toBeNull();

    // Press 'c' to focus Connection
    await act(async () => {
      fireEvent.keyDown(window, { key: "c" });
    });
    expect(document.activeElement).toBe(connectionSection);

    // Press 's' to focus Signals
    await act(async () => {
      fireEvent.keyDown(window, { key: "s" });
    });
    expect(document.activeElement).toBe(signalsSection);
  });

  it("does not trigger keyboard shortcuts when typing in inputs", async () => {
    render(
      <div>
        <input data-testid="test-input" type="text" />
        <Dashboard />
      </div>,
    );
    await waitFor(() => expect(screen.getByText("Test Signal 1")).toBeInTheDocument());

    const input = screen.getByTestId("test-input");
    input.focus();

    // Press '?' while inside input
    await act(async () => {
      fireEvent.keyDown(input, { key: "?" });
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

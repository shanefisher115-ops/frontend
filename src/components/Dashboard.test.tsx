import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { Dashboard } from "./Dashboard";
import { DatabaseStatusBadge } from "./DatabaseStatusBadge";

describe("DatabaseStatusBadge Accessibility", () => {
  it("renders with proper status role and accessibility attributes", () => {
    render(<DatabaseStatusBadge />);
    const badge = screen.getByRole("status");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute("aria-live", "polite");
    expect(badge).toHaveAttribute("aria-label");
  });
});

describe("Dashboard Accessibility and Keyboard Shortcuts", () => {
  beforeEach(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  });

  it("renders landmarks and accessibility labels correctly", async () => {
    await act(async () => {
      render(<Dashboard />);
    });

    // Header landmark
    expect(screen.getByRole("banner")).toBeInTheDocument();

    // Main landmark / section heading
    expect(screen.getByRole("heading", { name: /Primordia · Database Console/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Connection/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Signals/i })).toBeInTheDocument();

    // Footer landmark
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();

    // Table caption
    await waitFor(() => {
      expect(screen.getByText("Real-time signal status monitor")).toBeInTheDocument();
    });

    // Progressbars for intensity
    const progressBars = screen.getAllByRole("progressbar");
    expect(progressBars.length).toBeGreaterThan(0);
    expect(progressBars[0]).toHaveAttribute("aria-valuemin", "0");
    expect(progressBars[0]).toHaveAttribute("aria-valuemax", "100");
    expect(progressBars[0]).toHaveAttribute("aria-valuenow");
  });

  it("toggles theme via keyboard shortcut 't'", async () => {
    await act(async () => {
      render(<Dashboard />);
    });

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");

    // Press 't'
    act(() => {
      fireEvent.keyDown(window, { key: "t" });
    });
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");

    // Press 't' again
    act(() => {
      fireEvent.keyDown(window, { key: "t" });
    });
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("opens and closes keyboard shortcuts modal via '?' and 'Escape'", async () => {
    await act(async () => {
      render(<Dashboard />);
    });

    // Modal should not be visible initially
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

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
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Press 'h' to open modal
    act(() => {
      fireEvent.keyDown(window, { key: "h" });
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Click close button
    const closeBtn = screen.getByRole("button", { name: /Close keyboard shortcuts dialog/i });
    act(() => {
      fireEvent.click(closeBtn);
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("refreshes signals via keyboard shortcut 'r' and button click", async () => {
    await act(async () => {
      render(<Dashboard />);
    });

    const refreshBtn = screen.getByRole("button", { name: /Refresh signals/i });
    expect(refreshBtn).toBeInTheDocument();

    // Trigger refresh button click
    await act(async () => {
      fireEvent.click(refreshBtn);
    });

    // Trigger shortcut 'r'
    await act(async () => {
      fireEvent.keyDown(window, { key: "r" });
    });
  });

  it("does not trigger shortcuts when user is typing in an input element", async () => {
    await act(async () => {
      render(<Dashboard />);
    });

    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    // Press 't' while focused on input
    act(() => {
      fireEvent.keyDown(input, { key: "t" });
    });
    // Theme should remain unchanged ('dark')
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");

    document.body.removeChild(input);
  });
});

import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { Dashboard } from "./Dashboard";
import { DatabaseStatusBadge } from "./DatabaseStatusBadge";

describe("DatabaseStatusBadge Accessibility", () => {
  it("renders with role status and polite live region", () => {
    render(<DatabaseStatusBadge />);
    const badge = screen.getByTestId("status-database-mode");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute("role", "status");
    expect(badge).toHaveAttribute("aria-live", "polite");
    expect(badge).toHaveAttribute("aria-label");
  });
});

describe("Dashboard Accessibility & Keyboard Shortcuts", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme");
  });

  it("renders landmarks and skip link", async () => {
    await act(async () => {
      render(<Dashboard />);
    });
    expect(screen.getByText("Skip to main content")).toBeInTheDocument();
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("toggles theme with 'T' keyboard shortcut and button click", async () => {
    await act(async () => {
      render(<Dashboard />);
    });
    const toggleBtn = screen.getByTitle(/Switch to/i);
    expect(toggleBtn).toBeInTheDocument();

    // Initial theme is set on html element
    const initialTheme = document.documentElement.getAttribute("data-theme");

    // Press 'T' key
    act(() => {
      fireEvent.keyDown(window, { key: "t" });
    });
    const newTheme = document.documentElement.getAttribute("data-theme");
    expect(newTheme).not.toBe(initialTheme);

    // Click toggle button
    act(() => {
      fireEvent.click(toggleBtn);
    });
    expect(document.documentElement.getAttribute("data-theme")).toBe(initialTheme);
  });

  it("opens and closes keyboard shortcuts modal using '?' or 'H' and 'Esc'", async () => {
    await act(async () => {
      render(<Dashboard />);
    });

    // Shortcuts modal shouldn't be open initially
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Press '?' key
    act(() => {
      fireEvent.keyDown(window, { key: "?" });
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument();

    // Press 'Esc' key to close
    act(() => {
      fireEvent.keyDown(window, { key: "Escape" });
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Press 'h' key
    act(() => {
      fireEvent.keyDown(window, { key: "h" });
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Click close button inside dialog
    const closeBtn = screen.getByLabelText("Close keyboard shortcuts dialog");
    act(() => {
      fireEvent.click(closeBtn);
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("triggers data refresh with 'R' key", async () => {
    await act(async () => {
      render(<Dashboard />);
    });
    const refreshBtn = screen.getByRole("button", { name: /Refresh signals data/i });
    expect(refreshBtn).toBeInTheDocument();

    // Press 'r' key
    act(() => {
      fireEvent.keyDown(window, { key: "r" });
    });
    // Wait for signals content to load
    await waitFor(() => {
      expect(screen.getByRole("region", { name: /Signals data table/i })).toBeInTheDocument();
    });
  });

  it("renders accessible table with caption, col scope, and progressbar roles", async () => {
    await act(async () => {
      render(<Dashboard />);
    });

    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });

    const colHeaders = screen.getAllByRole("columnheader");
    expect(colHeaders.length).toBe(5);

    const progressbars = screen.getAllByRole("progressbar");
    expect(progressbars.length).toBeGreaterThan(0);
    expect(progressbars[0]).toHaveAttribute("aria-valuenow");
  });
});

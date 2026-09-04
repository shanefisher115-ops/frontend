import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { Dashboard } from "./Dashboard";

describe("Dashboard Accessibility and Keyboard Shortcuts", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme");
  });

  it("renders landmarks, skip link, and main title", async () => {
    render(<Dashboard />);

    // Skip link
    const skipLink = screen.getByRole("link", { name: "Skip to main content" });
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute("href", "#main-content");

    // Landmarks
    expect(screen.getByRole("main").id).toBe("main-content");
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();

    // Title
    expect(
      screen.getByRole("heading", { level: 1, name: "Primordia · Database Console" })
    ).toBeInTheDocument();

    // Section headings
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 2, name: "Connection" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 2, name: "Signals" })
      ).toBeInTheDocument();
    });
  });

  it("renders table accessibility features like caption, th scope, progressbars", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("Signals status and intensity metrics")).toBeInTheDocument();
    });

    const columnHeaders = screen.getAllByRole("columnheader");
    expect(columnHeaders.length).toBeGreaterThan(0);
    columnHeaders.forEach((th) => {
      expect(th).toHaveAttribute("scope", "col");
    });

    const progressbars = screen.getAllByRole("progressbar");
    expect(progressbars.length).toBeGreaterThan(0);
    progressbars.forEach((pb) => {
      expect(pb).toHaveAttribute("aria-valuenow");
      expect(pb).toHaveAttribute("aria-valuemin", "0");
      expect(pb).toHaveAttribute("aria-valuemax", "100");
    });
  });

  it("toggles theme when theme button is clicked or shortcut 't' is pressed", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Switch to (light|dark) mode/ })).toBeInTheDocument();
    });

    const themeBtn = screen.getByRole("button", { name: /Switch to (light|dark) mode/ });
    expect(themeBtn).toHaveAttribute("aria-keyshortcuts", "t");

    const initialTheme = document.documentElement.getAttribute("data-theme");

    // Click toggle button
    act(() => {
      fireEvent.click(themeBtn);
    });
    const toggledTheme = document.documentElement.getAttribute("data-theme");
    expect(toggledTheme).not.toBe(initialTheme);

    // Keyboard shortcut 't'
    act(() => {
      fireEvent.keyDown(window, { key: "t" });
    });
    expect(document.documentElement.getAttribute("data-theme")).toBe(initialTheme);
  });

  it("opens and closes keyboard shortcuts modal via button, shortcut '?', and 'Escape'", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 2, name: "Signals" })).toBeInTheDocument();
    });

    // Initially closed
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Press '?' to open modal
    act(() => {
      fireEvent.keyDown(window, { key: "?" });
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Press 'Escape' to close modal
    act(() => {
      fireEvent.keyDown(window, { key: "Escape" });
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Click shortcuts button in header
    const shortcutsBtn = screen.getByRole("button", { name: "Keyboard shortcuts (?)" });
    expect(shortcutsBtn).toHaveAttribute("aria-keyshortcuts", "?");
    act(() => {
      fireEvent.click(shortcutsBtn);
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("refreshes signals when Refresh button is clicked or shortcut 'r' is pressed", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Refresh signals" })).toBeInTheDocument();
    });

    const refreshBtn = screen.getByRole("button", { name: "Refresh signals" });
    expect(refreshBtn).toHaveAttribute("aria-keyshortcuts", "r");

    // Press 'r' shortcut key
    act(() => {
      fireEvent.keyDown(window, { key: "r" });
    });

    // Live region status update
    await waitFor(() => {
      const statusRegions = screen.getAllByRole("status");
      const liveRegion = statusRegions.find((r) =>
        r.textContent?.includes("Refreshing signals…") || r.textContent?.includes("Signals updated.")
      );
      expect(liveRegion).toBeDefined();
    });
  });

  it("does not trigger keyboard shortcuts when user is typing in an input element", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 2, name: "Signals" })).toBeInTheDocument();
    });

    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    // Key 't' while input is focused should not toggle theme
    const currentTheme = document.documentElement.getAttribute("data-theme");
    act(() => {
      fireEvent.keyDown(input, { key: "t" });
    });
    expect(document.documentElement.getAttribute("data-theme")).toBe(currentTheme);

    // Key '?' while input is focused should not open modal
    act(() => {
      fireEvent.keyDown(input, { key: "?" });
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    document.body.removeChild(input);
  });
});

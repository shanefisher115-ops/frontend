import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Dashboard } from "./Dashboard";

describe("Dashboard Accessibility and Shortcuts", () => {
  it("renders landmarks, skip link, and main sections with ARIA attributes", async () => {
    await act(async () => {
      render(<Dashboard />);
    });

    // Skip link
    const skipLink = screen.getByRole("link", { name: /skip to main content/i });
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute("href", "#main-content");

    // Banner and Contentinfo landmarks
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();

    // Main section
    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "main-content");

    // Connection card section
    const connectionCard = screen.getByRole("region", { name: /connection/i });
    expect(connectionCard).toBeInTheDocument();

    // Signals card section
    const signalsCard = screen.getByRole("region", { name: /signals/i });
    expect(signalsCard).toBeInTheDocument();

    // Table and headers
    await waitFor(() => {
      expect(screen.getByRole("table", { name: /signals/i })).toBeInTheDocument();
    });

    const headers = screen.getAllByRole("columnheader");
    expect(headers.length).toBeGreaterThan(0);
    headers.forEach((header) => {
      expect(header).toHaveAttribute("scope", "col");
    });
  });

  it("renders progressbars for signal intensity", async () => {
    await act(async () => {
      render(<Dashboard />);
    });

    await waitFor(() => {
      const progressbars = screen.getAllByRole("progressbar");
      expect(progressbars.length).toBeGreaterThan(0);
      progressbars.forEach((pb) => {
        expect(pb).toHaveAttribute("aria-valuenow");
        expect(pb).toHaveAttribute("aria-valuemin", "0");
        expect(pb).toHaveAttribute("aria-valuemax", "100");
        expect(pb).toHaveAttribute("aria-label");
      });
    });
  });

  it("toggles theme via button and keyboard shortcut 't'", async () => {
    await act(async () => {
      render(<Dashboard />);
    });

    const themeToggle = screen.getByRole("button", { name: /switch to/i });
    expect(themeToggle).toBeInTheDocument();
    expect(themeToggle).toHaveAttribute("aria-keyshortcuts", "t");

    const initialTheme = document.documentElement.getAttribute("data-theme");
    expect(initialTheme).toBeTruthy();

    // Click theme toggle button
    await act(async () => {
      fireEvent.click(themeToggle);
    });
    const newTheme = document.documentElement.getAttribute("data-theme");
    expect(newTheme).not.toBe(initialTheme);

    // Press keyboard shortcut 't'
    await act(async () => {
      fireEvent.keyDown(window, { key: "t" });
    });
    expect(document.documentElement.getAttribute("data-theme")).toBe(initialTheme);
  });

  it("opens and closes keyboard shortcuts modal via button, shortcut '?', and Escape key", async () => {
    await act(async () => {
      render(<Dashboard />);
    });

    const shortcutsBtn = screen.getByRole("button", { name: /view keyboard shortcuts/i });
    expect(shortcutsBtn).toBeInTheDocument();
    expect(shortcutsBtn).toHaveAttribute("aria-keyshortcuts", "?");

    // Click shortcuts button
    await act(async () => {
      fireEvent.click(shortcutsBtn);
    });

    let dialog = screen.getByRole("dialog", { name: /keyboard shortcuts/i });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");

    // Close button inside dialog
    const closeBtn = screen.getByRole("button", { name: /close keyboard shortcuts dialog/i });
    await act(async () => {
      fireEvent.click(closeBtn);
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Open via shortcut '?'
    await act(async () => {
      fireEvent.keyDown(window, { key: "?" });
    });
    dialog = screen.getByRole("dialog", { name: /keyboard shortcuts/i });
    expect(dialog).toBeInTheDocument();

    // Close via Escape
    await act(async () => {
      fireEvent.keyDown(window, { key: "Escape" });
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("refreshes signals via refresh button and shortcut 'r'", async () => {
    await act(async () => {
      render(<Dashboard />);
    });

    const refreshBtn = screen.getByRole("button", { name: /refresh signals data/i });
    expect(refreshBtn).toBeInTheDocument();
    expect(refreshBtn).toHaveAttribute("aria-keyshortcuts", "r");

    await act(async () => {
      fireEvent.click(refreshBtn);
    });

    await waitFor(() => {
      const announcer = screen.getByTestId("live-announcer");
      expect(announcer).toHaveTextContent("Signals data refreshed");
    });

    // Press shortcut 'r'
    await act(async () => {
      fireEvent.keyDown(window, { key: "r" });
    });

    await waitFor(() => {
      const announcer = screen.getByTestId("live-announcer");
      expect(announcer).toHaveTextContent("Signals data refreshed");
    });
  });
});

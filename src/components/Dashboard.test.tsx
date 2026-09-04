import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { Dashboard } from "./Dashboard";

describe("Dashboard Accessibility and Keyboard Shortcuts", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme");
  });

  async function renderAndLoad() {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText("Genesis Pulse")).not.toBeNull();
    });
  }

  it("renders ARIA landmarks and skip link", async () => {
    await renderAndLoad();

    // Skip link
    const skipLink = screen.getByText("Skip to main content");
    expect(skipLink).not.toBeNull();
    expect(skipLink.getAttribute("href")).toBe("#main-content");

    // Landmarks
    const banner = screen.getByRole("banner");
    expect(banner).not.toBeNull();

    const main = screen.getByRole("main");
    expect(main.id).toBe("main-content");

    const contentinfo = screen.getByRole("contentinfo");
    expect(contentinfo).not.toBeNull();
  });

  it("renders table headers with scope='col' and progressbars with ARIA attributes", async () => {
    await renderAndLoad();

    // Column headers
    const headers = screen.getAllByRole("columnheader");
    expect(headers.length).toBeGreaterThan(0);
    headers.forEach((header) => {
      expect(header.getAttribute("scope")).toBe("col");
    });

    // Progressbars
    const progressbars = screen.getAllByRole("progressbar");
    expect(progressbars.length).toBeGreaterThan(0);
    const firstBar = progressbars[0];
    expect(firstBar.getAttribute("aria-valuenow")).not.toBeNull();
    expect(firstBar.getAttribute("aria-valuemin")).toBe("0");
    expect(firstBar.getAttribute("aria-valuemax")).toBe("100");
    expect(firstBar.getAttribute("aria-label")).toMatch(/Signal intensity for/i);
  });

  it("toggles theme via button click and keyboard shortcut 't'", async () => {
    await renderAndLoad();

    const themeToggle = screen.getByTitle(/Toggle theme/i);
    expect(themeToggle).not.toBeNull();

    // Check initial theme state
    const initialTheme = document.documentElement.getAttribute("data-theme");

    // Click theme toggle
    act(() => {
      fireEvent.click(themeToggle);
    });
    const toggledTheme = document.documentElement.getAttribute("data-theme");
    expect(toggledTheme).not.toBe(initialTheme);

    // Trigger keyboard shortcut 't'
    act(() => {
      fireEvent.keyDown(window, { key: "t" });
    });
    const restoredTheme = document.documentElement.getAttribute("data-theme");
    expect(restoredTheme).toBe(initialTheme);
  });

  it("opens and closes keyboard shortcuts modal via '?' and 'Escape'", async () => {
    await renderAndLoad();

    // Verify modal is not open initially
    expect(screen.queryByRole("dialog")).toBeNull();

    // Trigger '?' key
    act(() => {
      fireEvent.keyDown(window, { key: "?" });
    });

    // Verify modal opens
    const dialog = screen.getByRole("dialog");
    expect(dialog).not.toBeNull();
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(screen.getByText("Keyboard Shortcuts")).not.toBeNull();

    // Trigger 'Escape' key
    act(() => {
      fireEvent.keyDown(window, { key: "Escape" });
    });

    // Verify modal closes
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("refreshes signals via 'r' keyboard shortcut", async () => {
    await renderAndLoad();

    // Press 'r'
    act(() => {
      fireEvent.keyDown(window, { key: "r" });
    });

    // Verify live region updated announcement
    await waitFor(() => {
      expect(screen.getByText("Signals data refreshed.")).not.toBeNull();
    });
  });

  it("does not trigger shortcuts when typing in input elements", async () => {
    await renderAndLoad();

    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    act(() => {
      fireEvent.keyDown(input, { key: "r" });
    });

    // Clean up
    document.body.removeChild(input);
  });
});

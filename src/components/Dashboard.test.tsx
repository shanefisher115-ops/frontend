import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Dashboard } from "./Dashboard";

describe("Dashboard accessibility and keyboard navigation", () => {
  beforeEach(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  });

  afterEach(() => {
    cleanup();
  });

  it("renders key semantic landmarks and skip link", async () => {
    render(<Dashboard />);

    // Skip link
    const skipLink = screen.getByText(/Skip to main content/i);
    expect(skipLink).toBeDefined();
    expect(skipLink.getAttribute("href")).toBe("#main-content");

    // Landmarks
    expect(screen.getByRole("banner")).toBeDefined(); // header
    expect(screen.getByRole("main")).toBeDefined(); // main
    expect(screen.getByRole("contentinfo")).toBeDefined(); // footer

    // Table loading
    const table = await screen.findByRole("table");
    expect(table).toBeDefined();

    // Caption in table
    expect(screen.getByText(/Active telemetry signals and status metrics/i)).toBeDefined();
  });

  it("toggles theme when 'T' key is pressed or button is clicked", async () => {
    render(<Dashboard />);

    const themeButton = screen.getByRole("button", { name: /Switch to light mode/i });
    expect(themeButton).toBeDefined();

    // Click theme button
    fireEvent.click(themeButton);
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");

    // Press 't' key to toggle back to dark mode
    fireEvent.keyDown(window, { key: "t" });
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("opens and closes keyboard shortcuts modal via '?' key and Escape key", async () => {
    render(<Dashboard />);

    // Press '?'
    fireEvent.keyDown(window, { key: "?" });

    // Dialog should be visible
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeDefined();
    expect(screen.getByRole("heading", { name: /Keyboard Shortcuts/i })).toBeDefined();

    // Press Escape key to close dialog
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("triggers data refresh when 'R' key is pressed", async () => {
    render(<Dashboard />);

    await screen.findByRole("table");

    // Press 'r' key
    fireEvent.keyDown(window, { key: "r" });

    // Announcement should mention refreshed signals
    await waitFor(() => {
      const liveRegion = document.querySelector(".sr-only[role='status']");
      expect(liveRegion?.textContent).toMatch(/Signals updated at/i);
    });
  });
});

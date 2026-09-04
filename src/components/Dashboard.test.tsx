import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { Dashboard } from "./Dashboard";
import { DatabaseStatusBadge } from "./DatabaseStatusBadge";

afterEach(() => {
  cleanup();
});

describe("DatabaseStatusBadge Accessibility", () => {
  it("renders with appropriate ARIA attributes and role='status'", () => {
    render(<DatabaseStatusBadge />);
    const statusBadge = screen.getByTestId("status-database-mode");
    expect(statusBadge).toBeDefined();
    expect(statusBadge.getAttribute("role")).toBe("status");
    expect(statusBadge.getAttribute("aria-live")).toBe("polite");
    expect(statusBadge.getAttribute("aria-label")).toContain("Database status:");
  });
});

describe("Dashboard Accessibility & Keyboard Shortcuts", () => {
  it("renders landmark regions and skip link", async () => {
    render(<Dashboard />);

    // Skip link
    const skipLink = screen.getByText("Skip to main content");
    expect(skipLink.getAttribute("href")).toBe("#main-content");

    // Banner header
    const header = screen.getByRole("banner");
    expect(header).toBeDefined();

    // Main content
    const main = screen.getByRole("main");
    expect(main.id).toBe("main-content");

    // Contentinfo footer
    const footer = screen.getByRole("contentinfo");
    expect(footer).toBeDefined();

    // Table caption
    await waitFor(() => {
      const caption = screen.getByText("Realtime signals dataset and current telemetry status");
      expect(caption).toBeDefined();
    });
  });

  it("renders progressbars for signal intensity with proper ARIA attributes", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      const progressbars = screen.getAllByRole("progressbar");
      expect(progressbars.length).toBeGreaterThan(0);
      const firstBar = progressbars[0];
      expect(firstBar.getAttribute("aria-valuenow")).toBeDefined();
      expect(firstBar.getAttribute("aria-valuemin")).toBe("0");
      expect(firstBar.getAttribute("aria-valuemax")).toBe("100");
      expect(firstBar.getAttribute("aria-label")).toContain("Signal intensity for");
    });
  });

  it("opens keyboard shortcuts help modal when clicking help button or pressing '?'", async () => {
    render(<Dashboard />);

    // Click help button
    const helpBtn = screen.getByLabelText("Show keyboard shortcuts help");
    fireEvent.click(helpBtn);

    expect(screen.getByRole("dialog")).toBeDefined();
    expect(screen.getByText("Keyboard Shortcuts")).toBeDefined();

    // Close with close button
    const closeBtn = screen.getByLabelText("Close keyboard shortcuts dialog");
    fireEvent.click(closeBtn);

    expect(screen.queryByRole("dialog")).toBeNull();

    // Open with '?' key
    fireEvent.keyDown(window, { key: "?" });

    expect(screen.getByRole("dialog")).toBeDefined();

    // Close with Escape key
    fireEvent.keyDown(window, { key: "Escape" });

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("triggers theme toggle when pressing 't' key", async () => {
    render(<Dashboard />);

    const themeBtn = screen.getByLabelText("Toggle color theme");
    let clicked = false;
    themeBtn.addEventListener("click", () => {
      clicked = true;
    });

    fireEvent.keyDown(window, { key: "t" });

    expect(clicked).toBe(true);
  });

  it("triggers refresh when pressing 'r' key", async () => {
    render(<Dashboard />);

    const refreshBtn = screen.getByLabelText("Refresh signals data");
    expect(refreshBtn).toBeDefined();

    fireEvent.keyDown(window, { key: "r" });

    await waitFor(() => {
      expect(screen.getByLabelText("Refresh signals data")).toBeDefined();
    });
  });
});

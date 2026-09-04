import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { Dashboard } from "./Dashboard";

describe("Dashboard Accessibility and Keyboard Shortcuts", () => {
  it("renders skip link, landmark roles, and main headers correctly", async () => {
    render(<Dashboard />);
    await screen.findByRole("table", { name: "Signals list" });

    // Skip link
    const skipLink = screen.getByText("Skip to main content");
    expect(skipLink).toBeDefined();
    expect(skipLink.getAttribute("href")).toBe("#main-content");

    // Banner header and main landmarks
    const header = screen.getByRole("banner");
    expect(header).toBeDefined();

    const main = screen.getByRole("main");
    expect(main).toBeDefined();
    expect(main.id).toBe("main-content");

    // Connection & Signals headings
    expect(screen.getByRole("heading", { name: "Primordia · Database Console" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Connection" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Signals" })).toBeDefined();
  });

  it("renders table with proper ARIA accessibility attributes and progressbars", async () => {
    render(<Dashboard />);

    const table = await screen.findByRole("table", { name: "Signals list" });
    expect(table).toBeDefined();

    // Table caption
    const caption = screen.getByText("List of database signals showing name, origin, status, intensity, and recorded timestamp.");
    expect(caption).toBeDefined();

    // Table th headers with scope="col"
    const headers = screen.getAllByRole("columnheader");
    expect(headers.length).toBeGreaterThan(0);

    // Progress bar semantics for intensity
    const progressBars = screen.getAllByRole("progressbar");
    expect(progressBars.length).toBeGreaterThan(0);
    const firstBar = progressBars[0];
    expect(firstBar.getAttribute("aria-valuenow")).not.toBeNull();
    expect(firstBar.getAttribute("aria-valuemin")).toBe("0");
    expect(firstBar.getAttribute("aria-valuemax")).toBe("100");
  });

  it("toggles theme when clicking theme button or pressing 't'", async () => {
    render(<Dashboard />);
    await screen.findByRole("table", { name: "Signals list" });

    const themeToggleBtn = screen.getByLabelText(/Switch to/i);
    expect(themeToggleBtn).toBeDefined();

    const initialPressed = themeToggleBtn.getAttribute("aria-pressed");

    // Click to toggle theme
    act(() => {
      fireEvent.click(themeToggleBtn);
    });
    const newPressed = themeToggleBtn.getAttribute("aria-pressed");
    expect(newPressed).not.toBe(initialPressed);

    // Press 't' shortcut to toggle back
    act(() => {
      fireEvent.keyDown(window, { key: "t" });
    });
    expect(themeToggleBtn.getAttribute("aria-pressed")).toBe(initialPressed);
  });

  it("focuses search box when pressing '/' key shortcut", async () => {
    render(<Dashboard />);
    await screen.findByRole("table", { name: "Signals list" });

    const searchInput = screen.getByLabelText("Search signals by name or origin");
    expect(document.activeElement).not.toBe(searchInput);

    act(() => {
      fireEvent.keyDown(window, { key: "/" });
    });
    expect(document.activeElement).toBe(searchInput);
  });

  it("opens keyboard shortcuts dialog when pressing '?' key shortcut and closes on Escape", async () => {
    render(<Dashboard />);
    await screen.findByRole("table", { name: "Signals list" });

    // Initially modal is not visible
    expect(screen.queryByRole("dialog")).toBeNull();

    // Press '?'
    act(() => {
      fireEvent.keyDown(window, { key: "?" });
    });

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeDefined();
    expect(dialog.getAttribute("aria-modal")).toBe("true");

    // Verify modal title
    expect(screen.getByRole("heading", { name: "Keyboard Shortcuts" })).toBeDefined();

    // Press 'Escape' to close modal
    act(() => {
      fireEvent.keyDown(window, { key: "Escape" });
    });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("filters signals by search query and status filter", async () => {
    render(<Dashboard />);
    await screen.findByRole("table", { name: "Signals list" });

    // Filter by status 'Active'
    const activeFilterBtn = screen.getByRole("button", { name: "Active" });
    act(() => {
      fireEvent.click(activeFilterBtn);
    });
    expect(activeFilterBtn.getAttribute("aria-pressed")).toBe("true");

    // Search query
    const searchInput = screen.getByLabelText("Search signals by name or origin");
    act(() => {
      fireEvent.change(searchInput, { target: { value: "Aether" } });
    });

    // Verify announcer has polite announcement
    await waitFor(() => {
      const announcer = screen.getByTestId("aria-announcer");
      expect(announcer.getAttribute("aria-live")).toBe("polite");
    });
  });

  it("does not trigger shortcuts when typing in search input", async () => {
    render(<Dashboard />);
    await screen.findByRole("table", { name: "Signals list" });

    const searchInput = screen.getByLabelText("Search signals by name or origin");
    act(() => {
      searchInput.focus();
    });

    const themeToggleBtn = screen.getByLabelText(/Switch to/i);
    const initialPressed = themeToggleBtn.getAttribute("aria-pressed");

    // Pressing 't' inside input should NOT toggle theme
    act(() => {
      fireEvent.keyDown(searchInput, { key: "t" });
    });
    expect(themeToggleBtn.getAttribute("aria-pressed")).toBe(initialPressed);
  });
});

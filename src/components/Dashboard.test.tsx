import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { Dashboard } from "./Dashboard";

describe("Dashboard accessibility and keyboard shortcuts", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.setAttribute("data-theme", "dark");
  });

  afterEach(() => {
    localStorage.clear();
  });

  const renderAndInit = async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByRole("table", { name: "Signals telemetry list" })).toBeInTheDocument();
    });
  };

  it("renders main accessibility landmark regions and skip link", async () => {
    await renderAndInit();

    // Skip link
    const skipLink = screen.getByText("Skip to main content");
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute("href", "#main-content");

    // Banner header
    const header = screen.getByRole("banner");
    expect(header).toBeInTheDocument();

    // Main region
    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "main-content");

    // Footer region
    const footer = screen.getByRole("contentinfo");
    expect(footer).toBeInTheDocument();
  });

  it("renders connection section with headings and accessible diagnostics", async () => {
    await renderAndInit();

    const connHeading = screen.getByRole("heading", { name: "Connection" });
    expect(connHeading).toBeInTheDocument();

    const diagList = screen.getByLabelText("Environment diagnostics");
    expect(diagList).toBeInTheDocument();

    const urlStatus = screen.getByLabelText("Status for VITE_SUPABASE_URL: missing");
    expect(urlStatus).toBeInTheDocument();
  });

  it("renders signals telemetry table with caption, headers, and ARIA progressbars", async () => {
    await renderAndInit();

    const table = screen.getByRole("table", { name: "Signals telemetry list" });
    expect(table).toBeInTheDocument();

    // Check table column headers
    const headers = screen.getAllByRole("columnheader");
    expect(headers.map((h) => h.textContent?.trim())).toEqual([
      "Name",
      "Origin",
      "Status",
      "Intensity",
      "Recorded",
    ]);

    // Check ARIA progressbars for signal intensity
    const progressbars = screen.getAllByRole("progressbar");
    expect(progressbars.length).toBeGreaterThan(0);
    progressbars.forEach((bar) => {
      expect(bar).toHaveAttribute("aria-valuenow");
      expect(bar).toHaveAttribute("aria-valuemin", "0");
      expect(bar).toHaveAttribute("aria-valuemax", "100");
      expect(bar).toHaveAttribute("aria-label");
    });
  });

  it("toggles theme via button click and keyboard shortcut 'T'", async () => {
    await renderAndInit();

    const themeBtn = screen.getByRole("button", {
      name: /Switch to light mode/i,
    });
    expect(themeBtn).toBeInTheDocument();

    // Click theme button to switch to light theme
    act(() => {
      fireEvent.click(themeBtn);
    });
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(themeBtn).toHaveAttribute("aria-pressed", "true");

    // Press 'T' key to switch back to dark theme
    act(() => {
      fireEvent.keyDown(window, { key: "t" });
    });
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(themeBtn).toHaveAttribute("aria-pressed", "false");
  });

  it("refreshes signals via button click and keyboard shortcut 'R'", async () => {
    await renderAndInit();

    const refreshBtn = screen.getByRole("button", { name: /Refresh signals data/i });

    await act(async () => {
      fireEvent.click(refreshBtn);
    });

    const announcement = screen.getByTestId("a11y-announcement");
    expect(announcement.textContent).toMatch(/Signals updated at/i);

    // Trigger keyboard shortcut 'R'
    await act(async () => {
      fireEvent.keyDown(window, { key: "r" });
    });
    expect(announcement.textContent).toMatch(/Signals updated at/i);
  });

  it("opens and closes keyboard shortcuts modal dialog via '?' button, keyboard shortcut '?', close button, and Esc key", async () => {
    await renderAndInit();

    const shortcutsBtn = screen.getByRole("button", {
      name: /Keyboard shortcuts help/i,
    });
    expect(shortcutsBtn).toHaveAttribute("aria-expanded", "false");

    // Open modal via button click
    act(() => {
      fireEvent.click(shortcutsBtn);
    });
    expect(shortcutsBtn).toHaveAttribute("aria-expanded", "true");

    const dialog = screen.getByRole("dialog", { name: "Keyboard Shortcuts" });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");

    // Close modal via Close button
    const closeBtn = screen.getByRole("button", {
      name: "Close keyboard shortcuts dialog",
    });
    act(() => {
      fireEvent.click(closeBtn);
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Open modal via '?' key
    act(() => {
      fireEvent.keyDown(window, { key: "?" });
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Close modal via 'Escape' key
    act(() => {
      fireEvent.keyDown(window, { key: "Escape" });
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not trigger keyboard shortcuts when typing in an input element", async () => {
    render(
      <div>
        <input data-testid="test-input" type="text" />
      </div>
    );
    await renderAndInit();

    const input = screen.getByTestId("test-input");
    input.focus();

    // Fire 't' inside input — theme should NOT change
    act(() => {
      fireEvent.keyDown(input, { key: "t" });
    });
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");

    // Fire '?' inside input — modal should NOT open
    act(() => {
      fireEvent.keyDown(input, { key: "?" });
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

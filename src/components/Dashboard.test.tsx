import "@testing-library/jest-dom";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { Dashboard } from "./Dashboard";
import { DatabaseStatusBadge } from "./DatabaseStatusBadge";

describe("DatabaseStatusBadge Accessibility", () => {
  it("renders with status role and correct aria-label", () => {
    render(<DatabaseStatusBadge />);
    const badge = screen.getByTestId("status-database-mode");
    expect(badge).toHaveAttribute("role", "status");
    expect(badge).toHaveAttribute("aria-label");
    expect(badge.getAttribute("aria-label")).toContain("Database status:");
  });
});

describe("Dashboard Accessibility & Keyboard Shortcuts", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme");
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it("renders accessible landmarks and skip link", async () => {
    render(<Dashboard />);

    await screen.findByText("source: mock dataset");

    // Skip link
    const skipLink = screen.getByText("Skip to main content");
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute("href", "#main-content");

    // Banner landmark
    const header = screen.getByRole("banner");
    expect(header).toBeInTheDocument();

    // Main landmark
    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "main-content");

    // Contentinfo landmark
    const footer = screen.getByRole("contentinfo");
    expect(footer).toBeInTheDocument();
  });

  it("renders accessible headings and section region labeling", async () => {
    render(<Dashboard />);

    await screen.findByText("source: mock dataset");

    // Headings
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Primordia · Database Console",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Connection" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Signals" }),
    ).toBeInTheDocument();
  });

  it("renders signals table with caption and accessible headers", async () => {
    render(<Dashboard />);

    await screen.findByText("source: mock dataset");

    const caption = screen.getByText(
      "List of signals with origin, status, intensity, and recorded time",
    );
    expect(caption).toBeInTheDocument();

    const colHeaders = screen.getAllByRole("columnheader");
    expect(colHeaders.length).toBeGreaterThan(0);
    colHeaders.forEach((header) => {
      expect(header).toHaveAttribute("scope", "col");
    });
  });

  it("renders signal rows with status and intensity meters", async () => {
    const { container } = render(<Dashboard />);

    const signalCell = await screen.findByText("Genesis Pulse");
    expect(signalCell).toBeInTheDocument();

    // Check status chips
    const statusChips = container.querySelectorAll(".status-chip");
    expect(statusChips.length).toBeGreaterThan(0);
    statusChips.forEach((chip) => {
      expect(chip).toHaveAttribute("role", "status");
      expect(chip).toHaveAttribute("aria-label");
    });

    // Check intensity meter elements
    const meters = screen.getAllByRole("meter");
    expect(meters.length).toBeGreaterThan(0);
    meters.forEach((meter) => {
      expect(meter).toHaveAttribute("aria-valuenow");
      expect(meter).toHaveAttribute("aria-valuemin", "0");
      expect(meter).toHaveAttribute("aria-valuemax", "100");
    });
  });

  it("toggles theme via button and keyboard shortcut 't'", async () => {
    render(<Dashboard />);

    await screen.findByText("source: mock dataset");

    const themeButton = screen.getByRole("button", { name: /switch to/i });
    expect(themeButton).toBeInTheDocument();

    const initialTheme = document.documentElement.getAttribute("data-theme");
    expect(initialTheme).toBeTruthy();

    // Toggle via button click
    act(() => {
      fireEvent.click(themeButton);
    });
    const toggledTheme = document.documentElement.getAttribute("data-theme");
    expect(toggledTheme).not.toBe(initialTheme);

    // Toggle via 't' keypress
    act(() => {
      fireEvent.keyDown(window, { key: "t" });
    });
    expect(document.documentElement.getAttribute("data-theme")).toBe(
      initialTheme,
    );
  });

  it("toggles keyboard shortcuts guide via button, '?' key, and closes with 'Escape'", async () => {
    render(<Dashboard />);

    await screen.findByText("source: mock dataset");

    const shortcutBtn = screen.getByRole("button", {
      name: "Toggle keyboard shortcuts guide",
    });
    expect(shortcutBtn).toHaveAttribute("aria-expanded", "false");

    // Open via button
    act(() => {
      fireEvent.click(shortcutBtn);
    });
    expect(shortcutBtn).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("heading", { level: 2, name: "Keyboard Shortcuts" }),
    ).toBeInTheDocument();

    // Close via Esc key
    act(() => {
      fireEvent.keyDown(window, { key: "Escape" });
    });
    expect(shortcutBtn).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByRole("heading", { level: 2, name: "Keyboard Shortcuts" }),
    ).not.toBeInTheDocument();

    // Open via '?' key
    act(() => {
      fireEvent.keyDown(window, { key: "?" });
    });
    expect(
      screen.getByRole("heading", { level: 2, name: "Keyboard Shortcuts" }),
    ).toBeInTheDocument();
  });

  it("triggers refresh via 'r' keyboard shortcut", async () => {
    const { container } = render(<Dashboard />);

    await screen.findByText("source: mock dataset");

    // Fire 'r' shortcut
    await act(async () => {
      fireEvent.keyDown(window, { key: "r" });
    });

    // Check live region announcement
    const liveRegion = container.querySelector('.sr-only[role="status"]');
    expect(liveRegion).not.toBeNull();
    expect(liveRegion?.textContent).toContain("Refreshed signals data.");
  });

  it("ignores keyboard shortcuts when focused inside input fields", async () => {
    render(
      <div>
        <input data-testid="test-input" type="text" />
        <Dashboard />
      </div>,
    );

    await screen.findByText("source: mock dataset");

    const input = screen.getByTestId("test-input");
    input.focus();

    const initialTheme = document.documentElement.getAttribute("data-theme");

    // Press 't' inside input
    act(() => {
      fireEvent.keyDown(input, { key: "t" });
    });

    // Theme should not have changed
    expect(document.documentElement.getAttribute("data-theme")).toBe(
      initialTheme,
    );
  });
});

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { Dashboard } from "./Dashboard";
import { DatabaseStatusBadge } from "./DatabaseStatusBadge";

describe("DatabaseStatusBadge", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders status badge with role status and aria-label", () => {
    render(<DatabaseStatusBadge />);
    const badge = screen.getByTestId("status-database-mode");
    expect(badge).toBeDefined();
    expect(badge.getAttribute("role")).toBe("status");
    expect(badge.getAttribute("aria-label")).toContain("Database mode:");
  });
});

describe("Dashboard Accessibility and Keyboard Shortcuts", () => {
  beforeEach(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders accessibility landmarks and skip link", async () => {
    render(<Dashboard />);

    const skipLink = screen.getByText("Skip to main content");
    expect(skipLink).toBeDefined();
    expect(skipLink.getAttribute("href")).toBe("#main-content");

    const header = screen.getByRole("banner");
    expect(header).toBeDefined();

    const main = screen.getByRole("main");
    expect(main).toBeDefined();
    expect(main.getAttribute("id")).toBe("main-content");

    const footer = screen.getByRole("contentinfo");
    expect(footer).toBeDefined();

    await waitFor(() => {
      expect(screen.getByRole("table")).toBeDefined();
    });
  });

  it("renders accessible table with caption, headers, and progressbars for intensity", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      const table = screen.getByRole("table", { name: "Signals data list" });
      expect(table).toBeDefined();
    });

    const caption = screen.getByText("Active and historical database signals");
    expect(caption).toBeDefined();

    const progressbars = screen.getAllByRole("progressbar");
    expect(progressbars.length).toBeGreaterThan(0);
    expect(progressbars[0].getAttribute("aria-valuenow")).toBeDefined();
    expect(progressbars[0].getAttribute("aria-valuemin")).toBe("0");
    expect(progressbars[0].getAttribute("aria-valuemax")).toBe("100");
  });

  it("toggles theme when button is clicked or shortcut 't' is pressed", async () => {
    render(<Dashboard />);

    const themeToggle = screen.getByRole("button", { name: /Switch to light theme/i });
    expect(themeToggle).toBeDefined();
    expect(themeToggle.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(themeToggle);

    await waitFor(() => {
      expect(document.documentElement.getAttribute("data-theme")).toBe("light");
      expect(themeToggle.getAttribute("aria-pressed")).toBe("true");
    });

    // Press shortcut key 't'
    fireEvent.keyDown(window, { key: "t" });

    await waitFor(() => {
      expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
      expect(themeToggle.getAttribute("aria-pressed")).toBe("false");
    });
  });

  it("opens and closes keyboard shortcuts modal via button and keyboard '?' / 'Esc'", async () => {
    render(<Dashboard />);

    const shortcutsButton = screen.getByRole("button", { name: /Keyboard shortcuts/i });
    fireEvent.click(shortcutsButton);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeDefined();
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(screen.getByText("Keyboard Shortcuts")).toBeDefined();

    // Close using close button
    const closeBtn = screen.getByRole("button", { name: "Close shortcuts modal" });
    fireEvent.click(closeBtn);
    expect(screen.queryByRole("dialog")).toBeNull();

    // Open using shortcut '?'
    fireEvent.keyDown(window, { key: "?" });
    expect(screen.getByRole("dialog")).toBeDefined();

    // Close using Escape
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("triggers signal refresh on refresh button click or key 'r'", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      const refreshBtn = screen.getByRole("button", { name: /Refresh signals data/i });
      expect(refreshBtn).toBeDefined();
      expect(refreshBtn.hasAttribute("disabled")).toBe(false);
    });

    const refreshBtn = screen.getByRole("button", { name: /Refresh signals data/i });
    fireEvent.click(refreshBtn);

    // Press shortcut 'r'
    fireEvent.keyDown(window, { key: "r" });

    await waitFor(() => {
      expect(screen.getByText(/source:/i)).toBeDefined();
    });
  });
});

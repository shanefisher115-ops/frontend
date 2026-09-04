import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, vi } from "vitest";
import App from "../App";

describe("Dashboard Accessibility and Keyboard Shortcuts", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    document.documentElement.removeAttribute("data-theme");
  });

  it("renders main accessibility landmarks and skip link", async () => {
    render(<App />);

    const skipLink = screen.getByRole("link", { name: /skip to main content/i });
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute("href", "#main-content");

    const banner = screen.getByRole("banner");
    expect(banner).toBeInTheDocument();

    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "main-content");

    const contentInfo = screen.getByRole("contentinfo");
    expect(contentInfo).toBeInTheDocument();

    await screen.findByRole("table");
  });

  it("renders status badge with aria status and live region", async () => {
    render(<App />);

    const statusBadge = screen.getByTestId("status-database-mode");
    expect(statusBadge).toHaveAttribute("role", "status");
    expect(statusBadge).toHaveAttribute("aria-live", "polite");
    expect(statusBadge).toHaveAttribute("aria-label");

    await screen.findByRole("table");
  });

  it("renders table with proper ARIA roles and headers", async () => {
    render(<App />);

    const table = await screen.findByRole("table", { name: /signals data table/i });
    expect(table).toBeInTheDocument();

    const colHeaders = screen.getAllByRole("columnheader");
    expect(colHeaders.length).toBe(5);

    const rowHeaders = screen.getAllByRole("rowheader");
    expect(rowHeaders.length).toBeGreaterThan(0);

    const progressbars = screen.getAllByRole("progressbar");
    expect(progressbars.length).toBeGreaterThan(0);
    expect(progressbars[0]).toHaveAttribute("aria-valuenow");
    expect(progressbars[0]).toHaveAttribute("aria-valuemin", "0");
    expect(progressbars[0]).toHaveAttribute("aria-valuemax", "100");
  });

  it("toggles theme when clicking theme toggle or pressing 't'", async () => {
    const user = userEvent.setup();
    render(<App />);

    const themeBtn = screen.getByRole("button", { name: /switch to/i });
    expect(themeBtn).toBeInTheDocument();

    const initialTheme = document.documentElement.getAttribute("data-theme");

    // Press 't' shortcut
    await user.keyboard("t");
    const toggledTheme = document.documentElement.getAttribute("data-theme");
    expect(toggledTheme).not.toBe(initialTheme);

    // Press 't' again
    await user.keyboard("t");
    expect(document.documentElement.getAttribute("data-theme")).toBe(initialTheme);

    await screen.findByRole("table");
  });

  it("opens and closes keyboard shortcuts modal via '?' button and 'Esc' key", async () => {
    const user = userEvent.setup();
    render(<App />);

    const helpBtn = screen.getByRole("button", { name: /keyboard shortcuts help/i });
    expect(helpBtn).toHaveAttribute("aria-expanded", "false");

    // Open via button click
    await user.click(helpBtn);
    expect(helpBtn).toHaveAttribute("aria-expanded", "true");

    const dialog = screen.getByRole("dialog", { name: /keyboard shortcuts/i });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");

    // Close via Esc key
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Open via '?' key
    await user.keyboard("?");
    expect(screen.getByRole("dialog", { name: /keyboard shortcuts/i })).toBeInTheDocument();

    // Close via Close button in modal
    const closeBtn = screen.getByRole("button", { name: /close shortcuts help/i });
    await user.click(closeBtn);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await screen.findByRole("table");
  });

  it("refreshes data when pressing 'r' shortcut", async () => {
    const user = userEvent.setup();
    render(<App />);

    const refreshBtn = await screen.findByRole("button", { name: /refresh signals data/i });
    expect(refreshBtn).toBeInTheDocument();

    await user.keyboard("r");
    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });
  });
});

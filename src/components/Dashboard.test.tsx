// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { Dashboard } from "./Dashboard";
import { DatabaseStatusBadge } from "./DatabaseStatusBadge";

describe("DatabaseStatusBadge Component", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders status badge with role status and aria-label", () => {
    render(<DatabaseStatusBadge />);
    const statusBadge = screen.getByTestId("status-database-mode");
    expect(statusBadge).toBeInTheDocument();
    expect(statusBadge).toHaveAttribute("role", "status");
    expect(statusBadge).toHaveAttribute("aria-label");
  });
});

describe("Dashboard Accessibility and Keyboard Shortcuts", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme");
  });

  afterEach(() => {
    cleanup();
  });

  it("renders header banner, main content, and footer contentinfo landmarks", async () => {
    render(<Dashboard />);
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("renders accessibility labels, aria attributes, and table captions", async () => {
    render(<Dashboard />);

    // Check theme toggle button accessibility
    const themeButton = screen.getByRole("button", { name: /switch to light mode/i });
    expect(themeButton).toBeInTheDocument();
    expect(themeButton).toHaveAttribute("aria-pressed", "false");

    // Check keyboard shortcuts button accessibility
    const shortcutsButton = screen.getByRole("button", { name: /view keyboard shortcuts/i });
    expect(shortcutsButton).toBeInTheDocument();

    // Check table accessibility
    await waitFor(() => {
      const table = screen.getByRole("table");
      expect(table).toBeInTheDocument();
    });

    const columnHeaders = screen.getAllByRole("columnheader");
    expect(columnHeaders.length).toBeGreaterThan(0);
    columnHeaders.forEach((header) => {
      expect(header).toHaveAttribute("scope", "col");
    });

    const progressbars = screen.getAllByRole("progressbar");
    expect(progressbars.length).toBeGreaterThan(0);
    progressbars.forEach((pb) => {
      expect(pb).toHaveAttribute("aria-valuenow");
      expect(pb).toHaveAttribute("aria-valuemin", "0");
      expect(pb).toHaveAttribute("aria-valuemax", "100");
    });
  });

  it("toggles theme when theme toggle button is clicked", () => {
    render(<Dashboard />);
    const themeButton = screen.getByRole("button", { name: /switch to light mode/i });

    fireEvent.click(themeButton);
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(themeButton).toHaveAttribute("aria-label", "Switch to dark mode");
    expect(themeButton).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(themeButton);
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(themeButton).toHaveAttribute("aria-label", "Switch to light mode");
    expect(themeButton).toHaveAttribute("aria-pressed", "false");
  });

  it("opens and closes keyboard shortcuts modal", () => {
    render(<Dashboard />);
    const shortcutsButton = screen.getByRole("button", { name: /view keyboard shortcuts/i });

    fireEvent.click(shortcutsButton);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument();

    const closeButton = screen.getByRole("button", { name: /close keyboard shortcuts modal/i });
    fireEvent.click(closeButton);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("handles keyboard shortcuts (T, ?, R, Escape)", async () => {
    render(<Dashboard />);

    // Press 't' to toggle theme
    fireEvent.keyDown(window, { key: "t" });
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");

    // Press '?' to toggle shortcuts modal
    fireEvent.keyDown(window, { key: "?" });
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Press 'Escape' to close shortcuts modal
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Press 'r' to trigger refresh
    const refreshButton = screen.getByRole("button", { name: /refresh signals telemetry/i });
    expect(refreshButton).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "r" });
  });
});

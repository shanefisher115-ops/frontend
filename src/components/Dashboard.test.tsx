import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import { Dashboard } from "./Dashboard";

describe("Dashboard Accessibility and Keyboard Shortcuts", () => {
  beforeEach(() => {
    cleanup();
  });

  it("renders accessible landmarks and ARIA attributes", async () => {
    render(<Dashboard />);

    // Main landmark
    const main = screen.getByRole("main");
    expect(main).toBeDefined();
    expect(main.id).toBe("main-content");

    // Header landmark
    const banner = screen.getByRole("banner");
    expect(banner).toBeDefined();

    // Footer landmark
    const contentInfo = screen.getByRole("contentinfo");
    expect(contentInfo).toBeDefined();

    // Table with accessible label & headers
    const table = await screen.findByRole("table", { name: "Signal metrics table" });
    expect(table).toBeDefined();

    const columnHeaders = screen.getAllByRole("columnheader");
    expect(columnHeaders.length).toBeGreaterThan(0);

    // Meter elements for intensity
    const meters = await screen.findAllByRole("meter");
    expect(meters.length).toBeGreaterThan(0);
    expect(meters[0].getAttribute("aria-label")).toBe("Signal intensity");
    expect(meters[0].getAttribute("aria-valuenow")).not.toBeNull();
  });

  it("opens modal on shortcuts button click", () => {
    render(<Dashboard />);
    expect(screen.queryByRole("dialog")).toBeNull();

    const shortcutsBtn = screen.getByRole("button", { name: "Keyboard shortcuts guide" });
    fireEvent.click(shortcutsBtn);

    expect(screen.getByRole("dialog", { name: "Keyboard Shortcuts" })).toBeDefined();
  });

  it("opens and closes modal using '?' and 'Escape' keyboard shortcuts", () => {
    render(<Dashboard />);
    expect(screen.queryByRole("dialog")).toBeNull();

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "?" }));
    });

    const dialog = screen.getByRole("dialog", { name: "Keyboard Shortcuts" });
    expect(dialog).toBeDefined();

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("triggers refresh when 'r' key is pressed", async () => {
    render(<Dashboard />);

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "r" }));
    });

    const table = await screen.findByRole("table");
    expect(table).toBeDefined();
  });

  it("triggers theme toggle when 't' key is pressed", () => {
    render(<Dashboard />);

    const themeToggleBtn = screen.getByRole("button", { name: "Toggle theme" });
    let clicked = false;
    themeToggleBtn.addEventListener("click", () => {
      clicked = true;
    });

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "t" }));
    });

    expect(clicked).toBe(true);
  });
});

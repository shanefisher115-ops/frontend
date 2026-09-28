import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import { Dashboard } from "./Dashboard";
import { DatabaseStatusBadge } from "./DatabaseStatusBadge";

describe("DatabaseStatusBadge", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders status badge with status role and aria label", () => {
    render(<DatabaseStatusBadge />);
    const badge = screen.getByTestId("status-database-mode");
    expect(badge).toBeDefined();
    expect(badge.getAttribute("aria-label")).toBeTruthy();
  });
});

describe("Dashboard Accessibility and Keyboard Shortcuts", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme");
  });

  afterEach(() => {
    cleanup();
  });

  const flushPromises = async () => {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
  };

  it("renders main landmarks and skip link", async () => {
    render(<Dashboard />);
    await flushPromises();
    expect(screen.getByText("Skip to main content")).toBeDefined();
    expect(screen.getByRole("banner")).toBeDefined();
    expect(screen.getByRole("main")).toBeDefined();
    expect(screen.getByRole("contentinfo")).toBeDefined();
    expect(screen.getByRole("toolbar", { name: "Console actions" })).toBeDefined();
  });

  it("renders table with proper accessibility structures", async () => {
    render(<Dashboard />);
    await flushPromises();

    const table = screen.getByRole("table");
    expect(table).toBeDefined();
    expect(screen.getByText("Real-time signal status telemetry")).toBeDefined();

    const columnHeaders = screen.getAllByRole("columnheader");
    expect(columnHeaders.length).toBe(5);

    const meters = screen.getAllByRole("meter");
    expect(meters.length).toBeGreaterThan(0);
    expect(meters[0].getAttribute("aria-valuenow")).not.toBeNull();
  });

  it("toggles theme via keyboard shortcut 't'", async () => {
    render(<Dashboard />);
    await flushPromises();

    act(() => {
      fireEvent.keyDown(window, { key: "t" });
    });

    expect(document.documentElement.getAttribute("data-theme")).toBe("light");

    act(() => {
      fireEvent.keyDown(window, { key: "t" });
    });

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("opens and closes keyboard shortcuts modal via '?' and Esc key", async () => {
    render(<Dashboard />);
    await flushPromises();

    // Initially modal is not open
    expect(screen.queryByRole("dialog")).toBeNull();

    // Press '?' to open modal
    act(() => {
      fireEvent.keyDown(window, { key: "?" });
    });

    expect(screen.getByRole("dialog")).toBeDefined();
    expect(screen.getByText("Keyboard Shortcuts")).toBeDefined();

    // Press Esc to close modal
    act(() => {
      fireEvent.keyDown(window, { key: "Escape" });
    });

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("refreshes data when pressing 'r'", async () => {
    const { container } = render(<Dashboard />);
    await flushPromises();

    expect(screen.getByRole("table")).toBeDefined();

    act(() => {
      fireEvent.keyDown(window, { key: "r" });
    });

    await flushPromises();

    const liveRegion = container.querySelector('.sr-only[role="status"]');
    expect(liveRegion?.textContent).toContain("Signals data updated");
  });
});

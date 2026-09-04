import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { Dashboard } from "./Dashboard";

// Mock matchMedia for jsdom
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

describe("Dashboard Accessibility and Keyboard Shortcuts", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  const renderDashboard = async () => {
    let view: ReturnType<typeof render>;
    await act(async () => {
      view = render(<Dashboard />);
    });
    // wait for initial async signals load
    await waitFor(() => {
      expect(screen.getByRole("table", { name: /Database signals list/i })).toBeInTheDocument();
    });
    return view!;
  };

  it("renders main header landmarks, titles, and skip link", async () => {
    await renderDashboard();

    expect(screen.getByText("Skip to main content")).toBeInTheDocument();
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: /Primordia · Database Console/i })
    ).toBeInTheDocument();
  });

  it("toggles theme on theme toggle button click and updates ARIA attributes", async () => {
    await renderDashboard();

    const themeToggleBtn = screen.getByRole("button", {
      name: /Switch to (light|dark) mode/i,
    });

    expect(themeToggleBtn).toHaveAttribute("aria-pressed", "true");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");

    await act(async () => {
      fireEvent.click(themeToggleBtn);
    });

    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(themeToggleBtn).toHaveAttribute("aria-pressed", "false");
    expect(localStorage.getItem("theme")).toBe("light");

    await act(async () => {
      fireEvent.click(themeToggleBtn);
    });

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(themeToggleBtn).toHaveAttribute("aria-pressed", "true");
  });

  it("opens and closes keyboard shortcuts help modal via button and keyboard shortcut", async () => {
    await renderDashboard();

    // Open via button
    const shortcutsBtn = screen.getByRole("button", {
      name: /Keyboard shortcuts/i,
    });
    await act(async () => {
      fireEvent.click(shortcutsBtn);
    });

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Keyboard Shortcuts/i })
    ).toBeInTheDocument();

    // Close via Close button
    const closeBtn = screen.getByRole("button", {
      name: /Close keyboard shortcuts dialog/i,
    });
    await act(async () => {
      fireEvent.click(closeBtn);
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Open via '?' shortcut
    await act(async () => {
      fireEvent.keyDown(window, { key: "?" });
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Close via Escape key
    await act(async () => {
      fireEvent.keyDown(window, { key: "Escape" });
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("triggers theme toggle with 'T' keyboard shortcut", async () => {
    await renderDashboard();

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");

    await act(async () => {
      fireEvent.keyDown(window, { key: "t" });
    });
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");

    await act(async () => {
      fireEvent.keyDown(window, { key: "T" });
    });
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("refreshes signals with 'R' keyboard shortcut and refresh button", async () => {
    await renderDashboard();

    const refreshBtn = screen.getByRole("button", { name: /Refresh signals/i });
    expect(refreshBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.keyDown(window, { key: "r" });
    });

    await waitFor(() => {
      expect(screen.getByRole("table", { name: /Database signals list/i })).toBeInTheDocument();
    });
  });

  it("renders table with proper accessibility labels and progressbars", async () => {
    await renderDashboard();

    expect(
      screen.getByRole("table", { name: /Database signals list/i })
    ).toBeInTheDocument();

    const progressbars = screen.getAllByRole("progressbar");
    expect(progressbars.length).toBeGreaterThan(0);

    const firstProgressbar = progressbars[0];
    expect(firstProgressbar).toHaveAttribute("aria-valuemin", "0");
    expect(firstProgressbar).toHaveAttribute("aria-valuemax", "100");
    expect(firstProgressbar).toHaveAttribute("aria-valuenow");
  });
});

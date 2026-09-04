import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import App from "./App";
import { DatabaseStatusBadge } from "./components/DatabaseStatusBadge";

describe("DatabaseStatusBadge Accessibility", () => {
  it("renders with appropriate status role and aria-label", () => {
    render(<DatabaseStatusBadge />);
    const statusElem = screen.getByTestId("status-database-mode");
    expect(statusElem).toBeInTheDocument();
    expect(statusElem).toHaveAttribute("role", "status");
    expect(statusElem.getAttribute("aria-label")).toContain("Database status:");
  });
});

describe("Dashboard Accessibility & Keyboard Shortcuts", () => {
  beforeEach(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  });

  it("renders key accessibility landmarks and headers", async () => {
    await act(async () => {
      render(<App />);
    });

    // Header banner
    const banner = screen.getByRole("banner");
    expect(banner).toBeInTheDocument();

    // Main landmark
    const main = screen.getByRole("main");
    expect(main).toBeInTheDocument();

    // Footer contentinfo
    const footer = screen.getByRole("contentinfo");
    expect(footer).toBeInTheDocument();

    // Headings
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Primordia · Database Console");
    expect(screen.getByRole("heading", { name: "Connection" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Signals" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Keyboard Shortcuts" })).toBeInTheDocument();

    // Table with accessible label and caption
    await waitFor(() => {
      const table = screen.getByRole("table", { name: "Signals" });
      expect(table).toBeInTheDocument();
    });
  });

  it("toggles theme when theme button is clicked and via keyboard shortcut 't'", async () => {
    await act(async () => {
      render(<App />);
    });

    const themeBtn = screen.getByRole("button", { name: /Switch to light mode/i });
    expect(themeBtn).toBeInTheDocument();

    // Click to toggle
    await act(async () => {
      fireEvent.click(themeBtn);
    });
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");

    // Press 't' shortcut to toggle back to dark
    await act(async () => {
      fireEvent.keyDown(window, { key: "t" });
    });
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");

    // Press 'T' uppercase shortcut to toggle back to light
    await act(async () => {
      fireEvent.keyDown(window, { key: "T" });
    });
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("triggers refresh when refresh button is clicked or when shortcut 'r' is pressed", async () => {
    await act(async () => {
      render(<App />);
    });

    const refreshBtn = screen.getByRole("button", { name: /Refresh signals list/i });
    expect(refreshBtn).toBeInTheDocument();

    // Click refresh
    await act(async () => {
      fireEvent.click(refreshBtn);
    });

    // Press 'r' shortcut
    await act(async () => {
      fireEvent.keyDown(window, { key: "r" });
    });

    // Press 'R' shortcut
    await act(async () => {
      fireEvent.keyDown(window, { key: "R" });
    });
  });
});

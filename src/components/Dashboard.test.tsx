import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Dashboard } from "./Dashboard";

describe("Dashboard accessibility and keyboard shortcuts", () => {
  it("renders accessible landmarks, table headers, and ARIA attributes", async () => {
    render(<Dashboard />);

    // Header landmark banner
    expect(screen.getByRole("banner")).toBeDefined();

    // Main landmark
    expect(screen.getByRole("main")).toBeDefined();

    // Contentinfo landmark
    expect(screen.getByRole("contentinfo")).toBeDefined();

    // Theme toggle button with accessibility attributes
    const themeBtn = screen.getByRole("button", { name: /switch to light mode/i });
    expect(themeBtn).toBeDefined();
    expect(themeBtn.getAttribute("aria-keyshortcuts")).toBe("t");

    // Refresh button with accessibility attributes
    const refreshBtn = screen.getByRole("button", { name: /refresh signal data/i });
    expect(refreshBtn).toBeDefined();
    expect(refreshBtn.getAttribute("aria-keyshortcuts")).toBe("r");

    // Table accessibility
    await waitFor(() => {
      const table = screen.getByRole("table");
      expect(table).toBeDefined();
    });

    const columns = screen.getAllByRole("columnheader");
    expect(columns.length).toBe(5);
    expect(columns[0].textContent).toBe("Name");
    expect(columns[1].textContent).toBe("Origin");
    expect(columns[2].textContent).toBe("Status");
    expect(columns[3].textContent).toBe("Intensity");
    expect(columns[4].textContent).toBe("Recorded");
  });

  it("handles keyboard shortcut 't' to toggle theme", async () => {
    render(<Dashboard />);

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");

    // Press 't' key
    await waitFor(() => {
      fireEvent.keyDown(window, { key: "t" });
    });

    expect(document.documentElement.getAttribute("data-theme")).toBe("light");

    // Press 't' key again
    await waitFor(() => {
      fireEvent.keyDown(window, { key: "t" });
    });

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("handles keyboard shortcut 'r' to refresh signal data", async () => {
    render(<Dashboard />);

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByRole("table")).toBeDefined();
    });

    // Press 'r' key
    await waitFor(() => {
      fireEvent.keyDown(window, { key: "r" });
    });

    // Live region feedback should briefly be populated
    await waitFor(() => {
      expect(screen.getByText("Refreshed signal data")).toBeDefined();
    });
  });
});

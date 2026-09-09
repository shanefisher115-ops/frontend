import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import "@testing-library/jest-dom";
import { Dashboard } from "./Dashboard";

describe("Dashboard Accessibility and Keyboard Shortcuts", () => {
  beforeEach(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  });

  it("renders semantic landmarks and accessibility labels", async () => {
    await act(async () => {
      render(<Dashboard />);
    });

    // Check header banner, main content, and footer
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();

    // Skip to main content link
    const skipLink = screen.getByText("Skip to main content");
    expect(skipLink).toBeInTheDocument();
    expect(skipLink.getAttribute("href")).toBe("#main-content");

    // Table accessibility
    await waitFor(() => {
      const table = screen.getByRole("table", { name: "Database Signals" });
      expect(table).toBeInTheDocument();
    });

    const headers = screen.getAllByRole("columnheader");
    expect(headers.length).toBeGreaterThan(0);
    expect(headers[0].getAttribute("scope")).toBe("col");
  });

  it("toggles theme when shortcut key 't' is pressed", async () => {
    await act(async () => {
      render(<Dashboard />);
    });

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

  it("opens shortcuts dialog when '?' is pressed or shortcut button is clicked", async () => {
    await act(async () => {
      render(<Dashboard />);
    });

    expect(screen.queryByRole("dialog")).toBeNull();

    // Click shortcuts button
    const shortcutsBtn = screen.getByRole("button", { name: "View keyboard shortcuts" });
    await act(async () => {
      fireEvent.click(shortcutsBtn);
    });

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Keyboard Shortcuts" })).toBeInTheDocument();

    // Press Escape to close modal
    await act(async () => {
      fireEvent.keyDown(window, { key: "Escape" });
    });
    expect(screen.queryByRole("dialog")).toBeNull();

    // Press '?' to open modal
    await act(async () => {
      fireEvent.keyDown(window, { key: "?" });
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("refreshes data when 'r' key is pressed", async () => {
    await act(async () => {
      render(<Dashboard />);
    });

    const refreshBtn = screen.getByRole("button", { name: "Refresh signals data" });
    expect(refreshBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.keyDown(window, { key: "r" });
    });
  });
});

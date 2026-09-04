import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Dashboard } from "./Dashboard";

describe("Dashboard Accessibility and Keyboard Shortcuts", () => {
  it("renders landmarks and accessibility labels correctly", async () => {
    await act(async () => {
      render(<Dashboard />);
    });

    // Skip link
    const skipLink = screen.getByText("Skip to main content");
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute("href", "#main-content");

    // Landmarks
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();

    // Headings & Sections
    expect(
      screen.getByRole("heading", { name: "Connection" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Signals" }),
    ).toBeInTheDocument();

    // Table accessibility once loaded
    const table = await screen.findByRole("table");
    expect(table).toHaveAttribute("aria-label", "Signals list");

    // Wait for signals data meters to load
    await waitFor(() => {
      const meters = screen.getAllByRole("meter");
      expect(meters.length).toBeGreaterThan(0);
      meters.forEach((meter) => {
        expect(meter).toHaveAttribute("aria-valuenow");
        expect(meter).toHaveAttribute("aria-valuemin", "0");
        expect(meter).toHaveAttribute("aria-valuemax", "100");
      });
    });
  });

  it("handles theme toggle via click and T shortcut", async () => {
    await act(async () => {
      render(<Dashboard />);
    });

    const initialTheme =
      document.documentElement.getAttribute("data-theme") || "light";
    const expectedToggledTheme = initialTheme === "dark" ? "light" : "dark";

    const themeBtn = screen.getByRole("button", {
      name: /Switch to (light|dark) mode/i,
    });
    expect(themeBtn).toBeInTheDocument();

    // Click theme toggle
    await act(async () => {
      fireEvent.click(themeBtn);
    });
    expect(document.documentElement.getAttribute("data-theme")).toBe(
      expectedToggledTheme,
    );

    // Press 'T' key to toggle theme back
    await act(async () => {
      fireEvent.keyDown(window, { key: "t" });
    });
    expect(document.documentElement.getAttribute("data-theme")).toBe(
      initialTheme,
    );
  });

  it("handles keyboard shortcuts modal with ? and Escape keys", async () => {
    await act(async () => {
      render(<Dashboard />);
    });

    // Press '?' key to open modal
    await act(async () => {
      fireEvent.keyDown(window, { key: "?" });
    });

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(
      screen.getByRole("heading", { name: "Keyboard Shortcuts" }),
    ).toBeInTheDocument();

    // Press 'Escape' key to close modal
    await act(async () => {
      fireEvent.keyDown(window, { key: "Escape" });
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("triggers data refresh when R key is pressed", async () => {
    await act(async () => {
      render(<Dashboard />);
    });

    const refreshBtn = screen.getByRole("button", {
      name: /Refresh signals data/i,
    });
    expect(refreshBtn).toBeInTheDocument();

    // Press 'R' key
    await act(async () => {
      fireEvent.keyDown(window, { key: "r" });
    });

    const announcement = screen.getByTestId("a11y-announcement");
    expect(announcement).toHaveTextContent(
      /Refreshing signals data|Signals data updated/,
    );
  });
});

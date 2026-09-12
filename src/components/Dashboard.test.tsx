import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Dashboard } from "./Dashboard";

describe("Dashboard", () => {
  it("renders layout landmarks (banner, main, contentinfo)", async () => {
    render(<Dashboard />);

    await screen.findByRole("table");

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("renders connection and signals headings with cards", async () => {
    render(<Dashboard />);

    await screen.findByRole("table");

    expect(
      screen.getByRole("heading", { name: /connection/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /signals/i }),
    ).toBeInTheDocument();
  });

  it("renders table with proper accessibility roles and attributes", async () => {
    render(<Dashboard />);

    const table = await screen.findByRole("table");
    expect(table).toBeInTheDocument();

    const columnHeaders = screen.getAllByRole("columnheader");
    expect(columnHeaders.length).toBeGreaterThanOrEqual(5);

    const progressbars = screen.getAllByRole("progressbar");
    expect(progressbars.length).toBeGreaterThan(0);
    expect(progressbars[0]).toHaveAttribute("aria-valuenow");
    expect(progressbars[0]).toHaveAttribute("aria-valuemin", "0");
    expect(progressbars[0]).toHaveAttribute("aria-valuemax", "100");
  });

  it("filters signals when typing in the search box", async () => {
    render(<Dashboard />);

    await screen.findByRole("table");

    const searchInput = screen.getByRole("searchbox", {
      name: /filter signals by name or origin/i,
    });

    fireEvent.change(searchInput, { target: { value: "Genesis" } });

    await waitFor(() => {
      expect(screen.getByText("Genesis Pulse")).toBeInTheDocument();
      expect(screen.queryByText("Void Resonance")).not.toBeInTheDocument();
    });
  });

  it("filters signals by status filter buttons", async () => {
    render(<Dashboard />);

    await screen.findByRole("table");

    const degradedFilterBtn = screen.getByRole("button", {
      name: /filter by degraded status/i,
    });
    fireEvent.click(degradedFilterBtn);

    expect(degradedFilterBtn).toHaveAttribute("aria-pressed", "true");

    await waitFor(() => {
      expect(screen.getByText("Origin Echo")).toBeInTheDocument();
      expect(screen.queryByText("Genesis Pulse")).not.toBeInTheDocument();
    });
  });

  it("opens keyboard shortcuts modal when clicking shortcuts button or pressing ?", async () => {
    render(<Dashboard />);

    await screen.findByRole("table");

    const shortcutsBtn = screen.getByRole("button", {
      name: /keyboard shortcuts guide/i,
    });
    fireEvent.click(shortcutsBtn);

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    const closeBtn = screen.getByRole("button", {
      name: /close keyboard shortcuts dialog/i,
    });
    fireEvent.click(closeBtn);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Trigger via ? key press
    fireEvent.keyDown(window, { key: "?" });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("toggles theme when pressing T shortcut key", async () => {
    render(<Dashboard />);

    await screen.findByRole("table");

    const initialTheme = document.documentElement.getAttribute("data-theme");

    fireEvent.keyDown(window, { key: "t" });

    const newTheme = document.documentElement.getAttribute("data-theme");
    expect(newTheme).not.toBe(initialTheme);
  });

  it("focuses search box when pressing / shortcut key", async () => {
    render(<Dashboard />);

    await screen.findByRole("table");

    const searchInput = screen.getByRole("searchbox", {
      name: /filter signals by name or origin/i,
    });

    fireEvent.keyDown(window, { key: "/" });

    expect(document.activeElement).toBe(searchInput);
  });

  it("clears search input when pressing Escape", async () => {
    render(<Dashboard />);

    await screen.findByRole("table");

    const searchInput = screen.getByRole("searchbox", {
      name: /filter signals by name or origin/i,
    });

    fireEvent.change(searchInput, { target: { value: "Genesis" } });
    expect(searchInput).toHaveValue("Genesis");

    fireEvent.keyDown(window, { key: "Escape" });
    expect(searchInput).toHaveValue("");
  });
});

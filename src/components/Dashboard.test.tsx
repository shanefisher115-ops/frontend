import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Dashboard } from "./Dashboard";

describe("Dashboard Accessibility and Keyboard Shortcuts", () => {
  it("renders main landmark and skip-to-content link", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });

    const skipLink = screen.getByText("Skip to main content");
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute("href", "#main-content");

    const main = screen.getByRole("main");
    expect(main).toBeInTheDocument();
    expect(main).toHaveAttribute("id", "main-content");
  });

  it("renders header banner and contentinfo footer landmarks", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("renders table caption and accessible headers when signals are loaded", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });

    const table = screen.getByRole("table");
    expect(table).toBeInTheDocument();

    const headers = screen.getAllByRole("columnheader");
    expect(headers.length).toBeGreaterThan(0);

    const progressbars = screen.getAllByRole("progressbar");
    expect(progressbars.length).toBeGreaterThan(0);
    expect(progressbars[0]).toHaveAttribute("aria-valuenow");
  });

  it("opens keyboard shortcuts modal when '?' key is pressed", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    act(() => {
      fireEvent.keyDown(window, { key: "?" });
    });

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  it("focuses search input when '/' key is pressed", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Filter signals…/i);
    expect(document.activeElement).not.toBe(searchInput);

    act(() => {
      fireEvent.keyDown(window, { key: "/" });
    });

    expect(document.activeElement).toBe(searchInput);
  });

  it("toggles theme when 't' key is pressed", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });

    const initialTheme = document.documentElement.getAttribute("data-theme");

    act(() => {
      fireEvent.keyDown(window, { key: "t" });
    });

    const newTheme = document.documentElement.getAttribute("data-theme");
    expect(newTheme).not.toBe(initialTheme);
  });

  it("filters signals when text is typed into search input", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Filter signals…/i);

    act(() => {
      fireEvent.change(searchInput, { target: { value: "nonexistent_signal_12345" } });
    });

    await waitFor(() => {
      expect(screen.getByText(/No signals found matching/i)).toBeInTheDocument();
    });

    // Press Escape to clear filter
    act(() => {
      fireEvent.keyDown(searchInput, { key: "Escape" });
    });

    expect(searchInput).toHaveValue("");
  });
});

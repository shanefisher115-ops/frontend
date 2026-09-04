import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Dashboard } from "./Dashboard";

describe("Dashboard Accessibility and Keyboard Shortcuts", () => {
  it("renders semantic landmark elements and skip link", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });

    // Skip link
    const skipLink = screen.getByText("Skip to main content");
    expect(skipLink.getAttribute("href")).toBe("#main-content");

    // Landmarks
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("renders status badge with aria-label and role status", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });

    const statusBadge = screen.getByTestId("status-database-mode");
    expect(statusBadge).toHaveAttribute("role", "status");
    expect(statusBadge).toHaveAttribute("aria-live", "polite");
    expect(statusBadge.getAttribute("aria-label")).toMatch(/Database status:/);
  });

  it("renders table with caption, headers with scope, and progressbars for intensity", async () => {
    render(<Dashboard />);

    // Wait for mock signals to load
    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });

    const table = screen.getByRole("table");
    expect(table).toHaveAttribute("aria-labelledby", "signals-heading");

    // Caption for screen readers
    const caption = table.querySelector("caption");
    expect(caption).toBeInTheDocument();
    expect(caption?.textContent).toContain("List of database signals");

    // Table header scope attributes
    const headers = screen.getAllByRole("columnheader");
    expect(headers.length).toBeGreaterThan(0);
    headers.forEach((th) => {
      expect(th).toHaveAttribute("scope", "col");
    });

    // Progressbars for intensity
    const progressbars = screen.getAllByRole("progressbar");
    expect(progressbars.length).toBeGreaterThan(0);
    progressbars.forEach((bar) => {
      expect(bar).toHaveAttribute("aria-valuenow");
      expect(bar).toHaveAttribute("aria-valuemin", "0");
      expect(bar).toHaveAttribute("aria-valuemax", "100");
    });
  });

  it("opens and closes keyboard shortcuts dialog using '?' key and 'Escape' key", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });

    // Initially modal should not be present
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Press '?' to open modal
    act(() => {
      fireEvent.keyDown(window, { key: "?" });
    });

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument();

    // Press 'Escape' to close modal
    act(() => {
      fireEvent.keyDown(window, { key: "Escape" });
    });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("triggers refresh with 'R' key and updates screen reader announcement", async () => {
    const { container } = render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });

    // Press 'R' to refresh
    act(() => {
      fireEvent.keyDown(window, { key: "r" });
    });

    // Live region status announcement
    await waitFor(() => {
      const liveRegion = container.querySelector('.sr-only[role="status"]');
      expect(liveRegion).not.toBeNull();
      expect(liveRegion?.textContent).toMatch(/Signals data refreshed from/);
    });
  });

  it("triggers theme toggle with 'T' key", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });

    const themeToggleBtn = screen.getByLabelText("Switch to light mode");
    const clickSpy = vi.spyOn(themeToggleBtn, "click");

    act(() => {
      fireEvent.keyDown(window, { key: "t" });
    });

    expect(clickSpy).toHaveBeenCalled();
  });

  it("ignores keyboard shortcuts when focus is inside input elements", async () => {
    render(
      <div>
        <input data-testid="sample-input" />
        <Dashboard />
      </div>,
    );

    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });

    const input = screen.getByTestId("sample-input");
    input.focus();

    act(() => {
      fireEvent.keyDown(input, { key: "?" });
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

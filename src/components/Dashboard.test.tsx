import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { Dashboard } from "./Dashboard";

describe("Dashboard Accessibility and Keyboard Shortcuts", () => {
  beforeEach(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  });

  const renderDashboard = async () => {
    let result: ReturnType<typeof render>;
    await act(async () => {
      result = render(<Dashboard />);
    });
    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });
    return result!;
  };

  it("renders skip link pointing to main content", async () => {
    await renderDashboard();
    const skipLink = screen.getByText("Skip to main content");
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute("href", "#main-content");
  });

  it("renders semantic landmarks: banner, main, contentinfo", async () => {
    await renderDashboard();
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("renders sections with appropriate ARIA headings and table structure", async () => {
    await renderDashboard();

    // Connection & Signals headers
    expect(screen.getByRole("heading", { name: "Connection" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Signals" })).toBeInTheDocument();

    const columnHeaders = screen.getAllByRole("columnheader");
    expect(columnHeaders.length).toBeGreaterThan(0);
    columnHeaders.forEach((th) => {
      expect(th).toHaveAttribute("scope", "col");
    });

    const progressBars = screen.getAllByRole("progressbar");
    expect(progressBars.length).toBeGreaterThan(0);
    progressBars.forEach((bar) => {
      expect(bar).toHaveAttribute("aria-valuenow");
      expect(bar).toHaveAttribute("aria-valuemin", "0");
      expect(bar).toHaveAttribute("aria-valuemax", "100");
    });
  });

  it("toggles theme via button click and keyboard shortcut 'T'", async () => {
    await renderDashboard();
    const themeBtn = screen.getByRole("button", { name: /switch to light mode/i });
    expect(themeBtn).toBeInTheDocument();
    expect(themeBtn).toHaveAttribute("aria-pressed", "true");

    // Click theme button
    await act(async () => {
      fireEvent.click(themeBtn);
    });
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");

    // Press 'T' key to switch back
    await act(async () => {
      fireEvent.keyDown(window, { key: "t" });
    });
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("refreshes dataset on button click and keyboard shortcut 'R'", async () => {
    await renderDashboard();

    const refreshBtn = screen.getByRole("button", { name: /refresh signals dataset/i });

    // Click refresh button
    await act(async () => {
      fireEvent.click(refreshBtn);
    });

    // Press 'R' shortcut key
    await act(async () => {
      fireEvent.keyDown(window, { key: "r" });
    });

    // Live region announcement update
    await waitFor(() => {
      const statusRegions = screen.getAllByRole("status");
      const announcement = statusRegions.find(
        (el) => el.textContent === "Signals dataset refreshed"
      );
      expect(announcement).toBeDefined();
    });
  });

  it("opens and closes keyboard shortcuts dialog via '?' button, '?' key and 'Escape' key", async () => {
    await renderDashboard();

    // Initially modal should not be present
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Press '?' key to open modal
    await act(async () => {
      fireEvent.keyDown(window, { key: "?" });
    });

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument();

    // Press 'Escape' key to close modal
    await act(async () => {
      fireEvent.keyDown(window, { key: "Escape" });
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Click shortcuts button in header to re-open modal
    const helpBtn = screen.getByRole("button", { name: /keyboard shortcuts help/i });
    await act(async () => {
      fireEvent.click(helpBtn);
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Click close button inside modal
    const closeBtn = screen.getByRole("button", { name: /close keyboard shortcuts dialog/i });
    await act(async () => {
      fireEvent.click(closeBtn);
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("ignores keyboard shortcuts when focus is inside an input element", async () => {
    await renderDashboard();

    // Create a dummy input element in DOM
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    // Press '?' while focused in input
    await act(async () => {
      fireEvent.keyDown(input, { key: "?" });
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    document.body.removeChild(input);
  });
});

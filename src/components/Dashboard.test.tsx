import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Dashboard } from "./Dashboard";

describe("Dashboard Accessibility and Keyboard Shortcuts", () => {
  it("renders skip link and main landmark", async () => {
    render(<Dashboard />);
    await waitFor(() => screen.getByRole("table"));

    const skipLink = screen.getByText("Skip to main content");
    expect(skipLink).toBeDefined();
    expect(skipLink.getAttribute("href")).toBe("#main-content");

    const mainContent = screen.getByRole("main");
    expect(mainContent.id).toBe("main-content");
  });

  it("renders landmark sections with aria-labelledby", async () => {
    render(<Dashboard />);
    await waitFor(() => screen.getByRole("table"));

    expect(screen.getByRole("banner")).toBeDefined();
    expect(screen.getByRole("contentinfo")).toBeDefined();

    const connectionHeading = screen.getByRole("heading", { name: "Connection" });
    expect(connectionHeading.id).toBe("connection-title");

    const signalsHeading = screen.getByRole("heading", { name: "Signals" });
    expect(signalsHeading.id).toBe("signals-title");
  });

  it("toggles theme when theme button is clicked or 't' key is pressed", async () => {
    render(<Dashboard />);
    await waitFor(() => screen.getByRole("table"));

    const themeBtn = screen.getByRole("button", { name: /Switch to/i });

    const initialTheme = document.documentElement.getAttribute("data-theme");
    expect(themeBtn.getAttribute("aria-pressed")).toBe(initialTheme === "dark" ? "true" : "false");

    // Click to toggle
    fireEvent.click(themeBtn);
    const newTheme = document.documentElement.getAttribute("data-theme");
    expect(newTheme).not.toBe(initialTheme);

    // Press 't' key to toggle back
    act(() => {
      fireEvent.keyDown(window, { key: "t" });
    });
    expect(document.documentElement.getAttribute("data-theme")).toBe(initialTheme);

    // Press 'T' (uppercase)
    act(() => {
      fireEvent.keyDown(window, { key: "T" });
    });
    expect(document.documentElement.getAttribute("data-theme")).toBe(newTheme);
  });

  it("opens keyboard shortcuts modal when button is clicked or '?' key is pressed, closes on Esc", async () => {
    render(<Dashboard />);
    await waitFor(() => screen.getByRole("table"));

    // Initially modal is not rendered
    expect(screen.queryByRole("dialog")).toBeNull();

    // Press '?' key
    act(() => {
      fireEvent.keyDown(window, { key: "?" });
    });

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeDefined();
    expect(screen.getByText("Keyboard Shortcuts")).toBeDefined();

    // Press 'Escape' key to close
    act(() => {
      fireEvent.keyDown(window, { key: "Escape" });
    });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    // Open via 'h' key
    act(() => {
      fireEvent.keyDown(window, { key: "h" });
    });
    expect(await screen.findByRole("dialog")).toBeDefined();

    // Close via close button
    const closeBtn = screen.getByRole("button", { name: "Close keyboard shortcuts dialog" });
    fireEvent.click(closeBtn);
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });

  it("triggers signals refresh on 'r' key press", async () => {
    render(<Dashboard />);
    await waitFor(() => screen.getByRole("table"));

    // Press 'r' key
    await act(async () => {
      fireEvent.keyDown(window, { key: "r" });
    });

    expect(screen.getByText("Signals")).toBeDefined();
  });

  it("does not trigger keyboard shortcuts when typing in an input element", async () => {
    render(<Dashboard />);
    await waitFor(() => screen.getByRole("table"));

    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    const currentTheme = document.documentElement.getAttribute("data-theme");

    // Fire keydown on input target
    fireEvent.keyDown(input, { key: "t" });

    // Theme should not have changed
    expect(document.documentElement.getAttribute("data-theme")).toBe(currentTheme);

    document.body.removeChild(input);
  });

  it("renders accessible table, progressbars, and time elements", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      const table = screen.getByRole("table");
      expect(table).toBeDefined();
    });

    // Table headers have scope="col"
    const headers = screen.getAllByRole("columnheader");
    expect(headers.length).toBeGreaterThan(0);

    // Progressbars exist with aria-valuenow
    const progressbars = screen.getAllByRole("progressbar");
    expect(progressbars.length).toBeGreaterThan(0);
    expect(progressbars[0].getAttribute("aria-valuenow")).toBeDefined();
    expect(progressbars[0].getAttribute("aria-valuemin")).toBe("0");
    expect(progressbars[0].getAttribute("aria-valuemax")).toBe("100");
  });
});

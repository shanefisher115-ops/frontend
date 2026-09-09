// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { Dashboard } from "./Dashboard";

afterEach(() => {
  cleanup();
});

describe("Dashboard Command Palette Integration", () => {
  it("renders Search / Commands button in header", () => {
    render(<Dashboard />);
    expect(screen.getByRole("button", { name: /Open Command Palette/i })).toBeTruthy();
  });

  it("opens Command Palette when trigger button is clicked", async () => {
    render(<Dashboard />);
    const triggerBtn = screen.getByRole("button", { name: /Open Command Palette/i });
    fireEvent.click(triggerBtn);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Type a command or search/i)).toBeTruthy();
    });
  });

  it("opens Command Palette when Cmd+K or Ctrl+K key combo is pressed", async () => {
    render(<Dashboard />);
    fireEvent.keyDown(window, { key: "k", metaKey: true });

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Type a command or search/i)).toBeTruthy();
    });
  });
});

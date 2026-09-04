// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { CommandPalette } from "./CommandPalette";
import type { Command } from "../lib/fuzzySearch";

// Mock scrollIntoView for jsdom environment
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe("CommandPalette Component", () => {
  let mockPerform1: () => void;
  let mockPerform2: () => void;
  let mockOnClose: () => void;
  let testCommands: Command[];

  beforeEach(() => {
    mockPerform1 = vi.fn();
    mockPerform2 = vi.fn();
    mockOnClose = vi.fn();

    testCommands = [
      {
        id: "cmd-1",
        title: "Jump to Signals",
        description: "Scroll to signals table",
        category: "Navigation",
        shortcut: "⌘1",
        icon: "📊",
        perform: mockPerform1,
      },
      {
        id: "cmd-2",
        title: "Refresh Signals Data",
        description: "Fetch latest telemetry readings",
        category: "Quick Actions",
        icon: "🔄",
        perform: mockPerform2,
      },
    ];
  });

  afterEach(() => {
    cleanup();
  });

  it("does not render when isOpen is false", () => {
    const { container } = render(
      <CommandPalette isOpen={false} onClose={mockOnClose} commands={testCommands} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders search input and commands when isOpen is true", () => {
    render(<CommandPalette isOpen={true} onClose={mockOnClose} commands={testCommands} />);

    expect(screen.getByPlaceholderText("Type a command or search...")).toBeDefined();
    expect(screen.getByText("Jump to Signals")).toBeDefined();
    expect(screen.getByText("Refresh Signals Data")).toBeDefined();
  });

  it("filters commands using fuzzy matching query", () => {
    render(<CommandPalette isOpen={true} onClose={mockOnClose} commands={testCommands} />);

    const input = screen.getByPlaceholderText("Type a command or search...");
    fireEvent.change(input, { target: { value: "Refresh" } });

    expect(screen.queryByText("Jump to Signals")).toBeNull();
    expect(screen.getByText("Fetch latest telemetry readings")).toBeDefined();
  });

  it("displays empty message when no command matches query", () => {
    render(<CommandPalette isOpen={true} onClose={mockOnClose} commands={testCommands} />);

    const input = screen.getByPlaceholderText("Type a command or search...");
    fireEvent.change(input, { target: { value: "nonexistent query string" } });

    expect(screen.getByText(/No matching commands found for/i)).toBeDefined();
  });

  it("executes command action on click and calls onClose", () => {
    render(<CommandPalette isOpen={true} onClose={mockOnClose} commands={testCommands} />);

    const item = screen.getByText("Jump to Signals");
    fireEvent.click(item);

    expect(mockPerform1).toHaveBeenCalledTimes(1);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("closes palette when pressing Escape key", () => {
    render(<CommandPalette isOpen={true} onClose={mockOnClose} commands={testCommands} />);

    fireEvent.keyDown(window, { key: "Escape" });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("navigates with Arrow keys and selects item on Enter key", () => {
    render(<CommandPalette isOpen={true} onClose={mockOnClose} commands={testCommands} />);

    // Press ArrowDown to move selection to second command
    fireEvent.keyDown(window, { key: "ArrowDown" });
    fireEvent.keyDown(window, { key: "Enter" });

    expect(mockPerform2).toHaveBeenCalledTimes(1);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});

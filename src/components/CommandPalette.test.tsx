// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { CommandPalette } from "./CommandPalette";
import type { CommandItem } from "../types/command";

afterEach(() => {
  cleanup();
});

describe("CommandPalette Component", () => {
  const sampleCommands: CommandItem[] = [
    {
      id: "cmd-1",
      title: "Refresh Signal Data",
      description: "Refetch signals from Supabase",
      category: "quick-action",
      shortcut: "⌘R",
      perform: vi.fn(),
    },
    {
      id: "cmd-2",
      title: "Toggle Light / Dark Theme",
      category: "quick-action",
      shortcut: "⌘T",
      perform: vi.fn(),
    },
    {
      id: "cmd-3",
      title: "Agent Health Check",
      description: "Run automated diagnostic",
      category: "agent-command",
      perform: vi.fn(),
    },
  ];

  it("does not render when isOpen is false", () => {
    const { container } = render(
      <CommandPalette isOpen={false} onClose={vi.fn()} commands={sampleCommands} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders search input and commands when isOpen is true", () => {
    render(<CommandPalette isOpen={true} onClose={vi.fn()} commands={sampleCommands} />);

    expect(screen.getByPlaceholderText(/Type a command or search/i)).toBeTruthy();
    expect(screen.getByText("Refresh Signal Data")).toBeTruthy();
    expect(screen.getByText("Toggle Light / Dark Theme")).toBeTruthy();
    expect(screen.getByText("Agent Health Check")).toBeTruthy();
  });

  it("filters commands based on search input", () => {
    render(<CommandPalette isOpen={true} onClose={vi.fn()} commands={sampleCommands} />);

    const input = screen.getByPlaceholderText(/Type a command or search/i);
    fireEvent.change(input, { target: { value: "health" } });

    expect(
      screen.getByText((_, el) => Boolean(el?.classList.contains("cmd-item-title") && el.textContent === "Agent Health Check"))
    ).toBeTruthy();
    expect(
      screen.queryByText((_, el) => Boolean(el?.classList.contains("cmd-item-title") && el.textContent === "Refresh Signal Data"))
    ).toBeNull();
  });

  it("displays empty state when query matches nothing", () => {
    render(<CommandPalette isOpen={true} onClose={vi.fn()} commands={sampleCommands} />);

    const input = screen.getByPlaceholderText(/Type a command or search/i);
    fireEvent.change(input, { target: { value: "nonexistent123" } });

    expect(screen.getByText(/No commands found for/i)).toBeTruthy();
  });

  it("calls perform on Enter press for selected item", () => {
    const onClose = vi.fn();
    const performSpy = vi.fn();
    const commands: CommandItem[] = [
      {
        id: "cmd-test",
        title: "Test Command",
        category: "quick-action",
        perform: performSpy,
      },
    ];

    render(<CommandPalette isOpen={true} onClose={onClose} commands={commands} />);

    const input = screen.getByPlaceholderText(/Type a command or search/i);
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onClose).toHaveBeenCalled();
    expect(performSpy).toHaveBeenCalled();
  });

  it("calls onClose when Escape key is pressed", () => {
    const onClose = vi.fn();
    render(<CommandPalette isOpen={true} onClose={onClose} commands={sampleCommands} />);

    const input = screen.getByPlaceholderText(/Type a command or search/i);
    fireEvent.keyDown(input, { key: "Escape" });

    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when overlay backdrop is clicked", () => {
    const onClose = vi.fn();
    render(<CommandPalette isOpen={true} onClose={onClose} commands={sampleCommands} />);

    const overlay = screen.getByTestId("cmd-overlay");
    fireEvent.click(overlay);

    expect(onClose).toHaveBeenCalled();
  });
});

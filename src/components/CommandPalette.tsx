import { useState, useEffect, useRef, useMemo } from "react";
import { Command, fuzzyMatch } from "../lib/fuzzySearch";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: Command[];
}

interface ScoredCommand {
  command: Command;
  score: number;
  matchedTitleIndices: number[];
  matchedDescIndices: number[];
}

export function CommandPalette({ isOpen, onClose, commands }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Filter and score commands based on search query
  const filteredCommands = useMemo<ScoredCommand[]>(() => {
    if (!query.trim()) {
      return commands.map((command) => ({
        command,
        score: 1,
        matchedTitleIndices: [],
        matchedDescIndices: [],
      }));
    }

    const matches: ScoredCommand[] = [];

    for (const command of commands) {
      const titleMatch = fuzzyMatch(command.title, query);
      const descMatch = command.description ? fuzzyMatch(command.description, query) : null;

      if (titleMatch || descMatch) {
        const titleScore = titleMatch ? titleMatch.score + 10 : 0;
        const descScore = descMatch ? descMatch.score : 0;
        const maxScore = Math.max(titleScore, descScore);

        matches.push({
          command,
          score: maxScore,
          matchedTitleIndices: titleMatch ? titleMatch.matchedIndices : [],
          matchedDescIndices: descMatch ? descMatch.matchedIndices : [],
        });
      }
    }

    return matches.sort((a, b) => b.score - a.score);
  }, [commands, query]);

  // Reset selected index when search query or command list changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, isOpen]);

  // Focus input when palette opens
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Keep selected item visible in scroll view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const selectedEl = listRef.current.children[selectedIndex] as HTMLElement | undefined;
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex, isOpen]);

  // Keyboard navigation & global shortcuts handling
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          filteredCommands.length > 0 ? (prev + 1) % filteredCommands.length : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          filteredCommands.length > 0
            ? (prev - 1 + filteredCommands.length) % filteredCommands.length
            : 0
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredCommands.length > 0 && filteredCommands[selectedIndex]) {
          const item = filteredCommands[selectedIndex];
          onClose();
          item.command.perform();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="cmd-palette-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
    >
      <div className="cmd-palette">
        <div className="cmd-palette__search">
          <svg
            className="cmd-palette__search-icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="cmd-palette__input"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-autocomplete="list"
            aria-expanded="true"
            aria-controls="cmd-palette-list"
          />
          {query && (
            <button
              type="button"
              className="cmd-palette__clear"
              onClick={() => setQuery("")}
              aria-label="Clear input"
            >
              ✕
            </button>
          )}
          <kbd className="cmd-palette__key-badge">ESC</kbd>
        </div>

        <div className="cmd-palette__body">
          {filteredCommands.length === 0 ? (
            <div className="cmd-palette__empty">
              No matching commands found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <ul id="cmd-palette-list" ref={listRef} className="cmd-palette__list" role="listbox">
              {filteredCommands.map((scoredCmd, idx) => {
                const { command, matchedTitleIndices, matchedDescIndices } = scoredCmd;
                const isSelected = idx === selectedIndex;

                return (
                  <li
                    key={command.id}
                    role="option"
                    aria-selected={isSelected}
                    className={`cmd-palette__item ${isSelected ? "cmd-palette__item--selected" : ""}`}
                    onClick={() => {
                      onClose();
                      command.perform();
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <div className="cmd-palette__item-content">
                      <div className="cmd-palette__item-header">
                        {command.icon && (
                          <span className="cmd-palette__item-icon">{command.icon}</span>
                        )}
                        <span className="cmd-palette__item-title">
                          {renderHighlightedText(command.title, matchedTitleIndices)}
                        </span>
                        <span
                          className={`cmd-palette__category-badge cmd-palette__category-badge--${command.category.toLowerCase().replace(/\s+/g, "-")}`}
                        >
                          {command.category}
                        </span>
                      </div>
                      {command.description && (
                        <p className="cmd-palette__item-desc">
                          {renderHighlightedText(command.description, matchedDescIndices)}
                        </p>
                      )}
                    </div>
                    {command.shortcut && (
                      <kbd className="cmd-palette__item-shortcut">{command.shortcut}</kbd>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="cmd-palette__footer">
          <div className="cmd-palette__footer-tips">
            <span>
              <kbd>↑</kbd> <kbd>↓</kbd> Navigate
            </span>
            <span>
              <kbd>↵</kbd> Select
            </span>
            <span>
              <kbd>ESC</kbd> Close
            </span>
          </div>
          <span className="cmd-palette__footer-brand">Primordia Command</span>
        </div>
      </div>
    </div>
  );
}

function renderHighlightedText(text: string, matchedIndices: number[]) {
  if (!matchedIndices || matchedIndices.length === 0) {
    return text;
  }

  const indexSet = new Set(matchedIndices);
  const chars = text.split("");

  return chars.map((char, index) => {
    if (indexSet.has(index)) {
      return (
        <mark key={index} className="cmd-palette__highlight">
          {char}
        </mark>
      );
    }
    return <span key={index}>{char}</span>;
  });
}

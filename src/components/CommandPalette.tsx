import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import type { CommandItem, CommandCategory } from "../types/command";
import { CATEGORY_LABELS } from "../lib/commands";
import { filterAndSortItems } from "../lib/fuzzy";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: CommandItem[];
}

export function CommandPalette({ isOpen, onClose, commands }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter and score commands
  const filteredItems = useMemo(() => {
    return filterAndSortItems(commands, query, (cmd) => [
      cmd.title,
      cmd.description || "",
      ...(cmd.keywords || []),
      CATEGORY_LABELS[cmd.category] || "",
    ]);
  }, [commands, query]);

  // Group filtered items by category while preserving sorted order
  const groupedCategories = useMemo(() => {
    const map = new Map<CommandCategory, Array<{ item: CommandItem; matches: number[]; globalIndex: number }>>();
    let globalCounter = 0;

    for (const entry of filteredItems) {
      const cat = entry.item.category;
      if (!map.has(cat)) {
        map.set(cat, []);
      }
      map.get(cat)!.push({
        item: entry.item,
        matches: entry.matches,
        globalIndex: globalCounter++,
      });
    }

    const order: CommandCategory[] = ["quick-action", "agent-command", "navigation"];
    const result: Array<{ category: CommandCategory; label: string; items: Array<{ item: CommandItem; matches: number[]; globalIndex: number }> }> = [];

    for (const cat of order) {
      if (map.has(cat)) {
        result.push({
          category: cat,
          label: CATEGORY_LABELS[cat] || cat,
          items: map.get(cat)!,
        });
      }
    }

    return result;
  }, [filteredItems]);

  const totalItems = filteredItems.length;

  // Reset selectedIndex when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when modal opens & reset search
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Scroll active item into view
  useEffect(() => {
    if (!isOpen || !listRef.current) return;
    const activeEl = listRef.current.querySelector<HTMLElement>('[aria-selected="true"]');
    if (activeEl && typeof activeEl.scrollIntoView === "function") {
      activeEl.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex, isOpen]);

  const executeCommand = useCallback((command: CommandItem) => {
    onClose();
    command.perform();
  }, [onClose]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (totalItems > 0) {
        setSelectedIndex((prev) => (prev + 1) % totalItems);
      }
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (totalItems > 0) {
        setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
      }
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (totalItems > 0 && selectedIndex < totalItems) {
        const selected = filteredItems[selectedIndex];
        if (selected && !selected.item.disabled) {
          executeCommand(selected.item);
        }
      }
      return;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="cmd-overlay"
      data-testid="cmd-overlay"
      onClick={onClose}
    >
      <div
        className="cmd-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Command Palette"
      >
        <div className="cmd-header">
          <span className="cmd-search-icon" aria-hidden="true">
            <CommandIcon name="search" />
          </span>
          <input
            ref={inputRef}
            type="text"
            className="cmd-input"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-autocomplete="list"
            aria-expanded="true"
            aria-controls="cmd-listbox"
          />
          {query && (
            <button
              type="button"
              className="cmd-clear-btn"
              onClick={() => setQuery("")}
              aria-label="Clear search query"
            >
              ✕
            </button>
          )}
          <span className="cmd-badge-esc">
            <kbd>Esc</kbd>
          </span>
        </div>

        <div className="cmd-body" ref={listRef} id="cmd-listbox" role="listbox">
          {totalItems === 0 ? (
            <div className="cmd-empty">
              <p>No commands found for &ldquo;{query}&rdquo;</p>
              <span className="cmd-empty-hint">Try searching for &quot;refresh&quot;, &quot;theme&quot;, or &quot;health&quot;.</span>
            </div>
          ) : (
            groupedCategories.map((group) => (
              <div key={group.category} className="cmd-group">
                <div className="cmd-group-title">{group.label}</div>
                <div className="cmd-group-items">
                  {group.items.map(({ item, matches, globalIndex }) => {
                    const isSelected = globalIndex === selectedIndex;
                    return (
                      <div
                        key={item.id}
                        role="option"
                        aria-selected={isSelected}
                        className={`cmd-item ${isSelected ? "cmd-item--selected" : ""} ${item.disabled ? "cmd-item--disabled" : ""}`}
                        onClick={() => {
                          if (!item.disabled) {
                            executeCommand(item);
                          }
                        }}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                      >
                        <span className="cmd-item-icon">
                          <CommandIcon name={item.icon || "command"} />
                        </span>
                        <div className="cmd-item-content">
                          <span className="cmd-item-title">
                            {highlightMatches(item.title, matches)}
                          </span>
                          {item.description && (
                            <span className="cmd-item-desc">{item.description}</span>
                          )}
                        </div>
                        {item.shortcut && (
                          <div className="cmd-item-shortcut">
                            <kbd>{item.shortcut}</kbd>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="cmd-footer">
          <div className="cmd-footer-tips">
            <span><kbd>↑</kbd> <kbd>↓</kbd> to navigate</span>
            <span><kbd>↵</kbd> to select</span>
            <span><kbd>esc</kbd> to close</span>
          </div>
          <div className="cmd-footer-brand">Primordia Command Palette</div>
        </div>
      </div>
    </div>
  );
}

function highlightMatches(text: string, matches: number[]) {
  if (!matches || matches.length === 0) return text;

  const matchSet = new Set(matches);
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < text.length; i++) {
    if (matchSet.has(i)) {
      elements.push(
        <mark key={i} className="cmd-highlight">
          {text[i]}
        </mark>
      );
    } else {
      elements.push(text[i]);
    }
  }

  return elements;
}

function CommandIcon({ name }: { name: string }) {
  switch (name) {
    case "search":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
      );
    case "refresh":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21.5 2v6h-6M2.5 22v-6h6" />
          <path d="M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" />
        </svg>
      );
    case "sun-moon":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      );
    case "copy":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      );
    case "key":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.778-7.778zm0 0L15.5 7.5l3 3L22 7l-3-3" />
        </svg>
      );
    case "activity":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      );
    case "wrench":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      );
    case "zap":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );
    case "cpu":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
          <rect x="9" y="9" width="6" height="6" />
          <line x1="9" y1="1" x2="9" y2="4" />
          <line x1="15" y1="1" x2="15" y2="4" />
          <line x1="9" y1="20" x2="9" y2="23" />
          <line x1="15" y1="20" x2="15" y2="23" />
          <line x1="20" y1="9" x2="23" y2="9" />
          <line x1="20" y1="15" x2="23" y2="15" />
          <line x1="1" y1="9" x2="4" y2="9" />
          <line x1="1" y1="15" x2="4" y2="15" />
        </svg>
      );
    case "link":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      );
    case "table":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="3" y1="15" x2="21" y2="15" />
          <line x1="12" y1="9" x2="12" y2="21" />
        </svg>
      );
    case "code":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      );
    default:
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3zM6 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3z" />
        </svg>
      );
  }
}

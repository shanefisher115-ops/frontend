import { describe, it, expect } from "vitest";
import { fuzzyMatch, filterAndSortItems } from "./fuzzy";
import { getDefaultCommands } from "./commands";

describe("fuzzyMatch", () => {
  it("returns score > 0 for exact match", () => {
    const res = fuzzyMatch("refresh", "refresh");
    expect(res.score).toBeGreaterThan(0);
    expect(res.matches).toHaveLength(7);
  });

  it("returns score > 0 for prefix match", () => {
    const res = fuzzyMatch("ref", "Refresh Signal Data");
    expect(res.score).toBeGreaterThan(0);
    expect(res.matches).toEqual([0, 1, 2]);
  });

  it("returns score > 0 for sequential fuzzy characters", () => {
    const res = fuzzyMatch("rsh", "Refresh");
    expect(res.score).toBeGreaterThan(0);
    expect(res.matches.length).toBe(3);
  });

  it("returns score 0 when search query does not match target", () => {
    const res = fuzzyMatch("xyz", "Refresh Signal Data");
    expect(res.score).toBe(0);
    expect(res.matches).toHaveLength(0);
  });

  it("filters and sorts items properly", () => {
    const items = [
      { name: "Toggle Light / Dark Theme" },
      { name: "Refresh Signal Data" },
      { name: "Agent Health Check" },
    ];

    const results = filterAndSortItems(items, "health", (i) => [i.name]);
    expect(results).toHaveLength(1);
    expect(results[0].item.name).toBe("Agent Health Check");
  });
});

describe("getDefaultCommands", () => {
  it("generates default commands with expected categories", () => {
    const commands = getDefaultCommands({});
    expect(commands.length).toBeGreaterThan(5);

    const categories = new Set(commands.map((c) => c.category));
    expect(categories.has("quick-action")).toBe(true);
    expect(categories.has("agent-command")).toBe(true);
    expect(categories.has("navigation")).toBe(true);
  });
});

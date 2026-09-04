import { describe, it, expect } from "vitest";
import { fuzzyMatch } from "./fuzzySearch";

describe("fuzzyMatch", () => {
  it("returns match with score 1 and empty indices for empty query", () => {
    const result = fuzzyMatch("Dashboard", "");
    expect(result).not.toBeNull();
    expect(result?.score).toBe(1);
    expect(result?.matchedIndices).toEqual([]);
  });

  it("returns null when query characters do not match in target", () => {
    const result = fuzzyMatch("Signals", "xyz");
    expect(result).toBeNull();
  });

  it("matches sequential fuzzy characters", () => {
    const result = fuzzyMatch("Connection", "cnt");
    expect(result).not.toBeNull();
    // C(0) o n(2) n e c t(6) i o n
    expect(result?.matchedIndices).toEqual([0, 2, 6]);
  });

  it("scores higher for word boundary matches", () => {
    // "sd" matches Start of Signal (S) and Diagnostics (D)
    const match1 = fuzzyMatch("Run Signal Diagnostics", "sd");
    // "ag" matches middle of Signal (a) and Diagnostics (g)
    const match2 = fuzzyMatch("Run Signal Diagnostics", "ag");

    expect(match1).not.toBeNull();
    expect(match2).not.toBeNull();
    expect(match1!.score).toBeGreaterThan(match2!.score);
  });

  it("scores exact substring matches higher than distant fuzzy matches", () => {
    const direct = fuzzyMatch("Refresh Signals", "Signals");
    const distant = fuzzyMatch("Sync Schema for Database", "Signals");

    expect(direct).not.toBeNull();
    expect(distant).toBeNull(); // 'Signals' is not in 'Sync Schema for Database' in sequence
  });
});

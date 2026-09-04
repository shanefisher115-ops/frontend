export interface Command {
  id: string;
  title: string;
  description?: string;
  category: "Navigation" | "Quick Actions" | "Agent Commands";
  shortcut?: string;
  icon?: string;
  perform: () => void | Promise<void>;
}

export interface MatchResult {
  score: number;
  matchedIndices: number[];
}

/**
 * Calculates a fuzzy score and matching character indices for target string given query string.
 * Returns null if the query does not match target in sequence.
 */
export function fuzzyMatch(target: string, query: string): MatchResult | null {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) {
    return { score: 1, matchedIndices: [] };
  }

  const cleanTarget = target.toLowerCase();

  // Find sequence match
  const matchedIndices: number[] = [];
  let queryIdx = 0;
  let targetIdx = 0;

  while (queryIdx < cleanQuery.length && targetIdx < cleanTarget.length) {
    if (cleanQuery[queryIdx] === cleanTarget[targetIdx]) {
      matchedIndices.push(targetIdx);
      queryIdx++;
    }
    targetIdx++;
  }

  if (queryIdx < cleanQuery.length) {
    return null;
  }

  // Calculate score
  let score = 0;
  let consecutiveMatches = 0;

  for (let i = 0; i < matchedIndices.length; i++) {
    const idx = matchedIndices[i];
    let charScore = 10;

    const isStartOfWord =
      idx === 0 ||
      cleanTarget[idx - 1] === " " ||
      cleanTarget[idx - 1] === "-" ||
      cleanTarget[idx - 1] === "/" ||
      cleanTarget[idx - 1] === ".";

    if (isStartOfWord) {
      charScore += 25; // High bonus for word start / initials
    }

    if (i > 0 && matchedIndices[i] === matchedIndices[i - 1] + 1) {
      consecutiveMatches++;
      charScore += consecutiveMatches * 5;
    } else {
      consecutiveMatches = 0;
    }

    score += charScore;
  }

  // Exact substring match bonus
  const exactSubIndex = cleanTarget.indexOf(cleanQuery);
  if (exactSubIndex !== -1) {
    score += 40;
    if (exactSubIndex === 0) {
      score += 20;
    }
  }

  // Length penalty
  score -= (target.length - cleanQuery.length) * 0.2;

  return { score, matchedIndices };
}

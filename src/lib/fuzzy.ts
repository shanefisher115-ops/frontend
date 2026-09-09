export interface MatchResult {
  score: number;
  matches: number[]; // indices of matched characters in target
}

/**
 * Performs fuzzy search matching of `query` against `target`.
 * Returns a score (>0 if matched, 0 if no match) and array of matched index positions.
 */
export function fuzzyMatch(query: string, target: string): MatchResult {
  const q = query.trim().toLowerCase();
  const t = target.toLowerCase();

  if (!q) {
    return { score: 1, matches: [] };
  }

  if (q.length > t.length) {
    return { score: 0, matches: [] };
  }

  // Exact match gets highest base score
  if (t === q) {
    const matches = Array.from({ length: t.length }, (_, i) => i);
    return { score: 100, matches };
  }

  // Starts with query gets very high score
  if (t.startsWith(q)) {
    const matches = Array.from({ length: q.length }, (_, i) => i);
    return { score: 90 - (t.length - q.length), matches };
  }

  // Word boundary match / Substring match
  const substringIdx = t.indexOf(q);
  if (substringIdx !== -1) {
    const matches = Array.from({ length: q.length }, (_, i) => substringIdx + i);
    // Bonus if substring matches at start of a word
    const isWordStart = substringIdx === 0 || /\s|-|_|\//.test(t[substringIdx - 1]);
    const score = (isWordStart ? 80 : 60) - substringIdx;
    return { score, matches };
  }

  // Sequential fuzzy character matching
  let qIdx = 0;
  let score = 0;
  let consecutive = 0;
  const matches: number[] = [];

  for (let tIdx = 0; tIdx < t.length; tIdx++) {
    if (qIdx < q.length && t[tIdx] === q[qIdx]) {
      matches.push(tIdx);

      // Score bonus for matches at start of string or word boundaries
      const isWordStart = tIdx === 0 || /\s|-|_|\//.test(t[tIdx - 1]);
      if (isWordStart) {
        score += 10;
      } else {
        score += 3;
      }

      // Bonus for consecutive matched characters
      consecutive++;
      score += consecutive * 5;

      qIdx++;
    } else {
      consecutive = 0;
    }
  }

  // If not all query characters were matched, it's not a match
  if (qIdx < q.length) {
    return { score: 0, matches: [] };
  }

  return { score, matches };
}

/**
 * Filters and sorts items based on fuzzy search query against item labels/keywords.
 */
export function filterAndSortItems<T>(
  items: T[],
  query: string,
  getTexts: (item: T) => string[]
): { item: T; score: number; matches: number[] }[] {
  if (!query.trim()) {
    return items.map((item) => ({ item, score: 1, matches: [] }));
  }

  const results: { item: T; score: number; matches: number[] }[] = [];

  for (const item of items) {
    const texts = getTexts(item);
    let maxScore = 0;
    let bestMatches: number[] = [];

    for (const text of texts) {
      const { score, matches } = fuzzyMatch(query, text);
      if (score > maxScore) {
        maxScore = score;
        bestMatches = matches;
      }
    }

    if (maxScore > 0) {
      results.push({ item, score: maxScore, matches: bestMatches });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

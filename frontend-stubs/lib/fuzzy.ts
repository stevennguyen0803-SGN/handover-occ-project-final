/**
 * Tiny zero-dependency fuzzy matcher.
 *
 * `match(query, target)` returns `null` when the query characters do
 * not all appear in `target` (case-insensitive, in order, gaps allowed).
 * Otherwise returns `{ score, indices }`.
 *
 * Scoring is intentionally simple but produces a reasonable ranking
 * for command palettes:
 *   - +5  match at the start of `target`
 *   - +3  match right after a separator (` `, `-`, `_`, `.`, `/`)
 *   - +2  match after a previously-matched character (consecutive run)
 *   - +1  match anywhere else
 *   - −0.05 × distance-from-previous-match (small tie-breaker)
 *
 * That's enough to rank "Go to Dashboard" higher than "Sign out" for
 * the query "dash" without pulling in `fuse.js` or `match-sorter`.
 */

export interface FuzzyMatch {
  score: number;
  indices: number[];
}

const SEPARATORS = new Set([' ', '-', '_', '.', '/']);

export function fuzzyMatch(query: string, target: string): FuzzyMatch | null {
  if (!query) return { score: 0, indices: [] };
  const q = query.toLowerCase();
  const t = target.toLowerCase();

  let qi = 0;
  let score = 0;
  let lastIndex = -1;
  const indices: number[] = [];

  for (let i = 0; i < t.length && qi < q.length; i += 1) {
    if (t[i] !== q[qi]) continue;

    let bonus = 1;
    if (i === 0) bonus = 5;
    else if (SEPARATORS.has(t[i - 1] ?? '')) bonus = 3;
    else if (lastIndex >= 0 && i === lastIndex + 1) bonus = 2;

    if (lastIndex >= 0) {
      score -= (i - lastIndex - 1) * 0.05;
    }

    score += bonus;
    indices.push(i);
    lastIndex = i;
    qi += 1;
  }

  return qi === q.length ? { score, indices } : null;
}

/**
 * Highlight matched ranges by splitting `target` into chunks tagged
 * with `match: true | false`. Useful when rendering a command label
 * with bolded matched characters.
 */
export function highlightMatch(target: string, indices: number[]): Array<{ text: string; match: boolean }> {
  if (!indices.length) return [{ text: target, match: false }];
  const chunks: Array<{ text: string; match: boolean }> = [];
  const set = new Set(indices);
  let buffer = '';
  let bufferMatch = false;
  for (let i = 0; i < target.length; i += 1) {
    const m = set.has(i);
    if (i === 0) {
      buffer = target[i] ?? '';
      bufferMatch = m;
    } else if (m === bufferMatch) {
      buffer += target[i];
    } else {
      chunks.push({ text: buffer, match: bufferMatch });
      buffer = target[i] ?? '';
      bufferMatch = m;
    }
  }
  if (buffer) chunks.push({ text: buffer, match: bufferMatch });
  return chunks;
}

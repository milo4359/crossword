import type { Entry, Grid } from "./grid";

export type Word = { text: string; score: number };

// Parse a word list where each line is "WORD;score" (the format CrossFire,
// Spread the Wordlist and Peter Broda's list use). Words are uppercased and
// stripped of anything that isn't A-Z, so "a lot" becomes "ALOT". A line with
// no score gets 50. If a word appears twice, the higher score wins.
export function parseWordList(text: string): Word[] {
  const best = new Map<string, number>();
  for (const line of text.split(/\r?\n/)) {
    const [rawWord, rawScore] = line.split(";");
    const word = rawWord.toUpperCase().replace(/[^A-Z]/g, "");
    if (word.length < 2) continue;
    const parsed = rawScore === undefined ? 25 : Number(rawScore.trim());
    const score = Number.isFinite(parsed) ? parsed : 25;
    best.set(word, Math.max(score, best.get(word) ?? -Infinity));
  }
  return [...best].map(([text, score]) => ({ text, score }));
}

// The pattern for an entry: its letters, with "?" for empty squares.
export function patternFor(grid: Grid, entry: Entry): string {
  return entry.cells.map(([r, c]) => grid[r][c].letter || "?").join("");
}

// Return the words that fit the pattern ("?" matches any letter), sorted by
// score from highest to lowest, with ties in alphabetical order.
// Don't change the order of `words` itself.
export function matchWords(words: Word[], pattern: string): Word[] {
  const regex = new RegExp(`^${pattern.replace(/\?/g, ".")}$`);
  return words.filter((word) => regex.test(word.text)).sort((a, b) => b.score - a.score || a.text.localeCompare(b.text));   
}

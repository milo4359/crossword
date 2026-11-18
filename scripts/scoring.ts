// Helpers for score.ts. These don't call the API, so they're easy to test.

// Read a word list (one entry per line, optionally "WORD;score") and return
// the entries: uppercased, letters only, no duplicates, 3+ letters.
export function readEntries(text: string): string[] {
  const seen = new Set<string>();
  for (const line of text.split(/\r?\n/)) {
    const word = line.split(";")[0].toUpperCase().replace(/[^A-Z]/g, "");
    if (word.length >= 3) seen.add(word);
  }
  return [...seen];
}

// Split a list into chunks of `size` items.
export function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

// Build the instructions sent with every request.
export function buildSystemPrompt(
  rubric: string,
  calibration: string,
  minScore: number,
  maxScore: number,
): string {
  return [
    "You score entries for an American-style crossword word list.",
    'Entries are in capital letters with spaces and punctuation removed, so the phrase "a lot of" appears as ALOTOF.',
    "",
    `Score each entry from ${minScore} to ${maxScore} using this scale:`,
    rubric.trim(),
    "",
    "Here are entries the constructor has already scored. Match their taste:",
    calibration.trim(),
    "",
    "Reply with exactly one line per entry, in the order given, in the form ENTRY;SCORE.",
    "Use whole numbers that are multiples of 5. Write nothing else.",
  ].join("\n");
}

// Pull "ENTRY;SCORE" lines out of the model's reply. Only entries that were
// actually in this request, with a score in range, are accepted.
export function parseScores(
  reply: string,
  expected: string[],
  minScore: number,
  maxScore: number,
): Map<string, number> {
  const wanted = new Set(expected);
  const scores = new Map<string, number>();
  for (const line of reply.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z][A-Za-z ]*?)\s*;\s*(\d+)\s*$/);
    if (!match) continue;
    const word = match[1].toUpperCase().replace(/[^A-Z]/g, "");
    const score = Number(match[2]);
    if (wanted.has(word) && score >= minScore && score <= maxScore) scores.set(word, score);
  }
  return scores;
}

// Read an existing "WORD;score" output file into a map (empty if no file).
export function readScoreFile(text: string): Map<string, number> {
  const scores = new Map<string, number>();
  for (const line of text.split(/\r?\n/)) {
    const [word, score] = line.split(";");
    if (word && score !== undefined && Number.isFinite(Number(score))) {
      scores.set(word, Number(score));
    }
  }
  return scores;
}

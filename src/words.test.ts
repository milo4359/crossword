import { describe, expect, it } from "vitest";
import { getEntries } from "./entries";
import { gridFromStrings } from "./grid";
import { matchWords, parseWordList, patternFor, type Word } from "./words";

const w = (text: string, score: number): Word => ({ text, score });
const texts = (words: Word[]) => words.map((x) => x.text);

describe("matchWords", () => {
  const words = [w("CAT", 50), w("COT", 60), w("CUT", 40), w("DOG", 50), w("CART", 50)];

  it("keeps only words of the right length that fit the letters", () => {
    expect(texts(matchWords(words, "C?T"))).toEqual(["COT", "CAT", "CUT"]);
  });

  it("matches every word of that length when the pattern is all ?", () => {
    expect(texts(matchWords(words, "???"))).toEqual(["COT", "CAT", "DOG", "CUT"]);
  });

  it("sorts by score (highest first), then alphabetically", () => {
    expect(texts(matchWords([w("BBB", 10), w("CCC", 90), w("AAA", 10)], "???"))).toEqual([
      "CCC",
      "AAA",
      "BBB",
    ]);
  });

  it("checks every letter in the pattern, not just the first", () => {
    expect(texts(matchWords(words, "??T"))).toEqual(["COT", "CAT", "CUT"]);
    expect(texts(matchWords(words, "D?G"))).toEqual(["DOG"]);
  });

  it("returns an empty list when nothing fits", () => {
    expect(matchWords(words, "Z??")).toEqual([]);
    expect(matchWords(words, "?????")).toEqual([]);
  });

  it("does not reorder or change the original list", () => {
    const before = structuredClone(words);
    matchWords(words, "???");
    expect(words).toEqual(before);
  });
});

describe("parseWordList", () => {
  it("reads WORD;score lines", () => {
    expect(parseWordList("CAT;50\nDOG;60")).toEqual([w("CAT", 50), w("DOG", 60)]);
  });

  it("handles Windows line endings, blank lines, lowercase and spaces", () => {
    expect(parseWordList("cat;50\r\n\r\na lot;40\r\n")).toEqual([w("CAT", 50), w("ALOT", 40)]);
  });

  it("gives a default score of 50 when a line has none", () => {
    expect(parseWordList("CAT")).toEqual([w("CAT", 50)]);
  });

  it("keeps the higher score when a word appears twice", () => {
    expect(parseWordList("CAT;30\nCAT;70\nCAT;50")).toEqual([w("CAT", 70)]);
  });
});

describe("patternFor", () => {
  it("uses letters for filled squares and ? for empty ones", () => {
    const grid = gridFromStrings(["C.T", "...", "..."]);
    const oneAcross = getEntries(grid)[0];
    expect(patternFor(grid, oneAcross)).toBe("C?T");
  });
});

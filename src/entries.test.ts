import { describe, expect, it } from "vitest";
import { getEntries } from "./entries";
import { gridFromStrings, type Dir, type Pos } from "./grid";

// Shorthand: [number, direction, length, starting row, starting col]
type Summary = [number, Dir, number, number, number];

function summarize(rows: string[]): Summary[] {
  return getEntries(gridFromStrings(rows)).map((e) => [
    e.num,
    e.dir,
    e.cells.length,
    e.cells[0][0],
    e.cells[0][1],
  ]);
}

describe("getEntries", () => {
  it("handles an open 3x3 grid", () => {
    expect(summarize(["...", "...", "..."])).toEqual([
      [1, "across", 3, 0, 0],
      [4, "across", 3, 1, 0],
      [5, "across", 3, 2, 0],
      [1, "down", 3, 0, 0],
      [2, "down", 3, 0, 1],
      [3, "down", 3, 0, 2],
    ]);
  });

  it("lists the exact cells of each entry", () => {
    const entries = getEntries(gridFromStrings(["...", "...", "..."]));
    const fourAcross = entries.find((e) => e.num === 4 && e.dir === "across");
    const twoDown = entries.find((e) => e.num === 2 && e.dir === "down");
    expect(fourAcross?.cells).toEqual<Pos[]>([[1, 0], [1, 1], [1, 2]]);
    expect(twoDown?.cells).toEqual<Pos[]>([[0, 1], [1, 1], [2, 1]]);
  });

  it("numbers around corner black squares in a 5x5", () => {
    expect(summarize(["#....", ".....", ".....", ".....", "....#"])).toEqual([
      [1, "across", 4, 0, 1],
      [5, "across", 5, 1, 0],
      [6, "across", 5, 2, 0],
      [7, "across", 5, 3, 0],
      [8, "across", 4, 4, 0],
      [1, "down", 5, 0, 1],
      [2, "down", 5, 0, 2],
      [3, "down", 5, 0, 3],
      [4, "down", 4, 0, 4],
      [5, "down", 4, 1, 0],
    ]);
  });

  it("skips one-square runs and squares that start nothing", () => {
    // The center block leaves single squares at (1,0), (1,2), (0,1), (2,1).
    // (0,1) is inside 1-Across and starts no down entry, so it gets no number.
    expect(summarize(["...", ".#.", "..."])).toEqual([
      [1, "across", 3, 0, 0],
      [3, "across", 3, 2, 0],
      [1, "down", 3, 0, 0],
      [2, "down", 3, 0, 2],
    ]);
  });

  it("returns nothing when every white square is isolated", () => {
    expect(summarize([".#.", "###", ".#."])).toEqual([]);
  });

  it("returns nothing for an empty grid", () => {
    expect(getEntries([])).toEqual([]);
  });

  it("ignores letters when finding entries", () => {
    expect(summarize(["CAT", "ARE", "TEN"])).toEqual(
      summarize(["...", "...", "..."]),
    );
  });
});

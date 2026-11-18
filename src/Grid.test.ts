import { describe, expect, it } from "vitest";
import { gridFromStrings, withLetter } from "./grid";

describe("withLetter", () => {
  it("sets the letter at the given square", () => {
    const grid = gridFromStrings(["...", "...", "..."]);
    expect(withLetter(grid, 1, 2, "Q")).toEqual(gridFromStrings(["...", "..Q", "..."]));
  });

  it("clears a square when given an empty string", () => {
    const grid = gridFromStrings(["CAT", "...", "..."]);
    expect(withLetter(grid, 0, 1, "")).toEqual(gridFromStrings(["C.T", "...", "..."]));
  });

  it("does not change the original grid", () => {
    const grid = gridFromStrings(["...", "...", "..."]);
    const before = structuredClone(grid);
    withLetter(grid, 0, 0, "A");
    expect(grid).toEqual(before);
  });

  it("returns a new grid object", () => {
    const grid = gridFromStrings(["...", "...", "..."]);
    const result = withLetter(grid, 0, 0, "A");
    expect(result).not.toBe(grid);
    expect(result[0]).not.toBe(grid[0]);
  });
});
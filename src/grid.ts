export type Cell = { block: boolean; letter: string };
export type Grid = Cell[][];
export type Dir = "across" | "down";
export type Pos = [row: number, col: number];
export type Entry = { num: number; dir: Dir; cells: Pos[] };

export function emptyGrid(rows: number, cols: number = rows): Grid {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ block: false, letter: "" })),
  );
}

// Build a grid from strings: '#' is a black square, '.' is an empty white
// square, and any letter is a filled white square. Handy for tests.
export function gridFromStrings(rows: string[]): Grid {
  return rows.map((row) =>
    [...row].map((ch) =>
      ch === "#"
        ? { block: true, letter: "" }
        : { block: false, letter: ch === "." ? "" : ch.toUpperCase() },
    ),
  );
}

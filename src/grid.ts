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

// Return a NEW grid with the letter at (row, col) replaced. The original
// grid must not change. Use "" to clear a square.
export function withLetter(grid: Grid, row: number, col: number, letter: string): Grid {
  const newGrid = grid.map((r) => [...r]);
  newGrid[row][col] = { ...newGrid[row][col], letter };
  return newGrid;
}

// Return a NEW grid with (row, col) and its mirror square toggled.
// The mirror of (row, col) is (rows - 1 - row, cols - 1 - col).
// Both squares get the SAME new state: black if (row, col) was white,
// white if it was black. Squares that change get their letter cleared.
export function withBlockToggled(grid: Grid, row: number, col: number): Grid {
  const newGrid = grid.map((r) => [...r]);
  const rows = grid.length;
  const cols = grid[0].length;
  const mirrorRow = rows - 1 - row;
  const mirrorCol = cols - 1 - col;

  function toggle(r: number, c: number) {
    const cell = newGrid[r][c];
    if (cell.block) {
      newGrid[r][c] = { block: false, letter: "" };
    } else {
      newGrid[r][c] = { block: true, letter: "" };
    }
  }

  const makeBlock = !grid[row][col].block;
  newGrid[row][col] = { block: makeBlock, letter: "" };
  newGrid[mirrorRow][mirrorCol] = { block: makeBlock, letter: "" };
  return newGrid;
}
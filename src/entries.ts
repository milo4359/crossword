import type { Entry, Grid, Cell, Pos } from "./grid";

// Return every entry in the grid: all across entries in number order,
// then all down entries in number order.
//
// A white square starts an across entry if the square to its left is a
// black square or the edge, and the square to its right is white.
// (Same idea for down, using above and below.) A run of one square is
// not an entry. Numbers go left to right, top to bottom, and a square
// gets a number if it starts an across entry, a down entry, or both.
export function getEntries(grid: Grid): Entry[] {
  const across: Entry[] = [];
  const down: Entry[] = [];
  let number = 1;
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      const cell = grid[row][col];
      const startsAcross = (col === 0 || grid[row][col - 1].block) && col + 1 < grid[row].length && !grid[row][col + 1].block;
      const startsDown = (row === 0 || grid[row - 1][col].block) && row + 1 < grid.length && !grid[row + 1][col].block;
      if (!startsAcross && !startsDown) continue;   
      if (cell.block) continue;
      if (startsAcross) {
        // Start of an across entry
        const cells: Pos[] = [];
        let c = col;
        while (c < grid[row].length && !grid[row][c].block) {
          cells.push([row, c]);
          c++;
        }
        if (cells.length > 1) {
          across.push({ num: number, dir: "across", cells });
        }
      }
      if (startsDown) {
        // Start of a down entry
        const cells: Pos[] = [];
        let r = row;
        while (r < grid.length && !grid[r][col].block) {
          cells.push([r, col]);
          r++;
        }
        if (cells.length > 1) {
          down.push({ num: number, dir: "down", cells });
        }
      }
      if (startsAcross || startsDown) {
        // This square starts an entry, so increment the number
        number++;
      }
    }
  }
  const entries = [...across, ...down];
        
  
  return entries;
}

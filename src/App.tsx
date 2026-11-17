import { useState, type CSSProperties } from "react";
import { emptyGrid, type Dir } from "./grid";
import { getEntries } from "./entries";
import "./App.css";

type Selection = { row: number; col: number; dir: Dir };

export default function App() {
  const [grid] = useState(() => emptyGrid(15));
  const [selected, setSelected] = useState<Selection>({ row: 0, col: 0, dir: "across" });
  const entries = getEntries(grid);

  // Map each entry's first square ("row,col") to its clue number
  const numbers = new Map(
    entries.map((e) => [`${e.cells[0][0]},${e.cells[0][1]}`, e.num]),
  );

  // TODO 1: find the entry in the selected direction that contains the selected square
  const activeEntry = entries.find((e) => e.dir === selected.dir && e.cells.some(([r, c]) => r === selected.row && c === selected.col));

  // Positions of every square in the active entry, as "row,col" keys
  const activeCells = new Set(activeEntry?.cells.map(([r, c]) => `${r},${c}`));

  function handleClick(r: number, c: number) {
    // TODO 2: select the clicked square; if it's already selected, switch direction
    if (selected.row === r && selected.col === c) {
      setSelected({ row: r, col: c, dir: selected.dir === "across" ? "down" : "across" });
    } else {
      setSelected({ row: r, col: c, dir: selected.dir });
    }
  }

  return (
    <div className="grid" style={{ "--cols": grid[0].length } as CSSProperties}>
      {grid.map((row, r) =>
        row.map((cell, c) => {
          const key = `${r},${c}`;
          const num = numbers.get(key);

          let className = "cell";
          if (cell.block) className += " block";
          else if (r === selected.row && c === selected.col) className += " selected";
          else if (activeCells.has(key)) className += " in-entry";

          return (
            <div key={key} className={className} onClick={() => handleClick(r, c)}>
              {num !== undefined && <span className="num">{num}</span>}
              {cell.letter}
            </div>
          );
        }),
      )}
    </div>
  );
}
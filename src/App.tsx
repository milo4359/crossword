import { useEffect, useState, type CSSProperties, type KeyboardEvent } from "react";
import { emptyGrid, withBlockToggled, withLetter, type Dir } from "./grid";
import { getEntries } from "./entries";
import { matchWords, parseWordList, patternFor, type Word } from "./words";
import "./App.css";

type Selection = { row: number; col: number; dir: Dir };

export default function App() {
  const [grid, setGrid] = useState(() => emptyGrid(15));
  const [selected, setSelected] = useState<Selection>({ row: 0, col: 0, dir: "across" });
  const [words, setWords] = useState<Word[]>([]);
  const [wordsStatus, setWordsStatus] = useState<"loading" | "ready" | "error">("loading");
  const entries = getEntries(grid);

  // Load the word list once, when the app first appears
  useEffect(() => {
    fetch("/wordlist.txt")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((text) => {
        setWords(parseWordList(text));
        setWordsStatus("ready");
      })
      .catch(() => setWordsStatus("error"));
  }, []);

  const numbers = new Map(
    entries.map((e) => [`${e.cells[0][0]},${e.cells[0][1]}`, e.num]),
  );

  const activeEntry = entries.find(
    (e) =>
      e.dir === selected.dir &&
      e.cells.some(([r, c]) => r === selected.row && c === selected.col),
  );
  const activeCells = new Set(activeEntry?.cells.map(([r, c]) => `${r},${c}`));

  const pattern = activeEntry ? patternFor(grid, activeEntry) : "";
  const matches = activeEntry ? matchWords(words, pattern) : [];

  // Does the square at (r, c) belong to an entry going in direction dir?
  function hasEntry(r: number, c: number, dir: Dir) {
    return entries.some(
      (e) => e.dir === dir && e.cells.some(([er, ec]) => er === r && ec === c),
    );
  }

  function handleClick(r: number, c: number) {
    if (selected.row === r && selected.col === c) {
      setSelected({ ...selected, dir: selected.dir === "across" ? "down" : "across" });
    } else {
      // Keep the current direction unless this square has no entry that way
      const other = selected.dir === "across" ? "down" : "across";
      const dir = hasEntry(r, c, selected.dir) ? selected.dir : other;
      setSelected({ row: r, col: c, dir });
    }
  }

  // Select (r, c) in direction dir, unless it's off the grid or a black square.
  function moveTo(r: number, c: number, dir: Dir) {
    if (r < 0 || r >= grid.length || c < 0 || c >= grid[r].length) return;
    if (grid[r][c].block) return;
    setSelected({ row: r, col: c, dir });
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.ctrlKey || e.metaKey || e.altKey) return; // leave shortcuts like Ctrl+R alone

    const { row, col, dir } = selected;
    const [dRow, dCol] = dir === "across" ? [0, 1] : [1, 0];

    if (/^[a-zA-Z]$/.test(e.key)) {
      if (grid[row][col].block) return; // can't type into a black square
      setGrid(withLetter(grid, row, col, e.key.toUpperCase()));
      moveTo(row + dRow, col + dCol, dir);
    } else if (e.key === "Backspace") {
      if (grid[row][col].letter !== "") {
        setGrid(withLetter(grid, row, col, ""));
      } else {
        const r = row - dRow, c = col - dCol;
        if (r >= 0 && c >= 0 && !grid[r][c].block) {
          setGrid(withLetter(grid, r, c, ""));
          moveTo(r, c, dir);
        }
      }
    } else if (e.key === "ArrowRight") moveTo(row, col + 1, "across");
    else if (e.key === "ArrowLeft") moveTo(row, col - 1, "across");
    else if (e.key === "ArrowDown") moveTo(row + 1, col, "down");
    else if (e.key === "ArrowUp") moveTo(row - 1, col, "down");
    else if (e.key === ".") {
      setGrid(withBlockToggled(grid, row, col));
      moveTo(row + dRow, col + dCol, dir);
    }
    else if (e.key === " ") setSelected({ ...selected, dir: dir === "across" ? "down" : "across" });
    else return; // any other key: let the browser handle it

    e.preventDefault(); // stop arrows/space from scrolling the page
  }

  return (
    <div className="app">
      <div
        className="grid"
        style={{ "--cols": grid[0].length } as CSSProperties}
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const key = `${r},${c}`;
            const num = numbers.get(key);

            let className = "cell";
            if (cell.block) className += " block";
            if (r === selected.row && c === selected.col) className += " selected";
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

      <aside className="matches">
        {activeEntry ? (
          <>
            <h2>
              {activeEntry.num} {activeEntry.dir === "across" ? "Across" : "Down"}
            </h2>
            <div className="pattern">{pattern}</div>
            {wordsStatus === "loading" && <p>Loading word list…</p>}
            {wordsStatus === "error" && <p>Couldn't load public/wordlist.txt</p>}
            {wordsStatus === "ready" && (
              <>
                <p className="count">{matches.length.toLocaleString()} matches</p>
                <ol>
                  {matches.slice(0, 200).map((w) => (
                    <li key={w.text}>
                      <span>{w.text}</span>
                      <span className="score">{w.score}</span>
                    </li>
                  ))}
                </ol>
              </>
            )}
          </>
        ) : (
          <p>Select a square to see matching words.</p>
        )}
      </aside>
    </div>
  );
}
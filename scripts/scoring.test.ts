import { describe, expect, it } from "vitest";
import { buildSystemPrompt, chunk, parseScores, readEntries, readScoreFile } from "./scoring";

describe("scoring helpers", () => {
  it("reads entries", () => {
    expect(readEntries("cat;50\r\nA lot of;40\nCAT;30\nAB\n\n")).toEqual(["CAT", "ALOTOF"]);
  });
  it("chunks", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });
  it("parses replies, ignoring junk and unexpected words", () => {
    const reply = "Here you go:\nCAT;50\ndog ; 45\nEMU;99\nZEBRA;40\nOWL - 30\n";
    const got = parseScores(reply, ["CAT", "DOG", "EMU", "OWL"], 0, 60);
    expect([...got]).toEqual([["CAT", 50], ["DOG", 45]]);
  });
  it("reads score files", () => {
    expect([...readScoreFile("CAT;50\nDOG;45\n")]).toEqual([["CAT", 50], ["DOG", 45]]);
  });
  it("builds prompt", () => {
    const p = buildSystemPrompt("60: great", "CAT;50", 0, 60);
    expect(p).toContain("from 0 to 60"); expect(p).toContain("CAT;50");
  });
});

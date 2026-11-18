// Clean a word list before scoring. Removes entries that:
//   - have fewer than 3 letters
//   - contain a digit
//   - already have a score of DROP_AT_OR_BELOW or lower
// Entries with no score are kept. Each kept line is copied exactly as it was.
//
//   npx tsx scripts/clean-list.ts <input file> <output file>

import { readFileSync, writeFileSync } from "node:fs";

const DROP_AT_OR_BELOW = 0;

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.log("Usage: npx tsx scripts/clean-list.ts <input file> <output file>");
  process.exit(1);
}

const lines = readFileSync(input, "utf8").split(/\r?\n/).filter((line) => line.trim() !== "");
let tooShort = 0;
let hasDigit = 0;
let lowScore = 0;

const kept = lines.filter((line) => {
  const [entry, rawScore] = line.split(";");
  if (/\d/.test(entry)) {
    hasDigit++;
    return false;
  }
  if (entry.replace(/[^A-Za-z]/g, "").length < 3) {
    tooShort++;
    return false;
  }
  const score = rawScore === undefined ? NaN : Number(rawScore.trim());
  if (Number.isFinite(score) && score <= DROP_AT_OR_BELOW) {
    lowScore++;
    return false;
  }
  return true;
});

writeFileSync(output, kept.join("\n") + "\n");
console.log(`Kept ${kept.length} of ${lines.length} entries.`);
console.log(
  `Removed ${hasDigit} with digits, ${tooShort} under 3 letters, ${lowScore} scored ${DROP_AT_OR_BELOW} or below.`,
);
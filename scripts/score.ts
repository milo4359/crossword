// Score crossword entries with Claude, using the Message Batches API
// (half the normal price; results can take up to 24 hours, often much less).
//
//   npx tsx scripts/score.ts submit <entries.txt> [--limit N]   send a batch
//   npx tsx scripts/score.ts status                              check progress
//   npx tsx scripts/score.ts collect                             save the scores
//
// Needs ANTHROPIC_API_KEY set in your terminal. Never put the key in a file.

import Anthropic from "@anthropic-ai/sdk";
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import {
  buildSystemPrompt,
  chunk,
  parseScores,
  readEntries,
  readScoreFile,
} from "./scoring";

// ---------- Settings you can change ----------

const MODEL = "claude-sonnet-5-5";
const ENTRIES_PER_REQUEST = 200;
const MIN_SCORE = 0;
const MAX_SCORE = 50;

// Describe your scale. The model follows this plus your examples.
const RUBRIC = `
50: real sparkle: vivid in-the-language phrases, fresh slang, beloved names and titles
40: solid, everyday words and phrases any solver knows
30: fine but dull fill, and common crossword words (ABET, ABATE)
20: crosswordese and abbreviations you'd use only when stuck
10: green paint (an adjective plus a noun that isn't a set phrase, like ABANDONEDCAR),
    partials (phrases starting with A, AN or THE, like ABEDTIMESTORY), and specialist jargon
0-5: avoid: misspellings, non-words, letter sequences (ABCDEFG), or entries that fail the breakfast test

Most plain single words belong at 30-40. Reserve 45-50 for entries a solver would enjoy seeing.
Don't hold back the top score: roughly 1 in 30 entries deserves 50.
`;

// Files (all inside scripts/, and all except this script are in .gitignore)
const CALIBRATION_FILE = "scripts/calibration.txt"; // your own hand-scored examples
const STATE_FILE = "scripts/score-state.json"; // remembers the batch between commands
const OUTPUT_FILE = "scripts/scored.txt"; // WORD;score results, added to on each collect
const MISSING_FILE = "scripts/missing.txt"; // entries that didn't come back; rerun these

// ---------------------------------------------

type State = { batchId: string; chunks: string[][] };

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment
const [command, ...args] = process.argv.slice(2);

async function main() {
  if (command === "submit") await submit();
  else if (command === "status") await status();
  else if (command === "collect") await collect();
  else console.log("Usage: npx tsx scripts/score.ts submit <entries.txt> [--limit N] | status | collect");
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

async function submit() {
  const file = args[0];
  if (!file) throw new Error("Give the entries file: submit <entries.txt>");
  if (existsSync(STATE_FILE)) {
    throw new Error(`${STATE_FILE} already exists. Run "collect" first, or delete it to start over.`);
  }

  let entries = readEntries(readFileSync(file, "utf8"));
  const limitAt = args.indexOf("--limit");
  if (limitAt !== -1) entries = entries.slice(0, Number(args[limitAt + 1]));

  const system = buildSystemPrompt(
    RUBRIC,
    readFileSync(CALIBRATION_FILE, "utf8"),
    MIN_SCORE,
    MAX_SCORE,
  );
  const chunks = chunk(entries, ENTRIES_PER_REQUEST);

  const batch = await client.messages.batches.create({
    requests: chunks.map((words, i) => ({
      custom_id: String(i),
      params: {
        model: MODEL,
        max_tokens: words.length * 15 + 200,
        system,
        output_config: { effort: "low" }, // keep reasoning (and cost) small
        messages: [{ role: "user", content: words.join("\n") }],
      },
    })),
  });

  const state: State = { batchId: batch.id, chunks };
  writeFileSync(STATE_FILE, JSON.stringify(state));
  console.log(`Submitted ${entries.length} entries in ${chunks.length} requests.`);
  console.log(`Batch ${batch.id}. Run "status" to check on it.`);
}

async function status() {
  const { batchId } = loadState();
  const batch = await client.messages.batches.retrieve(batchId);
  const c = batch.request_counts;
  console.log(`Status: ${batch.processing_status}`);
  console.log(
    `Processing ${c.processing}, succeeded ${c.succeeded}, errored ${c.errored}, expired ${c.expired}, canceled ${c.canceled}`,
  );
}

async function collect() {
  const state = loadState();
  const batch = await client.messages.batches.retrieve(state.batchId);
  if (batch.processing_status !== "ended") {
    console.log(`Not finished yet (status: ${batch.processing_status}). Try again later.`);
    return;
  }

  const scores = existsSync(OUTPUT_FILE)
    ? readScoreFile(readFileSync(OUTPUT_FILE, "utf8"))
    : new Map<string, number>();
  const missing: string[] = [];
  let inputTokens = 0;
  let outputTokens = 0;

  for await (const item of await client.messages.batches.results(state.batchId)) {
    const words = state.chunks[Number(item.custom_id)];
    if (item.result.type !== "succeeded") {
      missing.push(...words);
      continue;
    }
    const message = item.result.message;
    inputTokens += message.usage.input_tokens;
    outputTokens += message.usage.output_tokens;

    const reply = message.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("\n");
    const got = parseScores(reply, words, MIN_SCORE, MAX_SCORE);
    for (const word of words) {
      const score = got.get(word);
      if (score === undefined) missing.push(word);
      else scores.set(word, score);
    }
  }

  const lines = [...scores].map(([word, score]) => `${word};${score}`);
  writeFileSync(OUTPUT_FILE, lines.join("\n") + "\n");
  writeFileSync(MISSING_FILE, missing.join("\n") + (missing.length ? "\n" : ""));
  renameSync(STATE_FILE, STATE_FILE + ".done"); // frees the way for the next submit

  console.log(`Saved ${scores.size} scores to ${OUTPUT_FILE}.`);
  console.log(`${missing.length} entries came back without a score; they're in ${MISSING_FILE}.`);
  console.log(`Tokens used: ${inputTokens.toLocaleString()} in, ${outputTokens.toLocaleString()} out.`);
}

function loadState(): State {
  if (!existsSync(STATE_FILE)) throw new Error('No batch in progress. Run "submit" first.');
  return JSON.parse(readFileSync(STATE_FILE, "utf8")) as State;
}

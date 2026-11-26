/**
 * Make the AI Judge Laugh — deterministic entry picker.
 *
 * Competition: u-alfasurya91-make-the-ai-judge-laugh-6ed40225
 * Task: write ONE line about office life, under 200 characters, to
 * $MAKEFUN_OUTPUT_DIR/entry.txt (fallback /output/entry.txt).
 *
 * The judge is a comedy-club headliner model that picks the bigger laugh
 * head to head, weighing, most important first:
 *   1. the line is about office life and lands as a joke;
 *   2. the observation is true to the office (meetings, email, bosses,
 *      coffee, deadlines, the printer) — the listener nods before laughing;
 *   3. the turn is surprising — a fresh angle or an unexpected last word
 *      rather than a pun or a stock line everyone has heard;
 *   4. it is tight — one line, no wasted setup, every word earning its
 *      place, reads cleanly aloud in one breath;
 *   5. it is original — a joke the judge has not heard before, not a
 *      familiar line with the nouns swapped.
 *
 * This program implements those five criteria as a deterministic scorer,
 * scores every hand-written candidate, picks the best, validates the gate
 * (single line, 1-200 characters, not only whitespace), writes it out,
 * reads it back and verifies the bytes match.
 *
 * Node 22+, standard library only. No network, no randomness, no secrets.
 * Deterministic: the same input always produces the same entry.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

// ---------------------------------------------------------------------------
// The gate, exactly as the competition states it.
// ---------------------------------------------------------------------------

const GATE_MIN_CHARS = 1;
const GATE_MAX_CHARS = 200;

interface GateResult {
  valid: boolean;
  reasons: string[];
  charCount: number;
}

/**
 * Check the sealed gate: UTF-8 text of 1 to 200 characters, not only
 * whitespace, and a single line (the task says one line; a line break
 * would make it two lines, so we reject any newline or carriage return).
 */
function checkGate(text: string): GateResult {
  const reasons: string[] = [];
  const charCount = [...text].length; // count code points, like a reader does
  if (charCount < GATE_MIN_CHARS) {
    reasons.push(`too short: ${charCount} characters (minimum ${GATE_MIN_CHARS})`);
  }
  if (charCount > GATE_MAX_CHARS) {
    reasons.push(`too long: ${charCount} characters (maximum ${GATE_MAX_CHARS})`);
  }
  if (text.trim().length === 0) {
    reasons.push("only whitespace");
  }
  if (text.includes("\n") || text.includes("\r")) {
    reasons.push("more than one line");
  }
  return { valid: reasons.length === 0, reasons, charCount };
}

// ---------------------------------------------------------------------------
// Candidates — every line hand-written in this file, one joke each.
// ---------------------------------------------------------------------------

interface Candidate {
  id: string;
  text: string;
  note: string; // what the line is trying to do, for the report
}

const CANDIDATES: Candidate[] = [
  {
    id: "shared-drive",
    text: "Our shared drive is a graveyard where good ideas go to be renamed Final_v2_FINAL.",
    note: "Concrete artifact (Final_v2_FINAL) every office worker recognises; the twist lands on the last word.",
  },
  {
    id: "slow-laptop",
    text: "I asked IT for a faster laptop; they gave me a second monitor to watch the first one load.",
    note: "A real IT non-answer; the punchline reframes the second monitor as a viewing gallery.",
  },
  {
    id: "out-of-office",
    text: "My out-of-office reply is the most honest document I have ever written at this company.",
    note: "Quiet truth: the auto-reply is the only place nobody performs. Short, clean, one breath.",
  },
  {
    id: "standup-clock",
    text: "Our standup ran so long that by the end the only thing still standing was the clock.",
    note: "Turns the meeting's own name against it; the clock standing is the surprise.",
  },
  {
    id: "printer-friday",
    text: "The printer is the quietest thing in the office until it decides to scream at 4:59 on a Friday.",
    note: "Specific time (4:59 Friday) makes it true; the printer screaming is the unexpected turn.",
  },
  {
    id: "meetings-hours",
    text: "I spent eight hours in meetings about the work I will do in the two hours I do not have.",
    note: "Arithmetic of the modern office: the day is spent talking about work, never doing it.",
  },
  {
    id: "coffee-panic",
    text: "The coffee machine broke, and for the first time ever the whole office agreed on something: panic.",
    note: "Coffee as the office's real religion; agreement itself is the punchline.",
  },
  {
    id: "sprint-circles",
    text: "We call it agile because every sprint ends with us running in circles.",
    note: "The jargon word 'sprint' turns literal; short and tight, but the target is a familiar one.",
  },
  {
    id: "intern-morale",
    text: "The intern asked where we keep the morale; we told her it left with the last round of layoffs.",
    note: "Dark, specific, and true in a way that stings; the morale 'leaving' is the turn.",
  },
  {
    id: "calendar-soul",
    text: "My calendar is so full the only free slot left is the one where my soul used to be.",
    note: "Calendar as a diary of a lost life; the soul slot is the surprise in the final clause.",
  },
  {
    id: "small-talk",
    text: "I joined the meeting five minutes late and still caught the first forty minutes of small talk.",
    note: "A number joke: five minutes late, forty minutes of nothing. Nod-then-laugh timing.",
  },
  {
    id: "email-meeting",
    text: "Every meeting could have been an email, but every email becomes a meeting, so we meet about the email.",
    note: "The loop is the joke; circular logic mirrors the circular office. Risks feeling stock.",
  },
  {
    id: "boss-door",
    text: "My boss calls it an open-door policy, but the door is only open when he wants something.",
    note: "A true observation, but 'open-door policy' is a well-worn target; originality suffers.",
  },
  {
    id: "raise-desk",
    text: "I asked my boss for a raise and he gave me a standing desk and said to consider it done.",
    note: "A pun-adjacent swap (raise / standing desk); the judge explicitly demotes puns.",
  },
  {
    id: "pizza-delivery",
    text: "The only thing delivered on time here is the pizza, and even that apologises when it arrives.",
    note: "Delivery as the office's only reliable process; the apologising pizza is the turn.",
  },
  {
    id: "agile-standup",
    text: "In our standup nobody stands up, nobody updates, and the only thing that moves is the deadline.",
    note: "Three-part list with the deadline moving as the sting; reads aloud like a drumbeat.",
  },
  {
    id: "reply-all",
    text: "Someone replied-all asking to be removed from the thread, and forty people replied-all to agree.",
    note: "The reply-all chain is a universal office disaster; the agreement itself is the twist.",
  },
  {
    id: "quick-sync",
    text: "The invite said quick sync, which is office for bring lunch, this will take the whole afternoon.",
    note: "Translates the jargon honestly; 'bring lunch' is the surprise in the tail.",
  },
];

// ---------------------------------------------------------------------------
// The scorer — the judge's published brief, turned into numbers.
// ---------------------------------------------------------------------------

// Office-domain vocabulary: the brief names meetings, email, bosses,
// coffee, deadlines, the printer. A line earns its office-ness here.
const OFFICE_WORDS = new Set([
  "meeting", "meetings", "email", "emails", "boss", "coffee", "deadline",
  "deadlines", "printer", "calendar", "standup", "sprint", "agile",
  "office", "intern", "morale", "layoffs", "it", "laptop", "monitor",
  "drive", "shared", "out-of-office", "reply", "replied-all", "thread",
  "work", "company", "pizza", "desk", "raise", "policy", "door",
  "small", "talk",
]);

// Concrete, specific detail the listener recognises instantly — the
// "nod before laughing" material. A precise time, a filename, a number.
const TRUTH_MARKERS: Array<{ pattern: RegExp; weight: number; why: string }> = [
  { pattern: /4:59 on a Friday/i, weight: 4, why: "exact time of dread" },
  { pattern: /Final_v2_FINAL/, weight: 4, why: "the filename everyone has seen" },
  { pattern: /\bfive minutes late\b/i, weight: 3, why: "a counted lateness" },
  { pattern: /\bforty minutes\b/i, weight: 3, why: "a counted waste" },
  { pattern: /\beight hours\b/i, weight: 3, why: "a counted day" },
  { pattern: /\btwo hours\b/i, weight: 2, why: "a counted remainder" },
  { pattern: /\blast round of layoffs\b/i, weight: 3, why: "a named office event" },
  { pattern: /\bsecond monitor\b/i, weight: 3, why: "a named piece of kit" },
  { pattern: /\bout-of-office\b/i, weight: 3, why: "a named office artifact" },
  { pattern: /\bshared drive\b/i, weight: 3, why: "a named office artifact" },
  { pattern: /\bstanding desk\b/i, weight: 2, why: "a named piece of kit" },
  { pattern: /replied-all/i, weight: 3, why: "the reply-all chain" },
  { pattern: /quick sync/i, weight: 2, why: "the jargon invite" },
  { pattern: /\bforty people\b/i, weight: 2, why: "a counted crowd" },
];

// Stock lines and pun-adjacent phrasing the judge has heard ten thousand
// times. Each hit costs originality, because the brief demotes "a familiar
// line with the nouns swapped" and "a pun".
const STOCK_PHRASES: Array<{ pattern: RegExp; weight: number; why: string }> = [
  { pattern: /could have been an email/i, weight: 5, why: "the most repeated office joke alive" },
  { pattern: /open-door policy/i, weight: 4, why: "stock target, heard everywhere" },
  { pattern: /running in circles/i, weight: 3, why: "stock image" },
  { pattern: /consider it done/i, weight: 2, why: "setup for a pun" },
  { pattern: /standing desk/i, weight: 2, why: "pun on 'raise' / 'standing'" },
  { pattern: /soul used to be/i, weight: 2, why: "familiar 'my soul' gag" },
];

// Words that signal the twist — the sentence turns in its final third and
// the last word is not the one the setup promised. "still" earns its place
// here: "still caught the first forty minutes" is the twist of that line,
// the lateness failing to save the listener from anything.
const TURN_WORDS = new Set([
  "until", "but", "so", "renamed", "scream", "panic", "apologises",
  "leaves", "left", "watch", "standing", "graveyard", "honest",
  "circles", "moves", "late", "arrives", "still", "lunch", "agree",
]);

// Filler words that earn nothing: they cost tightness. Note "ever" is NOT
// filler: "the first time ever" and "the most honest document I have ever
// written" are idioms where "ever" carries the emphasis, so it stays out.
const FILLER_WORDS = new Set([
  "very", "really", "just", "actually", "literally", "basically",
  "quite", "rather", "totally", "simply",
]);

interface ScoreBreakdown {
  office: number; // criterion 1 + 2: about the office, true to it
  truth: number; // criterion 2: the nod-before-laughing detail
  surprise: number; // criterion 3: the unexpected turn
  tightness: number; // criterion 4: no wasted setup
  originality: number; // criterion 5: not a heard-before line
  total: number;
  reasons: string[];
}

function wordsOf(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s\-_]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

function scoreCandidate(c: Candidate): ScoreBreakdown {
  const reasons: string[] = [];
  const words = wordsOf(c.text);
  const lower = c.text.toLowerCase();

  // 1 + 2. Office-ness: distinct office-domain words, capped so a
  // keyword-stuffed line cannot win by vocabulary alone.
  const officeHits = new Set<string>();
  for (const w of words) {
    if (OFFICE_WORDS.has(w)) officeHits.add(w);
  }
  // "it" only counts when it means the IT department, not a pronoun.
  if (/\basked IT\b/i.test(c.text)) officeHits.add("it");
  else officeHits.delete("it");
  const office = Math.min(officeHits.size, 6) * 2;
  reasons.push(`office words (${[...officeHits].join(", ") || "none"}): +${office}`);

  // 2. Truth: concrete, recognisable detail.
  let truth = 0;
  for (const marker of TRUTH_MARKERS) {
    if (marker.pattern.test(c.text)) {
      truth += marker.weight;
      reasons.push(`truth marker "${marker.why}": +${marker.weight}`);
    }
  }
  truth = Math.min(truth, 10);

  // 3. Surprise: the turn must sit late in the line — the last third —
  // because a joke's twist belongs at the end, not up front.
  const third = Math.floor(words.length / 3);
  const tail = words.slice(words.length - third);
  let surprise = 0;
  for (const w of tail) {
    if (TURN_WORDS.has(w)) {
      surprise += 2;
      reasons.push(`turn word "${w}" in the final third: +2`);
    }
  }
  // A final word that is a concrete noun or a verb of reversal scores
  // extra: the last word is what the listener carries away.
  const lastWord = words[words.length - 1];
  if (["final_v2_final", "panic", "load", "friday", "circles", "layoffs", "done", "arrives", "deadline", "clock", "agree"].includes(lastWord)) {
    surprise += 2;
    reasons.push(`last word "${lastWord}" lands the joke: +2`);
  }
  surprise = Math.min(surprise, 10);

  // 4. Tightness: the brief wants one line, one breath, no wasted setup.
  // The sweet spot is 80-150 characters: long enough to set up and turn,
  // short enough to read aloud in one breath.
  const len = [...c.text].length;
  let tightness = 0;
  if (len >= 80 && len <= 150) {
    tightness = 8;
    reasons.push(`length ${len} chars in the one-breath band: +8`);
  } else if (len < 80) {
    tightness = 5;
    reasons.push(`length ${len} chars, a little thin: +5`);
  } else {
    tightness = Math.max(0, 8 - Math.floor((len - 150) / 10));
    reasons.push(`length ${len} chars, over the one-breath band: +${tightness}`);
  }
  const fillerCount = words.filter((w) => FILLER_WORDS.has(w)).length;
  if (fillerCount > 0) {
    tightness = Math.max(0, tightness - fillerCount * 2);
    reasons.push(`filler words (${fillerCount}): -${fillerCount * 2}`);
  }
  // One sentence, one thought: a second sentence would be a second setup.
  const sentenceCount = c.text.split(/[.!?]/).filter((s) => s.trim().length > 0).length;
  if (sentenceCount > 1) {
    tightness = Math.max(0, tightness - 3);
    reasons.push(`more than one sentence (${sentenceCount}): -3`);
  }

  // 5. Originality: start at full marks, lose points for stock phrasing.
  let originality = 10;
  for (const stock of STOCK_PHRASES) {
    if (stock.pattern.test(c.text)) {
      originality -= stock.weight;
      reasons.push(`stock phrase "${stock.why}": -${stock.weight}`);
    }
  }
  originality = Math.max(0, originality);

  // The brief orders the criteria most important first, so the weights
  // follow that order: office and truth lead, surprise next, then
  // tightness, then originality.
  const total =
    office * 3 +
    truth * 3 +
    surprise * 2 +
    tightness * 1 +
    originality * 1;

  return { office, truth, surprise, tightness, originality, total, reasons };
}

// ---------------------------------------------------------------------------
// Pick, gate, write, verify.
// ---------------------------------------------------------------------------

function main(): void {
  console.log("Make the AI Judge Laugh — deterministic entry picker");
  console.log(`Candidates: ${CANDIDATES.length}`);
  console.log("");

  // Score every candidate and rank them, highest total first. Ties break
  // by the earlier criterion in the brief's order, then by shorter text
  // (the brief says length for its own sake does not count, but a tie
  // still favours the tighter line), then by candidate id for full
  // determinism.
  const scored = CANDIDATES.map((c) => ({ candidate: c, score: scoreCandidate(c) }));
  scored.sort((a, b) => {
    if (b.score.total !== a.score.total) return b.score.total - a.score.total;
    if (b.score.office !== a.score.office) return b.score.office - a.score.office;
    if (b.score.truth !== a.score.truth) return b.score.truth - a.score.truth;
    if (b.score.surprise !== a.score.surprise) return b.score.surprise - a.score.surprise;
    if (b.score.tightness !== a.score.tightness) return b.score.tightness - a.score.tightness;
    if (b.score.originality !== a.score.originality) return b.score.originality - a.score.originality;
    const lenA = [...a.candidate.text].length;
    const lenB = [...b.candidate.text].length;
    if (lenA !== lenB) return lenA - lenB;
    return a.candidate.id < b.candidate.id ? -1 : 1;
  });

  for (const [index, entry] of scored.entries()) {
    const s = entry.score;
    console.log(
      `${String(index + 1).padStart(2)}. [${entry.candidate.id}] total=${s.total} ` +
        `(office=${s.office} truth=${s.truth} surprise=${s.surprise} ` +
        `tight=${s.tightness} orig=${s.originality})`,
    );
    console.log(`    "${entry.candidate.text}"`);
    for (const reason of s.reasons) {
      console.log(`    - ${reason}`);
    }
  }
  console.log("");

  const winner = scored[0];
  console.log(`Winner: [${winner.candidate.id}] (${winner.candidate.note})`);
  console.log(`Entry: "${winner.candidate.text}"`);

  // Gate the winner exactly as the sealed scorer will.
  const gate = checkGate(winner.candidate.text);
  console.log(`Gate: ${gate.valid ? "VALID" : "INVALID"} (${gate.charCount} chars)`);
  if (!gate.valid) {
    for (const reason of gate.reasons) console.log(`  ! ${reason}`);
    throw new Error("winning entry failed the gate; refusing to write an invalid entry");
  }

  // Write it, then read it back and verify the bytes match what we wrote.
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output/entry.txt";
  const outPath = outDir.endsWith("entry.txt") ? outDir : join(outDir, "entry.txt");
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, winner.candidate.text, "utf8");
  console.log(`Wrote: ${outPath}`);

  const readBack = readFileSync(outPath, "utf8");
  if (readBack !== winner.candidate.text) {
    throw new Error("read-back mismatch: entry.txt does not match the winning entry");
  }
  const gateAfter = checkGate(readBack);
  if (!gateAfter.valid) {
    throw new Error(`read-back entry failed the gate: ${gateAfter.reasons.join("; ")}`);
  }
  console.log(`Verified: read-back matches, ${gateAfter.charCount} chars, gate VALID`);
  console.log("Done.");
}

main();

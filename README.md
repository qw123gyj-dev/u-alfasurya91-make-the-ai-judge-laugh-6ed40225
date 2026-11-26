# Make the AI Judge Laugh

[![Make the AI Judge Laugh](https://make.fun/badge/u-alfasurya91-make-the-ai-judge-laugh-6ed40225.svg)](https://make.fun/competitions/u-alfasurya91-make-the-ai-judge-laugh-6ed40225)
[![Rank](https://make.fun/badge/u-alfasurya91-make-the-ai-judge-laugh-6ed40225/qw123gyj-dev/u-alfasurya91-make-the-ai-judge-laugh-6ed40225/rank.svg)](https://make.fun/competitions/u-alfasurya91-make-the-ai-judge-laugh-6ed40225)
[![Reward](https://make.fun/badge/u-alfasurya91-make-the-ai-judge-laugh-6ed40225/qw123gyj-dev/u-alfasurya91-make-the-ai-judge-laugh-6ed40225/reward.svg)](https://make.fun/competitions/u-alfasurya91-make-the-ai-judge-laugh-6ed40225)

## What this is

An entry for the make.fun bounty **Make the AI Judge Laugh** (slug
`u-alfasurya91-make-the-ai-judge-laugh-6ed40225`, $2 prize pool). The task:
write one line about office life, under 200 characters, and a judge model
picks the funniest head to head.

`main.ts` is a deterministic entry picker. It holds 18 hand-written
candidate joke lines, scores each one against the judge's published brief
— office truth first, then the surprising turn, then tightness, then
originality — picks the best, validates the gate (single line, 1–200
characters, not only whitespace), writes it to
`$MAKEFUN_OUTPUT_DIR/entry.txt` (fallback `/output/entry.txt`), reads it
back and verifies the bytes match.

## The winning entry

> Our shared drive is a graveyard where good ideas go to be renamed Final_v2_FINAL.

81 characters, one line, one sentence. It won the internal scoring with
59 points: the `Final_v2_FINAL` filename is a detail every office worker
recognises instantly (the listener nods before laughing), the shared drive
as a graveyard is a fresh angle rather than a stock setup, the twist lands
on the very last word, and at 81 characters it reads aloud in one breath.

## How to run

Node 22 or later, standard library only — nothing to install.

```sh
node main.ts
```

To write the entry somewhere else (for local testing), set the output
directory first:

```sh
MAKEFUN_OUTPUT_DIR=/tmp/out node main.ts
cat /tmp/out/entry.txt
```

The program prints the full ranking with a score breakdown for every
candidate, the gate check for the winner, and a read-back verification.
It exits non-zero if the winning entry fails the gate or the read-back
does not match, so it never writes an invalid entry.

## Files

- `main.ts` — the entry picker (candidates, scorer, gate, writer, verifier)
- `README.md` — this file
- `LICENSE` — MIT
- `.makefun/owner.json` — payout wallet for the entry

---
description: Resume the ilramdhan.dev Apple-clean redesign as orchestrator, from docs/redesign/STATE.md
argument-hint: '[optional: phase id e.g. R3, or extra instruction]'
---

You are the **orchestrator** of the ilramdhan.dev redesign. You dispatch sub-agents; you only hand-edit small fixes.
Reply to the user in **Bahasa Indonesia**; code, docs and sub-agent prompts in English.

Extra instruction: $ARGUMENTS

1. Read, in order: `docs/redesign/STATE.md` (decisions, phase table, log tail), `docs/redesign/PLAN.md`,
   `docs/HANDOVER.md` "Binding rules", then `/Users/ilhamramadhan/WebstormProjects/mutugading.com/web/DESIGN.md`.
   Don't re-analyse what these record.
2. Decisions D1–D5 are answered in STATE.md; ask the user only for decisions the plan doesn't cover.
3. Pre-flight: confirm the skills in PLAN §5 exist in `~/.claude/skills/`; kill stray `vite`/`playwright` processes
   from earlier sessions; `git fetch` and check out `redesign/apple-clean`.
4. Take the phase named in $ARGUMENTS, else the first non-✅ row (🟡 = inspect files and finish, don't restart).
   Dispatch it with the Agent tool using the model in PLAN §6 (haiku/sonnet/opus). R2+I1 run in parallel; R5+I2 and R6a–R6d+I2 run in parallel in one
   message (disjoint files; state file ownership in each prompt). Round 2 (PLAN §8): F8+F5, F1+F2, F3+F4 in parallel the same way. Paste PLAN §5's "Every UI sub-agent prompt must say"
   block into every UI prompt. Every sub-agent prompt also says: "Before you report, stop every background shell
   you started (dev server, e2e, watchers) with TaskStop/kill; leave none running."
5. When a sub-agent hands back (or its task notification says it is waiting on background work), stop it with
   TaskStop right away, so it doesn't linger as "waiting on 1 shell". Then, after each phase: run the PLAN §5 gates yourself, look at 2 of its screenshots next to the mutugading reference,
   update STATE.md (row + log line), tell the user briefly. Keep going phase after phase until the last row (R9, then F9) or until context runs
   low (then finish the current phase, update STATE.md, tell the user to run `/lanjut-redesign`).
6. Sub-agent API failure: resume it with SendMessage stating exact on-disk progress ("finish, don't restart").
7. Push/merge only as PLAN §5 Git says; never merge to `main` without the user's explicit OK.

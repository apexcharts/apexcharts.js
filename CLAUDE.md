# Agent guidance for this repo

## Context budget (applies to every session, subagent and workflow agent)

Every turn resends the whole conversation, so anything read stays billed for the rest of the session. Keep context small; it also keeps answers sharper.

- Search before reading: grep/glob for the symbol, then Read with `offset`/`limit` around the hit. Do not read whole large modules (`src/apexcharts.js`, `src/modules/tooltip/Tooltip.js`, `src/charts/*.js`, `src/modules/highlightFilter/*`, `plans/*.md`) end to end unless the task truly needs the whole file.
- Never read `dist/`, `node_modules/`, or generated samples (`samples/vanilla-js`, `samples/react`, `samples/vue`); the source of truth is `src/` and `samples/source/`.
- Pipe noisy command output through `tail`, `head` or `grep` (test runs, builds, `git log`). Report failures, not full passing logs.
- Screenshots: crop or downscale before reading, and read only the ones you need to judge.
- Subagents return conclusions with `file:line` references, not file dumps or long excerpts.

## Workflows and multi-agent runs

- Prefer fewer, focused waves over broad fan-out. Each agent gets one narrow question or one file area, not "audit everything".
- Pass each agent the exact files or line ranges it needs; do not have every agent rediscover the codebase.
- Verify findings in a separate small pass only for the findings that need it, not by re-reading everything.
- Write intermediate results to disk (scratchpad or `plans/`) and pass paths between stages instead of pasting large results into prompts.

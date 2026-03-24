---
description: PR/push readiness checklist (git-workflow + ci-gates, SAB)
---

Follow `.cursor/rules/git-workflow-master.mdc` and **canonically** `.cursor/rules/ci-gates.mdc`.
Use the repository-specific "SAB Repository: PR / Push Readiness" checklist in the git workflow rule.

**Input:** current branch and changed files (or ask the user for `git status` / PR summary).

**Output:** itemized checklist — done / risk / next action:

- `npm run check:branch`, `npm run ci:check`;
- `docs/process/traceability-matrix-log.md` when changes hit zones from `scripts/check-traceability-matrix-update.mjs`;
- when needed, set `CI_MERGE_RANGE` and run `node ./scripts/check-traceability-matrix-update.mjs`.

Do not replace command execution with assumptions — provide checklist status and risks.

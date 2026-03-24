---
description: Markdown documentation review by technical-writer role (SAB)
---

Follow `.cursor/rules/technical-writer.mdc`.
Use the repository-specific "SAB Repository: Documentation Review" checklist in that file.

**Goal:** substantive review of a document — active editor file or user-provided path(s).

**Steps:**

1. Identify target file. If unclear, ask for path in `docs/**/*.md` (or `README.md` / `CONTRIBUTING.md`).
2. Read the document and run the `technical-writer` checklist (structure, navigation/TOC, testability, links, consistency with canonical artifacts).
3. For `docs/specs/**/*.md`, verify compliance with `.cursor/rules/docs.mdc`.
4. Return: short summary; findings by severity (blocker / important / nice-to-have); concrete edit proposals (ideally ready replacement snippets).

Do not duplicate what CI already guarantees (`npm run ci:check`) unless you see an explicit markdown/link issue in session context.

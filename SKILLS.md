# Project Skills Baseline

This file defines which globally installed skills are baseline for work in `sab-win-26-mine-parking`, and when to use them.

## Context

This repository is focused on:

- systems analysis and documentation (`docs/**`);
- requirements and traceability (FR/NFR/ADR/protocols);
- static wireframe (`ui/**`);
- agent rules and commands (`.cursor/rules`, `.cursor/commands`, `.cursor/agents`).

## Required Skills (Core)

- `skill-creator` (`~/.agents/skills/skill-creator`)
  - Use for creating/auditing/refactoring skills and `SKILL.md`.
- `create-rule` (`~/.cursor/skills-cursor/create-rule`)
  - Use for creating/updating `.cursor/rules/*.mdc`.
- `create-skill` (`~/.cursor/skills-cursor/create-skill`)
  - Use for creating project/user skills.
- `create-subagent` (`~/.cursor/skills-cursor/create-subagent`)
  - Use for creating/updating `.cursor/agents/*.md`.
- `docs-audit` (`~/.agents/skills/docs-audit`)
  - Use to detect documentation drift and mismatches across artifacts.
- `docs-writer` (`~/.agents/skills/docs-writer`)
  - Use for writing/restructuring markdown documentation.
- `requirements-engineering` (`~/.agents/skills/requirements-engineering`)
  - Use for formalizing requirements (EARS, acceptance criteria).
- `requirement-review` (`~/.agents/skills/requirement-review`)
  - Use for quality review of requirements and conflict/gap detection.
- `spec-flow-analyzer` (`~/.agents/skills/spec-flow-analyzer`)
  - Use for user-flow and edge-case analysis of specifications.
- `terminology-work` (`~/.agents/skills/terminology-work`)
  - Use for terminology standardization and glossary alignment.
- `openapi-glossary` (`~/.agents/skills/openapi-glossary`)
  - Use when API/OpenAPI terminology appears in docs.
- `make-repo-contribution` (`~/.agents/skills/make-repo-contribution`)
  - Use before commit/PR/push workflow actions.
- `git-workflow` (`~/.agents/skills/git-workflow`)
  - Use for branch/commit/PR workflow guidance.

## Optional Skills (By Task)

- `markdown-mermaid-writing`
  - For diagrams and structured visual explanations when they add clarity.
- `docs-write`
  - Alternative to `docs-writer` when a more conversational style is needed.
- `markitdown`, `ocr-image-to-markdown`
  - For PDF/DOCX/image to Markdown conversion tasks.
- `ai-prompt-engineering-safety-review`, `prompt-optimize`, `prompt-engineering-patterns`
  - For prompt design and prompt quality/safety review tasks.

## Excluded by Default (Not Project-Relevant)

The following global skills are not used by default in this repository:

- domain-specific skills outside repository scope (for example `modbus-protocol`, `engineering`, `data-scientist`, `senior-data-scientist`, `emergency-rescue`, and similar).

Enable them only on explicit user request or when directly relevant.

## Selection Rules

1. Start with project rules from `.cursor/rules/**` and commands from `.cursor/commands/**`.
2. Select the minimum necessary skill set per task to reduce context noise.
3. For requirements/spec tasks, prioritize:
   `requirements-engineering` -> `spec-flow-analyzer` -> `requirement-review`.
4. For agent-instruction tasks, prioritize:
   `skill-creator` + (`create-rule` / `create-skill` / `create-subagent`).
5. For contribution/git tasks, prioritize:
   `make-repo-contribution` + `git-workflow` + local CI policy (`.cursor/rules/ci-gates.mdc`).

## Maintenance

Update this file when:

- new global skills are installed;
- repository task profile changes;
- recurring conflicts/duplication between skills are discovered.

# Docs Style Guide

This guide defines naming and structure conventions for the `docs/` tree.

## Оглавление

1. [Naming Policy](#naming-policy)
2. [Language Policy](#language-policy)
3. [Requirements File Conventions](#requirements-file-conventions)
4. [Structure Policy](#structure-policy)
5. [Navigation Policy](#navigation-policy)
6. [Related Documents Policy](#related-documents-policy)
7. [Link Stability](#link-stability)

## Naming Policy

- Prefer one style for new file names: lowercase `kebab-case`.
- Avoid spaces in new file names.
- Prefer ASCII names for new technical/process files.
- Existing legacy names may remain until a dedicated migration PR.
- Use `readme.md` for section indexes under `docs/*` and `README.md` only at repository root.
- For protocol/source files, prefer `<type>-<source>-<yyyy-mm-dd>-vNN.<ext>`.
- In UI naming, prefer role-explicit names (`client`, `admin`, `guard`) instead of ambiguous aliases.

## Language Policy

- Content language can be Russian or English depending on audience.
- For new process and technical index files, prefer English names for stable links.

## Requirements File Conventions

- Keep requirement IDs inside content (`FR-*`, `NFR-*`, `CONSTR-*`).
- Preserve document structure when updating `docs/specs/*`.
- Do not silently remove requirements; mark obsolete/replaced with clear note.

## Structure Policy

- Each first-level section in `docs/` should have a `readme.md`.
- Keep canonical documents separate from helper/process materials.
- Scripts supporting documentation should be clearly labeled in section READMEs.

## Navigation Policy

- In documents where the content includes 3+ second-level sections (i.e., `## ...` headings) after the intro, include a clickable table of contents near the top as `## Оглавление` (or `## Table of Contents`).
- The `## Оглавление` section must contain Markdown links to each relevant `## ...` section (e.g., `- [Naming Policy](#naming-policy)`), so readers can jump directly to the section.
- Link anchors must follow GitHub-style slugification of the target heading text (the same logic is used by `scripts/check-markdown-links.mjs`).
- When headings are renamed or reorganized, update the table of contents accordingly in the same change.

## Related Documents Policy

- If a document depends on or references specific canonical artifacts/specs/protocols (beyond one-off mentions), add a short `## Связанные документы` (or `### Связанные документы`) section with relative links to those sources.
- Prefer linking to canonical files under `docs/artifacts/`, `docs/specs/`, `docs/architecture/` and `docs/protocols/`.

## Link Stability

- Use relative links.
- If files are renamed, update links in the same PR.
- Prefer incremental migration over bulk renames.

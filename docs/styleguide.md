# Docs Style Guide

This guide defines naming and structure conventions for the `docs/` tree.

## Оглавление

1. [Naming Policy](#naming-policy)
2. [Language Policy](#language-policy)
3. [Requirements File Conventions](#requirements-file-conventions)
4. [Structure Policy](#structure-policy)
5. [Navigation Policy](#navigation-policy)
6. [Related Documents Policy](#related-documents-policy)
7. [Link Text Policy](#link-text-policy)
8. [Link Stability](#link-stability)

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
- Prefer linking to canonical files under `docs/artifacts/`, `docs/specs/`, `docs/architecture/` and `docs/interviews/`.

## Link Text Policy

- Link text must describe the artifact, not repeat the path or file name.
- Do not use link labels like `readme.md`, `../artifact.md`, `docs/specs/readme.md`, `slides/` or other path-like text when a human-readable title can be given.
- Prefer one of these patterns for link text:
  - official artifact title: `Карточка проекта`, `Impact Map`, `ADR-003: Модульный монолит`;
  - section/index title: `Индекс архитектуры`, `Индекс интервью`, `Индекс слайдов Demo 2`;
  - short descriptive label if there is no stable title yet: `Шаблон артефакта из изображения`, `Команда review-doc`, `Гайд по относительным ссылкам`.
- In `Связанные документы` sections, prefer the format `- [Название артефакта](artifacts/context-diagram.md) — краткое пояснение.`
- The same rule applies to inline links in regular paragraphs, not only to `Связанные документы`.
- Exceptions are allowed only for literal examples inside templates, where a path is shown as a sample value and is not presented as the final wording of a real document.

Good:

- [История развития проекта](process/project-journey.md)
- [Индекс спецификаций](specs/readme.md)
- [Шаблон артефакта из изображения](process/templates/artifact-from-image-template.md)

Bad:

- `docs/process/project-journey.md` как текст ссылки
- `readme.md` как текст ссылки
- `slides/` как текст ссылки

## Link Stability

- Use relative links.
- If files are renamed, update links in the same PR.
- Prefer incremental migration over bulk renames.

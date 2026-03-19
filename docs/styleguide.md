# Docs Style Guide

This guide defines naming and structure conventions for the `docs/` tree.

## Naming Policy

- Prefer one style for new file names: lowercase `kebab-case`.
- Avoid spaces in new file names.
- Prefer ASCII names for new technical/process files.
- Existing legacy names may remain until a dedicated migration PR.
- Use `readme.md` for section indexes under `docs/*` and `README.md` only at repository root.
- For transcript/protocol source files, prefer `<type>-<source>-<yyyy-mm-dd>-vNN.<ext>`.
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

## Link Stability

- Use relative links.
- If files are renamed, update links in the same PR.
- Prefer incremental migration over bulk renames.

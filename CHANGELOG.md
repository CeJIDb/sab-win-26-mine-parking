# Changelog

All notable changes to this project are documented in this file.

The format is based on Keep a Changelog.

## [Unreleased]

### Added

- repository governance baseline: CONTRIBUTING, LICENSE, CODEOWNERS, CI workflow, issue/PR templates
- git consistency files: `.editorconfig` and `.gitattributes`
- markdown quality checks and smoke test scripts for CI
- process docs for contributors in `docs/process/*` (first contribution path, DoR/DoD, traceability, release checklist)
- commit governance files: `commitlint.config.cjs`, Husky hooks, branch/changelog policy scripts
- additional CI workflows for commitlint, PR title, and release tags
- live traceability matrix file `docs/process/traceability-matrix-log.md`
- documentation IA files: `docs/readme.md`, `docs/styleguide.md`, and section indexes for `artifacts`, `specs`, `architecture`, `demo-days`
- infosec artifacts: `docs/artifacts/infosec/*` (контекст угроз, анализ уязвимостей и контрмер)

### Changed

- `readme.md` with contribution, quality-gates, and release policy sections
- `CONTRIBUTING.md` with DoR/DoD, traceability, and policy checks
- `.github/workflows/ci.yml` with policy checks (branch naming and changelog guard)
- `.github/CODEOWNERS` with multi-owner mapping placeholders for key domains
- markdown quality checks hardened for contributor/process docs (`scripts/check-markdown.mjs`)
- changelog exception policy clarified for CI/process-only updates
- traceability matrix workflow and related docs updated (`docs/process/traceability-matrix-*`, `docs/process/templates/*`)
- added/updated traceability guard scripts for CI (`scripts/check-traceability-matrix-update.mjs` and linked checks)
- updated repository requirements documentation structure (constraints + NFR docs) and contributor-facing protocol/transcript/readme files
- infosec analysis artifact formalized: `docs/artifacts/infosec/infosec-analyze-parking.md` expanded (threats, vulnerabilities, risks, glossary)
- consolidated links after infosec artifact merge and removed duplicated auth/data docs references
- regenerated client wireframe pages in `ui/client/*` after template build

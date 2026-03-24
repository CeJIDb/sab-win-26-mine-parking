# First Contribution Path

## Оглавление

1. [Goal](#goal)
2. [Steps](#steps)
3. [Done Criteria](#done-criteria)

## Goal

## Связанные документы

- [docs/process/pr-dor-dod.md](pr-dor-dod.md)
- [docs/process/traceability-matrix.md](traceability-matrix.md)

Help a new contributor make a safe and traceable first change.

## Steps

1. Read `CONTRIBUTING.md`.
2. Identify the source of truth for your change (`docs/artifacts/*`, `docs/protocols/*`, `docs/specs/*`, `docs/architecture/*`).
3. Create a branch using policy: `feature/*`, `docs/*`, `chore/*`, `hotfix/*`.
4. Implement a minimal and focused change.
5. Update traceability records in `docs/process/traceability-matrix.md`.
6. Run:
   ```bash
   npm ci
   npm run ci:check
   ```
7. Open a PR and complete DoR/DoD from `docs/process/pr-dor-dod.md`.

## Done Criteria

The change is verifiable, linked to requirements, and ready for review.

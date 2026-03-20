# Release Checklist

## Оглавление

1. [Preparation](#preparation)
2. [Documentation and Traceability](#documentation-and-traceability)
3. [Release](#release)
4. [Post-release](#post-release)

## Preparation

- [ ] All target PRs are merged.
- [ ] CI is green.
- [ ] `CHANGELOG.md` is up to date.

## Documentation and Traceability

- [ ] Traceability entries are complete for release scope.
- [ ] `readme.md` and `CONTRIBUTING.md` are updated if process changed.
- [ ] No unresolved requirement gaps remain.

## Release

- [ ] `Unreleased` entries moved to version section in `CHANGELOG.md`.
- [ ] Git tag `vX.Y.Z` created.
- [ ] Release notes published.

## Post-release

- [ ] Smoke check completed.
- [ ] Follow-up issues created when needed.

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
- `docs/architecture`: ADR-003 (канон `adr-003-modular-monolith-c.md`, черновик G, учебная версия C), DDD bounded contexts (`ddd-bounded-contexts.md`, учебные `ddd-bounded-contexts-study.md`, `ddd-pseudocode-study.md`); обновлён индекс `readme.md`

### Changed

- `docs/architecture/ddd-bounded-contexts-study.md`: добавлены TOC, ссылки на pseudocode-файл и ADR-003
- `docs/architecture/ddd-pseudocode-study.md`: добавлены TOC, убраны числовые префиксы из `##`-заголовков, добавлено пояснение про английские имена контекстов и комментарии для упрощённых мест (plate=null, deny без дисплея)
- `docs/architecture/adr-003-modular-monolith-c-study.md`: порядок TOC приведён в соответствие с реальным порядком разделов;
  имена атрибутов (`тариф.ставка` вместо `тариф.ставкаЗаЧас`, `Клиент.льготныйДокументИд`, `сессия.статус = завершена`), навигация ТС→Клиент в `Доступ.оценить()`;
  привязка `Платёж` к `Бронированию` (не к `Сессии`); проверка BLACKLISTED, ветка «ГРЗ не распознан» в LPR, журнал въезда-выезда, `Бронирование.завершить()` при выезде; адаптер `Платёжный Терминал КПП`

- `docs/artifacts/infosec/infosec-analyze-parking.md`: выравнивание строк таблицы «Уязвимости» с разделами «Аутентификация» и «Чувствительные данные» (брутфорс, сессии/TLS как риск несоответствия реализации); добавлен подраздел «Соответствие карточке проекта» (63/54/149-ФЗ, реестр ПО, идентификация клиентов)
- корневой `README.md`, `CONTRIBUTING.md`, индексы `docs/*/readme.md` и `scripts/docs/readme.md`: перевод на русский, выравнивание ссылок с GitHub и CI (`check:branch`), актуализация состава (в т.ч. ссылка на `infosec-analyze-parking-study.md`)
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
- обновлён артефакт `docs/artifacts/infosec/infosec-analyze-parking-study.md` (анализ парковочного исследования)
- wireframe HTML: явные правила LF в `.gitattributes` (`ui/**/*.html`, `*.njk`) и запись с нормализацией LF в `scripts/build-templates.mjs`, чтобы не было ложных `git diff` после сборки на Windows/WSL

# Changelog

All notable changes to this project are documented in this file.

The format is based on Keep a Changelog.

## [Unreleased]

### Added

- `docs/architecture/c4/c4-l1-system-context.md`: C4 Level 1 в текстовом виде по методике примера «Телемед» — пользователи `[Person]`, внешние системы с разделением периметра (как серый/фиолетовый в легенде), легенда, Mermaid `C4Context`; согласовано с `c4-parking-platform.md`
- `docs/architecture/c4/c4-l2-container.md`: C4 Level 2 (Container) в формате референса «Телемед» — граница системы, контейнеры, внешние системы, Mermaid `C4Container`; индекс в `docs/architecture/readme.md`
- `scripts/atomic-commit.mjs` и npm-скрипты `commit:atomic` / `commit:atomic:yes` — группировка изменений в атомарные conventional-коммиты по зонам репозитория; описание в `CONTRIBUTING.md`
- просмотр C4/Mermaid: `scripts/build-c4-preview-html.mjs`, npm-команда `docs:c4-preview`, артефакт `docs/architecture/c4/c4-parking-platform-preview.html` (Mermaid 11 с CDN); рекомендация расширения `bierner.markdown-mermaid`, настройка `markdown.mermaid.enabled` в `.vscode/settings.json`; раздел «Как посмотреть диаграммы» в `docs/architecture/c4/c4-parking-platform.md`, ссылки в `docs/architecture/c4/c4-external-context.md` и `docs/architecture/readme.md`
- `docs/architecture/c4/c4-parking-platform.md`: C4-диаграммы платформы парковки — Level 1 (System Context), Level 2 (Container), Level 3 (Component); Mermaid + текстовые описания акторов, внешних систем и модулей; ASCII-схемы ключевых сценариев (въезд, завершение сессии); ссылки на ADR-001–003, DDD bounded contexts и чартер
- `docs/architecture/c4/c4-external-context.md` и каталог `docs/architecture/c4/reference-readings/`: индекс C4 model (каноническая ссылка на [c4model.com](https://c4model.com/)), локальные копии материалов по C4+PlantUML, ADD и краткая заметка buildin.ai; файлы в kebab-case; запись в `docs/architecture/readme.md`
- `docs/architecture/ddd/event-storming-external-context.md` и каталог `docs/architecture/ddd/reference-readings/`: индекс и переименованные в kebab-case локальные копии материалов по DDD, Event Storming и DDD+ES (Хабр, buildin.ai); запись в индексе `docs/architecture/readme.md`
- Cursor: правила ревью с `globs` для systems-analyst, glossary-terms-maintainer, software-architect, security-engineer, ux/accessibility (`ui/`), reality-checker (`docs/`), git-workflow-master; слэш-команды `review-requirements`, `review-architecture`, `review-security`, `review-wireframe`, `review-reality`, `review-pr-readiness`, `review-sources-sync`, `review-glossary`; сводка в `docs/process/cursor-agent-commands.md`
- Cursor: правило `technical-writer` привязано к `docs/**/*.md` и корневым `README.md` / `CONTRIBUTING.md` через `globs`; слэш-команда Review Doc (`.cursor/commands/review-doc.md`) для явного ревью документации
- repository governance baseline: CONTRIBUTING, LICENSE, CODEOWNERS, CI workflow, issue/PR templates
- git consistency files: `.editorconfig` and `.gitattributes`
- markdown quality checks and smoke test scripts for CI
- process docs for contributors in `docs/process/*` (first contribution path, DoR/DoD, traceability, release checklist)
- commit governance files: `commitlint.config.cjs`, Husky hooks, branch/changelog policy scripts
- additional CI workflows for commitlint, PR title, and release tags
- live traceability matrix file `docs/process/traceability-matrix-log.md`
- documentation IA files: `docs/readme.md`, `docs/styleguide.md`, and section indexes for `artifacts`, `specs`, `architecture`, `demo-days`
- infosec artifacts: `docs/artifacts/infosec/*` (контекст угроз, анализ уязвимостей и контрмер)
- `docs/architecture`: ADR в `adr/` (`adr/adr-003-modular-monolith.md` и др.), DDD bounded contexts (`ddd/ddd-bounded-contexts.md`, учебные `ddd/ddd-bounded-contexts-study.md`, `ddd/ddd-pseudocode-study.md`); обновлён индекс `readme.md`

### Changed

- repository docs/process/scripts/Cursor rules updated after removing transcript materials: deleted obsolete references, updated checks/templates/agent instructions, and switched the remaining protocol docs to anonymized participant names via GitHub handles/role aliases
- `docs/artifacts/infosec/infosec-analyze-parking-study.md`: уточнены активы и категории источников угроз (включая разработчиков, внешние системы и технические/природные факторы), разделены данные аутентификации и согласий на отдельные строки защиты, выровнены формулировки в ролевой модели и таблице цепочек угроз, нормализована структура таблицы мер защиты
- C4: в `c4-l1-system-context.md` и `c4-parking-platform.md` унифицированы формулировки персон и внешних систем
  (служебный веб-интерфейс, платёжные терминалы объекта, сервис уведомлений, информационные табло);
  на L2 в `c4-parking-platform.md` три служебных SPA сведены в один контейнер с ролевым доступом;
  обновлены подписи рёбер Mermaid L1 и пересобран `c4-parking-platform-preview.html`
- C4 Level 1: внешний узел «информационные табло» уточнён как **инфо-дисплеи и табло (объект)** — несколько физических устройств с разным назначением, одна граница интеграции на L1; пояснение в `docs/architecture/c4/c4-l1-system-context.md`, таблица и Mermaid в `docs/architecture/c4/c4-parking-platform.md`
- DDD и C4 — ревью техписателем и архитектором: исправлены scope ACID-транзакций в ASCII-сценариях
  (чтение статусов вынесено вне транзакции въезда; `проверитьВыезд()` включён в ACID блока выезда);
  добавлен `PAY --> NOT` в контекстную карту DDD; удалён ложный `TAR --> PAY`
  (сумма передаётся через `Сервис приложения` как Value Object, прямая зависимость отсутствует);
  добавлен `PAY --> NOT` в пояснительную таблицу рёбер; добавлено примечание о медиации `Договор → Тариф`;
  добавлены `Rel(employee, ...)` для `Сотрудника` в C4 Level 3;
  исправлен `"LPR/СКУД Adapter"` → `"Адаптер ЛПР/СКУД"` в Level 3 Mermaid;
  секция `## Текстовое описание` переименована в `## Ключевые сценарии`;
  счётчик «два правила» исправлен на «три» в `ddd-bounded-contexts-study.md`;
  описание `Уведомление` в таблице уточнено (генерирует + ставит в очередь);
  добавлены разделы `## Связанные документы` в `ddd-pseudocode-study.md` и `ddd-bounded-contexts-study.md`;
  ветка ошибки `НЕТ_ДОСТУПНЫХ_МЕСТ` добавлена в псевдокод `создатьАвтоБронь`
- `docs/architecture/c4/c4-l1-context-telemed-format.md` переименован в `c4-l1-system-context.md`; обновлены ссылки в `docs/architecture/readme.md` и `docs/process/traceability-matrix-log.md`

- DDD-файлы (`ddd-bounded-contexts.md`, `ddd-bounded-contexts-study.md`, `ddd-pseudocode-study.md`):
  все имена bounded contexts переведены на русский ubiquitous language
  (`Доступ`, `Бронирование`, `Сессия`, `Тариф`, `Платёж`, `Договор`,
  `Клиент`, `Площадка`, `Уведомление`, `Обращение`, `Сотрудник`, `Отчёт`);
  псевдокод переведён (`Сервис приложения`, `АдаптерЛПРСКУД`, `ИсходящиеСообщения`);
  добавлено пропущенное ребро `Договор → Тариф` в контекстную карту
- `docs/architecture/c4/c4-parking-platform.md`: Level 3 Component —
  имена компонентов, подписи связей и ASCII-схемы переведены на русский;
  Level 2 — «LPR/СКУД Adapter» → «Адаптер ЛПР/СКУД»,
  «Notification Worker» → «Агент доставки уведомлений»;
  HTML-превью пересобрано (`npm run docs:c4-preview`)

- Husky: `pre-commit` и `pre-push` вызывают `scripts/git-workflow-agent-reminder.mjs` (напоминание о git-workflow-master при крупном диффе; субагент Cursor из хуков не запускается); обновлены `git-workflow-master`, `CONTRIBUTING.md`
- `CONTRIBUTING.md`, `scripts/atomic-commit.mjs`: сообщения атомарных коммитов на русском (после `:`); уточнено, что стиль совпадает с `git-workflow-master`, а скрипт агента не вызывает
- ADR (`adr-001` … `adr-003`): каталог `docs/architecture/adr/`, индекс `adr/readme.md`; обновлены ссылки в `docs/readme.md`, `ddd/*`, `specs/nonfunctional-requirements/nfr-external-quality.md`, `repo-context-compressed.md`, `artifacts/es-to-be/es-tobe-sd-parking-main.md`, `CHANGELOG.md`, `traceability-matrix-log.md`
- ADR-003: единый файл `docs/architecture/adr/adr-003-modular-monolith.md` (переименован из `adr-003-modular-monolith-c.md`); удалены `adr-003-modular-monolith-c-study.md` и `adr-003-modular-monolith-vs-microservices-g.md`; обновлены `readme.md`, `ddd/ddd-bounded-contexts*.md`, `traceability-matrix-log.md`
- `docs/architecture/ddd-bounded-contexts*.md`, `ddd-pseudocode-study.md`: файлы перенесены в `docs/architecture/ddd/`; обновлены ссылки в `readme.md`, `event-storming-external-context.md` и внутри перенесённых документов (ADR и `docs/artifacts/`)
- `docs/architecture/ddd/ddd-bounded-contexts-study.md`: добавлены TOC, ссылки на pseudocode-файл и ADR-003
- `docs/architecture/ddd/ddd-pseudocode-study.md`: добавлены TOC, убраны числовые префиксы из `##`-заголовков, добавлено пояснение про английские имена контекстов и комментарии для упрощённых мест (plate=null, deny без дисплея)
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

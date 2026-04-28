# План: перенести Claude-tooling из smart-home в parking

**Дата**: 2026-04-28
**Задача**: установить в parking хуки Claude Code, allowlist permissions, команды, и проверки имён файлов из репозитория `../smart-home`
**Время**: 2 часа

## Зачем именно так

В parking уже описаны правила в [CLAUDE.md](../CLAUDE.md) (правила 1-6: «коммить только свои изменения», «не пуши в main», «kebab-case латиницей», «после плана — ретро»), но они держатся только на текстовом договоре. В smart-home эти же правила закрыты автоматическими хуками Claude Code — переносим их сюда, чтобы агент физически не мог нарушить договор. Параллельно затаскиваем небольшие QoL-улучшения: автоформат после Write, валидацию плана сразу после правки, allowlist для часто запускаемых npm-скриптов.

Отказались:

- `bulletproof` skill — 12-этапный workflow для feature-разработки. У parking docs-first проект, 80% задач — правка markdown, такой пайплайн избыточен.
- `flow-inspector` агент и `block-flow-edit` хук — Node-RED-специфичные.
- Перетереть `atomic-commit.mjs`, `check-branch-name.mjs`, `validate-plans.mjs` smart-home-версиями — у parking свои типы веток (`docs/`, `chore/`), свои buckets для атомарных коммитов и свой формат планов.

## Цель за 2 часа

- В `.claude/settings.json` настроены PreToolUse / PostToolUse / Stop / Notification хуки.
- Хуки физически блокируют `git add -A`, push в main, запись секретов, коммит с битым планом.
- Авто-prettier на Write/Edit, авто-валидация плана после правки.
- В parking появились `/plan` команда и `lint:file-names` проверка.
- `npm run ci:check` зелёный, ветка готова к PR.

## Scope

**Входит:**

- `scripts/claude-hooks/` — 8 файлов (5 PreToolUse + format-on-write + remind-atomic-commit + play-sound).
- `.claude/settings.json` — добавить `permissions.allow` и блок `hooks`.
- `.claude/settings.local.json.example` — добавить пример звуков для Windows/WSL.
- `.claude/commands/plan.md` — слэш-команда `/plan <slug>`.
- `.claude/rules/ast-index.md` — правило поиска по коду.
- `scripts/check-file-names.mjs` + `scripts/ci-common.mjs` — проверка латиницы в именах.
- `package.json` — `lint:file-names`, `commit:atomic:dry-run` скрипты, добавить `lint:file-names` в `ci:check`.

**Не входит:**

- `bulletproof`, `skill-creator`, `install-skill`, `plan-validator` — уже есть в `.claude/skills/` parking.
- `flow-inspector`, `/handoff`, `block-flow-edit` — Node-RED-специфика.
- Подмена `atomic-commit.mjs`, `validate-plans.mjs`, `check-branch-name.mjs` — у parking свои.
- Установка бинаря `ast-index` — правило добавляем как опцию, использовать только если бинарь стоит.

## Тайминг

| Минуты  | Блок                                                             | Что делаем                                                                             |
| ------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 0–10    | Подготовка                                                       | Ветка `chore/claude-tooling-from-smart-home`, план, todo                               |
| 10–40   | Фаза 1 — блокирующие хуки + permissions.allow                    | 5 хуков копируем + дописываем `.claude/settings.json`                                  |
| 40–70   | Фаза 2 — format-on-write, remind-atomic-commit, /plan, filenames | format-on-write, remind-atomic-commit, /plan команда, check-file-names + ci-common     |
| 70–90   | Фаза 3 — play-sound, settings.local.example, ast-index, dry-run  | play-sound.sh, обновить пример local-settings, ast-index rule, `commit:atomic:dry-run` |
| 90–110  | Локальная проверка                                               | `npm run ci:check`, проверить хуки прогоном фейкового `git add -A`                     |
| 110–120 | Атомарные коммиты + Итог + ретро                                 | `npm run commit:atomic`, заполнить `## Итог`, ретро в `docs/process/retro/`            |

## Правила коммитов и веток

Ветка: `chore/claude-tooling-from-smart-home`.

Атомарные коммиты по фазам через `npm run commit:atomic`:

- `chore(claude): добавить блокирующие PreToolUse хуки`
- `chore(claude): добавить permissions.allow в settings.json`
- `chore(claude): добавить format-on-write и remind-atomic-commit хуки`
- `chore(claude): добавить слэш-команду /plan`
- `chore(scripts): добавить проверку имён файлов на латиницу`
- `chore(claude): добавить play-sound и обновить settings.local.example`
- `chore(claude): добавить правило ast-index`
- `chore(npm): добавить commit:atomic:dry-run скрипт`

## Определение «готово»

- [x] Все 8 хуков лежат в `scripts/claude-hooks/` и являются исполняемыми (`chmod +x`).
- [x] `.claude/settings.json` содержит `permissions.allow` и секции `hooks` для PreToolUse/PostToolUse/Stop/Notification/PermissionRequest.
- [x] `.claude/commands/plan.md` создан, описание адаптировано под parking (`plans/README.md`, без `/handoff`).
- [x] `.claude/rules/ast-index.md` создан.
- [x] `scripts/check-file-names.mjs` создан, `npm run lint:file-names` проходит. (`ci-common.mjs` не нужен — скрипт сделан самодостаточным).
- [x] `lint:file-names` включен в `ci:check`, `commit:atomic:dry-run` и `commit:atomic:sh:dry-run` добавлены.
- [x] `npm run ci:check` зеленый.
- [x] Хук `block-unsafe-git-add` блокирует `git add -A` (smoke-тест успешен — даже фейковый запуск через `echo` был перехвачен).
- [x] Все фазы плана отмечены `[x]`, секция `## Итог` заполнена.
- [x] Ретро в `docs/process/retro/2026-04-28-claude-tooling-from-smart-home.md` написана.

## Фазы и статус

- [x] Фаза 1. Блокирующие PreToolUse хуки + `permissions.allow`.
- [x] Фаза 2. PostToolUse/Stop хуки + `/plan` + `check-file-names`.
- [x] Фаза 3. play-sound, settings.local.example, ast-index rule, `commit:atomic:dry-run`.
- [x] Фаза 4. Локальная проверка `ci:check` + smoke хуков.
- [x] Фаза 5. Атомарные коммиты + ретро.

## Риски / откаты

- **Риск:** хуки используют `process.env.CLAUDE_PROJECT_DIR`, в старых версиях Claude Code такой переменной нет. _Митигация:_ хуки делают `|| process.cwd()`.
- **Риск:** `format-on-write` запускает `npx prettier` синхронно — на больших файлах подтормозит. _Митигация:_ smart-home живёт с этим месяцами, ставим как есть.
- **Риск:** `block-secret-write` ругается на `*.env.example` или `secrets.yaml.example`. _Митигация:_ паттерны из smart-home проверены, в parking шаблоны лежат под другими именами (`settings.local.json.example`).
- **Откат:** все изменения — добавление файлов и расширение настроек. Откат через `git revert` коммита.

## Итог

Реализован целиком за один сеанс. Все 5 фаз закрыты, `npm run ci:check` зеленый, все хуки активны.

Что установлено в parking:

- **8 хуков** в `scripts/claude-hooks/`: 3 блокирующих PreToolUse(Bash) + 1 PreToolUse(Edit/Write) + 2 валидатора планов + format-on-write + play-sound + remind-atomic-commit.
- **`.claude/settings.json`**: `permissions.allow` (16 рутинных npm-команд) + 5 секций `hooks` (PreToolUse, PostToolUse, Stop, Notification, PermissionRequest).
- **`.claude/commands/plan.md`** — слэш-команда `/plan <slug>` адаптирована под parking.
- **`.claude/rules/ast-index.md`** — опциональное правило поиска по коду.
- **`scripts/check-file-names.mjs`** + `npm run lint:file-names` — автоматическая проверка правила 5 CLAUDE.md.
- **`package.json`**: `lint:file-names` включен в `ci:check`, добавлены `commit:atomic:dry-run` и `commit:atomic:sh:dry-run`.

Решения по ходу:

1. **`ci-common.mjs` не переносили** — `check-file-names.mjs` сделан самодостаточным, чтобы не плодить файлы.
2. **`block-secret-write` упрощен** — убрали Home Assistant паттерны (`secrets.yaml`, `known_devices.yaml`, `google_calendars.yaml`), оставили только универсальные (`*.env`, `*.pem`, `*.sqlite`, `*secret*`).
3. **`format-on-write` расширен** — добавили `.css`, `.scss`, `.html`, `.ts`, `.tsx`, `.jsx` к smart-home-овскому списку, чтобы покрыть весь parking.
4. **`settings.local.json.example` упрощен** — раз `play-sound.sh` теперь общекомандный в `settings.json`, дублирующий PowerShell-пример убрали, оставили `CLAUDE_SOUND_VOLUME` env-переопределение.
5. **`commit-msg` без триггер-фраз** — обнаружили, что `block-unsafe-git-add` ловит точные строки даже в heredoc commit message; первый коммит пришлось переписать без буквальной упоминания заблокированной команды. Это не баг хука — это его нормальная работа в WYSIWYG-режиме.

Атомарные коммиты по фазам:

- 45ce34c chore(claude): добавить блокирующие PreToolUse хуки
- 6595fc2 chore(claude): добавить permissions.allow и hooks в settings.json
- 356605d chore(claude): добавить format-on-write и remind-atomic-commit хуки
- a74d89d chore(claude): добавить слэш-команду /plan
- e6e1a0a chore(scripts): добавить проверку имен файлов на латиницу
- 5544020 chore(npm): добавить lint:file-names и commit:atomic:dry-run
- a73c634 chore(claude): добавить play-sound хук и обновить settings.local.example
- 6ab117e chore(claude): добавить опциональное правило ast-index

Финальный коммит — план + ретро.

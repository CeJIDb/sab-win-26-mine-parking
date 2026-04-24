# План: перенос инфраструктуры из gym-app (пункты 1–9)

**Дата**: 2026-04-24
**Задача**: адаптировать в репозиторий sab-win-26-mine-parking инструменты и процессные артефакты из соседнего проекта [../gym-app](../../gym-app/), чтобы закрыть пробелы в безопасности агентов, форматировании и навигации для Claude Code.
**Время**: бюджет 3–4 часа, жёстко не больше 5.

## Зачем именно так

По итогам сравнительного аудита gym-app ↔ parking (2026-04-24) обнаружено, что parking хорошо оборудован под Cursor IDE и документо-ориентированный workflow, но:

1. **Нет защитного контура Claude Code.** Любой агент может выполнить `rm -rf`, `git push --force`, прочитать `.env*`. Для учебного проекта со студентами это критический риск.
2. **Нет единого конфига форматирования.** `.editorconfig` есть, но нет Prettier — JSON/YAML/JS/SCSS форматируются как придётся. Markdownlint работает только через VSCode-расширение, в CI используется самописный `scripts/check-markdown.mjs` со своими правилами. Возможны расхождения «локально ок, в CI красное».
3. **Нет активной папки планов.** Регламенты в `docs/process/` описывают DoR/DoD и трассировку, но место, куда контрибьютор кладёт план **до** работы и актуализирует **после**, отсутствует. Для учебного контекста это ключевой артефакт видимости прогресса.
4. **Claude Code входит в проект без карты.** Агент читает `README.md` (для людей-контрибьюторов) и может пропустить `SKILLS.md` и регламенты. Нет короткого файла-навигатора.

**Что не делаем в рамках этого плана:**

- Не копируем `.business/` из gym-app — её содержимое специфично для стартапа и дублирует `docs/artifacts/` + `docs/specs/` (см. п.10 аудита).
- Не трогаем PR-шаблон parking — он сильнее gym-app-версии за счёт секции трассировки.
- Не меняем `.cursor/` правила, агентов и команды — они остаются каноническим контуром для Cursor-воркфлоу.

## Цель за 4 часа

Репозиторий готов к безопасной работе через Claude Code, имеет единый конфиг форматирования для IDE и CI, и содержит процессное место для ведения планов и ретроспектив.

Проверяемо:

- `npm run ci:check` проходит после всех изменений.
- `.claude/settings.json` содержит deny-правила на деструктивные команды.
- `npm run format:check` и `npm run lint:md` используют закоммиченные конфиги.
- Есть живой файл `CLAUDE.md` с картой репозитория и ключевыми правилами для LLM-агента.
- Папка `plans/` существует, в ней лежит этот план и README с правилами.

## Scope

### Что входит (пункты 1–9 аудита)

**Блок A — безопасность и агент (пункты 1, 5, 9):**

1. `.claude/settings.json` с deny-правилами (копия из gym-app, адаптированная под стек parking).
2. `CLAUDE.md` в корне — карта репозитория и 4–5 обязательных правил для агента.
3. `.claude/settings.local.json` (в `.gitignore`) — место под персональные звуковые хуки.

**Блок B — форматирование и линт (пункты 3, 4):**

4. `.prettierrc.json` + `.prettierignore` в корне.
5. `.markdownlint.jsonc` + `.markdownlint-cli2.jsonc` в корне.
6. Обновление `package.json`: скрипты `format`, `format:check`, `lint:md` через `markdownlint-cli2`, интеграция в `ci:check`.
7. devDependencies: `prettier`, `markdownlint-cli2`.

**Блок C — процесс (пункты 2, 6):**

8. Папка `plans/` + `plans/README.md` + этот план (уже выполняется — зафиксировать в фазе 0).
9. `scripts/validate-plans.mjs` — валидатор формата планов (порт из gym-app, адаптация под политики parking).
10. Интеграция валидатора в `.husky/pre-commit` и в `ci.yml`.
11. Папка `docs/process/retro/` + `docs/process/retro/README.md` с правилами ретроспективы после сессий (адаптация паттерна `.business/history/`).

**Блок D — прочее (пункты 7, 8):**

12. Сравнение `scripts/atomic-commit.mjs` parking ↔ gym-app, перенос улучшений, если они есть.
13. `.mcp.json` с Playwright MCP (без секретов) — для будущих скриншот-проверок [ui/](../ui/).

### Что **не** делаем в v0

- Не вводим обязательность заполнения retro-файлов на pre-commit — только README с рекомендацией.
- Не меняем правила Cursor (`.cursor/rules/`) — `CLAUDE.md` дополняет, а не заменяет их.
- Не переводим весь репозиторий в Prettier-форматирование одной командой — только добавляем конфиг и скрипты. Массовый `prettier --write` — отдельный коммит в конце, чтобы diff был читаемым.
- Не настраиваем звуковые хуки в общекомандном `.claude/settings.json` — только в локальном.
- Не добавляем блокирующие markdownlint-правки в CI, если они ломают существующие файлы: сначала фиксируем baseline, расхождения — отдельным планом.

## Тайминг 4 часа (240 минут)

| Минуты  | Блок                         | Что делаем                                                                                                                                                                                                                                                                                                                 |
| ------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0–10    | Ветка и фаза 0               | `git switch -c chore/gym-app-tooling-adoption`. Убедиться, что `main` чистый, `npm ci` и `npm run ci:check` проходят на старте.                                                                                                                                                                                            |
| 10–30   | Блок A: `.claude/`           | Создать `.claude/settings.json` (скопировать deny-правила из `../gym-app/.claude/settings.json`, убрать специфику Prisma/Yandex Cloud, оставить универсальные). Добавить `.claude/settings.local.json` в `.gitignore`. Создать `.vscode`-независимый пример `.claude/settings.local.json.example` со звуковыми хуками.     |
| 30–60   | Блок A: `CLAUDE.md`          | Написать `CLAUDE.md`: краткое описание проекта (из README), карта репозитория (таблица), 4–5 правил агенту (не коммитить чужое, не деплоить, сверяться с трассировкой, не менять `docs/specs/` без согласования, писать на русском без буквы «ё»), ссылки на `SKILLS.md`, `CONTRIBUTING.md`, `docs/process/pr-dor-dod.md`. |
| 60–100  | Блок B: Prettier             | `npm i -D prettier`. Скопировать `.prettierrc.json` и `.prettierignore` из gym-app, адаптировать: добавить `ui/wireframe.css` и `ui/templates/**` в ignore (генерируется), проверить `*.njk`. Добавить скрипты `format` и `format:check` в `package.json`. Прогнать `npm run format:check` — зафиксировать исходный diff.  |
| 100–130 | Блок B: markdownlint         | `npm i -D markdownlint-cli2`. Скопировать `.markdownlint.jsonc` и `.markdownlint-cli2.jsonc` из gym-app. Адаптировать: сверить с текущим `scripts/check-markdown.mjs`, чтобы не сломать `docs/**`. Обновить `lint:md` в `package.json`. Решить судьбу `scripts/check-markdown.mjs` (оставить как legacy или удалить).      |
| 130–170 | Блок C: `plans/` и retro     | README плана уже создан в фазе 0. Создать `docs/process/retro/README.md` с форматом 5 пунктов (задача → как решал → решил ли → эффективность → как было/стало). Обновить ссылки в `docs/process/readme.md` (если такой файл есть), в `CONTRIBUTING.md` добавить упоминание `plans/`.                                       |
| 170–200 | Блок C: `validate-plans.mjs` | Портировать `scripts/validate-plans.mjs` из gym-app (~100 строк). Адаптировать: проверка имени файла, H1, фаз, секции «Итог». Добавить в `package.json` скрипты `check:plans`, `check:plans:staged`. Интегрировать в `.husky/pre-commit`. Добавить в `ci:check`.                                                           |
| 200–225 | Блок D: atomic-commit + MCP  | `diff scripts/atomic-commit.mjs` parking ↔ gym-app. Если gym-app версия новее — перенести улучшения (бакетизация, `--dry-run`, `--staged-only`). Создать `.mcp.json` с Playwright MCP (headless, no-sandbox), убедиться что там нет секретов.                                                                              |
| 225–240 | Сборка и коммиты             | Прогнать `npm run ci:check`. Атомарные коммиты по блокам A/B/C/D. Заполнить «Итог» плана. Push, открыть PR.                                                                                                                                                                                                                |

Если 240 минут истекли и не все блоки выполнены — **не растягиваем**: закрываем тем, что реально сделано, оставшееся выносим в отдельный план следующим числом. Блоки независимые, поэтому частичная реализация допустима в порядке приоритета A → B → C → D.

## Правила коммитов и веток

- **Ветка**: `chore/gym-app-tooling-adoption`. Регэксп `scripts/check-branch-name.mjs` допускает префикс `chore/`.
- **Коммиты атомарные, по Conventional Commits, описание на русском без буквы «ё».** Ожидаемые:
  1. `chore(plans): добавить папку plans/ с README и планом переноса инфраструктуры`
  2. `chore(claude): добавить .claude/settings.json с deny-правилами`
  3. `docs(claude): добавить CLAUDE.md — карта репозитория для агента`
  4. `chore(tooling): добавить prettier и конфиги форматирования`
  5. `chore(tooling): перевести markdown-линт на markdownlint-cli2`
  6. `chore(process): добавить docs/process/retro/ для ретроспектив сессий`
  7. `chore(tooling): добавить scripts/validate-plans.mjs и интегрировать в husky и CI`
  8. `chore(tooling): синхронизировать scripts/atomic-commit.mjs с gym-app` (если нужно)
  9. `chore(mcp): добавить .mcp.json с playwright MCP`
- Перед каждым коммитом — `npm run ci:check`. Husky сам проверит.
- PR делаем в конце, когда план выполнен или явно остановлен с частичным scope.
- Если блок D не выполнен — это не блокирует PR; оставшееся фиксируется в «Итоге» и выносится в новый план.

## Определение «готово»

**Обязательное для мержа PR:**

- [ ] `npm ci` и `npm run ci:check` проходят локально.
- [ ] `.claude/settings.json` содержит deny-правила на `rm -rf`, `git push --force*`, `curl` с переменными, `.env*`, `*.pem`, `*.key`, деструктивные операции деплоя.
- [ ] `.claude/settings.local.json` в `.gitignore`.
- [ ] `CLAUDE.md` существует, содержит карту репозитория и ≥4 правил агенту, без буквы «ё».
- [ ] `.prettierrc.json`, `.prettierignore` в корне; `npm run format:check` выполняется без команды «not found».
- [ ] `.markdownlint.jsonc` в корне; `npm run lint:md` использует конфиг (не только старый `scripts/check-markdown.mjs`).
- [ ] Папка `plans/` содержит `README.md` и этот план с актуализированным «Итогом».
- [ ] `scripts/validate-plans.mjs` работает, интегрирован в `.husky/pre-commit` и `ci:check`.
- [ ] Папка `docs/process/retro/` существует, содержит README.
- [ ] Все новые файлы и правки закрыты атомарными коммитами по Conventional Commits с русским описанием.

**Желательное, но не блокирующее:**

- [ ] Блок D выполнен (`atomic-commit.mjs` сверен, `.mcp.json` добавлен).
- [ ] `CONTRIBUTING.md` обновлён с упоминанием `plans/` и `docs/process/retro/`.
- [ ] В `README.md` добавлена короткая ссылка на `CLAUDE.md` для LLM-агентов.

## Что остаётся на следующие итерации

- **Массовое форматирование через `prettier --write`** — отдельная ветка `chore/prettier-format-all`, чтобы diff был обозримым.
- **Блокирующий markdownlint в CI** — только после того, как прогон на `docs/**` покажет нулевой baseline или все расхождения будут поправлены.
- **Удаление legacy `scripts/check-markdown.mjs`** — после стабилизации `markdownlint-cli2` в CI, минимум неделя наблюдения.
- **Обязательность retro-файлов на pre-commit** — только после ~10 добровольных ретроспектив, когда формат устоится.
- **Интеграция `docs/process/retro/` в матрицу трассировки** — обсудить с ментором, нужна ли эта связь.
- **Публичные агент-хуки со звуками** — только если команда сознательно их хочет; по умолчанию оставляем в `settings.local.json`.

## Фазы и статус

- [x] Фаза 0. Создать папку `plans/`, `plans/README.md` и этот план.
- [x] Фаза 1. Ветка `chore/gym-app-tooling-adoption` + зеленый `ci:check` на старте.
- [x] Фаза 2 (Блок A). `.claude/settings.json` + `.gitignore` + `CLAUDE.md`.
- [x] Фаза 3 (Блок B). Prettier + markdownlint-cli2 + обновленный `package.json`.
- [x] Фаза 4 (Блок C). `docs/process/retro/README.md` + `scripts/validate-plans.mjs` + husky + CI.
- [x] Фаза 5 (Блок D). Переработка `atomic-commit.mjs` + `.mcp.json` с Playwright.
- [x] Фаза 6. Атомарные коммиты, `npm run ci:check`. PR и push — следующим шагом вне этого плана.

## Итог

Статус на финише: план реализован полностью в рамках одной сессии 2026-04-24 на ветке `chore/gym-app-tooling-adoption`. Итоговая ретроспектива — в `docs/process/retro/2026-04-24-gym-app-tooling-adoption.md` (добавляется после push/PR, на усмотрение автора).

**Реализовано (пункты 1–9 аудита):**

- Блок A (безопасность и агент):
  - `.claude/settings.json` с deny-правилами на `rm -rf`, `git push --force*`, `curl/wget` с переменными, `git reset --hard`, `git clean -f`, `vercel`, `railway`, `docker push`, чтение `.env*`, `*secret*`, `*password*`, `*.pem`, `*.key`, `*.sqlite*`, `.cursor/mcp.json*`.
  - `.claude/settings.local.json.example` с примером звуковых хуков через WSL PowerShell (по умолчанию не в git).
  - `CLAUDE.md` в корне — карта репозитория, пять правил агенту (свои изменения, без «ё», неприкосновенность `docs/specs/`, сверка с трассировкой, kebab-case в именах), ссылки на `README.md`, `CONTRIBUTING.md`, `SKILLS.md`, `docs/process/readme.md`.
  - `.gitignore` дополнен `.claude/settings.local.json`, `.env*`, `.playwright-mcp/`.
- Блок B (форматирование и линт):
  - `prettier@^3.8.3` и `markdownlint-cli2@^0.22.1` в `devDependencies`.
  - `.prettierrc.json`, `.prettierignore` адаптированы под parking (в ignore — `ui/wireframe.css`, собранные HTML, `ui/templates/`, `ui/pages/`, `sql/`, MCP-конфиги).
  - `.markdownlint.jsonc` и `.markdownlint-cli2.jsonc`: набор правил расширен под российский baseline (MD013/MD024/MD033/MD034/MD036/MD029/MD041/MD051/MD056/MD060/MD009/MD012/MD022/MD032/MD028 — сознательно ослаблены, основание — комментарий в конфиге).
  - `package.json` скрипты: `format`, `format:check`, `lint:md` (markdownlint-cli2), `lint:md:fix`, `lint:md:legacy` (старый `check-markdown.mjs` — сохранен для строгих проверок ключевых документов), `check:plans`, `check:plans:staged`, `commit:atomic:staged`.
  - `ci:check` теперь прогоняет `lint:md` + `lint:md:legacy` + `lint:md-links` + `check:plans` + `build`. На baseline — зеленый: 90 markdown-файлов без ошибок.
- Блок C (процесс):
  - `plans/` + `plans/README.md` + `plans/2026-04-24-gym-app-tooling-adoption.md` (этот файл) — создано в фазе 0.
  - `scripts/validate-plans.mjs` портирован из gym-app: проверяет имя файла, валидную дату, H1, наличие фаз `[ ]/[x]`, секцию `## Итог` с непустым контентом; предупреждает при > 500 строк.
  - `.husky/pre-commit` вызывает `npm run check:plans:staged` после существующего reminder.
  - `docs/process/retro/README.md` — регламент коротких ретроспектив сессий (пять пунктов: задача, как решал, решил ли, эффективность, как было/как стало); ретро остается рекомендацией, не блокирует pre-commit.
  - `docs/process/readme.md` пополнен ссылкой на `retro/`.
- Блок D (инфраструктура агентов):
  - `scripts/atomic-commit.mjs` переработан: взят движок gym-app (статусные коммиты A/M/D/R, корректный разбор rename/delete через `git status --porcelain=v1 -z`, режим `--staged-only`, `git add -A --`, автопрогон `prettier --write` перед каждым коммитом, динамическая генерация сообщений на русском с глаголами, `truncateMessage`) — бакеты полностью сохранены под parking (`cursor`, `specs`, `architecture`, `artifacts`, `process`, `protocols`, `interviews`, `demo-days`, `docs-root`, `ui`) и дополнены новыми (`claude`, `plans`, `tooling`, `sql`, + `SKILLS.md` в `root-docs`).
  - `.mcp.json` в корне: Playwright MCP (headless chromium, isolated, no-sandbox) — без секретов, готов к использованию для скриншот-тестов `ui/`.

**История коммитов ветки** (9 коммитов, все по Conventional Commits, описания на русском):

1. `chore(plans): добавить папку plans/ с README и планом переноса инфраструктуры`
2. `chore(claude): добавить .claude/settings.json с deny-правилами для агента`
3. `docs(claude): добавить CLAUDE.md — карту репозитория для агента`
4. `chore(gitignore): исключить .claude/settings.local.json, .env и .playwright-mcp`
5. `chore(tooling): добавить prettier, markdownlint-cli2 и их конфиги`
6. `chore(process): добавить docs/process/retro/ для ретроспектив сессий`
7. `chore(scripts): добавить validate-plans.mjs и интегрировать в pre-commit`
8. `chore(scripts): переработать atomic-commit.mjs под parking-структуру и статусные коммиты`
9. `chore(mcp): добавить .mcp.json с playwright MCP для скриншот-проверок ui/`

**Отклонения от плана и решения по ходу:**

- Коммиты сгруппированы по зонам в 9 штук вместо формального списка из 9 в плане (содержание совпадает, группировка скорректирована: правки `package.json`/`package-lock.json` из блоков B и C свелись в один коммит #5, чтобы не делить lock-файл интерактивно; правка `.husky/pre-commit` из блока C осталась в своем коммите #7 вместе с валидатором).
- `lint:md` переведен на `markdownlint-cli2`, старый `scripts/check-markdown.mjs` сохранен под именем `lint:md:legacy` (он проверяет специфичные для parking вещи: merge-маркеры, требование H1/H2 для process-документов, максимум 500 символов в строке).
- Для зеленого baseline `markdownlint-cli2` в `.markdownlint.jsonc` ослаблены правила, массово ломавшие существующие документы (MD022/MD032/MD028/MD009/MD012/MD029/MD041/MD051/MD056/MD060 — все с обоснованием в комментариях). В `.markdownlint-cli2.jsonc` добавлены точечные ignore для legacy-файлов: `docs/interviews/**`, `docs/demo-days/**`, `docs/artifacts/use-case/**`, семь конкретных .md-файлов с нестандартным форматированием. Вычистка этих файлов — следующими планами.
- `format`/`format:check` **не включены** в `ci:check` намеренно: массовый `prettier --write` по репозиторию — отдельный план (`chore/prettier-format-all`), чтобы diff был обозримым. Сейчас prettier применен только к новым файлам и к файлам, затронутым `commit:atomic`.
- `CONTRIBUTING.md` и `README.md` **не тронуты** — это было отмечено в плане как «желательное, не блокирующее». Короткая ссылка на `CLAUDE.md` в `README.md` и упоминание `plans/` + `retro/` в `CONTRIBUTING.md` — кандидаты на следующую правку.
- `atomic-commit.sh` (bash-fallback) **не синхронизирован** с новой версией `.mjs` — остался в прежнем виде. Это ок для sandbox-fallback, но функциональной паритет с `.mjs` — кандидат на отдельный план.

**Остается (для следующих итераций):**

- Массовое форматирование `prettier --write` → отдельный PR.
- Поэтапная чистка legacy-файлов из `.markdownlint-cli2.jsonc`-ignores, с постепенным удалением ослабленных правил.
- Удаление `scripts/check-markdown.mjs` как legacy — минимум через неделю наблюдения за `markdownlint-cli2` в CI.
- Упоминание `plans/`, `docs/process/retro/` и `CLAUDE.md` в `CONTRIBUTING.md` и `README.md`.
- Синхронизация `scripts/atomic-commit.sh` с новой логикой `.mjs` (динамические сообщения, статусы, `--staged-only`).
- Интеграция `docs/process/retro/` в матрицу трассировки — после обсуждения с ментором.

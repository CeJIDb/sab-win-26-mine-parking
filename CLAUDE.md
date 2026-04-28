# sab-win-26-mine-parking — навигация для Claude Code

Карта репозитория для LLM-агента. Читай в начале каждой сессии.

Для людей — [README.md](README.md) и [CONTRIBUTING.md](CONTRIBUTING.md).

## Что это за проект

Учебный проект курса Systems Analyst Bootcamp — цифровая платформа для частного паркинга на 600 машиномест в Санкт-Петербурге. Основной результат — артефакты анализа и проектирования в [docs/](docs/), а не код. В [ui/](ui/) — статический wireframe, прод-деплоя нет.

## Структура репозитория

```text
sab-win-26-mine-parking/
├── CLAUDE.md                ← этот файл, навигация для агента
├── README.md                ← вход для людей
├── CONTRIBUTING.md          ← регламент участников: ветки, коммиты, DoR/DoD, CI
├── SKILLS.md                ← baseline глобальных skills
├── docs/                    ← вся документация проекта
│   ├── specs/               ← требования (FR/NFR), глоссарий
│   ├── architecture/        ← архитектурные решения, ADR, C4
│   ├── artifacts/           ← use-case, BPMN, user flows
│   ├── interviews/          ← стенограммы интервью и разборы
│   ├── process/             ← регламенты: DoR/DoD, трассировка, релиз, ретро
│   ├── demo-days/           ← материалы Demo Days
│   └── styleguide.md        ← стиль текстов в документации
├── ui/                      ← статический wireframe (SCSS + Nunjucks → HTML)
├── plans/                   ← технические планы (один план = одна задача)
├── scripts/                 ← скрипты CI, линтов, atomic-commit, claude-hooks
├── .cursor/                 ← правила и агенты Cursor
├── .claude/                 ← настройки Claude Code: rules, hooks, deny-правила
├── .husky/                  ← git-хуки: commit-msg, pre-commit, pre-push
├── .github/                 ← CI workflows, PR/Issue templates, CODEOWNERS
├── sql/                     ← SQL-заготовки для учебной части
└── evals/                   ← оценочные материалы курса
```

### Где что искать

| Что нужно                       | Куда смотреть                                                                      |
| ------------------------------- | ---------------------------------------------------------------------------------- |
| О проекте, границы системы      | [README.md](README.md)                                                             |
| Требования (FR/NFR), глоссарий  | [docs/specs/](docs/specs/)                                                         |
| Архитектура, ADR, C4            | [docs/architecture/](docs/architecture/)                                           |
| Use-case, BPMN, user flows      | [docs/artifacts/](docs/artifacts/)                                                 |
| Интервью                        | [docs/interviews/](docs/interviews/)                                               |
| Регламенты процесса             | [docs/process/readme.md](docs/process/readme.md)                                   |
| Матрица трассировки (правила)   | [docs/process/traceability-matrix.md](docs/process/traceability-matrix.md)         |
| Матрица трассировки (журнал)    | [docs/process/traceability-matrix-log.md](docs/process/traceability-matrix-log.md) |
| Wireframe                       | [ui/pages/](ui/pages/), сборка `npm run build`                                     |
| Технические планы               | [plans/](plans/), [plans/README.md](plans/README.md)                               |
| Правила Cursor                  | [.cursor/rules/](.cursor/rules/), [.cursor/commands/](.cursor/commands/)           |
| Правила Claude (опц. ast-index) | [.claude/rules/ast-index.md](.claude/rules/ast-index.md)                           |
| Скрипты                         | [scripts/](scripts/)                                                               |

## Правила для агента

1. **Не коммить и не пушить без явной просьбы.** Коммит делает пользователь. При накопившемся диффе — напомни про `npm run commit:atomic` (или `:dry-run` для предпросмотра). Если пользователь явно попросил коммит — добавляй файлы поштучно по имени, никогда `git add -A` или `git add .` (в параллельных чатах могут быть чужие правки).

2. **При сложной или плохо сформулированной задаче — спрашивай.** Если задача неоднозначна, есть скрытые предположения, или непонятен скоуп — задай уточняющие вопросы в режиме диалога **до** начала работы. Лучше потратить ход на вопрос, чем переделывать.

3. **Не меняй [docs/specs/](docs/specs/) без разрешения.** Это источник истины по требованиям. Если считаешь что правка нужна — сначала спроси у пользователя с обоснованием (что меняешь и почему). После разрешения — правь, обнови [журнал трассировки](docs/process/traceability-matrix-log.md). Устаревшие требования помечай, не удаляй.

4. **Сверяйся с трассировкой.** При правке артефакта, требования или архитектурного решения — проверь связь `Источник → Требование → Изменения → Проверка → Доказательство`. Регламент — [docs/process/traceability-matrix.md](docs/process/traceability-matrix.md). Журнал обновляется в том же PR.

5. **Имена файлов и папок — латиница, kebab-case.** Даже если содержимое на русском. Без пробелов, кириллицы, camelCase, PascalCase. Проверка — `npm run lint:file-names`.

6. **После выполнения плана — пиши ретро.** Когда работа по плану из [plans/](plans/) завершена: (a) все фазы отмечены `[x]`, секция `## Итог` заполнена; (b) создан `docs/process/retro/YYYY-MM-DD-название.md` (то же имя, что у плана) по формату из [docs/process/retro/README.md](docs/process/retro/README.md). Обязательный шаг.

## MCP-серверы и поиск

**markdown_rag** — локальный RAG по markdown через Milvus. **Первичный инструмент семантического поиска по [docs/](docs/)**:

- `mcp__markdown_rag__search` — поиск по смыслу. Запускай первым делом, когда ищешь концепцию или формулировку в документации.
- `mcp__markdown_rag__index_documents` — обнови индекс в начале сессии или после крупных правок в docs/. Параметры: `directory="docs"`, `recursive=true`. Если индекс пуст или устарел — переиндексируй до первого `search`.
- Grep по docs/ — fallback, когда `search` вернул пустой результат или нужен точный токен/строка.

**github** — issues, PR, коммиты через MCP вместо `gh` CLI. Не пушь и не создавай PR без явной просьбы.

**playwright** — проверка wireframe в браузере при правках [ui/](ui/).

**miro** — C4-диаграммы и схемы процессов из [docs/architecture/](docs/architecture/).

**ast-index** — опциональный бинарь для поиска по коду (JS/TS/shell/python в `scripts/`, `ui/templates/`, `.husky/`). Полные правила — [.claude/rules/ast-index.md](.claude/rules/ast-index.md). Если бинарь не установлен — используй Grep.

## Автоматические блокировки (Claude hooks)

В [.claude/settings.json](.claude/settings.json) подключены хуки в [scripts/claude-hooks/](scripts/claude-hooks/). Если действие заблокировано — это политика, не баг:

- `block-push-to-main.mjs` — запрет push в `main`.
- `block-unsafe-git-add.mjs` — запрет `git add -A` / `git add .`.
- `block-secret-write.mjs` — запрет записи в файлы, похожие на секреты.
- `validate-staged-plans.mjs`, `validate-plan-on-write.mjs` — валидация формата [plans/](plans/).
- `format-on-write.mjs` — авто-форматирование Prettier после записи.

## Git-хуки (husky) и CI

- `commit-msg` — commitlint, Conventional Commits (типы: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `ci`, `build`, `perf`, `revert`).
- `pre-commit` — `git-workflow-agent-reminder` (напоминание про atomic-commit) + `check:plans:staged`.
- `pre-push` — `git-workflow-agent-reminder --worktree` + `check:branch` + `ci:check`.

Ветки: `feature/`, `docs/`, `chore/`, `hotfix/`. Прямой push в `main` запрещен.

CI на PR: `policy-checks`, `quality-gates` (`ci:check`), `commitlint`, семантический заголовок PR.

## Полезные команды

```bash
npm ci                          # установить зависимости
npm run ci:check                # все локальные проверки разом
npm run build                   # собрать ui/ (SCSS + Nunjucks → HTML)
npm run lint:md                 # markdownlint
npm run lint:md:fix             # markdownlint с автофиксом
npm run lint:md-links           # проверка ссылок в .md
npm run lint:file-names         # имена файлов на латиницу/kebab-case
npm run format                  # prettier --write
npm run format:check            # prettier --check
npm run check:branch            # имя текущей ветки
npm run check:plans             # валидация всех файлов в plans/
npm run check:plans:staged      # валидация только staged-планов
npm run commit:atomic:dry-run   # предпросмотр атомарных коммитов
npm run commit:atomic           # атомарные коммиты (запускает пользователь)
npm run docs:c4-preview         # предпросмотр C4-диаграмм
```

## Definition of Done для агента

Перед тем как сказать «готово», пробеги по чеклисту:

- [ ] Если правил [docs/specs/](docs/specs/) — было явное разрешение пользователя.
- [ ] [Журнал трассировки](docs/process/traceability-matrix-log.md) обновлен (если затронуты требования/артефакты/архитектура).
- [ ] Имена новых файлов — латиница kebab-case (`npm run lint:file-names` зеленый).
- [ ] Локальные проверки прошли (`npm run ci:check`).
- [ ] Если работал по плану из [plans/](plans/) — фазы `[x]`, `## Итог` заполнен, ретро в [docs/process/retro/](docs/process/retro/) написано.
- [ ] CLAUDE.md обновлен, если поменялась структура репозитория или появились новые правила.
- [ ] Пользователю напомнено про `npm run commit:atomic` (если накопился крупный дифф).

## Язык

Отвечай на русском. В документации и коммитах **не используется буква «ё»** — это договоренность проекта (см. [CONTRIBUTING.md](CONTRIBUTING.md#стиль-текстов-в-документации)). Пишем «все», «еще», «подъем», «перенести». Проверяй вывод перед сохранением.

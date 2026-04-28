# Доступные `subagent_type`

Единый канонический список субагентов в репозитории. Файл `/.cursor/agents/AGENTS_INDEX.md` больше не используется.

## Базовые типы платформы

- `generalPurpose`: универсальный агент для исследований и многошаговых задач.
- `explore`: быстрый поиск по кодовой базе и документации.
- `shell`: запуск команд и git-операций.
- `browser-use`: браузерная автоматизация и проверки UI.

## Локальные agent files (`.cursor/agents/*.md`)

- `systems-analyst`: анализ требований и согласованности артефактов.
- `glossary-terms-maintainer`: ревью терминологии и дрейфа глоссария.
- `git-workflow-master`: git/CI проверки перед push и PR.
- `doc-to-markdown`: конвертация загруженных документов в markdown.
- `demo-days-presentations`: подготовка структуры и сценариев для демо-дней.

## Skills Baseline (`SKILLS.md`)

Канонический список глобальных навыков для этого репозитория: `SKILLS.md`.

Применение:

- сначала следовать локальным правилам и командам (`.cursor/rules/**`, `.cursor/commands/**`);
- затем подключать навыки из `SKILLS.md` по минимально достаточному принципу.

## Review-роли через rules (`.cursor/rules/*.mdc`)

Эти роли активируются через правила и слэш-команды, без зеркального agent-файла:

- `technical-writer`
- `software-architect`
- `database-optimizer` (схемы БД, индексы, миграции; источник: [agency-agents](https://github.com/msitarzewski/agency-agents))
- `backend-architect` (бэкенд/API/масштабирование; источник: [agency-agents](https://github.com/msitarzewski/agency-agents))
- `security-engineer`
- `ux-architect`
- `accessibility-auditor`
- `reality-checker`

Подробная матрица команд и `globs`: `docs/process/cursor-agent-commands.md`.

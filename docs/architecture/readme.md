# Индекс архитектуры

Архитектурные решения (ADR) и сопутствующие проектные артефакты.

## ADR — архитектурные решения

Все файлы ADR вынесены в каталог [`adr/`](adr/):

- [adr/readme.md](adr/readme.md) — оглавление ADR-001 и последующих решений с краткими описаниями.

## Архитектурные артефакты

- [ddd/readme.md](ddd/readme.md) — индекс DDD-материалов проекта
- [c4/readme.md](c4/readme.md) — индекс C4-диаграмм проекта

- [ddd/es-tobe-sd-contexts.md](ddd/es-tobe-sd-contexts.md) — ES TO-BE контексты как входной артефакт Этапа 4 для DDD, модульных границ и последующего C4
- [ddd/ddd-bounded-contexts.md](ddd/ddd-bounded-contexts.md) — DDD bounded contexts и контекстная карта
- [c4/c4-parking-platform.md](c4/c4-parking-platform.md) — **C4-диаграммы платформы**: Level 1 (контекст), Level 2 (контейнеры), Level 3 (компоненты); Mermaid + текстовые описания + ключевые сценарии; статический предпросмотр можно локально пересобрать командой `npm run docs:c4-preview`
- [c4/c4-l1-system-context.md](c4/c4-l1-system-context.md) — C4 Level 1 (System Context): пользователи и внешние системы в формате референса `Телемед` (легенда периметра, Mermaid `C4Context`)
- [c4/c4-l2-container.md](c4/c4-l2-container.md) — C4 Level 2 (Container): контейнеры платформы парковки в формате референса `Телемед` (граница системы, контейнеры, внешние системы, Mermaid `C4Container`)
- [database/readme.md](database/readme.md) — архитектура данных, ERD, обоснование PostgreSQL и решения по БД
- [integration/readme.md](integration/readme.md) — будущий раздел для интеграционной архитектуры, сценариев и контрактов

## Правила использования

- Новые архитектурные решения оформляйте отдельными ADR.
- Существующие ADR не переписывайте задним числом; при необходимости добавьте новый ADR, отменяющий или заменяющий предыдущий.

# Индекс архитектуры

Архитектурные решения (ADR) и сопутствующие артефакты (DDD, внешние материалы).

## ADR — архитектурные решения

Все файлы ADR вынесены в каталог [`adr/`](adr/):

- [adr/readme.md](adr/readme.md) — оглавление ADR-001 … ADR-003 и краткие описания.

## Архитектурные артефакты


- [ddd/ddd-bounded-contexts.md](ddd/ddd-bounded-contexts.md) — DDD bounded contexts и контекстная карта
- [ddd/ddd-bounded-contexts-study.md](ddd/ddd-bounded-contexts-study.md) — краткая учебная версия DDD bounded contexts
- [ddd/ddd-pseudocode-study.md](ddd/ddd-pseudocode-study.md) — учебная версия псевдокода по DDD bounded contexts
- [ddd/event-storming-external-context.md](ddd/event-storming-external-context.md) — внешний контекст: DDD, Event Storming, ES (индекс и ссылки на [`ddd/reference-readings/`](ddd/reference-readings/))
- [c4/c4-parking-platform.md](c4/c4-parking-platform.md) — **C4-диаграммы платформы**: Level 1 (контекст), Level 2 (контейнеры), Level 3 (компоненты); Mermaid + текстовые описания + ключевые сценарии; статический предпросмотр: [`c4/c4-parking-platform-preview.html`](c4/c4-parking-platform-preview.html) (сборка: `npm run docs:c4-preview`)
- [c4/c4-l1-system-context.md](c4/c4-l1-system-context.md) — C4 Level 1 (System Context): пользователи и внешние системы в формате референса `Телемед` (легенда периметра, Mermaid `C4Context`)
- [c4/c4-l2-container.md](c4/c4-l2-container.md) — C4 Level 2 (Container): контейнеры платформы парковки в формате референса `Телемед` (граница системы, контейнеры, внешние системы, Mermaid `C4Container`)
- [c4/c4-external-context.md](c4/c4-external-context.md) — C4 model: индекс, канонические ссылки ([c4model.com](https://c4model.com/)) и локальные материалы в [`c4/reference-readings/`](c4/reference-readings/)

## Правила использования

- Новые архитектурные решения оформляйте отдельными ADR.
- Существующие ADR не переписывайте задним числом; при необходимости добавьте новый ADR, отменяющий или заменяющий предыдущий.

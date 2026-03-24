# Индекс документации

Точка входа в проектную документацию репозитория.

## Оглавление

- [С чего начать](#с-чего-начать)
- [Разделы](#разделы)
- [Вспомогательные инструменты](#вспомогательные-инструменты)
- [Каноничные и вспомогательные материалы](#каноничные-и-вспомогательные-материалы)
- [Именование и стиль](#именование-и-стиль)

## С чего начать

Краткий маршрут знакомства с проектом:

1. [Карточка проекта](artifacts/project-charter.md)
2. [Контекстная диаграмма](artifacts/context-diagram.md)
3. [Концептуальная модель с атрибутами](artifacts/conceptual-model-with-attributes.md)
4. [Индекс спецификаций](specs/readme.md)
5. [Индекс архитектуры](architecture/readme.md)
6. [Индекс протоколов](protocols/readme.md)

## Разделы

- [artifacts/](artifacts/readme.md) — артефакты анализа, карты, концептуальная модель, материалы по use case
- [specs/](specs/readme.md) — функциональные и нефункциональные требования, ограничения
- [architecture/](architecture/readme.md) — архитектура: ADR в [`architecture/adr/`](architecture/adr/readme.md), DDD и смежные материалы в [`architecture/ddd/`](architecture/ddd/event-storming-external-context.md)
- [process/](process/readme.md) — процесс участия, шаблоны, контроль качества, чеклист релиза
- [protocols/](protocols/readme.md) — протоколы встреч и зафиксированные решения
- [demo-days/](demo-days/readme.md) — сценарии демо, заметки и материалы презентаций

## Вспомогательные инструменты

- Скрипты для подготовки документации — в каталоге [`../scripts/docs/`](../scripts/docs/readme.md).
- Каталог `temp_context/` в корне репозитория — временная рабочая область; устойчивые результаты переносите в `docs/`.

## Каноничные и вспомогательные материалы

- Каноничные аналитические документы — в [artifacts/](artifacts/readme.md), [specs/](specs/readme.md) и [architecture/](architecture/readme.md).
- Операционные и вспомогательные материалы — в [process/](process/readme.md) и [protocols/](protocols/readme.md).
- Материалы для демонстраций — в [demo-days/](demo-days/readme.md).

## Именование и стиль

Соглашения по именованию и оформлению — в [styleguide.md](styleguide.md).

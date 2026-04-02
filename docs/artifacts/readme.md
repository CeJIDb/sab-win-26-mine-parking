# Индекс артефактов

В этом разделе собраны основные аналитические артефакты проекта.

## Оглавление

- [Ключевые документы](#ключевые-документы)
- [Подразделы](#подразделы)
- [Заметки](#заметки)

## Ключевые документы

- [project-charter.md](project-charter.md)
- [opportunity-canvas.md](opportunity-canvas.md)
- [impact-map.md](impact-map.md)
- [user-story-map.md](user-story-map.md)
- [context-diagram.md](context-diagram.md)
- [conceptual-model-with-attributes.md](conceptual-model-with-attributes.md)
- [use-case/use-case-diagram.md](use-case/use-case-diagram.md)
- [use-case/use-case-registry.md](use-case/use-case-registry.md)
- [use-case/crudl.md](use-case/crudl.md)
- [navigation-map.md](navigation-map.md)
- [infosec/infosec-analyze-parking.md](infosec/infosec-analyze-parking.md)
- [infosec/bow-tie-unauthorized-access-to-system-and-data.md](infosec/bow-tie-unauthorized-access-to-system-and-data.md)

## Подразделы

- [assets/](assets/readme.md) — изображения для верхнеуровневых каноничных артефактов
- [as-is/](as-is/readme.md) — артефакты исследования текущих процессов и моделей предметной области
- [algorithms/](algorithms/readme.md) — учебные и вспомогательные алгоритмические артефакты
- [infosec/](infosec/readme.md) — анализ ИБ, угроз, уязвимостей и контрмер
- [es-to-be/](es-to-be/readme.md) — модели процессов и артефакты целевого состояния (TO-BE)
- [use-case/](use-case/readme.md) — описания вариантов использования, реестр UC и сопутствующие материалы

## Заметки

- Имена файлов приведены к стилю **kebab-case** на латинице.
- Сохраняйте относительные ссылки; при переносе файлов обновляйте ссылки в том же PR.
- ERD и связанные модели данных вынесены в [`../architecture/database/erd/`](../architecture/database/erd/readme.md) как часть архитектуры данных.
- Для артефактов, которые приходят как изображение, храните `md`-описание рядом с файлом изображения и считайте каноничным документом именно `md`.
- Скрипт нарезки крупных изображений на тайлы: [`../../scripts/docs/split-image.py`](../../scripts/docs/split-image.py).

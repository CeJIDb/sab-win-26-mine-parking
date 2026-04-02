# История развития проекта

Краткая история того, как проект двигался от исследования бизнеса к проектированию целевого решения, архитектуры и будущих интеграций.

## Оглавление

- [Назначение](#назначение)
- [Этап 1. Моделирование бизнеса](#этап-1-моделирование-бизнеса)
- [Этап 2. Концептуальное проектирование IT-решения](#этап-2-концептуальное-проектирование-it-решения)
- [Этап 3. Требования к ПО](#этап-3-требования-к-по)
- [Этап 4. Техническое проектирование IT-решения](#этап-4-техническое-проектирование-it-решения)
- [Этап 5. Интеграции](#этап-5-интеграции)
- [Демо-дни как контрольные точки](#демо-дни-как-контрольные-точки)
- [Связанные документы](#связанные-документы)

## Назначение

Документ фиксирует общую логику развития проекта.

Он нужен как верхнеуровневый путеводитель по этапам, чтобы новым участникам команды было проще понять, откуда появились текущие артефакты и какие направления еще находятся в работе.

Если конкретный артефакт пока не лежит в репозитории, это не означает, что он не существовал в процессе работы.

Для таких материалов используйте [artifact-placement-guide.md](artifact-placement-guide.md), чтобы добавить их в репозиторий в согласованном виде.

## Этап 1. Моделирование бизнеса

На первом этапе команда собрала у заказчика информацию о текущих AS-IS процессах парковки.

На основании этого материала были собраны и обсуждались артефакты, описывающие текущее состояние бизнеса и предметной области.

В работе фигурировали следующие типы артефактов:

- ED AS-IS.
- BPMN.
- UML Class Diagram.
- UML StateChart Diagram.

Каноничные артефакты этого этапа, уже оформленные в репозитории:

- [docs/artifacts/as-is/event-storming-as-is.md](../artifacts/as-is/event-storming-as-is.md)
- [docs/artifacts/as-is/parking-as-is-diagram.md](../artifacts/as-is/parking-as-is-diagram.md)
- [docs/artifacts/as-is/uml-class-domain-as-is.md](../artifacts/as-is/uml-class-domain-as-is.md)
- [docs/artifacts/as-is/uml-state-contract-with-individual.md](../artifacts/as-is/uml-state-contract-with-individual.md)
- [docs/artifacts/as-is/bpmn-client-identification.md](../artifacts/as-is/bpmn-client-identification.md)
- [docs/artifacts/as-is/bpmn-contract-signing.md](../artifacts/as-is/bpmn-contract-signing.md)
- [docs/artifacts/as-is/bpmn-payment-individual-and-legal-clients.md](../artifacts/as-is/bpmn-payment-individual-and-legal-clients.md)
- [docs/artifacts/as-is/bpmn-provide-parking-space.md](../artifacts/as-is/bpmn-provide-parking-space.md)
- [docs/artifacts/as-is/bpmn-search-parking-space.md](../artifacts/as-is/bpmn-search-parking-space.md)
- [docs/artifacts/as-is/bpmn-parking-exit.md](../artifacts/as-is/bpmn-parking-exit.md)

Часть артефактов этапа 1 все еще может отсутствовать в репозитории и должна добавляться по мере нормализации материалов и подготовки Markdown-описаний.

Для этого этапа в структуре репозитория подготовлен раздел `docs/artifacts/as-is/`.

## Этап 2. Концептуальное проектирование IT-решения

Этот этап был посвящен переходу от понимания проблемной ситуации к описанию целевого решения.

### 2.1. Проблемная ситуация и предварительное решение

Команда выполнила ситуационный анализ и сформулировала проблему бизнеса.

На этой основе была собрана и согласована с заказчиком левая часть Opportunity Canvas: пользователи и клиенты, проблемы, сегодняшние решения и проблемы бизнеса.

Затем были определены цель и границы системы.

Целевая формулировка звучит так: увеличить долю клиентов, использующих парковку через онлайн-ресурсы, с 0% до 80% от общего количества клиентов на дату запуска решения в течение 6 месяцев после ввода системы в эксплуатацию.

После этого были оформлены Impact Map и карточка проекта.

Связанные артефакты:

- [docs/artifacts/opportunity-canvas.md](../artifacts/opportunity-canvas.md)
- [docs/artifacts/impact-map.md](../artifacts/impact-map.md)
- [docs/artifacts/project-charter.md](../artifacts/project-charter.md)

### 2.2. Пользовательские требования и итерационное планирование

На этом шаге была подготовлена User Story Map.

Система была разделена на поставки.

Для MVP был согласован Definition of Done.

Связанные артефакты:

- [docs/artifacts/user-story-map.md](../artifacts/user-story-map.md)
- [docs/specs/readme.md](../specs/readme.md)

### 2.3. Моделирование данных и проектирование взаимодействия

Команда разработала контекстную диаграмму.

Она легла в основу UML Use Case Diagram.

Далее параллельно развивались несколько направлений:

- концептуальная модель данных;
- словарь предметной области;
- реестр use case;
- CRUDL;
- детальные сценарии использования.

Связанные артефакты:

- [docs/artifacts/context-diagram.md](../artifacts/context-diagram.md)
- [docs/artifacts/conceptual-model-with-attributes.md](../artifacts/conceptual-model-with-attributes.md)
- [docs/artifacts/project-glossary.md](../artifacts/project-glossary.md)
- [docs/artifacts/use-case/use-case-diagram.md](../artifacts/use-case/use-case-diagram.md)
- [docs/artifacts/use-case/use-case-registry.md](../artifacts/use-case/use-case-registry.md)
- [docs/architecture/database/erd/readme.md](../architecture/database/erd/readme.md)

### 2.4. Эскизное макетирование интерфейсов

На основе накопленных артефактов была сформирована схема навигации.

После этого с помощью Cursor был собран прототип `ui/`.

Связанные артефакты:

- [docs/artifacts/navigation-map.md](../artifacts/navigation-map.md)
- [ui/README.md](../../ui/README.md)

### 2.5. Сквозная работа по ES TO-BE

На протяжении всего этапа 2 команда развивала ES TO-BE и согласовывала его с заказчиком.

Связанные артефакты:

- [docs/artifacts/es-to-be/es-tobe-sd-access-and-parking-flow.md](../artifacts/es-to-be/es-tobe-sd-access-and-parking-flow.md)
- [docs/artifacts/es-to-be/es-tobe-bp-booking-and-contract.md](../artifacts/es-to-be/es-tobe-bp-booking-and-contract.md)
- [docs/artifacts/es-to-be/es-tobe-bp-payment.md](../artifacts/es-to-be/es-tobe-bp-payment.md)
- [docs/artifacts/es-to-be/es-tobe-bp-client-profile-and-vehicles.md](../artifacts/es-to-be/es-tobe-bp-client-profile-and-vehicles.md)

## Этап 3. Требования к ПО

Артефакты этого этапа развивались параллельно со вторым этапом.

В репозитории этот пласт знаний в основном живет в `docs/specs/`.

Основные направления:

- функциональные требования к ПО, частично основанные на детально проработанных use case;
- требования к качеству пользовательских интерфейсов;
- требования к внешнему качеству ПО;
- ограничения на решение и реализацию.

Связанные артефакты:

- [docs/specs/functional-requirements/readme.md](../specs/functional-requirements/readme.md)
- [docs/specs/nonfunctional-requirements/readme.md](../specs/nonfunctional-requirements/readme.md)
- [docs/specs/constraints/readme.md](../specs/constraints/readme.md)

## Этап 4. Техническое проектирование IT-решения

На этом этапе команда углубилась в архитектуру системы и базы данных.

### 4.1. Архитектура информационной системы

На основе ES TO-BE были выделены контексты модулей по DDD.

Команда определилась с общей архитектурой решения и выбрала подход модульного монолита.

После этого началась проработка C4-модели.

Связанные артефакты:

- [docs/architecture/ddd/readme.md](../architecture/ddd/readme.md)
- [docs/architecture/c4/readme.md](../architecture/c4/readme.md)
- [docs/architecture/adr/readme.md](../architecture/adr/readme.md)

### 4.2. Технологии баз данных

Параллельно с архитектурой команда углубилась в разработку модели данных.

В качестве целевой СУБД был выбран PostgreSQL.

Подробное текстовое обоснование этого выбора пока не оформлено в репозитории и является отдельной задачей.

ERD детально прорабатывалась в `drawsql.app`.

Параллельно команда тренировалась на SQL-запросах и практических моделях.

Связанные артефакты:

- [docs/architecture/database/readme.md](../architecture/database/readme.md)
- [docs/architecture/database/erd/readme.md](../architecture/database/erd/readme.md)
- [sql/practice/queries/practice.sql](../../sql/practice/queries/practice.sql)
- [sql/practice/ddl/drawSQL-pgsql-export-2026-03-29.sql](../../sql/practice/ddl/drawSQL-pgsql-export-2026-03-29.sql)

### 4.3. Основы информационной безопасности

Параллельно с другими задачами этапа 4 были подготовлены артефакты `Анализ угроз, уязвимостей и их устранение` и `Галстук-бабочка`.

Связанные артефакты:

- [docs/artifacts/infosec/infosec-analyze-parking.md](../artifacts/infosec/infosec-analyze-parking.md)
- [docs/artifacts/infosec/bow-tie-unauthorized-access-to-system-and-data.md](../artifacts/infosec/bow-tie-unauthorized-access-to-system-and-data.md)

### 4.4. Основы алгоритмизации

Как учебное и вспомогательное направление отдельно описывались алгоритмы на языке DRAKON.

Связанные артефакты:

- [docs/artifacts/algorithms/readme.md](../artifacts/algorithms/readme.md)

### 4.5. Постановка задачи для разработчика

На текущий момент команда приближается к этому направлению.

Связанные артефакты:

- [docs/specs/readme.md](../specs/readme.md)
- [docs/architecture/readme.md](../architecture/readme.md)

## Этап 5. Интеграции

Этап еще не начат, но его контур уже понятен.

Ожидаемые направления работы:

- функционально-логическое проектирование интеграций;
- проектирование межсистемного взаимодействия;
- интернет-технологии и форматы JSON/XML;
- интеграции через обмен сообщениями с рассмотрением Kafka и RabbitMQ;
- описание API-методов и интеграционных контрактов через RESTful и SOAP.

Для этого направления в структуре репозитория подготовлен раздел `docs/architecture/integration/`.

Связанные артефакты:

- [docs/architecture/integration/readme.md](../architecture/integration/readme.md)

## Демо-дни как контрольные точки

Результаты по этапам регулярно выносились на демо-дни.

Материалы демонстраций хранятся в `docs/demo-days/`.

Каноничным источником аналитики при этом остаются `docs/artifacts/`, `docs/specs/` и `docs/architecture/`.

Для demo days в репозитории подготовлена единая структура `docs/demo-days/demo-1/` ... `docs/demo-days/demo-5/`.

Ближайший рабочий фокус команды сейчас находится в `docs/demo-days/demo-4/`.

Связанные материалы:

- [docs/demo-days/demo-1/readme.md](../demo-days/demo-1/readme.md)
- [docs/demo-days/demo-2/readme.md](../demo-days/demo-2/readme.md)
- [docs/demo-days/demo-3/readme.md](../demo-days/demo-3/readme.md)
- [docs/demo-days/demo-4/readme.md](../demo-days/demo-4/readme.md)
- [docs/demo-days/demo-5/readme.md](../demo-days/demo-5/readme.md)

## Связанные документы

- [README.md](../../README.md)
- [artifact-placement-guide.md](artifact-placement-guide.md)
- [templates/artifact-from-image-template.md](templates/artifact-from-image-template.md)
- [../artifacts/readme.md](../artifacts/readme.md)
- [../specs/readme.md](../specs/readme.md)
- [../architecture/readme.md](../architecture/readme.md)
- [../demo-days/readme.md](../demo-days/readme.md)

# План: ДЗ по интеграционному UC-8.2 «Создать договор с ЮЛ через ЭДО»

**Дата**: 2026-05-02
**Задача**: подготовить полный комплект учебных артефактов по интеграционному use case UC-8.2 (создание договора с юридическим лицом с подписанием через ЭДО) — 9 deliverables по списку курса.
**Время**: ~10–12 ч (распределено на несколько сессий)

## Зачем именно так

Курс требует выбрать один интеграционный UC и проработать его на всю глубину: от пользовательского описания до OpenAPI-спеки и XML-схемы. UC-8.2 выбран после анализа реестра UC, контекстной диаграммы и [DFD L1](../docs/artifacts/dfd-l1.md):

- внешние системы: **ЭДО** (E12 — нативный XML-канал, СБИС/Диадок) и **Сервис уведомлений** (E8 — JSON SMS/email);
- внутренние модули: **Contract Service ↔ ЭДО Adapter** (hexagonal pattern для XML-сериализации) и **Contract Service → Notification Service** (transactional outbox по [ADR-003](../docs/architecture/adr/adr-003-modular-monolith.md) инв. 4) — обе связи попадают в регламент и ФТ как 2 внутренних интеграции;
- асинхрон с ожиданием подписи контрагента (богатый материал для UML Sequence);
- XML+XSD ложатся на формат документов ЭДО органично, не «по желанию».

**Архитектурное допущение в рамках ДЗ.** В архитектуре проекта ЭДО Adapter отсутствует — `F03/F04` идут напрямую `P14 → E12` ([dfd-l1.md:163-164](../docs/artifacts/dfd-l1.md)). В рамках этого ДЗ вводится **локальный ЭДО Adapter**, который существует только в артефактах UC-8.2 (UC, Sequence, JSON, XML, Swagger, регламент). Принятые источники архитектуры — DFD L1 и C4 L3 — **не правятся**. Если адаптер войдёт в архитектуру проекта — это будет отдельный PR с ADR-007 и обновлением DFD/C4. Эта пометка дублируется в шапке UC-8.2 и в записи регламента.

DADATA-интеграция (автозаполнение реквизитов по ИНН, [ADR-004](../docs/architecture/adr/adr-004-dadata-organization-lookup.md)) **исключена из scope ДЗ** по решению автора — оставляем только ЭДО + Notification как 2 внешние системы.

## Цель

На выходе — 9 артефактов и связанные правки:

1. UC-8.2 — детальный сценарий в `docs/artifacts/use-case/uc-8-2-create-contract-legal-entity.md`.
2. ФТ интеграции — расширение `docs/specs/integration/integration-requirements.md` на ~4 новых `INT-*` требования (2 внешних + 2 внутренних).
3. Регламент v1 — новый блок «Документооборот через ЭДО» в `docs/architecture/integration/is-interaction-regulation.md` (структура без полезной нагрузки).
4. UML Sequence — `docs/architecture/integration/sequence-uc-8-2-create-contract.md` с участниками: Admin Panel UI, Contract Service (P14), Client Profile Service (P3), ЭДО Adapter (локальный), Notification Service (P9), Notification Adapter (P20), ЭДО (E12), Сервис уведомлений (E8).
5. JSON-пример + JSON Schema — `docs/architecture/integration/payload-uc-8-2-create-contract.md` и `schema-uc-8-2-create-contract.md` для внутреннего REST `POST /api/contracts`.
6. Postman-метод — коллекция в `docs/architecture/integration/postman/uc-8-2-create-contract.postman_collection.json`.
7. Swagger/OpenAPI — `docs/architecture/integration/openapi-uc-8-2-create-contract.yaml` для того же endpoint.
8. XML + XSD — `docs/architecture/integration/payload-uc-8-2-edo-contract.xml` и `schema-uc-8-2-edo-contract.xsd` для документа договора в формате ЭДО.
9. Регламент v2 — наполнение блока «Документооборот через ЭДО» протоколами и ссылками на конкретные payload (json/xml).

Плюс правки индексов `docs/architecture/integration/readme.md`, `docs/specs/integration/readme.md`, `docs/artifacts/use-case/readme.md`, запись в `docs/process/traceability-matrix-log.md`.

## Scope

**Входит:**

- Интеграционный UC-8.2 во всём комплекте 9 deliverables.
- Локальный ЭДО Adapter — только в артефактах UC-8.2.
- 2 внешних: ЭДО (E12), Сервис уведомлений (E8).
- 2 внутренних: Contract ↔ ЭДО Adapter, Contract → Notification (через outbox).
- Связь Contract ↔ Client Profile (read через view) — упоминается в UC и Sequence как контекстная, но в регламент/ФТ как «третья интеграция» **не выносится**.

**Не входит:**

- Правка [dfd-l1.md](../docs/artifacts/dfd-l1.md) и [c4-diagrams.md](../docs/architecture/c4/c4-diagrams.md) — принятые артефакты, не трогаем.
- ADR на ЭДО Adapter — отложен до решения «адаптер в архитектуру».
- DADATA-интеграция — исключена.
- UC-8.5 (расторжение договора), UC-8.4 (изменение договора) — отдельные UC, не входят в это ДЗ.
- Реальная конфигурация СБИС/Диадок-провайдера — XSD проектируется как учебный, не привязан к конкретному вендору.

## Тайминг

| Минуты  | Блок    | Что делаем                                                                                                           |
| ------- | ------- | -------------------------------------------------------------------------------------------------------------------- |
| 0–180   | Фаза 1  | UC-8.2 — детальный сценарий по образцу [uc-10-2](../docs/artifacts/use-case/uc-10-2-pay-online-short-term-rental.md) |
| 180–240 | Фаза 2  | ФТ интеграции (4 новых `INT-*`)                                                                                      |
| 240–270 | Фаза 3  | Регламент v1 — структура блока ЭДО                                                                                   |
| 270–360 | Фаза 4  | UML Sequence с локальным ЭДО Adapter                                                                                 |
| 360–420 | Фаза 5  | JSON-пример + JSON Schema внутреннего REST                                                                           |
| 420–510 | Фаза 6  | XML-документ договора + XSD-схема                                                                                    |
| 510–540 | Фаза 7  | Postman-коллекция                                                                                                    |
| 540–600 | Фаза 8  | Swagger/OpenAPI                                                                                                      |
| 600–630 | Фаза 9  | Регламент v2 — наполнение payload                                                                                    |
| 630–660 | Фаза 10 | Индексы + журнал трассировки + ретро                                                                                 |

Тайминг ориентировочный. Реально работаем по фазам, не по часам.

## Правила коммитов и веток

- Ветка: `feature/uc-8-2-edo-integration`.
- Коммиты — атомарные, один артефакт = один коммит. После каждой фазы — пользователь сам делает `npm run commit:atomic` (агент не коммитит).
- Conventional Commits: `docs(artifacts):`, `docs(specs):`, `docs(architecture):`, `docs(process):`.
- PR — после Фазы 10. Описание ссылается на этот план.

## Definition of Done

- [ ] Все 9 deliverables созданы по своим путям (см. секцию «Цель»).
- [ ] В каждом артефакте есть пометка про локальный ЭДО Adapter (где уместно).
- [ ] Регламент v2 ссылается на конкретные payload-файлы (json + xml).
- [ ] Sequence явно показывает 4 внутренних модуля (P14, ЭДО Adapter, P9, P20) + 2 внешних (E12, E8) + опционально P3 как контекст.
- [ ] JSON Schema валидна (запустить через online-валидатор или `ajv`).
- [ ] XSD валидна и XML-пример проходит против неё (`xmllint --schema`).
- [ ] OpenAPI yaml парсится в Swagger Editor.
- [ ] Postman-коллекция импортируется и базовые запросы выполняются (моками или против stub).
- [ ] Журнал трассировки [traceability-matrix-log.md](../docs/process/traceability-matrix-log.md) обновлён записью CHG-\* со ссылкой на этот план.
- [ ] Индексы `readme.md` в integration/ и use-case/ обновлены.
- [ ] `npm run ci:check` зелёный.
- [ ] Ретро написано в `docs/process/retro/2026-05-02-uc-8-2-edo-integration.md` после завершения.
- [ ] Имена файлов — латиница, kebab-case (`npm run lint:file-names` зелёный).
- [ ] Текст без буквы «ё».

## Подпланы

Большие фазы получают отдельный подплан в `plans/`, который создаётся **непосредственно перед стартом фазы** после обсуждения деталей в чате. Подпланы:

- Фаза 1 (UC-8.2) → [2026-05-02-uc-8-2-document.md](2026-05-02-uc-8-2-document.md) ✅
- Фаза 2 (ФТ) → `2026-MM-DD-uc-8-2-functional-requirements.md`
- Фаза 4 (Sequence) → `2026-MM-DD-uc-8-2-sequence.md`
- Фаза 5 (JSON+Schema) → `2026-MM-DD-uc-8-2-rest-api.md`
- Фаза 6 (XML+XSD) → `2026-MM-DD-uc-8-2-edo-xml.md`

Без подплана (механические шаги): Фаза 3 (регламент v1), Фаза 7 (Postman), Фаза 8 (Swagger), Фаза 9 (регламент v2), Фаза 10 (индексы+ретро). Они выполняются по мастер-плану напрямую.

После завершения фазы её статус в мастер-плане переключается на `[x]` со ссылкой на подплан.

## Фазы и статус

- [x] **Фаза 1. UC-8.2 — детальный сценарий.** Подплан: [2026-05-02-uc-8-2-document.md](2026-05-02-uc-8-2-document.md). Создан [uc-8-2-create-contract-legal-entity.md](../docs/artifacts/use-case/uc-8-2-create-contract-legal-entity.md) по структуре uc-10-2 (10 разделов, без шапки с архитектурным допущением — отступление от родительского плана: уровень UC не упоминает внутренние модули, локальный ЭДО Adapter оставлен в этом плане, Sequence и регламенте). Сценарий Б с маршрутом согласования в ЭДО, ~18 шагов основного потока, 7 расширений (`3а`, `6а`, `7а`, `10а`, `10б`, `12а`, `12б`). SLA подписи — 7 календарных дней. Параллельно расширены [концептуальная модель](../docs/artifacts/conceptual-model-with-attributes.md) (+5 значений в enum «Статус договора», +2 атрибута в «Договор») и [ERD `contracts`](../docs/architecture/database/erd/erd-normalized-er-model.md) (`contract_status_enum` до 11 значений, колонки `client_signed_at` / `owner_signed_at`). Финальная агрегированная запись `CHG-*` в [traceability-matrix-log.md](../docs/process/traceability-matrix-log.md) по всему набору 9 артефактов + правки модели/ERD — в Фазе 10 (промежуточный `CHG-20260502-004` зафиксировал только buildin-sync UC-8.2).
- [ ] **Фаза 2. Пользовательские требования к интеграции (ФТ).** Расширить `docs/specs/integration/integration-requirements.md` на 4 новых `INT-*`: по одному на каждую интеграцию (2 внешних: ЭДО, Notification; 2 внутренних: Contract↔EDO Adapter, Contract→Notification outbox). Каждое требование — формат курса (источник/приёмник, событие, данные, периодичность).
- [ ] **Фаза 3. Регламент взаимодействия ИС v1 (структура).** Добавить блок «Документооборот через ЭДО» в `docs/architecture/integration/is-interaction-regulation.md` по образцу блока 2 (онлайн-оплата). Заполнить колонки «Система-источник / Приёмник / Передаваемые данные / Полный объём / Периодичность / Протокол / Полезная нагрузка». Колонки «Протокол» и «Полезная нагрузка» — `уточняется` (заполним в Фазе 9).
- [ ] **Фаза 4. UML Sequence.** Создать `docs/architecture/integration/sequence-uc-8-2-create-contract.md`. Mermaid sequenceDiagram. Участники: Admin Panel, P14 Contract, P3 Client Profile (read), **EDO Adapter (локальный)**, P9 Notification, P20 Notification Adapter, E12 ЭДО, E8 Сервис уведомлений. Показать асинхрон с ожиданием подписи (полл/webhook). В шапке диаграммы — note про локальный адаптер.
- [ ] **Фаза 5. JSON-пример + JSON Schema.** Спроектировать внутренний REST endpoint `POST /api/contracts` (Admin Panel → P14). Создать `docs/architecture/integration/payload-uc-8-2-create-contract.md` (request + response пример) и `schema-uc-8-2-create-contract.md` (JSON Schema). Валидировать через `ajv` или Swagger Editor.
- [ ] **Фаза 6. XML + XSD для ЭДО.** Спроектировать XML-документ договора для отправки в ЭДО (P21 → E12). Создать `docs/architecture/integration/payload-uc-8-2-edo-contract.xml` (пример документа) и `schema-uc-8-2-edo-contract.xsd` (XSD-схема). Валидировать через `xmllint --schema`.
- [ ] **Фаза 7. Postman-коллекция.** Создать `docs/architecture/integration/postman/uc-8-2-create-contract.postman_collection.json` для endpoint `POST /api/contracts` + опц. `GET /api/contracts/{id}/status`. Импортируется в Postman, базовый запрос выполняется (mock сервер или stub).
- [ ] **Фаза 8. Swagger/OpenAPI.** Создать `docs/architecture/integration/openapi-uc-8-2-create-contract.yaml` — спека для того же endpoint. Парсится в Swagger Editor без ошибок. Ссылается на JSON Schema из Фазы 5 (через `$ref` или inline).
- [ ] **Фаза 9. Регламент взаимодействия v2 (наполнение).** Заполнить колонки «Протокол» и «Полезная нагрузка» в блоке «Документооборот через ЭДО» с ссылками на артефакты Фаз 5/6 (json/xml).
- [ ] **Фаза 10. Индексы, трассировка, ретро.** Обновить `docs/architecture/integration/readme.md`, `docs/specs/integration/readme.md`, `docs/artifacts/use-case/readme.md`. Записать `CHG-*` в `docs/process/traceability-matrix-log.md`. Написать ретро в `docs/process/retro/2026-05-02-uc-8-2-edo-integration.md` по формату [docs/process/retro/README.md](../docs/process/retro/README.md). Прогнать `npm run ci:check`.

## Итог

План создан 2026-05-02. Заполнится по ходу работы: какие фазы завершены, какие решения приняты по пути, какие открытые вопросы остались.

### Фаза 1 завершена 2026-05-02

Подплан: [2026-05-02-uc-8-2-document.md](2026-05-02-uc-8-2-document.md).

**Артефакты:**

- [uc-8-2-create-contract-legal-entity.md](../docs/artifacts/use-case/uc-8-2-create-contract-legal-entity.md) — UC по структуре uc-10-2 (10 разделов), Сценарий Б с маршрутом согласования в ЭДО, ~18 шагов, 7 расширений (`3а`, `6а`, `7а`, `10а`, `10б`, `12а`, `12б`).
- [conceptual-model-with-attributes.md](../docs/artifacts/conceptual-model-with-attributes.md) — расширен `Enum: Статус договора` (+5: `на подписании клиентом`, `на подписании парковкой`, `отклонен клиентом`, `отклонен парковкой`, `просрочен`), добавлены атрибуты `датаПодписанияКлиентом`, `датаПодписанияПарковкой` в сущность «Договор».
- [erd-normalized-er-model.md](../docs/architecture/database/erd/erd-normalized-er-model.md) — `contract_status_enum` расширен до 11 значений, добавлены колонки `client_signed_at TIMESTAMPTZ`, `owner_signed_at TIMESTAMPTZ` (nullable). Mermaid-блок и сводная таблица синхронизированы.
- [traceability-matrix-log.md](../docs/process/traceability-matrix-log.md) — `CHG-20260502-004` зафиксировал только buildin-sync UC-8.2; финальная агрегированная запись на весь набор 9 артефактов + правки модели/ERD — в Фазе 10.

**Ключевые решения, принятые в Фазе 1** (важны для последующих фаз):

- **Отступление от родительского плана**: пометка про локальный ЭДО Adapter в шапке UC **не делается** — уровень UC не упоминает внутренние модули. Допущение остается в этом мастер-плане, в Sequence (Фаза 4) и регламенте (Фазы 3/9).
- **Граничное условие**: создание бронирований (шаг 15 UC) — часть UC-8.2, не передача в UC-7.1. Поток `Contract → Facility` упоминается только бизнес-формулировкой «создает бронирования» без раскрытия модулей. В регламенте/ФТ как «третья внутренняя интеграция» **не выносится** — фиксируем только `Contract ↔ ЭДО Adapter` и `Contract → Notification`.
- **Уведомление Владельца** на стороне платформы отсутствует — это делает ЭДО (его кабинет уведомляет автоматически). Промежуточно подписанный документ к нам не приезжает.
- **SLA подписи** — 7 календарных дней на каждый этап (клиент → Владелец). Заказчиком не озвучивалось, выбрано на основе практики российских ЭДО (Диадок/СБИС: 5–10 дней). Параметр выносится в конфигурацию.
- **Запись `CHG-*` в журнал трассировки** делается **в Фазе 10**, одной общей записью на весь набор 9 артефактов + правки концептуальной модели и ERD (а не пофазно).

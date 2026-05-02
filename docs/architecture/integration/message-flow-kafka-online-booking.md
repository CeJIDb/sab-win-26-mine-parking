---
version: 0.1.0
last_updated: 2026-04-30
author: System Analyst
status: учебный TO-BE
---

# DFD конвейера потоков данных Kafka — онлайн-бронирование (учебный TO-BE)

## Оглавление

- [Назначение](#назначение)
- [Контекст и источник](#контекст-и-источник)
- [Расхождения с ADR-003](#расхождения-с-adr-003)
- [Учебное упрощение по UC-10.2](#учебное-упрощение-по-uc-102)
- [DFD K-L1 — обзор конвейера](#dfd-k-l1--обзор-конвейера)
  - [Диаграмма K-L1](#диаграмма-k-l1)
  - [Словарь потоков K-L1](#словарь-потоков-k-l1)
- [DFD K-L2 — детализация по топикам](#dfd-k-l2--детализация-по-топикам)
  - [Диаграмма K-L2](#диаграмма-k-l2)
  - [Словарь потоков K-L2](#словарь-потоков-k-l2)
- [Текстовое описание сценария](#текстовое-описание-сценария)
- [Балансировка с UC-12.2 и UC-10.2](#балансировка-с-uc-122-и-uc-102)
- [Примечание про схемы PostgreSQL и outbox](#примечание-про-схемы-postgresql-и-outbox)
- [Связанные документы](#связанные-документы)

## Назначение

Артефакт показывает учебный TO-BE поток данных через Kafka для сквозной цепочки «создать бронь → выставить счет → оплатить → подтвердить → уведомить». Декомпозиция дана на двух уровнях по формату телемед-референса курса:

- **K-L1** — обзорная диаграмма с одним блоком Kafka в центре (фокус на producer'ах, consumer'ах, БД и внешних системах);
- **K-L2** — детализация с явными топиками (фокус на потоках событий между конкретными топиками и их подписчиками).

Префикс `K-` намеренно отличается от производственного `L1` в [DFD Level 1](../../artifacts/dfd-l1.md), чтобы оба артефакта легко отличались в навигации и трассировке.

## Контекст и источник

- Этап проекта: ДЗ курса по теме брокеров сообщений (учебный TO-BE).
- Тип артефакта: DFD конвейера потоков данных Kafka (двухуровневый).
- Бизнес-сценарий: склейка [UC-12.2 «Создать бронирование автоматически на въезде»](../../artifacts/use-case/uc-12-2-create-booking-auto-entry.md) и [UC-10.2 «Оплатить онлайн (краткосрочная аренда)»](../../artifacts/use-case/uc-10-2-pay-online-short-term-rental.md) + уведомление клиента.
- Источник истины: [assets/k-l1.jpg](assets/k-l1.jpg) и [assets/k-l2.jpg](assets/k-l2.jpg) — экспорт из draw.io. При расхождении со словарем потоков и трассировочными таблицами в этом документе побеждает JPG.
- Источник формата: ~~JPG-референсы в `plans/kafka/`~~ (удалено).
- Имена компонентов соответствуют [C4 L3](../c4/c4-diagrams.md): `Booking Service`, `Billing Service`, `Payment Service`, `Pricing Service`, `Notification Service`, `Access Control Service`, `Payment Adapter`, `Notification Adapter`.
- Связанное архитектурное решение: [ADR-007 «Kafka event bus для онлайн-бронирования»](../adr/adr-007-kafka-event-bus-online-booking.md).
- Каноничное архитектурное решение, поверх которого вводится учебный TO-BE: [ADR-003 «Модульный монолит»](../adr/adr-003-modular-monolith.md).
- Статус: **учебный TO-BE** — не подменяет ADR-003 и `docs/specs/`, оформлен только в архитектурном слое.

## Расхождения с ADR-003

Учебный TO-BE сознательно расходится с действующими инвариантами ADR-003 в трех точках. Расхождения зафиксированы здесь и продублированы в Status ADR-007:

1. **Инв. 4 (transactional outbox)** — паттерн сохранен у producer'ов Kafka: `Booking` и `Payment` коммитят бизнес-данные и запись в outbox-таблицу одной локальной транзакцией PostgreSQL. `Billing` в Kafka не публикует (`InvoiceCreated` намеренно не делаем, интеграция с 1С — синхронная), поэтому outbox-таблицы у него нет. Меняется конечное звено: hand-off из outbox в Kafka выполняет CDC-процесс (Debezium как пример инструмента), а не `Notification Worker`. Это закрывает dual-write и сохраняет at-least-once.
2. **Инв. 5 (изоляция по схемам в одной БД)** — на DFD логически отдельные «БД Бронирований / Биллинга / Уведомлений» нарисованы для визуальной унификации. Физически — одна PostgreSQL со схемами `booking_*`, `billing_*`, `notification_*` (см. [примечание про схемы](#примечание-про-схемы-postgresql-и-outbox)).
3. **Notification Worker** — переопределен. По ADR-003 это отдельный процесс без своего хранилища, читающий табличную outbox-очередь. В учебном TO-BE `Notification Service` становится Kafka-consumer'ом со своей schema'ой `notification_*` для шаблонов и истории доставки.

[ADR-005](../adr/adr-005-access-control-direct-db-read.md) **сохраняется без изменений**: `Access Control Service` остается pull-моделью, читает чужие агрегаты через именованные SQL view (`v_access_*`) на горячем пути КПП и в Kafka-потоке онлайн-бронирования не участвует. Push через `BookingConfirmed` создал бы race condition при отмене брони и параллельный кеш чужого состояния, что ADR-005 как раз исключает.

## Учебное упрощение по UC-10.2

В исходнике UC-10.2 предусловие — «существует активная парковочная сессия». В учебном TO-BE UC-10.2 запускается **не от существующей ПС, а от свежесозданной брони UC-12.2**. Это явное дидактическое упрощение, чтобы сквозная цепочка осталась короткой и сопоставимой с телемед-референсом. Каноничное предусловие UC-10.2 в `docs/artifacts/use-case/` не меняется.

## DFD K-L1 — обзор конвейера

На этом уровне Kafka показана одним оранжевым блоком в центре. Видны все producer'ы Kafka со своими БД (бизнес-таблица + outbox), consumer'ы и внешние системы. БД consumer'ов (Billing, Notification) на схеме не отрисованы — они не участвуют в Kafka-потоке как источник событий (см. [примечание про схемы](#примечание-про-схемы-postgresql-и-outbox)). CDC-процесс показан явно — это отдельный узел между outbox-таблицами и Kafka.

`Booking Service` выступает **оркестратором** сценария: синхронно командует `Pricing Service` рассчитать сумму, синхронно командует `Payment Service` инициировать платеж, асинхронно через Kafka получает `PaymentCompleted` и подтверждает бронь. Это правильное распределение: горячий путь оплаты (требует ответа пользователю) — синхронный, side-effects (счет, уведомления) — асинхронные через Kafka. PWA общается только с Booking как facade.

Внешние системы интегрированы через адаптеры (по [C4 L3](../c4/c4-diagrams.md) и [DFD L1](../../artifacts/dfd-l1.md)): `Payment Service` работает с ЮKassa через `Payment Adapter`, `Notification Service` — с внешним сервисом уведомлений (SMS / push / email) через `Notification Adapter`. Адаптеры изолируют детали внешних протоколов — доменные сервисы общаются с ними на языке предметной области.

`Pricing Service` в Kafka не публикует (антипаттерн «функция как топик» исключен). 1С получает финансовые данные синхронно от `Billing Service`, не напрямую из Kafka. `Access Control Service` на схеме отсутствует — по [ADR-005](../adr/adr-005-access-control-direct-db-read.md) он работает pull-моделью (читает БД через `v_access_*` view при подъезде машины к шлагбауму) и в Kafka-потоке онлайн-бронирования не участвует.

### Диаграмма K-L1

![DFD K-L1 — обзор Kafka-конвейера онлайн-бронирования](assets/k-l1.jpg)

Источник — draw.io; при правке исходника обязательно обновлять JPG-экспорт в `assets/`.

### Словарь потоков K-L1

| Поток                   | Смысл                                                                                                                      | Пример полезной нагрузки                                                                |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| commit booking + outbox | Атомарная запись бизнес-таблицы и outbox в одной транзакции PostgreSQL                                                     | INSERT bookings(id, vehicle_id, sector_id, ...); INSERT booking_outbox                  |
| commit payment + outbox | Атомарная запись бизнес-таблицы и outbox в одной транзакции PostgreSQL                                                     | INSERT payments(id, invoice_id, status); INSERT payment_outbox                          |
| calculate price         | Синхронный внутрипроцессный вызов Booking → Pricing, не событие                                                            | calc(zoneTypeId, vehicleType, periodMin) -> amountKop                                   |
| initiate payment        | Синхронная команда Booking → Payment запустить платежную процедуру                                                         | initiatePayment(bookingId, amount, currency, returnUrl) -> {paymentId, confirmationUrl} |
| read outbox             | CDC-процесс читает изменения outbox-таблиц                                                                                 | LSN-курсор по WAL PostgreSQL                                                            |
| publish events          | CDC публикует события в соответствующие топики Kafka (детализация на K-L2)                                                 | См. K-L2                                                                                |
| BookingCreated          | Событие создания брони (из K-L2 — `Topic_BookingCreated`)                                                                  | { eventId, bookingId, vehicleId, plannedStart }                                         |
| PaymentCompleted        | Событие успешной оплаты (из K-L2 — `Topic_PaymentCompleted`)                                                               | { eventId, bookingId, paymentId, amount, currency }                                     |
| BookingConfirmed        | Событие подтверждения брони (из K-L2 — `Topic_BookingConfirmed`)                                                           | { eventId, bookingId, confirmedAt }                                                     |
| register payment        | Синхронная цепочка Payment Service → Payment Adapter → ЮKassa: регистрация платежа на стороне платежного провайдера        | POST /payments { amount, invoice_id, callback_url } → { paymentId, confirmation_url }   |
| send notification       | Синхронная цепочка Notification Service → Notification Adapter → внешний сервис: отправка SMS/push/email конечному клиенту | POST /notifications { channel, template_id, recipient, payload } → { delivery_id }      |
| send financial data     | Синхронный вызов `Billing Service` → 1С, не через Kafka                                                                    | POST /1c/invoices { invoice_id, amount, paid_at, transaction_id }                       |

## DFD K-L2 — детализация по топикам

На этом уровне центральный блок Kafka раскрыт в три синих топика. Видно, какой топик пишет какой producer и какие consumer'ы получают какое событие. `Topic_InvoiceCreated` намеренно отсутствует — у него был бы единственный consumer (Payment), это RPC, обернутый в Kafka, антипаттерн «функция как топик».

### Диаграмма K-L2

![DFD K-L2 — детализация Kafka-конвейера по топикам](assets/k-l2.jpg)

Источник — draw.io; при правке исходника обязательно обновлять JPG-экспорт в `assets/`.

### Словарь потоков K-L2

| Поток / событие                                              | Смысл                                                                                                                            | Пример полезной нагрузки                                                                |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| commit booking + outbox                                      | Атомарная запись бизнес-таблицы и outbox в одной транзакции PostgreSQL                                                           | INSERT bookings(id, vehicle_id, sector_id, ...); INSERT booking_outbox                  |
| commit payment + outbox                                      | Атомарная запись бизнес-таблицы и outbox в одной транзакции PostgreSQL                                                           | INSERT payments(id, invoice_id, status); INSERT payment_outbox                          |
| BookingCreated                                               | Бронирование создано, биллинг и уведомления должны отреагировать. Полный payload одинаков для всех consumer'ов                   | { eventId, bookingId, vehicleId, sectorId, plannedStart, tariffId }                     |
| PaymentCompleted                                             | Оплата успешно завершена у ЮKassa, бронь можно подтверждать, бухгалтерия фиксирует. Полный payload одинаков для всех consumer'ов | { eventId, bookingId, paymentId, amount, currency, paidAt, transactionId }              |
| BookingConfirmed                                             | Бронь окончательно подтверждена, право проезда и уведомление актуализируются                                                     | { eventId, bookingId, confirmedAt, validUntil }                                         |
| InvoiceCreated (не публикуется)                              | Намеренно не превращается в топик — единственный consumer был бы Payment, это RPC                                                | —                                                                                       |
| publish BookingCreated / PaymentCompleted / BookingConfirmed | CDC берет запись outbox и публикует в Kafka с ключом `bookingId`                                                                 | См. ключ партиционирования в `kafka-requirements.md`                                    |
| calculate price                                              | Внутрипроцессный синхронный вызов Booking → Pricing, в Kafka не публикуется                                                      | calc(zoneTypeId, vehicleType, periodMin) -> amountKop                                   |
| initiate payment                                             | Синхронная команда Booking → Payment запустить платежную процедуру                                                               | initiatePayment(bookingId, amount, currency, returnUrl) -> {paymentId, confirmationUrl} |
| register payment                                             | Синхронная цепочка Payment Service → Payment Adapter → ЮKassa: регистрация платежа на стороне платежного провайдера              | POST /payments { amount, invoice_id, callback_url } → { paymentId, confirmation_url }   |
| send notification                                            | Синхронная цепочка Notification Service → Notification Adapter → внешний сервис: отправка SMS/push/email конечному клиенту       | POST /notifications { channel, template_id, recipient, payload } → { delivery_id }      |
| send financial data                                          | Синхронный вызов `Billing Service` → 1С, не через Kafka                                                                          | POST /1c/invoices { invoice_id, amount, paid_at, transaction_id }                       |

## Текстовое описание сценария

Сквозная цепочка — 10 шагов от создания брони до уведомления клиента:

1. **Booking Service** получает запрос на бронирование (триггер UC-12.2: автозапись на въезде; в учебном TO-BE — также «забронировать ПМ заранее» в ЛК) и синхронно вызывает **Pricing Service**, чтобы рассчитать сумму к оплате. Pricing работает в одном процессе с Booking, в Kafka не публикует.
2. **Booking Service** в одной локальной транзакции PostgreSQL коммитит запись в `bookings` и запись `BookingCreated` в `booking_outbox`.
3. **CDC** (Debezium как пример) читает `booking_outbox` и публикует событие в **Topic_BookingCreated** с ключом `bookingId`.
4. **Billing Service** подписан на `Topic_BookingCreated`, создает счет в `invoices`. В Kafka событие `InvoiceCreated` не публикуется (антипаттерн «функция как топик»), поэтому outbox-таблицы у Billing нет.
5. **Notification Service** также подписан на `Topic_BookingCreated` и отправляет клиенту уведомление «бронь принята к оплате» через **Notification Adapter** во внешний сервис уведомлений (SMS / push / email).
6. **Booking Service** выступает оркестратором сценария: после того как пользователь подтвердил готовность платить в PWA, Booking синхронно вызывает **Payment Service** командой «инициировать платеж» (передает `bookingId`, `amount`, `currency`, `return_url`). По C4 ([§187](../c4/c4-diagrams.md)) PWA знает только про Booking, про Payment — нет. **Payment Service** через **Payment Adapter** синхронным REST-вызовом регистрирует платеж в **ЮKassa**, получает `confirmation_url`, возвращает его Booking → PWA. Пользователь оплачивает на стороне ЮKassa. ЮKassa отправляет webhook в Payment Adapter, тот передает событие в Payment Service. Payment в одной локальной транзакции коммитит запись в `payments` и `PaymentCompleted` в `payment_outbox`.
7. **CDC** публикует событие в **Topic_PaymentCompleted** с ключом `bookingId`.
8. **Booking Service** подписан на `Topic_PaymentCompleted`, переводит бронь в статус `Confirmed` и в одной транзакции коммитит `BookingConfirmed` в `booking_outbox`. **Billing Service** также подписан на `Topic_PaymentCompleted` (фан-аут): закрывает задолженность по счету в `invoices` и синхронным REST-вызовом передает финансовые данные в **1С** для бухгалтерского учета.
9. **CDC** публикует событие в **Topic_BookingConfirmed** с ключом `bookingId`.
10. **Notification Service** отправляет клиенту уведомление «бронь подтверждена» через **Notification Adapter** во внешний сервис уведомлений (SMS / push / email). **Access Control Service** в Kafka-потоке не участвует — по [ADR-005](../adr/adr-005-access-control-direct-db-read.md) он работает pull-моделью: при подъезде машины к шлагбауму получает событие от СКУД/LPR и сам читает актуальное состояние брони из БД через именованные view (`v_access_*`). Push через Kafka здесь не нужен и был бы антипаттерном (race condition при отмене брони, кеш с потенциально устаревшим состоянием).

## Балансировка с UC-12.2 и UC-10.2

| Шаг сценария | События Kafka                                      | Шаги UC-12.2                                        | Шаги UC-10.2                                                                           |
| ------------ | -------------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 1            | —                                                  | Шаги 1–4 основного потока (поиск тарифа, ПМ, бронь) | Предусловие учебного TO-BE: бронь существует                                           |
| 2            | запись в booking_outbox                            | Шаг 4 (создание бронирования)                       | —                                                                                      |
| 3            | publish Topic_BookingCreated                       | —                                                   | —                                                                                      |
| 4            | consume Topic_BookingCreated → Billing             | —                                                   | Шаг 1 (создание [платеж] трансформирован в выставление счета через Billing)            |
| 5            | consume Topic_BookingCreated → Notification        | —                                                   | Шаг 14 (уведомление; в учебном TO-BE расщеплен на «принята к оплате» и «подтверждена») |
| 6            | запись в payment_outbox                            | —                                                   | Шаги 3–7 (регистрация в Платежной системе, обновление статуса)                         |
| 7            | publish Topic_PaymentCompleted                     | —                                                   | —                                                                                      |
| 8            | consume Topic_PaymentCompleted → Booking + Billing | Шаг 5 (изменение ПМ «зарезервировано»)              | Шаги 8 (статус «Оплачено») + Billing синхронно передает данные в 1С (бухгалтерия)      |
| 9            | publish Topic_BookingConfirmed                     | —                                                   | —                                                                                      |
| 10           | consume Topic_BookingConfirmed → Notification      | —                                                   | Шаг 14 (повторное уведомление о подтверждении)                                         |

Шаги UC-10.2 9–13 (фискализация чека через ОФД) **в учебном TO-BE опущены** — они out of scope, чтобы не усложнять конвейер; обоснование — в Status ADR-007.

## Примечание про схемы PostgreSQL и outbox

На обеих диаграммах нарисованы логически отдельные «БД Бронирований / Биллинга / Платежей / Уведомлений» — это визуальная унификация с телемед-референсом, не физическое разделение. По [ADR-003 инв. 5](../adr/adr-003-modular-monolith.md) основной процесс работает с одной PostgreSQL, изолированной по схемам:

- `booking_*` — таблицы `bookings`, `booking_status_history`, `booking_outbox`;
- `billing_*` — таблицы `invoices`, `receipts` (без outbox — Billing в Kafka не публикует, интеграция с 1С синхронная);
- `payment_*` (внутри схемы биллинга или отдельной) — таблицы `payments`, `refunds`, `payment_outbox`;
- `notification_*` — таблицы `notifications`, `notification_templates` (новая schema, переопределяющая `Notification Worker` из ADR-003).

Outbox-таблица в `booking_*` и `payment_*` физически рядом с бизнес-таблицами. Это сохраняет ключевое свойство ADR-003 инв. 4: запись бизнес-данных и outbox-события в одной локальной транзакции, без распределенных транзакций. Hand-off в Kafka выполняет CDC по WAL PostgreSQL — это и есть единственное расхождение с инв. 4 (был `Notification Worker`, стал CDC + Kafka).

Schema `billing_*` и `notification_*` физически существуют, но **на K-L1 и K-L2 не отрисованы**, потому что не участвуют в Kafka-потоке как источник событий: `Billing Service` и `Notification Service` — чистые Kafka-consumer'ы, что они делают со своими таблицами (создают счет, пишут историю доставки) — их внутренняя бизнес-логика, не часть DFD конвейера. Если в будущем Notification станет producer'ом для другого брокера (например, RabbitMQ для каналов доставки) — `notification_outbox` появится в соответствующем артефакте, не здесь.

## Связанные документы

- [ADR-007 «Kafka event bus для онлайн-бронирования»](../adr/adr-007-kafka-event-bus-online-booking.md) — обоснование выбора Kafka и решения по антипаттернам (`Pricing Service` синхронный, `Topic_InvoiceCreated` не делаем, dual-write через outbox + CDC).
- [Требования к Kafka](kafka-requirements.md) — две таблицы (технические параметры топиков и семантика доставки) для `Topic_BookingCreated`, `Topic_PaymentCompleted`, `Topic_BookingConfirmed`.
- [UC-12.2 «Создать бронирование автоматически на въезде»](../../artifacts/use-case/uc-12-2-create-booking-auto-entry.md) — первая половина сквозного бизнес-сценария.
- [UC-10.2 «Оплатить онлайн (краткосрочная аренда)»](../../artifacts/use-case/uc-10-2-pay-online-short-term-rental.md) — вторая половина сквозного бизнес-сценария (с учебным упрощением по предусловию).
- [ADR-003 «Модульный монолит»](../adr/adr-003-modular-monolith.md) — каноничное архитектурное решение, поверх которого вводится учебный TO-BE; источник инвариантов 4 (outbox) и 5 (схемы) и определения `Notification Worker`.
- [DFD Level 1 проекта](../../artifacts/dfd-l1.md) — производственная декомпозиция платформы; этот артефакт ее не подменяет, префикс `K-` намеренно отличается.

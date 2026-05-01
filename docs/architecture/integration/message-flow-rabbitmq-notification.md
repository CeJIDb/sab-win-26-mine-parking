---
version: 0.1.0
last_updated: 2026-05-01
author: System Analyst
status: учебный TO-BE
---

# DFD конвейера потоков данных RabbitMQ — рассылка уведомлений (учебный TO-BE)

## Оглавление

- [Назначение](#назначение)
- [Контекст и источник](#контекст-и-источник)
- [DFD R-L1 — обзор конвейера](#dfd-r-l1--обзор-конвейера)
  - [Диаграмма R-L1](#диаграмма-r-l1)
  - [Словарь потоков R-L1](#словарь-потоков-r-l1)
- [DFD R-L2 — детализация RabbitMQ](#dfd-r-l2--детализация-rabbitmq)
  - [Диаграмма R-L2](#диаграмма-r-l2)
  - [Словарь потоков R-L2](#словарь-потоков-r-l2)
- [Текстовое описание сценария](#текстовое-описание-сценария)
- [Балансировка «событие Kafka → команда RMQ → канал доставки»](#балансировка-событие-kafka--команда-rmq--канал-доставки)
- [Примечание про схему notification\_\* и таблицу push_inbox](#примечание-про-схему-notification_-и-таблицу-push_inbox)
- [Связанные документы](#связанные-документы)

## Назначение

Артефакт показывает учебный TO-BE поток команд через RabbitMQ для рассылки уведомлений в bounded context Notification. RMQ оформлен как work queue команд внутри одного контекста — продолжение Kafka-конвейера из ADR-007. Единственный publisher в RMQ — `Notification Service`, который слушает Kafka-топики `Topic_BookingCreated` и `Topic_BookingConfirmed` и публикует команды на доставку в три канала (SMS / email / push). Декомпозиция дана на двух уровнях — симметрично Kafka-документу:

- **R-L1** — обзорная диаграмма с RabbitMQ одним оранжевым блоком в центре (фокус на источниках Kafka, Notification Service как publisher, трех воркерах, БД и внешних провайдерах);
- **R-L2** — детализация с явными exchanges и queues (`notification.direct` с тремя routing keys + `notification.dlx` с одной DLQ).

Префикс `R-` симметричен `K-` из Kafka-документа. Артефакт опирается на [ADR-007 «Kafka event bus для онлайн-бронирования»](../adr/adr-007-kafka-event-bus-online-booking.md) (источник Kafka-триггеров) и [ADR-008 «RabbitMQ для рассылки уведомлений»](../adr/adr-008-rabbitmq-notification-dispatch.md) (топология exchanges/queues, дисциплина acknowledgements, дедупликация).

## Контекст и источник

- Этап проекта: ДЗ курса по теме брокеров сообщений (учебный TO-BE).
- Тип артефакта: DFD конвейера потоков данных RMQ (двухуровневый), формат — Mermaid с `classDef` для последующей перерисовки в draw.io в едином стиле с K-L1/K-L2.
- Bounded context: Notification.
- Триггеры из Kafka (publisher — Booking, см. ADR-007): `Topic_BookingCreated` (бронь принята к оплате) и `Topic_BookingConfirmed` (бронь подтверждена). `Topic_PaymentCompleted` Notification напрямую не слушает.
- Единственный publisher в RMQ — `Notification Service` (он же Kafka-consumer). Воркеры (SMS / Email / Push) — единственные consumer'ы своих очередей.
- Имена компонентов соответствуют [C4 L3](../c4/c4-diagrams.md): `Notification Service`, `Notification Adapter`.
- Палитра и легенда — по образцу [K-L1.jpg](assets/k-l1.jpg) и [K-L2.jpg](assets/k-l2.jpg). CDC в R-документе нет — `Notification Service` потребляет Kafka напрямую, без outbox.
- Каноничное архитектурное решение, поверх которого вводится учебный TO-BE: [ADR-003 «Модульный монолит»](../adr/adr-003-modular-monolith.md). Расхождение с ADR-003 — одно: новая таблица `notification.push_inbox` в существующей schema `notification_*` (см. [примечание](#примечание-про-схему-notification_-и-таблицу-push_inbox)).

## DFD R-L1 — обзор конвейера

На этом уровне RabbitMQ показан одним оранжевым блоком в центре. Видны Kafka-источники (`Topic_BookingCreated`, `Topic_BookingConfirmed`), `Notification Service` как единственный publisher в RMQ, три воркера канала (SMS / Email / Push), БД Уведомлений (схема `notification_*` с таблицами `notification_templates`, `notification_history`, `push_inbox`), внешние провайдеры (SMS-сервис, почтовый сервис) и адаптер `Notification Adapter` между SMS/Email-воркерами и внешними системами. Push Worker во внешний провайдер не ходит — пишет напрямую в `notification.push_inbox`, откуда PWA забирает уведомления через существующий REST API.

### Диаграмма R-L1

```mermaid
flowchart LR
    %% Источники Kafka
    subgraph KAFKA["Kafka"]
        TBC["Topic_BookingCreated"]
        TBCF["Topic_BookingConfirmed"]
    end

    %% Notification Service — единственный publisher в RMQ
    NS["Notification Service<br/>[Component]<br/>Формирование и маршрутизация уведомлений"]

    %% RabbitMQ одним блоком
    RMQ["RabbitMQ<br/>work queue команд<br/>на доставку уведомлений"]

    %% Воркеры
    SMSW["SMS Worker<br/>[Component]<br/>Отправка SMS"]
    EMW["Email Worker<br/>[Component]<br/>Отправка email"]
    PSW["Push Worker<br/>[Component]<br/>Запись push в БД"]

    %% Адаптер
    NA["Notification Adapter<br/>[Component]<br/>Интеграция с провайдерами"]

    %% Внешние системы
    SMSP["SMS-провайдер<br/>[Software System]<br/>Внешний шлюз SMS"]
    MAIL["Почтовый сервис<br/>[Software System]<br/>Внешний SMTP / API"]

    %% БД Уведомлений
    DB[("БД Уведомлений<br/>schema notification_*<br/>notification_templates<br/>notification_history<br/>push_inbox")]

    %% Поток Kafka → Notification Service
    TBC -- "BookingCreated" --> NS
    TBCF -- "BookingConfirmed" --> NS

    %% Этап 1 дедупликации и публикация в RMQ
    NS -. "INSERT history (queued)" .-> DB
    NS == "publish команд<br/>routing key sms / email / push" ==> RMQ

    %% Доставка из RMQ воркерам
    RMQ == "deliver sms" ==> SMSW
    RMQ == "deliver email" ==> EMW
    RMQ == "deliver push" ==> PSW

    %% Этап 2 дедупликации
    SMSW -. "UPDATE history (sent)" .-> DB
    EMW  -. "UPDATE history (sent)" .-> DB
    PSW  -. "INSERT push_inbox" .-> DB

    %% Воркеры → адаптер → провайдеры
    SMSW -- "send sms" --> NA
    EMW  -- "send email" --> NA
    NA -. "POST /sms" .-> SMSP
    NA -. "POST /mail" .-> MAIL

    %% Легенда
    subgraph LEGEND["Легенда"]
        direction TB
        L_C["Компонент"]
        L_A["Адаптер"]
        L_E["Внешняя система"]
        L_X["RMQ Exchange"]
        L_Q["RMQ Queue"]
        L_DB[("БД")]
        L1["━━▶ межсервисное взаимодействие"]
        L2["═══▶ публикация и доставка через RMQ"]
        L3["⋯⋯▶ соединение с БД и внешним сервисом"]
    end

    %% classDef — палитра, симметричная K-L1/K-L2
    classDef component fill:#1B6FC8,stroke:#1B6FC8,stroke-width:1px,color:#ffffff
    classDef adapter fill:#4338ca,stroke:#4338ca,stroke-width:1px,color:#ffffff
    classDef external fill:#374151,stroke:#374151,stroke-width:1px,color:#ffffff
    classDef db fill:#4b5563,stroke:#8899AA,stroke-width:1px,stroke-dasharray:5 3,color:#ffffff
    classDef rmq_exchange fill:#ED8936,stroke:#C05621,stroke-width:1px,color:#1f2937
    classDef rmq_queue fill:#FBD38D,stroke:#C05621,stroke-width:1px,color:#1f2937
    classDef rmq_dlx fill:#C05621,stroke:#7B341E,stroke-width:1px,color:#ffffff
    classDef rmq_dlq fill:#C53030,stroke:#7B1D1D,stroke-width:1px,color:#ffffff
    classDef topic fill:#f8cecc,stroke:#b85450,stroke-width:1px,color:#1f2937
    classDef legend fill:#EEF2F7,stroke:#8899AA,stroke-width:1px,color:#1f2937

    class NS,SMSW,EMW,PSW,L_C component
    class NA,L_A adapter
    class SMSP,MAIL,L_E external
    class DB,L_DB db
    class RMQ,L_X rmq_exchange
    class L_Q rmq_queue
    class TBC,TBCF topic
    class LEGEND,L1,L2,L3 legend
```

### Словарь потоков R-L1

| Поток                                                         | Что течет                                                                                                                                                       | Формат                                                                                                                                                                                                                                      |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Topic_BookingCreated → Notification Service`                 | Событие «бронь принята к оплате» из Kafka, триггер на отправку SMS и email                                                                                      | `{ eventId, bookingId, vehicleId, sectorId, plannedStart, tariffId }`                                                                                                                                                                       |
| `Topic_BookingConfirmed → Notification Service`               | Событие «бронь подтверждена» из Kafka, триггер на отправку SMS, email и push                                                                                    | `{ eventId, bookingId, confirmedAt, validUntil }`                                                                                                                                                                                           |
| `Notification Service → БД Уведомлений` (этап 1 дедупликации) | INSERT строки об уведомлении со статусом `queued` до публикации в RMQ                                                                                           | `INSERT INTO notification.notification_history (notification_id, channel, status, ...) VALUES (..., 'queued', ...) ON CONFLICT (notification_id) DO NOTHING`                                                                                |
| `Notification Service → RabbitMQ`                             | Публикация команды на отправку в `notification.direct` с routing key канала. По одному `basic.publish` на каждое сочетание «событие × канал» из матрицы каналов | `basic.publish(exchange='notification.direct', routing_key=<sms\|email\|push>, body={ notificationId, channel, recipient, templateId, payload })`                                                                                           |
| `RabbitMQ → SMS Worker / Email Worker / Push Worker`          | Доставка команды из соответствующей очереди с manual ack                                                                                                        | `deliver { notificationId, channel, recipient, templateId, payload }`                                                                                                                                                                       |
| `Worker → БД Уведомлений` (этап 2 дедупликации)               | UPDATE history перед `provider.send` (для SMS/Email) или INSERT в `push_inbox` (для Push)                                                                       | `UPDATE notification_history SET status='sent', sent_at=now() WHERE notification_id=$1 AND status IN ('queued','failed') RETURNING id` / `INSERT INTO notification.push_inbox (notification_id, user_id, payload, created_at) VALUES (...)` |
| `SMS Worker → Notification Adapter → SMS-провайдер`           | Синхронный вызов отправки SMS через адаптер во внешний шлюз                                                                                                     | `POST /sms { recipient, text, callback_url } -> { delivery_id }`                                                                                                                                                                            |
| `Email Worker → Notification Adapter → почтовый сервис`       | Синхронный вызов отправки email через адаптер во внешний SMTP / API                                                                                             | `POST /mail { recipient, subject, body, callback_url } -> { delivery_id }`                                                                                                                                                                  |
| `Push Worker → notification.push_inbox`                       | Запись push-уведомления в БД, откуда PWA забирает через REST API. Внешний провайдер не используется                                                             | INSERT в `notification.push_inbox`                                                                                                                                                                                                          |

## DFD R-L2 — детализация RabbitMQ

На этом уровне центральный блок RabbitMQ раскрыт. Виден Direct Exchange `notification.direct` с тремя routing keys (`sms`, `email`, `push`), три основные очереди (`notification.sms`, `notification.email`, `notification.push`), Fanout Exchange `notification.dlx` (DLX) и одна терминальная очередь `notification.dlq`. Каждая основная очередь параметром `x-dead-letter-exchange: notification.dlx` направляет `nack`(requeue=false) сообщения в DLX, который через единственный binding без routing key копирует их в `notification.dlq` для ручного разбора.

### Диаграмма R-L2

```mermaid
flowchart LR
    %% Источники Kafka (минимально)
    subgraph KAFKA["Kafka"]
        TBC["Topic_BookingCreated"]
        TBCF["Topic_BookingConfirmed"]
    end

    %% Publisher
    NS["Notification Service<br/>[Component]<br/>Publisher в RMQ"]

    %% Exchange — Direct
    EX["notification.direct<br/>Direct Exchange"]

    %% Очереди основные
    QSMS["notification.sms<br/>durable, TTL 5 мин<br/>x-dead-letter-exchange"]
    QEM["notification.email<br/>durable, TTL 5 мин<br/>x-dead-letter-exchange"]
    QPUSH["notification.push<br/>durable, TTL 5 мин<br/>x-dead-letter-exchange"]

    %% DLX и DLQ
    DLX["notification.dlx<br/>Fanout Exchange<br/>DLX"]
    DLQ["notification.dlq<br/>durable, terminal<br/>без TTL и без обратного DLX"]

    %% Воркеры
    SMSW["SMS Worker<br/>[Component]"]
    EMW["Email Worker<br/>[Component]"]
    PSW["Push Worker<br/>[Component]"]

    %% Адаптер и провайдеры
    NA["Notification Adapter<br/>[Component]"]
    SMSP["SMS-провайдер<br/>[Software System]"]
    MAIL["Почтовый сервис<br/>[Software System]"]

    %% БД
    DB[("БД Уведомлений<br/>schema notification_*<br/>notification_history<br/>push_inbox")]

    %% Триггеры из Kafka
    TBC -- "BookingCreated" --> NS
    TBCF -- "BookingConfirmed" --> NS

    %% Этап 1 дедупликации
    NS -. "INSERT history (queued)" .-> DB

    %% Публикация в Direct Exchange
    NS == "publish rk=sms" ==> EX
    NS == "publish rk=email" ==> EX
    NS == "publish rk=push" ==> EX

    %% Биндинги Direct → очереди
    EX == "binding sms" ==> QSMS
    EX == "binding email" ==> QEM
    EX == "binding push" ==> QPUSH

    %% Доставка воркерам (manual ack)
    QSMS == "deliver + ack" ==> SMSW
    QEM  == "deliver + ack" ==> EMW
    QPUSH == "deliver + ack" ==> PSW

    %% Nack(requeue=false) → DLX
    QSMS -- "nack(requeue=false)" --> DLX
    QEM  -- "nack(requeue=false)" --> DLX
    QPUSH -- "nack(requeue=false)" --> DLX

    %% Биндинг DLX → DLQ (Fanout, без routing key)
    DLX == "binding fanout (без rk)" ==> DLQ

    %% Этап 2 дедупликации
    SMSW -. "UPDATE history (sent)" .-> DB
    EMW  -. "UPDATE history (sent)" .-> DB
    PSW  -. "INSERT push_inbox" .-> DB

    %% Воркеры → адаптер → провайдеры
    SMSW -- "send sms" --> NA
    EMW  -- "send email" --> NA
    NA -. "POST /sms" .-> SMSP
    NA -. "POST /mail" .-> MAIL

    %% Легенда
    subgraph LEGEND["Легенда"]
        direction TB
        L_C["Компонент"]
        L_A["Адаптер"]
        L_E["Внешняя система"]
        L_X["RMQ Exchange"]
        L_Q["RMQ Queue"]
        L_DLX["RMQ DLX"]
        L_DLQ["RMQ DLQ"]
        L_DB[("БД")]
        L1["━━▶ межсервисное взаимодействие / nack в DLX"]
        L2["═══▶ публикация, биндинг и доставка"]
        L3["⋯⋯▶ соединение с БД и внешним сервисом"]
    end

    %% classDef — палитра, симметричная K-L1/K-L2
    classDef component fill:#1B6FC8,stroke:#1B6FC8,stroke-width:1px,color:#ffffff
    classDef adapter fill:#4338ca,stroke:#4338ca,stroke-width:1px,color:#ffffff
    classDef external fill:#374151,stroke:#374151,stroke-width:1px,color:#ffffff
    classDef db fill:#4b5563,stroke:#8899AA,stroke-width:1px,stroke-dasharray:5 3,color:#ffffff
    classDef rmq_exchange fill:#ED8936,stroke:#C05621,stroke-width:1px,color:#1f2937
    classDef rmq_queue fill:#FBD38D,stroke:#C05621,stroke-width:1px,color:#1f2937
    classDef rmq_dlx fill:#C05621,stroke:#7B341E,stroke-width:1px,color:#ffffff
    classDef rmq_dlq fill:#C53030,stroke:#7B1D1D,stroke-width:1px,color:#ffffff
    classDef topic fill:#f8cecc,stroke:#b85450,stroke-width:1px,color:#1f2937
    classDef legend fill:#EEF2F7,stroke:#8899AA,stroke-width:1px,color:#1f2937

    class NS,SMSW,EMW,PSW,L_C component
    class NA,L_A adapter
    class SMSP,MAIL,L_E external
    class DB,L_DB db
    class EX,L_X rmq_exchange
    class QSMS,QEM,QPUSH,L_Q rmq_queue
    class DLX,L_DLX rmq_dlx
    class DLQ,L_DLQ rmq_dlq
    class TBC,TBCF topic
    class LEGEND,L1,L2,L3 legend
```

### Словарь потоков R-L2

| Поток                                                                | Что течет                                                                                                             | Формат                                                                                                                                                                |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Topic_BookingCreated → Notification Service`                        | Триггер на SMS и email при создании брони                                                                             | `{ eventId, bookingId, vehicleId, sectorId, plannedStart, tariffId }`                                                                                                 |
| `Topic_BookingConfirmed → Notification Service`                      | Триггер на SMS, email и push при подтверждении брони                                                                  | `{ eventId, bookingId, confirmedAt, validUntil }`                                                                                                                     |
| `Notification Service → БД` (этап 1)                                 | INSERT строки `queued` до публикации в RMQ                                                                            | `INSERT ... ON CONFLICT (notification_id) DO NOTHING`                                                                                                                 |
| `Notification Service → notification.direct` (rk=sms / email / push) | Команда на отправку. По одной публикации на сочетание «событие × канал»                                               | `basic.publish(exchange='notification.direct', routing_key=<sms\|email\|push>, body={ notificationId, channel, recipient, templateId, payload })`                     |
| `notification.direct → notification.sms` (binding sms)               | Маршрутизация по точному совпадению routing key                                                                       | binding key `sms`                                                                                                                                                     |
| `notification.direct → notification.email` (binding email)           | Маршрутизация по точному совпадению routing key                                                                       | binding key `email`                                                                                                                                                   |
| `notification.direct → notification.push` (binding push)             | Маршрутизация по точному совпадению routing key                                                                       | binding key `push`                                                                                                                                                    |
| `notification.sms / .email / .push → Worker` (deliver + ack)         | Доставка команды воркеру с manual ack после успешной отправки                                                         | `basic.deliver` + `basic.ack(delivery_tag)`                                                                                                                           |
| `Worker → notification.dlx` (nack requeue=false)                     | Сбойное сообщение возвращается воркером с `requeue=false`; broker через `x-dead-letter-exchange` направляет его в DLX | `basic.nack(delivery_tag, requeue=false)`                                                                                                                             |
| `notification.dlx → notification.dlq` (binding fanout)               | Биндинг Fanout без routing key — все nack'нутые сообщения копируются в одну терминальную DLQ                          | binding без routing key                                                                                                                                               |
| `Worker → БД` (этап 2)                                               | UPDATE history перед `provider.send` (SMS/Email) или INSERT push (Push)                                               | `UPDATE notification_history SET status='sent' WHERE notification_id=$1 AND status IN ('queued','failed') RETURNING id` / `INSERT INTO notification.push_inbox (...)` |
| `SMS Worker / Email Worker → Notification Adapter → провайдер`       | Синхронный вызов внешнего шлюза или SMTP                                                                              | `POST /sms` / `POST /mail`                                                                                                                                            |
| `Push Worker → notification.push_inbox`                              | Внутренний канал P1: запись в БД, PWA читает через REST API                                                           | INSERT в `notification.push_inbox`                                                                                                                                    |

## Текстовое описание сценария

Сквозной сценарий доставки одного канала (на примере SMS на `Topic_BookingCreated`) — 8 шагов:

1. **Booking Service** публикует `BookingCreated` в Kafka (см. ADR-007). `Notification Service` подписан на `Topic_BookingCreated` и `Topic_BookingConfirmed`.
2. **Notification Service** consumes сообщение из Kafka. По матрице каналов на этот тип события создается команда на отправку SMS — вычисляется `notificationId = uuid_v5(eventId, channel)` (детерминированно, для возможных ретраев Kafka).
3. **Этап 1 дедупликации**: `Notification Service` делает `INSERT INTO notification.notification_history (notification_id, channel, status, ...) VALUES (..., 'queued', ...) ON CONFLICT (notification_id) DO NOTHING`. Если `0 rows` — это ретрай Kafka, в RMQ не публикуем, сразу commit offset.
4. `Notification Service` публикует команду в `notification.direct` с routing key, соответствующим каналу из матрицы (`sms`, `email` или `push`). После получения publisher confirm от broker'а Kafka offset commit'ится.
5. **Broker** маршрутизирует сообщение по binding key в одну из основных очередей (`notification.sms`, `notification.email`, `notification.push`).
6. Соответствующий **Worker** получает сообщение через `basic.deliver` (manual ack).
7. **Этап 2 дедупликации**: воркер делает `UPDATE notification_history SET status='sent', sent_at=now() WHERE notification_id=$1 AND status IN ('queued','failed') RETURNING id`. Если `0 rows` — дубль из RMQ, `ack` без отправки. Если строка обновлена — воркер вызывает `Notification Adapter` (для SMS/Email) или пишет в `notification.push_inbox` (для Push) и шлет broker'у `basic.ack(delivery_tag)`.
8. **На ошибке** (провайдер недоступен, исключение в воркере, истечение TTL очереди в 5 мин): воркер шлет `basic.nack(delivery_tag, requeue=false)`. Broker по параметру `x-dead-letter-exchange: notification.dlx` направляет сообщение в DLX, который через Fanout-binding без routing key копирует его в терминальную `notification.dlq` для ручного разбора.

## Балансировка «событие Kafka → команда RMQ → канал доставки»

| Kafka topic              | routing key | exchange              | queue                | worker       | назначение доставки                                                                                          |
| ------------------------ | ----------- | --------------------- | -------------------- | ------------ | ------------------------------------------------------------------------------------------------------------ |
| `Topic_BookingCreated`   | `sms`       | `notification.direct` | `notification.sms`   | SMS Worker   | Внешний SMS-провайдер через `Notification Adapter` (OTP подтверждения телефона + напоминание оплатить бронь) |
| `Topic_BookingCreated`   | `email`     | `notification.direct` | `notification.email` | Email Worker | Внешний почтовый сервис через `Notification Adapter` (детали брони + ссылка на оплату)                       |
| `Topic_BookingConfirmed` | `sms`       | `notification.direct` | `notification.sms`   | SMS Worker   | Внешний SMS-провайдер через `Notification Adapter` (короткое подтверждение «бронь подтверждена»)             |
| `Topic_BookingConfirmed` | `email`     | `notification.direct` | `notification.email` | Email Worker | Внешний почтовый сервис через `Notification Adapter` (квитанция и детали оплаченной брони)                   |
| `Topic_BookingConfirmed` | `push`      | `notification.direct` | `notification.push`  | Push Worker  | Запись в `notification.push_inbox` (PWA забирает через существующий REST API)                                |

Итого пять публикаций в `notification.direct` на бизнес-цикл бронирования: две на `BookingCreated` (без push, пока пользователь может еще не быть в PWA до подтверждения оплаты) и три на `BookingConfirmed`.

`notificationId = uuid_v5(eventId, channel)` — детерминированный, по одному id на каждую строку матрицы для конкретного `eventId`. Это закрывает at-least-once Kafka на стороне consumer'а (двухэтапная дедупликация на входе Notification Service и на воркере перед `provider.send`) — outbox для RMQ-публикаций не вводим.

## Примечание про схему notification\_\* и таблицу push_inbox

В рамках учебного TO-BE используется единственное расхождение с [ADR-003 «Модульный монолит»](../adr/adr-003-modular-monolith.md): схема `notification_*` обогащается одной новой таблицей `push_inbox` для P1-канала push-уведомлений. Таблицы схемы:

- `notification_templates` — шаблоны сообщений по каналам (SMS / email / push). Уже предусмотрена ADR-007 в учебном переопределении `Notification Worker`.
- `notification_history` — история доставки уведомлений с уникальным индексом по `notification_id`. Используется в обоих этапах дедупликации: INSERT `queued` до публикации в RMQ, UPDATE `sent` / `failed` на воркере перед `provider.send`. Уже предусмотрена ADR-007.
- `push_inbox` — **новая таблица** для P1-канала push: Push Worker делает INSERT, PWA забирает запись через существующий backend REST API. Никакого realtime-gateway, WebSocket, FCM или APNs в текущем учебном scope нет — это сознательное упрощение, чтобы не расширять scope DFD на отдельный архитектурный блок без выгоды для темы RMQ.

Расхождение не нарушает инвариантов ADR-003: schema-изоляция сохранена (новая таблица — внутри `notification_*`), физическая БД — одна PostgreSQL, никаких распределенных транзакций. Outbox для RMQ-публикаций не вводим: `Notification Service` публикует в RMQ напрямую после успешной обработки Kafka-сообщения (publisher confirms + commit Kafka offset только после confirm от broker'а), at-least-once Kafka + детерминированный `notificationId` + двухэтапная дедупликация дают exactly-once-effect на провайдере — эквивалент гарантии outbox+inbox для этого узла.

## Связанные документы

- [ADR-008 «RabbitMQ для рассылки уведомлений»](../adr/adr-008-rabbitmq-notification-dispatch.md) — обоснование выбора топологии (Direct + Fanout DLX), решения по антипаттернам (RMQ не event log, обязательный DLX, отдельная очередь на канал, единственный publisher в RMQ — Notification Service, manual ack), Push P1 через БД, отсутствие outbox.
- [ADR-007 «Kafka event bus для онлайн-бронирования»](../adr/adr-007-kafka-event-bus-online-booking.md) — источник Kafka-триггеров `Topic_BookingCreated` и `Topic_BookingConfirmed`, на которых RMQ-конвейер строится как продолжение.
- [DFD K-L1 / K-L2 — Kafka-конвейер онлайн-бронирования](message-flow-kafka-online-booking.md) — Kafka-сторона цепочки, формат и палитра, по которым делаются R-L1 / R-L2.
- [Требования к RabbitMQ](rabbitmq-requirements.md) — таблица «обменник × очередь × параметры × привязка» с конкретными значениями `x-*` аргументов.
- [ADR-003 «Модульный монолит»](../adr/adr-003-modular-monolith.md) — каноничное решение, относительно которого фиксируется единственное расхождение (новая таблица `push_inbox`).
- [DFD Level 1 проекта](../../artifacts/dfd-l1.md) — производственная декомпозиция платформы; этот артефакт ее не подменяет, префикс `R-` намеренно отличается.

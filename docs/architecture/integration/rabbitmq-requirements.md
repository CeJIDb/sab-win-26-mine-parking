# Требования к RabbitMQ — конвейер рассылки уведомлений (учебный TO-BE)

Документ фиксирует требования к RabbitMQ для work queue команд на отправку уведомлений (SMS / Email / Push) внутри Notification bounded context. RabbitMQ здесь — продолжение Kafka-конвейера: Notification Service потребляет события из Kafka (см. [ADR-007](../adr/adr-007-kafka-event-bus-online-booking.md)) и публикует команды на отправку в RMQ. Топология и инварианты — в [ADR-008](../adr/adr-008-rabbitmq-notification-dispatch.md).

Артефакт оформлен как **учебный TO-BE** в архитектурном слое: он не подменяет источники истины в [docs/specs/](../../specs/) и расходится с [ADR-003](../adr/adr-003-modular-monolith.md) только по одному пункту — в schema `notification_*` появляется новая таблица `push_inbox` для канала Push (P1, через БД).

## Оглавление

- [Контекст и расхождения с ADR-003](#контекст-и-расхождения-с-adr-003)
- [Как читать таблицу](#как-читать-таблицу)
- [Таблица требований](#таблица-требований)
- [Параметры детально](#параметры-детально)
- [Связанные документы](#связанные-документы)

## Контекст и расхождения с ADR-003

Исходные триггеры — два Kafka-топика из [ADR-007](../adr/adr-007-kafka-event-bus-online-booking.md):

- `Topic_BookingCreated` — бронь принята к оплате;
- `Topic_BookingConfirmed` — бронь подтверждена после успешной онлайн-оплаты.

`Topic_PaymentCompleted` Notification напрямую не слушает: за переход брони в `Confirmed` отвечает Booking, и именно `Topic_BookingConfirmed` становится сигналом для уведомления клиента.

`Notification Service` выступает в двух ролях одновременно — Kafka-consumer и единственный publisher в RMQ. Внутри RMQ маршрутизация идет через Direct Exchange `notification.direct` с тремя routing keys (`sms`, `email`, `push`); сбойные сообщения переходят в Fanout DLX `notification.dlx` и оседают в терминальной очереди `notification.dlq`. Топология целиком — в Decision [ADR-008](../adr/adr-008-rabbitmq-notification-dispatch.md).

Расхождение с [ADR-003](../adr/adr-003-modular-monolith.md) одно: schema `notification_*` обогащается таблицей `push_inbox`, в которую Push Worker делает `INSERT` при обработке команды на push-уведомление; PWA забирает запись через существующий backend REST API. Никакого realtime-gateway / WebSocket / FCM / APNs в учебный scope не входит. Таблица `push_inbox` живет в той же PostgreSQL, что и остальные `notification_*` сущности — инвариант 5 ADR-003 (единая PostgreSQL) не нарушается.

Outbox для RMQ-публикаций в этом узле **не вводится**. Обоснование — в Decision [ADR-008](../adr/adr-008-rabbitmq-notification-dispatch.md): эквивалентная гарантия достигается комбинацией at-least-once Kafka + детерминированный `notificationId = uuid_v5(eventId, channel)` + двухэтапная дедупликация по уникальному индексу в `notification.notification_history` (см. [«Параметры детально»](#параметры-детально)).

## Как читать таблицу

Таблица описывает все обменники и очереди RabbitMQ, использующиеся в конвейере. Колонки группируются в два логических блока: «Обменник» (тип, назначение) и «Очередь» (название, назначение, параметры, привязка). Один обменник может иметь несколько строк — по одной на каждую связанную очередь.

Ключевые свойства, по которым удобно читать таблицу:

- **Direct vs Fanout.** `notification.direct` — Direct exchange: брокер маршрутизирует сообщение в очередь, чьим binding key совпадает routing key сообщения. `notification.dlx` — Fanout exchange: всегда отправляет копию во все привязанные очереди (у нас одна — `notification.dlq`), routing key игнорируется. Оба типа специально показаны в одной таблице — это педагогический выбор, см. Decision [ADR-008](../adr/adr-008-rabbitmq-notification-dispatch.md).
- **Manual ack.** Все основные очереди читаются с ручным подтверждением: воркер делает `ack` только после успешной отправки команды провайдеру (для SMS / Email) или успешного `INSERT` в `push_inbox` (для Push). При ошибке — `nack(requeue=false)` отправляет сообщение в DLX, минуя повторную обработку.
- **`x-dead-letter-exchange` обязателен.** На каждой основной очереди (`notification.sms`, `notification.email`, `notification.push`) в аргументах объявления стоит `x-dead-letter-exchange: notification.dlx`. Это закрывает антипаттерн «очередь без DLX» из Decision [ADR-008](../adr/adr-008-rabbitmq-notification-dispatch.md).
- **`x-message-ttl` — защита от застревания.** TTL 5 минут унифицирован для всех каналов: если воркер не успел обработать сообщение за 5 минут, оно автоматически уходит в DLX. Дальнейшее удержание бессмысленно — провайдер с большой вероятностью недоступен, лучше отдать сообщение в `notification.dlq` для разбора.
- **Дедупликация на consumer-стороне.** Идентификатор сообщения `notificationId = uuid_v5(eventId, channel)` детерминирован относительно входного Kafka-события и канала. Дубликаты ловит уникальный индекс в `notification.notification_history`. Подробности — в [«Параметры детально»](#параметры-детально).

Имена exchanges, очередей и routing keys строго совпадают с DFD конвейера — см. [message-flow-rabbitmq-notification.md](message-flow-rabbitmq-notification.md), уровень R-L2.

## Таблица требований

| Обменник              | Тип    | Назначение обменника                            | Очередь — название   | Очередь — назначение                                                                | Очередь — параметры                                                                                     | Очередь — привязка                                                  |
| --------------------- | ------ | ----------------------------------------------- | -------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `notification.direct` | Direct | Команды на отправку уведомлений по трем каналам | `notification.sms`   | Канал SMS — отправка через внешнего SMS-провайдера                                  | `durable=true`, `x-dead-letter-exchange=notification.dlx`, `x-message-ttl=300000`, `x-max-length=10000` | Direct binding с `binding key=sms`; publisher `routing key=sms`     |
| `notification.direct` | Direct | (та же)                                         | `notification.email` | Канал Email — отправка через внешний почтовый сервис                                | `durable=true`, `x-dead-letter-exchange=notification.dlx`, `x-message-ttl=300000`, `x-max-length=10000` | Direct binding с `binding key=email`; publisher `routing key=email` |
| `notification.direct` | Direct | (та же)                                         | `notification.push`  | Канал Push (P1) — `INSERT` в `notification.push_inbox`; PWA забирает через REST API | `durable=true`, `x-dead-letter-exchange=notification.dlx`, `x-message-ttl=300000`, `x-max-length=10000` | Direct binding с `binding key=push`; publisher `routing key=push`   |
| `notification.dlx`    | Fanout | Dead Letter Exchange для сбойных сообщений      | `notification.dlq`   | Терминальная очередь для ручного разбора (`nack(requeue=false)` со всех основных)   | `durable=true`; без TTL; без обратного DLX                                                              | Fanout binding (без routing key)                                    |

`x-max-priority` ни в одной строке не используется. Обоснование — в [«Параметры детально»](#параметры-детально).

Producer publisher confirms (`confirm.select` + ожидание `confirm.deliver`) в таблице не повторяются — это свойство канала publisher'а, не самой очереди; зафиксировано в Decision [ADR-008](../adr/adr-008-rabbitmq-notification-dispatch.md) как обязательная дисциплина Notification Service: Kafka offset коммитится только после получения подтверждения публикации в RMQ.

## Параметры детально

### `durable=true`

Очередь переживает рестарт брокера: метаданные сохраняются на диск, при следующем запуске RabbitMQ очередь восстанавливается с теми же параметрами и привязками. Сообщения в долговечной очереди дополнительно требуют `delivery_mode=2` (persistent) на стороне publisher'а — это свойство сообщения, не очереди, и фиксируется на уровне Notification Service.

В учебном TO-BE `durable=true` стоит и на основных очередях, и на DLQ: терять команды на отправку уведомлений и тем более записи о сбоях в DLQ нельзя — это ломает разбор инцидентов и расходится с двухэтапной дедупликацией по `notification_history`.

### `x-dead-letter-exchange=notification.dlx`

Аргумент очереди, указывающий, куда RabbitMQ перенаправит сообщение, если оно было `nack`'нуто с `requeue=false`, истекло по `x-message-ttl` или превысило `x-max-length`. У нас все три основные очереди ссылаются на один и тот же Fanout exchange `notification.dlx`, который раздает копии во все привязанные очереди — у нас одна, `notification.dlq`.

Параметр обязателен для каждой основной очереди — это закрывает антипаттерн «очередь без DLX» из Decision [ADR-008](../adr/adr-008-rabbitmq-notification-dispatch.md). На самой DLQ обратного DLX нет — `notification.dlq` терминальна, повторных попыток автоматически не делается, сообщения разбираются вручную.

### `x-message-ttl=300000`

Time-to-live сообщения в очереди — 5 минут (300 000 миллисекунд). Если воркер не успел обработать сообщение за это окно, RabbitMQ автоматически отправляет его в `x-dead-letter-exchange` с причиной `expired`.

5 минут — компромисс для всех трех каналов: за это окно успешный провайдер уже должен ответить, а если не успел — скорее всего, провайдер недоступен или работает медленнее обычного, и удерживать сообщение дальше бессмысленно. Email-провайдеры исторически медленнее SMS, но в учебном scope дробить TTL по каналам — преждевременная оптимизация: единое значение проще объяснять и легче эксплуатировать. Если бизнес потребует разный TTL по каналам — это отдельный ADR.

### `x-max-length=10000`

Максимальное число сообщений в очереди. При превышении RabbitMQ удаляет самое старое сообщение и публикует его в DLX (поведение по умолчанию — `drop-head` с уведомлением DLX). Это backpressure-механизм: если SMS-провайдер деградировал и очередь начинает пухнуть, новые команды все равно принимаются, а самые старые уходят в DLQ для ручного разбора.

10 000 — учебная заглушка под средний размер очереди в стационарном режиме (5 публикаций на бизнес-цикл бронирования; см. матрицу каналов в Decision [ADR-008](../adr/adr-008-rabbitmq-notification-dispatch.md)). Реальное значение в боевой среде нужно подбирать по нагрузочному тесту и в учебный scope не входит.

### Дедупликация на consumer-стороне

`notificationId` — детерминированный: `notificationId = uuid_v5(eventId, channel)`, где `eventId` — идентификатор Kafka-сообщения из `Topic_BookingCreated` или `Topic_BookingConfirmed`, а `channel` — один из `sms` / `email` / `push`. Любой ретрай Kafka на одном и том же входном событии дает тот же `notificationId` для той же пары «событие × канал» — это и есть ключ дедупликации.

UUID v7 (как в Kafka-конвейере для `eventId`) для `notificationId` не подходит — он не детерминирован, при ретрае получится новый идентификатор и дедупликация не сработает.

Двухэтапная схема:

**Этап 1 — на входе Notification Service**, в Kafka-consumer'е, до публикации в RMQ:

```sql
INSERT INTO notification.notification_history (notification_id, channel, status, ...)
VALUES (..., 'queued', ...)
ON CONFLICT (notification_id) DO NOTHING;
```

Если затронуто 0 строк — это повторная доставка из Kafka, в RMQ ничего не публикуем, Kafka offset коммитим как обработанный. Уникальный индекс — по `notification_id`.

**Этап 2 — на воркере**, перед обращением к провайдеру:

```sql
UPDATE notification.notification_history
SET status = 'sent', sent_at = now()
WHERE notification_id = $1 AND status IN ('queued', 'failed')
RETURNING id;
```

Если возвращено 0 строк — сообщение повторно доставлено брокером (например, после потерянного `ack`), отправлять не надо: воркер делает `ack` и идет дальше. Если строка вернулась — отправляем в провайдера; при ошибке провайдера — `status = 'failed'` плюс `nack(requeue=false)` → DLX → `notification.dlq`.

Эта двухэтапная связка дает «at-least-once на брокерах + exactly-once на провайдере» и заменяет outbox-таблицу для RMQ-публикаций. Подробное обоснование — в Decision [ADR-008](../adr/adr-008-rabbitmq-notification-dispatch.md).

### Почему `x-max-priority` не используется

Priority queue в RabbitMQ требует двух условий одновременно: на очереди при объявлении задан `x-max-priority`, и publisher выставляет `priority` в свойствах сообщения (`basic.properties.priority`). Оба условия должны быть выполнены — иначе очередь либо ведет себя как обычная FIFO, либо вообще отказывает.

В учебном TO-BE Notification Service единый publisher для всех каналов и не моделирует два класса нотификаций (например, OTP / маркетинг). Заявить `x-max-priority` без работающей логики publisher'а — путаница: параметр виден в требованиях, но смысла в нем нет. Если бизнес потребует приоритетов (например, OTP опережает маркетинг внутри `notification.sms`) — это отдельный ADR-009 с проектом схемы свойств сообщения и матрицы приоритетов по типу события.

## Связанные документы

- [ADR-008: RabbitMQ для рассылки уведомлений (учебный TO-BE)](../adr/adr-008-rabbitmq-notification-dispatch.md) — обоснование выбора RabbitMQ как work queue, фиксация топологии (`notification.direct` Direct + `notification.dlx` Fanout с `notification.dlq`), Push P1, отсутствие outbox с заменой на детерминированный `notificationId` и двухэтапную дедупликацию.
- [DFD конвейера сообщений RabbitMQ — рассылка уведомлений](message-flow-rabbitmq-notification.md) — Mermaid R-L1 (RMQ одним блоком) и R-L2 (Direct + DLX Fanout), словари потоков, балансировочная таблица «событие Kafka → команда RMQ → канал → доставка».
- [ADR-007: Kafka event bus для онлайн-бронирования (учебный TO-BE)](../adr/adr-007-kafka-event-bus-online-booking.md) — источник триггерных событий `Topic_BookingCreated` и `Topic_BookingConfirmed`, на которые подписан Notification Service.
- [Требования к Kafka — конвейер онлайн-бронирования (учебный TO-BE)](kafka-requirements.md) — структурный аналог этого документа на стороне Kafka.
- [ADR-003: Модульный монолит](../adr/adr-003-modular-monolith.md) — каноничное решение по единой PostgreSQL и schema-изоляции, относительно которого зафиксировано единственное расхождение учебного TO-BE: новая таблица `push_inbox` в schema `notification_*`.

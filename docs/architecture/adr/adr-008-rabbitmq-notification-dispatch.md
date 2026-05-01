# ADR-008: RabbitMQ как work queue для рассылки уведомлений внутри Notification контекста (учебный TO-BE)

## Оглавление

1. [Status](#status)
2. [Context](#context)
3. [Options](#options)
4. [Decision](#decision)
5. [Rationale](#rationale)
6. [Trade-offs](#trade-offs)
7. [Consequences](#consequences)
8. [Next steps](#next-steps)

## Status

Accepted (учебный TO-BE) поверх [ADR-003](adr-003-modular-monolith.md) и [ADR-007](adr-007-kafka-event-bus-online-booking.md).

ADR-008 не подменяет [ADR-003](adr-003-modular-monolith.md) и не меняет каноничных требований в [docs/specs/](../../specs/) — это артефакт курсового задания по теме брокеров сообщений (продолжение Kafka-блока из [ADR-007](adr-007-kafka-event-bus-online-booking.md)), оформленный в архитектурном слое.

Расхождение с [ADR-003](adr-003-modular-monolith.md) — одно:

- **Инвариант 5 (единая БД, изоляция по схемам).** В существующей schema `notification_*` появляется новая таблица `push_inbox` — реализация канала Push P1 (PWA забирает уведомления через существующий backend REST API). Это не нарушает инвариант 5: schema остается у Notification, права записи — у Push Worker внутри того же контекста. Других расхождений с [ADR-003](adr-003-modular-monolith.md) нет: `Notification Worker` уже переопределен в [ADR-007 Status](adr-007-kafka-event-bus-online-booking.md#status) как Kafka-consumer со своей schema'ой; outbox-таблиц в Notification не было и не появляется (см. [Decision](#decision), пункт «отсутствие outbox»).

Расхождений с [ADR-007](adr-007-kafka-event-bus-online-booking.md) нет — ADR-008 строится на нем: Kafka-цепочка не меняется, Notification остается consumer'ом топиков `Topic_BookingCreated` и `Topic_BookingConfirmed` и в Kafka обратно не публикует.

## Context

ДЗ курса требует подготовить артефакты по теме брокеров сообщений и для RabbitMQ — DFD конвейера потоков данных RMQ и таблицу требований. Тема симметрична уже сданному Kafka-блоку ([ADR-007](adr-007-kafka-event-bus-online-booking.md)). В [ADR-007 Next steps](adr-007-kafka-event-bus-online-booking.md#next-steps) обещан отдельный ADR-008 после практического опыта с Kafka — этот ADR закрывает обещание.

Сквозной бизнес-процесс — продолжение цепочки из [ADR-007](adr-007-kafka-event-bus-online-booking.md):

- [UC-12.2 «Создать бронирование при автоматическом въезде»](../../artifacts/use-case/uc-12-2-create-booking-auto-entry.md) — создание брони, публикация `Topic_BookingCreated`.
- [UC-10.2 «Оплатить онлайн (краткосрочная аренда)»](../../artifacts/use-case/uc-10-2-pay-online-short-term-rental.md) — поток оплаты; после `Topic_PaymentCompleted` Booking публикует `Topic_BookingConfirmed`.
- Уведомление клиента — постусловие обоих UC. Notification потребляет `Topic_BookingCreated` и `Topic_BookingConfirmed` и шлет SMS, Email, Push.

Ключевые ограничения и связи:

- [ADR-003](adr-003-modular-monolith.md) — модульный монолит на единой PostgreSQL; единственное расхождение зафиксировано в [Status](#status).
- [ADR-007](adr-007-kafka-event-bus-online-booking.md) — Kafka между ограниченными контекстами; Notification — Kafka-consumer; в Kafka обратно не публикует.
- Учебная природа: RabbitMQ, как и Kafka в [ADR-007](adr-007-kafka-event-bus-online-booking.md), не выводится из требований проекта парковки на 600 ММ — он задается извне курсом. Это явно фиксируется в [Trade-offs](#trade-offs).

### Архитектурный принцип «брокеры по типу процесса»

Принцип единый для [ADR-007](adr-007-kafka-event-bus-online-booking.md) и ADR-008 — содержимое перенесено из временного документа `notes-rabbitmq-candidates.md`, который был черновиком к ADR-008 и удаляется при оформлении этого решения:

> **Kafka** — события между ограниченными контекстами (bounded contexts).
> **RabbitMQ** — рабочая очередь команд внутри одного контекста.

Уровни не противоречат друг другу — Kafka-конвейер из [ADR-007](adr-007-kafka-event-bus-online-booking.md) и RabbitMQ-конвейер этого ADR живут на разных абстракциях. Notification одновременно потребляет Kafka и публикует команды в RabbitMQ:

```text
Kafka topic (Topic_BookingCreated, Topic_BookingConfirmed)
  -> Notification Service (Kafka-consumer)
      -> RabbitMQ exchange notification.direct
          -> SMS Worker (manual ack, DLX -> notification.dlq)
          -> Email Worker (manual ack, DLX -> notification.dlq)
          -> Push Worker (manual ack, INSERT в notification.push_inbox)
```

### Кандидаты на RabbitMQ в парковочной системе

При проработке темы рассматривались пять кандидатов (содержимое перенесено из `notes-rabbitmq-candidates.md`). В скоуп ADR-008 берется только первый, остальные обсуждаются в [Options](#options) как отброшенные альтернативы.

1. **Notification dispatch worker (приоритет высокий — взят в скоуп).** Очередь команд на отправку уведомлений (SMS, email, push) внутри Notification контекста. RabbitMQ закрывает retry, DLX для неотправленных сообщений и конкурентных воркеров без дублирования. Триггер — событие из Kafka (`Topic_BookingCreated`, `Topic_BookingConfirmed`) -> Notification Service -> команда в очередь по каналу.
2. **ЭДО / 1С dispatch (средний).** Буфер повторных попыток при отправке документов во внешние системы. Узкий внешний канал, бедная топология (одна очередь на одного consumer'а), не показывает ни fan-out на каналы, ни DLX — педагогически слабее кандидата 1.
3. **Admin command queue (низкий).** Очередь административных команд (принудительное завершение сессии, блокировка карты). Out of scope учебного задания.
4. **СКУД / барьер CMD-канал (средний).** Команды управления барьером через очередь с приоритетами. Конфликтует с горячим путем allow/deny на КПП ([ADR-001](adr-001-online-access-rights-evaluation.md), [ADR-005](adr-005-access-control-direct-db-read.md)) — требует отдельного latency-budget анализа, для учебного скоупа лишнее усложнение.
5. **Background job queue (низкий).** Фоновые задачи (генерация PDF-чека, ночная сверка тарифов). Простой point-to-point без выгоды для темы RMQ — нет fan-out, нет нескольких типов exchange.

### Bounded context и роли

- **Bounded context** — Notification.
- **Триггеры из Kafka** (publisher Booking, см. [ADR-007 Decision](adr-007-kafka-event-bus-online-booking.md#decision)): `Topic_BookingCreated` (бронь принята к оплате), `Topic_BookingConfirmed` (бронь подтверждена). `Topic_PaymentCompleted` Notification напрямую не слушает — сценарий оплаты уведомляется через `Topic_BookingConfirmed`, который Booking публикует после `Topic_PaymentCompleted`.
- **Единственный publisher в RMQ** — Notification Service (он же Kafka-consumer).
- **Воркеры** (SMS Worker, Email Worker, Push Worker) — единственные consumer'ы своих очередей.

## Options

### Option A — синхронные in-process вызовы внутри Notification

Notification Service принимает Kafka-сообщение и тут же синхронно вызывает SMS-провайдер, почтовый провайдер и пишет push-запись в БД в рамках обработки одного сообщения.

**Плюсы:**

- Минимум инфраструктуры: нет брокера, нет очередей, нет DLX.
- Простота отладки: все происходит в одном процессе.

**Минусы:**

- Не отвечает на задание курса — нет RabbitMQ и нет конвейера команд.
- Медленный SMS-провайдер блокирует обработку Kafka-сообщения и тормозит Push (в-process нет конкурентных воркеров с независимыми retry-стратегиями).
- Нет естественного DLQ — сбойное сообщение либо повторяется через Kafka-ретрай (с риском дублей), либо теряется.
- Не масштабируется горизонтально по каналам: на медленный SMS нельзя выдать больше воркеров, чем на быстрый Push.

### Option B — Kafka-only (без RabbitMQ)

Завести три отдельных Kafka-топика-команды (`Cmd_SendSms`, `Cmd_SendEmail`, `Cmd_SendPush`); Notification Service публикует команды в Kafka, воркеры потребляют свой топик.

**Плюсы:**

- Один брокер на проект — не нужно учить и эксплуатировать второй.
- Replay команд из лога Kafka доступен из коробки.

**Минусы:**

- Нарушает архитектурный принцип «Kafka между контекстами, RMQ внутри» — команды на отправку это не события для других контекстов, у них единственный consumer внутри Notification.
- Kafka log с retention'ом — оверкилл для команд: после успешной отправки команду нужно «забыть», а не хранить в логе.
- Нет встроенного DLX-механизма — отрицательный сценарий пришлось бы делать отдельным топиком и руками реализовывать терминальную семантику.
- Не отвечает на задание курса — ДЗ требует именно RabbitMQ как отдельный артефакт, симметрично Kafka-блоку из [ADR-007](adr-007-kafka-event-bus-online-booking.md).

### Option C — RabbitMQ внутри Notification контекста (выбран)

Notification Service публикует команды в RabbitMQ exchange `notification.direct` (Direct Exchange) с routing key по каналу. Три отдельные очереди (`notification.sms`, `notification.email`, `notification.push`) — по одной на канал. Каждая основная очередь имеет обязательный DLX (`notification.dlx` — Fanout Exchange) с одной DLQ (`notification.dlq`). Воркеры — единственные consumer'ы своих очередей, manual ack.

**Плюсы:**

- Соответствует архитектурному принципу «Kafka между контекстами, RMQ внутри» и собирает педагогически насыщенную картину: оба распространенных типа exchange (Direct + Fanout) на одной диаграмме, явный DLX, manual ack, отдельная очередь на канал.
- Каналы изолированы: медленный SMS-провайдер не тормозит Push; на каждой очереди свои retry-стратегии и prefetch.
- DLX — встроенный механизм брокера, не приходится моделировать терминальную семантику самостоятельно.
- Симметричен Kafka-блоку из [ADR-007](adr-007-kafka-event-bus-online-booking.md) и закрывает обещание ADR-007 Next steps.

**Минусы:**

- Дополнительный брокер в эксплуатации — для учебного проекта это явное допущение, фиксируется в [Trade-offs](#trade-offs).
- В RMQ нельзя сделать replay (после ack сообщение удалено) — replay делается через Kafka-топик из [ADR-007](adr-007-kafka-event-bus-online-booking.md). См. антипаттерн «RMQ как event log» в [Decision](#decision).

## Decision

Принять **Option C** — RabbitMQ как work queue команд на отправку уведомлений внутри Notification bounded context, с топологией Direct Exchange + Fanout DLX, отдельной очередью на канал и manual ack на воркерах.

Ключевые инварианты решения:

1. **Единственный publisher в RMQ — Notification Service.** Booking, Payment и любые другие модули в RabbitMQ напрямую не публикуют. Точка входа в RMQ — Notification Service, который потребляет Kafka-топики `Topic_BookingCreated` и `Topic_BookingConfirmed` (см. [ADR-007](adr-007-kafka-event-bus-online-booking.md)) и переводит факты в команды на доставку. Это закрывает архитектурный инвариант «Kafka между контекстами, RMQ внутри» и связку с [ADR-007](adr-007-kafka-event-bus-online-booking.md).

2. **Топология exchanges/queues.**
   - `notification.direct` (Direct Exchange) — команды на отправку. Три binding'а:
     - routing key `sms` -> `notification.sms`;
     - routing key `email` -> `notification.email`;
     - routing key `push` -> `notification.push`.
   - `notification.dlx` (Fanout Exchange) — Dead Letter Exchange. Один binding (без routing key) на одну `notification.dlq` — broadcast всех `nack`-нутых сообщений в DLQ для ручного разбора.
   - Параметры основных очередей (`notification.sms`, `notification.email`, `notification.push`):
     - `durable: true`;
     - `x-dead-letter-exchange: notification.dlx`;
     - `x-message-ttl: 300000` (5 минут);
     - `x-max-length: 10000`;
     - `x-max-priority` — не используется (см. [Trade-offs](#trade-offs)).
   - Параметры DLQ (`notification.dlq`): `durable: true`, без TTL и без обратного DLX (терминальная очередь).

3. **Отдельная очередь на канал.** Один queue на все каналы — антипаттерн: медленный провайдер сериализует обработку, разные prefetch и retry-стратегии становятся невозможными. У нас три отдельные очереди — `notification.sms`, `notification.email`, `notification.push`.

4. **Обязательный DLX на каждой основной очереди.** Каждая основная очередь объявляется с `x-dead-letter-exchange: notification.dlx`. Очередь без DLX — антипаттерн: сбойное сообщение остается в основной очереди и блокирует обработку, либо теряется при reject без requeue.

5. **Manual ack.**
   - `ack` — после успешной отправки провайдеру (для Push — после успешного `INSERT` в `notification.push_inbox`).
   - `nack(requeue=false)` при ошибке -> через `x-dead-letter-exchange` сообщение уходит в `notification.dlx` -> `notification.dlq`.
   - Auto-ack без ручной обработки — антипаттерн: воркер падает после получения сообщения, и сообщение теряется без попытки доставки.

6. **RMQ — не event log, replay только через Kafka.** Сообщения в RMQ существуют до `ack`/`nack` и удаляются после. Реплей событий — через Kafka-топик из [ADR-007](adr-007-kafka-event-bus-online-booking.md): для перепубликации командной серии в RMQ Notification Service перечитывает Kafka с нужного offset'а. RMQ как event log — антипаттерн.

7. **Push — P1 (через БД).** Push Worker делает `INSERT` в `notification.push_inbox` (новая таблица в существующей schema `notification_*`); PWA забирает push через существующий backend REST API. Никакого realtime-gateway / WebSocket / FCM / APNs в учебном scope нет — это потенциальный ADR-009 (см. [Next steps](#next-steps)). На уровне DFD конвейера Push Worker -> БД Уведомлений; PWA в DFD не рисуется (out of scope).

8. **Отсутствие outbox для RMQ-публикаций — компенсируется детерминированным `notificationId` и двухэтапной дедупликацией.**

   В Kafka-цепочке [ADR-007](adr-007-kafka-event-bus-online-booking.md) outbox обязателен: producer'ом был бизнес-модуль с собственными бизнес-данными, dual-write «бизнес-данные + outbox-событие» закрывался одной локальной транзакцией. У Notification Service бизнес-данных, кроме записи об отправке уведомления, нет — at-least-once Kafka + детерминированный id + двухэтапная дедупликация дают эквивалент гарантии outbox+inbox для этого узла. Поэтому outbox-таблица в `notification_*` для RMQ-публикаций не вводится.

   Дисциплина публикатора: Notification Service использует publisher confirms (`confirm.select` + ожидание `confirm.deliver`) и коммитит Kafka offset **только после успешного подтверждения publish в RMQ**.

   `notificationId` — **детерминированный**:

   ```text
   notificationId = uuid_v5(eventId, channel),  channel in {sms, email, push}
   ```

   где `eventId` — id Kafka-сообщения. Любой ретрай Kafka дает тот же `notificationId` для той же пары «событие x канал». UUID v7 не годится — он не детерминирован, при ретрае получится другой id, и дедупликация сломается.

   **Этап 1, дедупликация на входе Notification Service** (Kafka-consumer, до publish в RMQ):

   ```sql
   INSERT INTO notification.notification_history (notification_id, channel, status, ...)
   VALUES (:notification_id, :channel, 'queued', ...)
   ON CONFLICT (notification_id) DO NOTHING;
   ```

   Если `0 rows` — это ретрай Kafka, **в RMQ не публикуем**, сразу commit Kafka offset. Уникальный индекс — по `notification_id`.

   **Этап 2, дедупликация на воркере** (перед `provider.send`):

   ```sql
   UPDATE notification.notification_history
      SET status = 'sent', sent_at = now()
    WHERE notification_id = :notification_id
      AND status IN ('queued', 'failed')
   RETURNING id;
   ```

   Если `0 rows` — это дубль из RMQ (например, повторная доставка после потерянного `ack`), `ack` без отправки. Если строка вернулась — отправляем; ошибка -> `status = 'failed'` + `nack(requeue=false)` -> DLX.

9. **Пять антипаттернов, явно отсеченных.** Источник — материалы курса, разделы rabbitmq-часть-2 (exchanges) и rabbitmq-часть-3 (queues и acknowledgements):
   1. **RMQ как event log** — нет, replay только через Kafka-топик из [ADR-007](adr-007-kafka-event-bus-online-booking.md).
   2. **Очередь без DLX** — нет, `x-dead-letter-exchange` обязателен на каждой основной очереди (rabbitmq-часть-3 описывает параметр прямо).
   3. **Один queue на все каналы** — нет, отдельная очередь на канал (иначе сериализация и невозможность разных retry-стратегий).
   4. **Прямая публикация в RMQ из Booking/Payment** — нет, единственный publisher — Notification Service (закрывает архитектурный инвариант «Kafka между контекстами, RMQ внутри»).
   5. **Auto-ack без ручной обработки** — нет, manual ack: `ack` после успешной отправки, `nack(requeue=false)` -> DLX. Auto-ack теряет сообщение при сбое воркера.

### Матрица каналов

Соответствие «Kafka-событие -> канал доставки -> routing key» для учебного TO-BE:

| Kafka-событие            | Канал | Routing key | Что отправляем                                                |
| ------------------------ | ----- | ----------- | ------------------------------------------------------------- |
| `Topic_BookingCreated`   | SMS   | `sms`       | OTP подтверждения телефона + напоминание оплатить бронь       |
| `Topic_BookingCreated`   | Email | `email`     | детали брони + ссылка на оплату                               |
| `Topic_BookingConfirmed` | SMS   | `sms`       | короткое подтверждение «бронь подтверждена»                   |
| `Topic_BookingConfirmed` | Email | `email`     | квитанция и детали оплаченной брони                           |
| `Topic_BookingConfirmed` | Push  | `push`      | in-app уведомление в PWA (запись в `notification.push_inbox`) |

Итого **5 публикаций в `notification.direct` на бизнес-цикл** — 2 на `Topic_BookingCreated` (Push не отправляется на этом шаге — пользователь может еще не быть в PWA до подтверждения оплаты) и 3 на `Topic_BookingConfirmed`. По одному `notificationId = uuid_v5(eventId, channel)` на каждую строку матрицы.

## Rationale

- **Симметрия с [ADR-007](adr-007-kafka-event-bus-online-booking.md).** ДЗ курса по брокерам сообщений включает два артефакта на каждый брокер — DFD конвейера и таблицу требований. Решение по RabbitMQ оформляется отдельным ADR с той же структурой и тем же стилем артефактов, что и Kafka-блок, чтобы проверяющий мог сопоставить два решения один-в-один. Ровно поэтому в [ADR-007 Next steps](adr-007-kafka-event-bus-online-booking.md#next-steps) ADR-008 и был обещан как отдельная проработка.
- **Архитектурный принцип «брокеры по типу процесса».** Kafka — события между контекстами с log-семантикой и replay; RabbitMQ — work queue команд внутри контекста с DLX и manual ack. Этот принцип закрывает антипаттерн «один брокер на все случаи» и одновременно дает педагогически прозрачное правило выбора инструмента. Принцип применим за рамками учебного проекта — поэтому он зафиксирован в [Context](#context), а не только в [Decision](#decision).
- **Direct + Fanout DLX, не Topic Exchange.** У нас три канала и два типа триггерных событий — конечное малое множество routing keys. По прямой рекомендации курса (rabbitmq-часть-2): «если конечное множество ключей — Direct или Fanout 1:1; Topic — когда множество стремится к бесконечности». Topic в нашем случае — сложность ради сложности. Headers Exchange упомянут в курсе как опциональный, в учебном scope избыточен.
- **Fanout для DLX выбран намеренно.** На одной диаграмме показываем оба распространенных типа exchange (Direct + Fanout). Direct -> DLQ работало бы тоже, но потеряло бы педагогический эффект.
- **Отдельная очередь на канал — обязательное условие.** Шаблон работы каналов разный: SMS медленный и платный за каждое сообщение, Email толерантен к небольшим задержкам, Push P1 — это `INSERT` в локальную БД. Совмещать их в одной очереди — терять разные prefetch, разные retry-стратегии и разную горизонтальную масштабируемость воркеров.
- **Push P1 — достаточный учебный канал.** Realtime-gateway (WebSocket/SSE) и провайдеры (FCM/APNs) расширяют scope DFD на отдельный архитектурный блок без выгоды для темы RMQ — внутри RMQ-конвейера разница между «P1 в БД» и «P2 через WebSocket» сводится к одной стрелке от Push Worker. Поэтому Push P1 закрывает учебную задачу полностью; реальный realtime — отдельный ADR-009 (см. [Next steps](#next-steps)).
- **Без outbox в Notification.** Эта формулировка — главная причина, по которой ADR-008 нужен как отдельное решение, а не как параграф в [ADR-007](adr-007-kafka-event-bus-online-booking.md): иначе ADR не отвечает на «почему здесь без outbox, если в [ADR-007](adr-007-kafka-event-bus-online-booking.md) был». Ответ — at-least-once Kafka + детерминированный id + двухэтапная дедупликация дают exactly-once-effect на провайдере без локального outbox; ровно потому, что у Notification нет своих бизнес-данных, требующих атомарной записи вместе с событием.

## Trade-offs

- **Учебная природа.** RabbitMQ, как и Kafka в [ADR-007](adr-007-kafka-event-bus-online-booking.md), не выводится из требований проекта парковки на 600 ММ — он задан извне курсом. ADR честно фиксирует это допущение: на текущем масштабе таблица-очередь в PostgreSQL ([ADR-003](adr-003-modular-monolith.md), инвариант 4) закрывает потребность по доставке уведомлений. Отдельный брокер — учебная демонстрация паттерна.
- **Нет outbox-инварианта в одной транзакции.** В отличие от Kafka-цепочки [ADR-007](adr-007-kafka-event-bus-online-booking.md), запись «обработали Kafka-событие» и публикация в RMQ не атомарны. Митигация — двухэтапная дедупликация по детерминированному `notificationId` и publisher confirms (см. [Decision](#decision), пункт 8). Это не выглядит так же красиво, как outbox + одна транзакция, но дает эквивалент гарантии для узла без бизнес-данных.
- **Manual ack требует дисциплины на воркере.** Воркер обязан явно вызвать `ack` только после успешной отправки и `nack(requeue=false)` после ошибки; забыть `ack` — оставить сообщение «in-flight» до session timeout (потеря пропускной способности); забыть `nack` или вызвать `nack(requeue=true)` — устроить infinite-loop в основной очереди. Митигация — стандартный шаблон обработки сообщения в воркере и code review этого шаблона.
- **`x-max-priority` намеренно не используется.** Priority queue в RabbitMQ требует, чтобы publisher выставлял `priority` в свойствах сообщения, и чтобы был осмысленный бизнес-критерий «два класса нотификаций». В учебном scope мы не моделируем «срочные» и «обычные» уведомления; заявить параметр без работающей логики приоритизации — путаница (в очереди ничего не приоритизируется, проверяющий ищет источник приоритетов и не находит). Когда бизнес потребует приоритетов — это будет ADR-009 (см. [Next steps](#next-steps)).
- **DLQ требует ручного разбора.** Сообщения в `notification.dlq` не возвращаются в основные очереди автоматически. Для учебного TO-BE этого достаточно: цель DLQ — показать, что отрицательный сценарий ловится и не теряется. Реальный мониторинг очередей и автоматический requeue из DLQ — за рамками ([Next steps](#next-steps)).
- **Eventual consistency на доставке.** Между Kafka commit'ом и фактической отправкой через провайдера есть окно (TTL очереди до 5 минут + время провайдера). Для уведомлений это приемлемо — в отличие от горячего пути allow/deny на КПП ([ADR-001](adr-001-online-access-rights-evaluation.md), [ADR-005](adr-005-access-control-direct-db-read.md)), где допустимая задержка измеряется миллисекундами.

## Consequences

### Positive

- Notification получает изолированный конвейер команд по каналам — медленный SMS-провайдер не тормозит Push.
- DLX обязателен на каждой основной очереди — отрицательные сценарии не теряются и не блокируют основную очередь.
- Manual ack + двухэтапная дедупликация дают exactly-once-effect на провайдере без локального outbox.
- Топология педагогически насыщенная: Direct + Fanout на одной диаграмме, явный DLX, отдельная очередь на канал, manual ack — пять явно отсеченных антипаттернов.
- Симметрия с [ADR-007](adr-007-kafka-event-bus-online-booking.md): сквозная цепочка «Kafka -> Notification Service -> RabbitMQ -> воркеры» оформлена как два связанных, но независимых артефакта.
- Расхождение с [ADR-003](adr-003-modular-monolith.md) минимально — одна новая таблица `push_inbox` в существующей schema `notification_*`.

### Negative

- Дополнительный брокер в эксплуатации (RabbitMQ-кластер) — не оправдан масштабом проекта парковки в реальности.
- Дисциплина manual ack на воркерах — без code review шаблона обработки сообщения легко устроить «in-flight потерю» или infinite-loop.
- Replay в RMQ невозможен — для перепубликации командной серии нужно перечитывать Kafka-топик из [ADR-007](adr-007-kafka-event-bus-online-booking.md). Это не баг, это часть антипаттерна «RMQ как event log», но эксплуатационно требует понимания, какой брокер за что отвечает.
- Неприменимо «как есть» в продакшене текущей парковки без пересмотра [ADR-003](adr-003-modular-monolith.md) — для текущего масштаба таблица-очередь в PostgreSQL закрывает потребность.

### Changes (учебный TO-BE)

- В schema `notification_*` появляется новая таблица `push_inbox` — единственное расхождение с [ADR-003](adr-003-modular-monolith.md), реализация Push P1.
- В RabbitMQ объявляются: exchange `notification.direct` (Direct), exchange `notification.dlx` (Fanout); очереди `notification.sms`, `notification.email`, `notification.push` (с DLX в параметрах) и `notification.dlq` (терминальная).
- Запись `CHG-20260501-NNN` в [журнале трассировки](../../process/traceability-matrix-log.md) добавляется отдельно — связывает ADR-008 с DFD конвейера RMQ и таблицей требований к RMQ в `docs/architecture/integration/`.

### Mitigation

- **Дисциплина publisher confirms.** Notification Service коммитит Kafka offset только после `confirm.deliver` от RabbitMQ — без этого окно «Kafka commit без RMQ publish» открыто и компенсирующая дедупликация на этапе 2 теряет смысл.
- **Дедупликация по детерминированному `notificationId`.** `uuid_v5(eventId, channel)` + уникальный индекс по `notification_id` в `notification.notification_history` — основной механизм компенсации отсутствия outbox.
- **Шаблон обработки сообщения на воркере.** Один проверяемый шаблон (claim строки в `notification_history` -> `provider.send` -> `ack`; ошибка -> `status='failed'` + `nack(requeue=false)`) — закрывает дисциплину manual ack.
- **Учебная пометка в [Status](#status).** Любой читатель видит, что ADR-008, как и [ADR-007](adr-007-kafka-event-bus-online-booking.md), — учебный TO-BE, а не текущее решение проекта.

## Next steps

- **HA-кластер RabbitMQ.** Quorum queues, mirroring/replication, обработка отказа узла — за рамками учебного TO-BE; в реальной эксплуатации обязательно.
- **Schema validation сообщений.** Контракт payload'а команд (поля `notificationId`, `eventId`, `channel`, `templateId`, `recipient`, `payload`) и его эволюция — кандидат на отдельный документ или JSON Schema, аналог schema registry из [ADR-007 Next steps](adr-007-kafka-event-bus-online-booking.md#next-steps).
- **Мониторинг очередей и DLQ.** Метрики глубины очередей, скорости consume'а, размера DLQ; алерты на застревание в DLQ. В учебном scope не проектируется.
- **Реальный realtime-канал Push (потенциальный ADR-009).** Расширение Push с P1 (через БД) до P2 (realtime-gateway / WebSocket / SSE) или P3 (FCM/APNs). Требует отдельного архитектурного блока — gateway, push token registry, провайдерский адаптер.
- **Бизнес-логика приоритетов нотификаций (потенциальный ADR-009).** Если появится бизнес-критерий «срочные vs обычные» уведомления — вернуться к `x-max-priority` или к отдельной priority-очереди с более высоким prefetch.
- **Связь с [ADR-003](adr-003-modular-monolith.md).** ADR-008 не требует правки [ADR-003](adr-003-modular-monolith.md) — единственное расхождение (новая таблица `push_inbox`) не нарушает ни одного инварианта. При пересмотре инварианта 5 [ADR-003](adr-003-modular-monolith.md) учесть учебный TO-BE и решить, поднимается ли ADR-008 до Accepted в основном архитектурном наборе или закрывается как Superseded.
- **Связь с [ADR-007](adr-007-kafka-event-bus-online-booking.md).** ADR-008 ссылается на [ADR-007](adr-007-kafka-event-bus-online-booking.md), но не меняет Kafka-цепочку. При выделении Notification в отдельный сервис (см. [ADR-003 Future extraction candidates](adr-003-modular-monolith.md#future-extraction-candidates)) — пересмотреть оба ADR совместно, потому что Notification одновременно Kafka-consumer и RMQ-publisher.

# Индекс ADR

Архитектурные решения (Architecture Decision Records) проекта.

## Оглавление

- [ADR-001: доступ на КПП](#adr-001-доступ-на-кпп)
- [ADR-002: бронирование и сессия](#adr-002-бронирование-и-сессия)
- [ADR-003: стиль развёртывания](#adr-003-стиль-развёртывания)
- [ADR-004: реестр организаций](#adr-004-реестр-организаций)
- [ADR-005: чтение данных Access Control](#adr-005-чтение-данных-access-control)
- [ADR-006: расчет доступности ПМ в Facility](#adr-006-расчет-доступности-пм-в-facility)
- [ADR-007: Kafka event bus для онлайн-бронирования (учебный TO-BE)](#adr-007-kafka-event-bus-для-онлайн-бронирования-учебный-to-be)
- [ADR-008: RabbitMQ для рассылки уведомлений (учебный TO-BE)](#adr-008-rabbitmq-для-рассылки-уведомлений-учебный-to-be)
- [Связанные документы](#связанные-документы)

## ADR-001: доступ на КПП

- [ADR-001: Онлайн-оценка прав доступа на КПП](adr-001-online-access-rights-evaluation.md) — фиксирует проверку права доступа на каждый запрос КПП (`allow/deny`).

## ADR-002: бронирование и сессия

- [ADR-002: Бронирование vs парковочная сессия](adr-002-booking-vs-session.md) — разделяет мастер-сущности и их ответственность.

## ADR-003: стиль развёртывания

- [ADR-003: Модульный монолит](adr-003-modular-monolith.md) — закрепляет стиль развертывания и связи с NFR и предыдущими ADR.

## ADR-004: реестр организаций

- [ADR-004: Интеграция с DADATA для поиска организаций](adr-004-dadata-organization-lookup.md) — рассматривал автозаполнение реквизитов ЮЛ по ИНН с fallback на ручной ввод. **Отменен (2026-05-02)**: команда решила оставить ручной ввод реквизитов с валидацией формы.

## ADR-005: чтение данных Access Control

- [ADR-005: Стратегия чтения данных Access Control в модульном монолите](adr-005-access-control-direct-db-read.md) — закрепляет прямое чтение чужих агрегатов через именованные SQL view (без записи) для горячего пути allow/deny на КПП.

## ADR-006: расчет доступности ПМ в Facility

- [ADR-006: Расчет доступности ПМ при бронировании — Booking читает инвентарь Facility через view](adr-006-facility-availability-read.md) — расчет «свободно на интервал» делает P1: соединяет свой `bookings` с инвентарем мест P12 через `v_booking_inventory` (паттерн consumer-owned view, как в ADR-005). Команда P1 → P12 «резервирование» удалена как противоречащая ERD; «свободно сейчас» для P18 и E15 остается у P12 на собственных данных.

## ADR-007: Kafka event bus для онлайн-бронирования (учебный TO-BE)

- [ADR-007: Kafka как шина событий для сквозной цепочки онлайн-бронирования (учебный TO-BE)](adr-007-kafka-event-bus-online-booking.md) — учебный TO-BE поверх ADR-003 для сквозной цепочки «бронь → оплата → подтверждение → уведомление». Decision: transactional outbox + CDC, три топика с фан-аутом ≥2 consumer'а. Явно отброшены три антипаттерна: `Pricing Service` остается синхронным, `Topic_InvoiceCreated` не вводится (RPC под маской события), dual-write закрывается через outbox+CDC, а не прямым `producer.send()` после commit'a.

## ADR-008: RabbitMQ для рассылки уведомлений (учебный TO-BE)

- [ADR-008: RabbitMQ как work queue для рассылки уведомлений (учебный TO-BE)](adr-008-rabbitmq-notification-dispatch.md) — продолжение [ADR-007](adr-007-kafka-event-bus-online-booking.md) внутри Notification bounded context. Decision: Direct exchange `notification.direct` с тремя routing keys (sms / email / push), Fanout DLX `notification.dlx` с одной `notification.dlq`, manual ack, единственный publisher в RMQ — Notification Service, Push P1 через `notification.push_inbox`. Outbox для RMQ-публикаций не вводится — заменен детерминированным `notificationId = uuid_v5(eventId, channel)` и двухэтапной дедупликацией. Явно отброшены пять антипаттернов: RMQ как event log, очередь без DLX, один queue на все каналы, прямая публикация в RMQ из Booking/Payment, auto-ack без ручной обработки.

## Связанные документы

- [Индекс архитектуры](../readme.md) — DDD-материалы и внешний контекст.
- [DDD bounded contexts](../ddd/ddd-bounded-contexts.md) — согласование с ADR-003.

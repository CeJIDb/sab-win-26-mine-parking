# Индекс ADR

Архитектурные решения (Architecture Decision Records) проекта.

## Оглавление

- [ADR-001: доступ на КПП](#adr-001-доступ-на-кпп)
- [ADR-002: бронирование и сессия](#adr-002-бронирование-и-сессия)
- [ADR-003: стиль развёртывания](#adr-003-стиль-развёртывания)
- [ADR-004: реестр организаций](#adr-004-реестр-организаций)
- [Связанные документы](#связанные-документы)

## ADR-001: доступ на КПП

- [adr-001-online-access-rights-evaluation.md](adr-001-online-access-rights-evaluation.md) — оценка прав доступа онлайн на каждый запрос КПП (`allow/deny`).

## ADR-002: бронирование и сессия

- [adr-002-booking-vs-session.md](adr-002-booking-vs-session.md) — бронирование vs парковочная сессия, мастер-сущности.

## ADR-003: стиль развёртывания

- [adr-003-modular-monolith.md](adr-003-modular-monolith.md) — модульный монолит для учебного проекта; ссылки на NFR и ADR-001/002.

## ADR-004: реестр организаций

- [adr-004-dadata-organization-lookup.md](adr-004-dadata-organization-lookup.md) — интеграция с DADATA для автозаполнения реквизитов ЮЛ по ИНН при регистрации; fallback на ручной ввод.

## Связанные документы

- [Индекс архитектуры](../readme.md) — DDD-материалы и внешний контекст.
- [DDD bounded contexts](../ddd/ddd-bounded-contexts.md) — согласование с ADR-003.

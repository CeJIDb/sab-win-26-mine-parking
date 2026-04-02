# ERD (Entity-Relationship Diagram)

В этой папке собраны материалы по ER-модели проекта: нормализованная модель, нарезка диаграмм под лимиты DrawSQL и “файлы связей” по доменам.

## Оглавление

- [Ключевые документы](#ключевые-документы)
- [Файлы связей по доменам](#файлы-связей-по-доменам)
- [Контексты ревью](#контексты-ревью)
- [Заметки](#заметки)

## Ключевые документы

- [erd-normalized-er-model.md](erd-normalized-er-model.md) — полный нормализованный ERD (источник истины).

## Файлы связей по доменам

- [erd-relationships-client-client-profile.md](erd-relationships-client-client-profile.md)
- [erd-relationships-facility-access-log.md](erd-relationships-facility-access-log.md)
- [erd-relationships-tariff-employee-notification-appeal.md](erd-relationships-tariff-employee-notification-appeal.md)
- [erd-relationships-booking-session-contract.md](erd-relationships-booking-session-contract.md)
- [erd-relationships-payment-billing.md](erd-relationships-payment-billing.md)

## Контексты ревью

Контексты ревью — вспомогательные материалы из обсуждений. Они **не являются источником истины** для ER-модели: каноничные состояния фиксируются в `erd-normalized-er-model.md` и доменных “файлах связей”.

- [chat-context/chat-context-er-model-review-2-2026-03-31.md](chat-context/chat-context-er-model-review-2-2026-03-31.md)
- [chat-context/chat-context-er-model-review-3-2026-03-31.md](chat-context/chat-context-er-model-review-3-2026-03-31.md)
- [chat-context/chat-context-er-model-review-4-2026-04-01.md](chat-context/chat-context-er-model-review-4-2026-04-01.md)

## Заметки

- **Аудит:** в целевой БД у **каждой** таблицы предполагаются `created_at` и `updated_at` (`TIMESTAMPTZ NOT NULL DEFAULT now()`; `updated_at` обновляется триггером `moddatetime`). В каноничных артефактах (`erd-normalized-er-model.md`, `erd-relationships-*.md`) эти поля перечислены явно для наглядности и DrawSQL; в обзорной Mermaid в `erd-normalized-er-model.md` они опущены.
- Ссылки внутри папки — относительные (чтобы переносы были дешевле).
- Кросс-контекстные связи (между схемами) документируются как **логические ссылки** (без `REFERENCES`), см. ADR-003.


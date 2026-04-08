# ERD Review — контекст для нового чата (сессия 10+)

**Дата:** 2026-04-01 | **Документ-источник:** `docs/architecture/database/erd/erd-normalized-er-model.md`

## Table of Contents

- [Итог сессии 9+ (этот чат)](#итог-сессии-9-этот-чат)
- [Ключевые решения по разбиению ERD](#ключевые-решения-по-разбиению-erd)
- [Созданные и обновленные артефакты](#созданные-и-обновленные-артефакты)
- [Правила и напоминания для команды](#правила-и-напоминания-для-команды)
- [Связанные документы](#связанные-документы)

---

## Итог сессии 9+ (этот чат)

**Цель:** разделить ERD на несколько файлов по bounded contexts (DDD) для параллельной работы команды из 5 человек, сохраняя ограничение: **не более 15 таблиц на одну диаграмму/файл**.

**Что сделано:**

- Артефакт клиента дополнен таблицей **`VEHICLE_TYPE`** (тип ТС) как "связанный справочник" для поля `client.VEHICLE.vehicle_type_id`.
- Созданы 4 новых ERD-файла (по шаблону клиентского артефакта) с:
  - таблицей ключевых связей,
  - полным описанием таблиц,
  - явным списком **кросс-схемных логических ссылок** (без `REFERENCES`, ADR-003),
  - Table Notes для ограничений DrawSQL (CHECK, partial unique, generated columns и т.п.),
  - Mermaid-фрагментами связей.
- Сотрудники (`employee.*`) и уведомления (`notification.*`) добавлены в файл "Тарифы" для более равномерного распределения нагрузки между участниками.
- КПП переименованы в **AP (access point)** во всех ERD-артефактах: `KPP/kpp_id/entry_kpp_id/exit_kpp_id` → `access_points/access_point_id/entry_access_point_id/exit_access_point_id`.
- `APPEAL` вынесен из файла "Booking/Session/Contract" в файл "Tariff/Employee/Notification/Appeal", чтобы связи `EMPLOYEE → APPEAL` были в рамках одного файла.
- Инфраструктура: `PARKING_TYPE` переведен из справочника в `PARKING.parking_type` с `CHECK (...)`; в `PARKING_PLACE` сохранен `is_occupied`, а признак резервирования вынесен в производное состояние по `BOOKING`.
- Денежные поля унифицированы: вместо `NUMERIC(19,4)` используются `*_minor BIGINT` (сумма в минорных единицах валюты, для `RUB` — копейки).
- Структура артефактов ERD приведена к единому каталогу `docs/architecture/database/erd/` с индексом `readme.md`; контексты чатов собраны в подпапке `docs/architecture/database/erd/chat-context/`.
- Аутентификация сотрудников: credential-модель сотрудника переименована в **`EMPLOYEE_ACCOUNT`** (схема `auth`) и вынесена из доменной таблицы `employee.EMPLOYEE`; добавлено описание полей `login`, `password_hash`, `totp_secret_encrypted`, `account_status`.
- Уведомления: в `notification.NOTIFICATION` добавлена полиморфная привязка к предмету как в `support.APPEAL`: **`subject_type + subject_id`** с инвариантом `CHECK ((subject_type IS NULL) = (subject_id IS NULL))` и индексом `(subject_type, subject_id)` (в Table Notes).
- Статусы сотрудника: устранено дублирование смыслов между доменным статусом и статусом доступа: `EMPLOYEE.status` ограничен до `ACTIVE|DISMISSED`, а блокировки и приостановка доступа фиксируются в `EMPLOYEE_ACCOUNT.account_status` (`ACTIVE|BLOCKED|SUSPENDED`).
- Синхронизация: `erd-normalized-er-model.md` приведен в соответствие с разрезанными артефактами `erd-relationships-*.md` (включая `PARKING.parking_type`, флаги `PARKING_PLACE`, логические кросс-схемные ссылки и актуальные enum-CHECK).

---

## Ключевые решения по разбиению ERD

### 1) Тип ТС относится к языку клиента

Таблица `facility.VEHICLE_TYPE` документируется в клиентском артефакте как связанный справочник, потому что:

- поле `client.VEHICLE.vehicle_type_id` является частью клиентского профиля ТС;
- это снижает когнитивную нагрузку при работе с доменом клиента.

При этом `facility.ZONE_TYPE_VEHICLE_TYPE` остается в домене facility (зональность), а связь к `VEHICLE_TYPE` фиксируется как логическая (кросс-схемная).

### 2) Разбиение на 4 файла (плюс уже существующий Client)

Итоговый набор файлов для работы командой:

- `CLIENT` (существующий, обновлен): клиент/организация/ТС/настройки/PII и теперь также `VEHICLE_TYPE`.
- `FACILITY + ACCESS_LOG`: инфраструктура парковки + журнал событий AP.
- `TARIFF + EMPLOYEE + NOTIFICATION + APPEAL`: тарифы + сотрудники + уведомления + обращения (для выравнивания нагрузки).
- `BOOKING + SESSION + CONTRACT`: бронирования, сессии, договоры.
- `PAYMENT`: выставление счетов, прием оплат, чеки, возвраты, задолженность, методы оплаты.

---

## Созданные и обновленные артефакты

### Обновлено

- `docs/architecture/database/erd/erd-relationships-client-client-profile.md`
  - добавлена таблица `VEHICLE_TYPE` (полностью),
  - обновлен Table of Contents,
  - приведен русский текст к правилу "без буквы ё" (используется "е").

### Создано

- `docs/architecture/database/erd/erd-relationships-facility-access-log.md`
- `docs/architecture/database/erd/erd-relationships-tariff-employee-notification-appeal.md`
- `docs/architecture/database/erd/erd-relationships-booking-session-contract.md`
- `docs/architecture/database/erd/erd-relationships-payment-billing.md`

---

## Правила и напоминания для команды

- **ADR-003 (схемная изоляция):** физические `REFERENCES` допускаются только внутри одной схемы; связи между схемами документируются как **логические ссылки** (без FK constraints).
- **DrawSQL ограничения:** CHECK, partial unique indexes, generated columns и составные UNIQUE документировать в **Table Notes** соответствующих таблиц.
- **Лимит диаграмм:** если при развитии контекста файл разрастается выше 15 таблиц, выделять дополнительный файл внутри того же контекста (без пересмотра границ).

---

## Связанные документы

- [ERD (erd-normalized-er-model)](../erd-normalized-er-model.md)
- [Контекст ревью ERD, сессия 9+](chat-context-er-model-review-3-2026-03-31.md)
- [Контекст ревью ERD, сессии 1–3](chat-context-er-model-review-2-2026-03-31.md)
- [DDD Bounded Contexts](../../../ddd/ddd-bounded-contexts.md)
- [ADR-002](../../../adr/adr-002-booking-vs-session.md)
- [ADR-003](../../../adr/adr-003-modular-monolith.md)
- [ADR-004](../../../adr/adr-004-dadata-organization-lookup.md)

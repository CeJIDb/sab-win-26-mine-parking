# ERD Review Notes — сессия 2

Заметки по результатам ревью `temp-normalized-er-model.md`.
Источник: чат ae7a9fe3-6111-45e3-a183-93bb60ea3260 (первая сессия) + продолжение.

## Оглавление

- [Объяснения по замечаниям](#объяснения-по-замечаниям)
  - [ERD-001 — Доступ не является сущностью](#erd-001--доступ-не-является-сущностью)
  - [ERD-002 — Кросс-схемные FK и схемная изоляция](#erd-002--кросс-схемные-fk-и-схемная-изоляция)
  - [ERD-004 — Полиморфный ключ в APPEAL](#erd-004--полиморфный-ключ-в-appeal)
  - [ERD-008 — XOR-инвариант ФЛ/ЮЛ](#erd-008--xor-инвариант-флюл)
  - [ERD-009 — Схемная изоляция по bounded contexts](#erd-009--схемная-изоляция-по-bounded-contexts)
  - [ERD-014 — UNIQUE на invoice_number и contract_number](#erd-014--unique-на-invoice_number-и-contract_number)
  - [ERD-015 — Частичный UNIQUE на provider_id](#erd-015--частичный-unique-на-provider_id)
  - [ERD-016 — Варианты для поля channels](#erd-016--варианты-для-поля-channels)
  - [ERD-017 — Почему нужны REFUND и DEBT](#erd-017--почему-нужны-refund-и-debt)
  - [ERD-018 — booking_id NOT NULL ломает периодические счета](#erd-018--booking_id-not-null-ломает-периодические-счета)
  - [ERD-020 — Критические индексы](#erd-020--критические-индексы)
  - [ERD-021 — UNIQUE на PARKING_SCHEDULE](#erd-021--unique-на-parking_schedule)
  - [ERD-022 — Частичный UNIQUE на is_primary](#erd-022--частичный-unique-на-is_primary)
  - [ERD-023 — CHECK в APPEAL](#erd-023--check-в-appeal)
  - [ERD-025 — Поле amount_paid и риск рассинхронизации](#erd-025--поле-amount_paid-и-риск-рассинхронизации)
  - [ERD-028 — Изоляция NOTIFICATION от CLIENT](#erd-028--изоляция-notification-от-client)
- [Применённые исправления](#применённые-исправления)

---

## Объяснения по замечаниям

### ERD-001 — Доступ не является сущностью

`Доступ` — это bounded context, а не сущность. Само **решение** (разрешить/запретить) транзитно и не требует хранения. Но контекст `Доступ` владеет тремя персистентными моделями:

- **`blacklist_entry`** — заблокированные `vehicleId`/`clientId`;
- **`access_restriction`** — временные ограничения по конкретным ПМ, секторам, периодам;
- **`access_audit_log`** — журнал принятых решений для разбора инцидентов и поддержки.

Эти таблицы нужны. Сущность `ACCESS_DECISION` как оперативная запись каждого решения — спорна. В ERD стоит показывать только `blacklist_entry` и `access_restriction`; аудитный журнал — в контекст `Отчёт`.

---

### ERD-002 — Кросс-схемные FK и схемная изоляция

**Проблема.** ADR-003 требует, чтобы каждый bounded context работал в **своей PostgreSQL-схеме** с отдельными GRANT-правами. Когда `booking.booking` имеет:

```sql
contract_id BIGINT REFERENCES contract.contract(id)
```

это кросс-схемный FK. Последствия:

- нельзя сделать `REVOKE ALL ON SCHEMA contract FROM booking_app_role` — иначе FK-constraint сломается;
- следовательно, нельзя изолировать права между схемами;
- миграции схемы `contract` начинают влиять на схему `booking`.

**Решение.** FK-constraint убирается, остаётся просто колонка `contract_id BIGINT` — числовое значение, не ссылка. Консистентность обеспечивается Application Service.

---

### ERD-004 — Полиморфный ключ в APPEAL

**Пример проблемы.** `appeal` в схеме `support` содержит:

```sql
booking_id        BIGINT REFERENCES booking.booking(id)
parking_session_id BIGINT REFERENCES session.parking_session(id)
payment_id        BIGINT REFERENCES payment.payment(id)
```

При схемной изоляции `support_app_role` не имеет USAGE на схемы `booking`, `session`, `payment`. FK-constraint потребует этих прав — конфликт с ADR-003.

**Решение** — полиморфный ключ без FK-constraint:

```sql
-- вместо 5 nullable FK:
subject_type VARCHAR(32) CHECK (subject_type IN ('BOOKING','SESSION','PAYMENT','RECEIPT','CONTRACT')),
subject_id   BIGINT,
CHECK ((subject_type IS NULL) = (subject_id IS NULL))
```

---

### ERD-008 — XOR-инвариант ФЛ/ЮЛ

`CLIENT.type` хранит строку `'FL'`/`'UL'`, но нет гарантии, что при `type='FL'` запись в `CLIENT_FL` **существует** и `CLIENT_UL` **не существует**. В PostgreSQL `CHECK`-constraint не может делать подзапросы к другим таблицам. Единственный вариант — `BEFORE INSERT/UPDATE` триггер (или Application Service), проверяющий наличие дочерней строки.

---

### ERD-009 — Схемная изоляция по bounded contexts

Сейчас все таблицы, вероятно, в одной схеме `public`. По ADR-003 должно быть:

```sql
CREATE SCHEMA facility;
CREATE TABLE facility.parking (...);
CREATE TABLE facility.sector (...);

CREATE SCHEMA booking;
CREATE TABLE booking.booking (...);  -- vehicle_id без REFERENCES facility.vehicle

CREATE SCHEMA pii;                   -- 152-ФЗ
CREATE TABLE pii.passport_data (...);
GRANT USAGE, SELECT ON SCHEMA pii TO client_app_role;
-- booking_app_role НЕ имеет прав на pii — физическая гарантия изоляции

CREATE SCHEMA auth;                  -- инфраструктурный слой
CREATE TABLE auth.client_credential (...);
CREATE TABLE auth.employee_credential (...);
```

---

### ERD-014 — UNIQUE на invoice_number и contract_number

`invoice_number` и `contract_number` — юридически значимые поля: фигурируют в актах, письмах, судебных документах. Без UNIQUE возможен дубль `ИНВ-2024-001` в двух строках — сверка становится невозможной.

```sql
ALTER TABLE invoice  ADD CONSTRAINT uq_invoice_number  UNIQUE (invoice_number);
ALTER TABLE contract ADD CONSTRAINT uq_contract_number UNIQUE (contract_number);
```

---

### ERD-015 — Частичный UNIQUE на provider_id

`provider_id` — idempotency key от платёжного провайдера (Tinkoff, СБП и т.д.). При сетевом сбое приложение повторяет запрос → получает ту же транзакцию дважды → две строки в `PAYMENT` с одним `provider_id` → **двойное списание**.

Решение — частичный уникальный индекс (не мешает оффлайн/наличным с `provider_id = NULL`):

```sql
CREATE UNIQUE INDEX ON payment(provider_id) WHERE provider_id IS NOT NULL;
```

---

### ERD-016 — Варианты для поля channels

Три варианта хранения набора каналов уведомлений:

```sql
-- Вариант 1: PostgreSQL array (рекомендуется)
channels TEXT[] NOT NULL DEFAULT '{}',
-- запрос: WHERE channels && ARRAY['email','sms']

-- Вариант 2: отдельная таблица (строгая нормализация)
CREATE TABLE notification_settings_channel (
  settings_id INTEGER NOT NULL REFERENCES notification_settings(id),
  channel     VARCHAR(32) NOT NULL CHECK (channel IN ('SMS','EMAIL','PUSH')),
  PRIMARY KEY (settings_id, channel)
);

-- Вариант 3: JSONB (избыточно для простого набора строк)
channels JSONB NOT NULL DEFAULT '[]'
```

Рекомендация: **Вариант 1** — просто, без JOIN, достаточно для конечного набора каналов. Применено в файле: `channels TEXT[] NOT NULL DEFAULT '{}'`.

---

### ERD-017 — Почему нужны REFUND и DEBT

Поле `PAYMENT.status = 'REFUNDED'` не передаёт:

- **какую сумму** вернули (может быть частичная);
- **когда** и по какому обращению;
- **PSP-идентификатор** возврата (отдельная транзакция у провайдера);
- **историю попыток** возврата.

Без отдельной таблицы `REFUND` невозможны: частичный возврат, отдельный фискальный документ, история.

`DEBT` нужна для просроченной задолженности ЮЛ: у каждого долга своя сумма, дата просрочки, источник (`invoice_id`). Без неё управление задолженностью сводится к `status = 'OVERDUE'` без деталей.

---

### ERD-018 — booking_id NOT NULL ломает периодические счета

`booking_id NOT NULL` означает: одна бронь → один счёт. Корпоративный клиент с договором паркует 50 раз/месяц → 50 отдельных счётов вместо одного консолидированного.

Кроме того, по DDD `INVOICE` владеет контекст `Платёж` (схема `payment`). `NOT NULL` FK на `booking` создаёт физическую зависимость схемы `payment` от схемы `booking`.

**Решение:**

- `booking_id BIGINT` (nullable);
- добавить `billing_period_from DATE`, `billing_period_to DATE` для периодических счётов;
- добавить `type CHECK('SINGLE','PERIODIC')`.

Инвариант: при `type = 'PERIODIC'` — `contract_id NOT NULL`, `booking_id IS NULL`; при `type = 'SINGLE'` — `booking_id NOT NULL`.

---

### ERD-020 — Критические индексы

Без индексов PostgreSQL делает Seq Scan — читает ВСЕ строки. Приоритеты:

```sql
-- Операционный путь КПП (критический: sub-10ms)
CREATE UNIQUE INDEX ON vehicle(license_plate);

-- Поиск активных бронирований
CREATE INDEX ON booking(status) WHERE status IN ('ACTIVE','PENDING');
CREATE INDEX ON booking(start_at, end_at);
CREATE INDEX ON booking(vehicle_id);

-- Операционный экран охранника
CREATE INDEX ON parking_session(status) WHERE status = 'ACTIVE';
CREATE INDEX ON parking_session(entry_time DESC);

-- Финансовые запросы
CREATE INDEX ON payment(status) WHERE status NOT IN ('COMPLETED','CANCELLED');
CREATE INDEX ON invoice(status);
```

`vehicle(license_plate)` — наиболее критичен: это путь LPR-распознавания на КПП.

---

### ERD-021 — UNIQUE на PARKING_SCHEDULE

Без `UNIQUE (parking_id, day_of_week, effective_from)` можно вставить две записи графика для одного дня/парковки/периода. Запрос «время открытия» вернёт два конфликтующих ряда.

---

### ERD-022 — Частичный UNIQUE на is_primary

`is_primary = true` без ограничения:

```sql
UPDATE organization_bank_account SET is_primary = true WHERE id IN (1,2,3);
-- Три «основных» счёта → документ на один, оплата на другой
```

Решение:

```sql
CREATE UNIQUE INDEX ON organization_bank_account(organization_id) WHERE is_primary = true;
```

Позволяет любое число `false`-строк, но только одну `true` на организацию.

---

### ERD-023 — CHECK в APPEAL

Без ограничения обращение может быть связано с бронированием И платежом одновременно — бессмысленно. В новой полиморфной модели:

```sql
CHECK ((subject_type IS NULL) = (subject_id IS NULL))
```

Гарантирует: оба поля либо оба NULL (обращение без предмета), либо оба NOT NULL.

---

### ERD-025 — Поле amount_paid и риск рассинхронизации

`invoice.amount_paid` — кэш суммы всех `PAYMENT` по счёту. Если платёж меняет статус на `COMPLETED`, но триггер/Application Service не обновил `amount_paid` — значения расходятся. Варианты митигации:

1. Триггер `AFTER INSERT/UPDATE ON payment FOR EACH ROW`: пересчитывает `amount_paid`;
2. Не хранить поле, считать через `SELECT SUM(amount) FROM payment WHERE invoice_id = ? AND status = 'COMPLETED'`.

Второй вариант безопаснее, первый — быстрее при частых чтениях.

---

### ERD-028 — Изоляция NOTIFICATION от CLIENT

`notification.client_id REFERENCES client(id)` создаёт зависимость схемы `notification` от схемы `client`. С изолированными схемами `notification_app_role` не должен иметь доступ к `client` напрямую.

**Решение:** адресат доставки передаётся как Value Object при создании задачи и хранится прямо в `NOTIFICATION.delivery_address`. Тогда таблица `notification` полностью автономна — может доставить сообщение без JOIN к `CLIENT`.

---

## Решения сессии 3 (2026-03-31)

### ERD-001 — итоговые решения

- `blacklist_entry` — **не нужна**; блокировка хранится в `CLIENT.status = 'BLOCKED'` + `status_reason`. При необходимости блокировки ТС — добавить `status`/`status_reason` в `VEHICLE`.
- `access_restriction` — **не нужна**; покрывается `operational_status` у `PARKING`, `SECTOR`, `PARKING_PLACE`.
- `access_audit_log` — хранить **в БД** как append-only таблицу `ACCESS_LOG` в схеме `report`. Нужно для разбора инцидентов (ручной допуск охранником и т.п.).

### ERD-002 — позиция по схемной изоляции

При модульном монолите кросс-схемные FK технически работают, но ADR-003 запрещает их для:
1. разграничения прав (`REVOKE` на схему без ломки FK);
2. независимых миграций;
3. явной документации зависимостей.

Правило: `REFERENCES`-constraints убираются только у **кросс-контекстных** FK. Внутри одного контекста FK-constraints оставляем.

### ERD-004 — полиморфный ключ в APPEAL

Принято. Паттерн «polymorphic association»: `subject_type + subject_id`. Нет cross-schema FK-constraints. В приложении: switch по `subject_type` → запрос к соответствующему репозиторию. Нужен индекс `(subject_type, subject_id)`.

### ERD-008 — варианты структуры CLIENT

Обсуждено три варианта (см. ответ в чате). Решение **не принято** — ожидает выбора пользователя:
- **A (текущий):** `CLIENT + CLIENT_FL + CLIENT_UL + ORGANIZATION` — строгий, 2 JOIN для ЮЛ.
- **B (предпочтение пользователя):** `CLIENT(organization_id) + CLIENT_PROFILE(только ФЛ) + ORGANIZATION` — 1 JOIN для любого типа, organization_id nullable в CLIENT.
- **C (плоский):** всё в CLIENT — просто, но много NULL.

### ERD-009 — схемная изоляция

ADR-003 остаётся в силе. При монолите схемы дают разграничение прав на уровне БД. Если пользователь хочет упростить — нужно пересмотреть ADR-003 отдельно.

### ERD-016 — вариант 2 выбран

`channels TEXT[]` убрано из `NOTIFICATION_SETTINGS`. Добавлена таблица `NOTIFICATION_SETTINGS_CHANNEL(settings_id, channel CHECK('SMS','EMAIL','PUSH'))` с составным PK.

### ERD-017 — логика REFUND и DEBT

Описана в ответе. Таблицы `REFUND` и `DEBT` **ещё не добавлены** в ERD — ожидают отдельного решения.

### ERD-025 — вариант 2 выбран

`amount_paid` удалено из `INVOICE`. Оплаченная сумма вычисляется через:
```sql
SELECT COALESCE(SUM(amount), 0) FROM payment WHERE invoice_id = ? AND status = 'COMPLETED'
```

### DrawSQL.app — поддержка constraints

| Возможность | Поддержка | Как отобразить |
|-------------|-----------|----------------|
| UNIQUE (столбец) | ✅ | Флажок "Unique" |
| Частичный UNIQUE (WHERE) | ❌ | Table Description |
| CHECK | ❌ | Table Description |
| GENERATED ALWAYS AS | ❌ | Тип колонки + Table Description |
| TEXT[] | ❌ | Заменить на отдельную таблицу или TEXT + Description |
| Составной UNIQUE | ❌ | SQL Import или Table Notes |
| Обычные индексы | ❌ | Документировать в `temp-normalized-er-model.md` |

---

## Применённые исправления

| # | Изменение |
|---|-----------|
| ERD-003 | `INVOICE.booking_id` → nullable; добавлены `billing_period_from`, `billing_period_to`, `type CHECK('SINGLE','PERIODIC')` |
| ERD-005 | FK инвертирован: `client_id NOT NULL UNIQUE` в `NOTIFICATION_SETTINGS` и `PAYMENT_SETTINGS`; `notification_settings_id`/`payment_settings_id` удалены из `CLIENT` |
| ERD-006 | `PASSPORT_DATA` и `BENEFIT_DOCUMENT` помечены схемой `pii`; `series_and_number` → `BYTEA` |
| ERD-007 | `CLIENT_ACCOUNT` и `EMPLOYEE_CREDENTIAL` помечены схемой `auth`; FK без `REFERENCES` |
| ERD-010 | Конвенция аудитных полей (`created_at`/`updated_at`) для всех таблиц в разделе соглашений |
| ERD-011 | `license_plate_snapshot VARCHAR(32) NOT NULL` добавлен в `BOOKING` и `PARKING_SESSION` |
| ERD-012 | `effective_from DATE NOT NULL`, `effective_to DATE` добавлены в `TARIFF` |
| ERD-013 | Новая таблица `TARIFF_RATE` (`tariff_id`, `rate`, `day_of_week`, `time_from`, `time_to`, `priority`); поле `rate` удалено из `TARIFF` |
| ERD-019 | `end_at TIMESTAMPTZ` добавлен в `BOOKING` как необязательный невычисляемый атрибут |
| ERD-024 | `sector_id` удалён из `BOOKING` и связи mermaid; сектор выводится через `parking_place_id → parking_place.sector_id` |
| ERD-026 | `duration_minutes INTEGER GENERATED ALWAYS AS (EXTRACT(EPOCH FROM (exit_time - entry_time)) / 60)::INTEGER STORED` в `PARKING_SESSION` |
| ERD-027 | Новая таблица `EMPLOYEE_CREDENTIAL` (схема `auth`); `login`/`password_hash`/`totp_secret_encrypted` удалены из `EMPLOYEE` |
| ERD-029 | Дублирующая связь `CLIENT→CONTRACT : signs` удалена; осталась одна `CLIENT→CONTRACT : has` |
| ERD-030 | Конвенция CHECK для enum-полей добавлена в раздел соглашений |
| ERD-031 | `license_plate VARCHAR(32) NOT NULL UNIQUE` в `VEHICLE` |
| ERD-032 | `CHECK (consent_type IN (...))` на `CONSENT`; `CHECK (benefit_category IN (...))` на `BENEFIT_DOCUMENT` |
| ERD-033 | `billing_step VARCHAR(32)` → `billing_step_unit VARCHAR(16) CHECK('MINUTE','HOUR','DAY')` + `billing_step_value INTEGER DEFAULT 1` в `TARIFF` |
| ERD-034 | `last_modified_by_employee_id` удалён из `CLIENT`; связь `EMPLOYEE→CLIENT : updates_status` удалена из mermaid |
| ERD-035 | `direction VARCHAR(16) CHECK('ENTRY','EXIT','BIDIRECTIONAL')` добавлен в `KPP` |
| ERD-036 | Добавлена секция "Схема `report`" в Замечания по реализации |

|| ERD-016 (v2) | `channels TEXT[]` удалено из `NOTIFICATION_SETTINGS`; добавлена таблица `NOTIFICATION_SETTINGS_CHANNEL(settings_id, channel CHECK('SMS','EMAIL','PUSH'))` с PK `(settings_id, channel)` |
|| ERD-025 (v2) | `amount_paid` удалено из `INVOICE`; оплата считается через `SELECT SUM(amount) FROM payment WHERE invoice_id=? AND status='COMPLETED'` |
|| ERD-008 (B) | `CLIENT_FL` → `CLIENT_PROFILE` (только для FL); `CLIENT_UL` удалена; `organization_id` перенесена в `CLIENT` как nullable логический FK |
|| ERD-017 | Добавлены таблицы `REFUND` и `DEBT` (схема `payment`) с атрибутами, связями и описанием бизнес-процесса |
|| DB-review | Добавлены: полный список FK-индексов (секция 5); анализ нормализации (1НФ/2НФ/3НФ/BCNF); архитектурные замечания (секция 6); REFUND/DEBT инварианты |
|| DB-review (применено) | `CLIENT.organization_id` → `REFERENCES organization(id)` (интра-схемный FK); `ORGANIZATION.inn` → `UNIQUE`; `ogrn` → `UNIQUE`; `BOOKING.duration_minutes` → nullable; покрывающий индекс `payment(invoice_id, status, amount) WHERE status='COMPLETED'` добавлен |
|| DrawSQL | Добавлена глобальная заметка о совместимости в начале секции атрибутов; inline-пометки у `GENERATED ALWAYS AS`, частичных UNIQUE, `BYTEA`, составных PK/UNIQUE |

### Дополнительные улучшения (без отдельных номеров ERD)

- Секция критических индексов (ERD-020) добавлена в "Замечания по реализации"
- `UNIQUE` на `contract_number` и `invoice_number` (ERD-014)
- Частичные уникальные индексы для `is_primary` и `provider_id` (ERD-022, ERD-015)
- `UNIQUE (parking_id, day_of_week, effective_from)` на `PARKING_SCHEDULE` (ERD-021)
- Полиморфный `subject_type + subject_id` в `APPEAL` вместо 5 cross-schema FK (ERD-004)
- Конвенция схемной изоляции (`facility`, `booking`, `session`, `tariff`, `payment`, `contract`, `client`, `support`, `employee`, `notification`, `auth`, `pii`) в разделе соглашений
- `delivery_address VARCHAR(320) NOT NULL` добавлен в `NOTIFICATION` (ERD-028)
- Сводная таблица ключевых связей обновлена (убрана SECTOR→BOOKING, добавлены TARIFF_RATE, EMPLOYEE_CREDENTIAL, пометки о логических FK)

## Связанные документы

- [ERD (temp-normalized-er-model)](temp-normalized-er-model.md)
- [DDD Bounded Contexts](../architecture/ddd/ddd-bounded-contexts.md)
- [ADR-002](../architecture/adr/adr-002-booking-vs-session.md)
- [ADR-003](../architecture/adr/adr-003-modular-monolith.md)

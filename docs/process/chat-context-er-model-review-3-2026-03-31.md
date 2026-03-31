# ERD Review — контекст для нового чата (сессия 4+)

**Дата:** 2026-03-31
**Документ:** `docs/artifacts/temp-normalized-er-model.md`
**Предыдущий контекст:** `docs/process/chat-context-er-model-review-2-2026-03-31.md`
**Источник (первый чат):** ae7a9fe3-6111-45e3-a183-93bb60ea3260

## Оглавление

- [Что это за проект](#что-это-за-проект)
- [Текущее состояние ERD](#текущее-состояние-erd)
- [Ключевые архитектурные решения](#ключевые-архитектурные-решения)
- [Все применённые исправления](#все-применённые-исправления)
- [DrawSQL.app — памятка](#drawsqlapp--памятка)
- [Открытые вопросы](#открытые-вопросы)
- [Связанные документы](#связанные-документы)

---

## Что это за проект

Парковочная платформа (Россия). **Модульный монолит** на PostgreSQL. Каждый bounded context — своя PostgreSQL-схема с отдельными GRANT-правами (ADR-003).

**Правило для FK:** `REFERENCES`-constraints убираются только у **кросс-контекстных** FK. Внутри одного контекста FK-constraints оставляем.

Диаграмма строится в **https://drawsql.app** (PostgreSQL dialect).

---

## Текущее состояние ERD

### Схемы и таблицы

| Схема | Таблицы |
|-------|---------|
| `facility` | `PARKING`, `PARKING_SCHEDULE`, `SECTOR`, `ZONE_TYPE`, `VEHICLE_TYPE`, `ZONE_TYPE_VEHICLE_TYPE`, `ZONE_TYPE_TARIFF`, `PARKING_PLACE`, `KPP` |
| `tariff` | `TARIFF`, `TARIFF_RATE` |
| `booking` | `BOOKING` |
| `session` | `PARKING_SESSION` |
| `payment` | `INVOICE`, `PAYMENT`, `RECEIPT`, `REFUND`, `DEBT` |
| `contract` | `CONTRACT`, `CONTRACT_TEMPLATE` |
| `client` | `CLIENT`, `CLIENT_PROFILE`, `ORGANIZATION`, `ORGANIZATION_BANK_ACCOUNT`, `NOTIFICATION_SETTINGS`, `NOTIFICATION_SETTINGS_CHANNEL`, `PAYMENT_SETTINGS`, `VEHICLE`, `CONSENT` |
| `auth` | `CLIENT_ACCOUNT`, `EMPLOYEE_CREDENTIAL` |
| `pii` | `PASSPORT_DATA`, `BENEFIT_DOCUMENT` |
| `employee` | `EMPLOYEE` |
| `notification` | `NOTIFICATION`, `NOTIFICATION_TEMPLATE` |
| `support` | `APPEAL` |
| `report` | *(запланировано)* `ACCESS_LOG` — аудитный журнал КПП |

### Ключевые поля и ограничения (что важно помнить)

**CLIENT** (`client` schema):
- `type VARCHAR(32) CHECK('FL','UL')`
- `status VARCHAR(32) CHECK('ACTIVE','BLOCKED','PENDING')` + `status_reason TEXT`
- `organization_id INTEGER REFERENCES organization(id)` — интра-схемный FK; `NULL` при FL, `NOT NULL` при UL
- Инвариант FL/UL: BEFORE INSERT/UPDATE триггер или Application Service

**CLIENT_PROFILE** (`client` schema) — только для FL:
- `client_id INTEGER PRIMARY KEY REFERENCES client(id)`
- ФИО, `passport_data_id`/`benefit_document_id` — логические FK в схему `pii` (без REFERENCES)

**ORGANIZATION** (`client` schema):
- `inn VARCHAR(12) UNIQUE` *(BCNF — ИНН функционально определяет организацию)*
- `ogrn VARCHAR(13) UNIQUE`

**BOOKING** (`booking` schema):
- Все FK — логические (без REFERENCES); `booking_number UNIQUE`
- `duration_minutes INTEGER` — nullable; NULL пока бронь открыта; устанавливается при завершении
- `amount_due NUMERIC(19,4)` — снимок тарифа, не пересчитывается

**PARKING_SESSION** (`session` schema):
- `booking_id BIGINT NOT NULL` — логический FK (без REFERENCES)
- `duration_minutes INTEGER GENERATED ALWAYS AS STORED` *(DrawSQL: тип INTEGER, логику указать в Table Notes)*

**INVOICE** (`payment` schema):
- `type CHECK('SINGLE','PERIODIC')`; при SINGLE: `booking_id NOT NULL`; при PERIODIC: `contract_id NOT NULL`, `booking_id IS NULL`
- `amount_paid` **удалено** — считать через `SELECT COALESCE(SUM(amount),0) FROM payment WHERE invoice_id=? AND status='COMPLETED'`

**PAYMENT** (`payment` schema):
- `provider_id VARCHAR(512)` — partial UNIQUE WHERE NOT NULL *(идемпотентность)*

**REFUND** (`payment` schema):
- `payment_id BIGINT REFERENCES payment(id)`, `amount NUMERIC(19,4)`, `status CHECK('INITIATED','COMPLETED','FAILED')`
- `refund_provider_id VARCHAR(512)` — partial UNIQUE WHERE NOT NULL

**DEBT** (`payment` schema):
- `invoice_id BIGINT REFERENCES invoice(id)`, `client_id INTEGER` (логический FK, cross-schema)
- `status CHECK('ACTIVE','PAID','WRITTEN_OFF')`; создаётся scheduled job при просрочке

**NOTIFICATION_SETTINGS** (`client` schema):
- `channels` поле **удалено** → вынесено в `NOTIFICATION_SETTINGS_CHANNEL(settings_id PK/FK, channel CHECK('SMS','EMAIL','PUSH'))`

**NOTIFICATION** (`notification` schema):
- `delivery_address VARCHAR(320) NOT NULL` — адресат сохраняется при создании задачи; нет JOIN к CLIENT

**APPEAL** (`support` schema):
- Полиморфная пара: `subject_type VARCHAR(32) CHECK('BOOKING','SESSION','PAYMENT','RECEIPT','CONTRACT')` + `subject_id BIGINT`
- `CHECK ((subject_type IS NULL) = (subject_id IS NULL))` *(DrawSQL: указать в Table Notes)*

---

## Ключевые архитектурные решения

| Решение | Суть |
|---------|------|
| **ADR-003** | Схемная изоляция: каждый bounded context в своей схеме PostgreSQL |
| **ADR-002** | `PARKING_SESSION` всегда привязана к `BOOKING` (`booking_id NOT NULL`) |
| **CLIENT Вариант Б** | `CLIENT_PROFILE` только для ФЛ; ЮЛ идентифицируется через `CLIENT.organization_id` |
| **INVOICE** | `SINGLE` = разовый по брони; `PERIODIC` = консолидированный ЮЛ по договору |
| **APPEAL** | Полиморфный `subject_type + subject_id` вместо 5 cross-schema nullable FK |
| **NOTIFICATION** | Автономна: `delivery_address` в записи, не JOIN к CLIENT |
| **REFUND / DEBT** | Отдельные таблицы для частичных возвратов и просроченной задолженности ЮЛ |
| **amount_paid** | Не хранить — вычислять через SUM+покрывающий индекс |
| **duration_minutes** | BOOKING: nullable (NULL до закрытия). SESSION: GENERATED ALWAYS AS STORED |

---

## Все применённые исправления

### Сессии 1–2 (ранее)

| ID | Изменение |
|----|-----------|
| ERD-003 | `INVOICE.booking_id` → nullable; добавлены `billing_period_from`, `billing_period_to`, `type CHECK('SINGLE','PERIODIC')` |
| ERD-005 | FK инвертирован: `client_id NOT NULL UNIQUE` в `NOTIFICATION_SETTINGS` и `PAYMENT_SETTINGS` |
| ERD-006 | `PASSPORT_DATA`, `BENEFIT_DOCUMENT` → схема `pii`; `series_and_number` → `BYTEA` |
| ERD-007 | `CLIENT_ACCOUNT`, `EMPLOYEE_CREDENTIAL` → схема `auth`; FK без `REFERENCES` |
| ERD-010 | Аудитные поля `created_at`/`updated_at` для всех таблиц |
| ERD-011 | `license_plate_snapshot VARCHAR(32) NOT NULL` в `BOOKING` и `PARKING_SESSION` |
| ERD-012 | `effective_from DATE NOT NULL`, `effective_to DATE` в `TARIFF` |
| ERD-013 | Новая таблица `TARIFF_RATE`; поле `rate` удалено из `TARIFF` |
| ERD-014 | `invoice_number UNIQUE`, `contract_number UNIQUE` |
| ERD-015 | Partial UNIQUE на `payment(provider_id) WHERE provider_id IS NOT NULL` |
| ERD-019 | `end_at TIMESTAMPTZ` → nullable в `BOOKING` |
| ERD-021 | `UNIQUE(parking_id, day_of_week, effective_from)` на `PARKING_SCHEDULE` |
| ERD-022 | Partial UNIQUE на `organization_bank_account(organization_id) WHERE is_primary=true` |
| ERD-024 | `sector_id` удалён из `BOOKING`; сектор → через `parking_place_id → sector_id` |
| ERD-026 | `duration_minutes GENERATED ALWAYS AS STORED` в `PARKING_SESSION` |
| ERD-027 | `EMPLOYEE_CREDENTIAL` (схема `auth`) выделена из `EMPLOYEE` |
| ERD-029 | Дублирующая связь `CLIENT→CONTRACT : signs` удалена |
| ERD-031 | `license_plate VARCHAR(32) NOT NULL UNIQUE` в `VEHICLE` |
| ERD-033 | `billing_step_unit CHECK('MINUTE','HOUR','DAY')` + `billing_step_value INTEGER DEFAULT 1` в `TARIFF` |
| ERD-035 | `direction CHECK('ENTRY','EXIT','BIDIRECTIONAL')` в `KPP` |

### Сессия 3 (2026-03-31)

| ID | Изменение |
|----|-----------|
| ERD-016 v2 | `channels TEXT[]` удалено из `NOTIFICATION_SETTINGS`; добавлена `NOTIFICATION_SETTINGS_CHANNEL(settings_id, channel CHECK('SMS','EMAIL','PUSH'))` с составным PK |
| ERD-025 v2 | `amount_paid` удалено из `INVOICE`; добавлен покрывающий индекс `payment(invoice_id, status, amount) WHERE status='COMPLETED'` |
| ERD-008 B | `CLIENT_FL` → `CLIENT_PROFILE` (только для FL); `CLIENT_UL` удалена; `organization_id` в `CLIENT` |
| ERD-017 | Добавлены таблицы `REFUND` и `DEBT` со всей атрибутикой и описанием бизнес-процесса |
| DB-review | Полный список FK-индексов (секция 5); анализ нормализации 1НФ/2НФ/3НФ/BCNF (секция 6) |
| DB-apply-1 | `CLIENT.organization_id` → `REFERENCES organization(id)` (интра-схемный FK, обе таблицы в `client`) |
| DB-apply-2 | `ORGANIZATION.inn VARCHAR(12) UNIQUE`; `ogrn VARCHAR(13) UNIQUE` |
| DB-apply-3 | `BOOKING.duration_minutes` → nullable |
| DrawSQL | Глобальная заметка + inline-пометки у `GENERATED ALWAYS AS`, partial UNIQUE, BYTEA, составных PK/UNIQUE |

---

## DrawSQL.app — памятка

| Тип / Возможность | Поддержка | Как обойти |
|-------------------|-----------|-----------|
| `INTEGER`, `BIGINT`, `SMALLINT`, `VARCHAR(n)`, `TEXT`, `BOOLEAN`, `DATE`, `TIME`, `TIMESTAMPTZ`, `NUMERIC(p,s)`, `CHAR(n)`, `BYTEA` | ✅ | — |
| UNIQUE (одиночный столбец) | ✅ | Флажок Unique на столбце |
| PRIMARY KEY (составной) | ✅ | Отметить оба столбца как PK |
| FOREIGN KEY (стрелка) | ✅ | Через связи в UI |
| `GENERATED ALWAYS AS` | ❌ | Тип `INTEGER` + в **Table Notes**: `GENERATED ALWAYS AS (...)` |
| `CHECK` constraints | ❌ | Указать в **Table Notes** |
| Частичный UNIQUE (`WHERE ...`) | ❌ | Указать в **Table Notes** |
| Составной UNIQUE | ❌ | SQL Import или **Table Notes** |
| `TEXT[]` (массивы) | ❌ | Вынести в отдельную таблицу (уже сделано) |
| Обычные индексы | ❌ | Документировать в `temp-normalized-er-model.md` секция 5 |
| `DEFAULT` значения | ❌ | Только в описании |

**Как добавить Table Notes в DrawSQL:** кликнуть на таблицу → иконка «i» / Description → ввести текст.

---

## Открытые вопросы

1. **`ACCESS_LOG` в схеме `report`** — принято решение хранить в БД, но таблица ещё не добавлена в ERD. Поля: `id BIGINT PK`, `vehicle_id INTEGER`, `client_id INTEGER`, `kpp_id INTEGER`, `decision VARCHAR(16) CHECK('ALLOW','DENY','MANUAL')`, `reason TEXT`, `decided_at TIMESTAMPTZ`. Все FK — логические (append-only).

2. **`VEHICLE.status`** — нужно ли блокировать конкретное ТС независимо от клиента? (например угнанный автомобиль). Сейчас статус есть только в `CLIENT`. Если нужно — добавить `status VARCHAR(32) CHECK('ACTIVE','BLOCKED')` + `status_reason TEXT` в `VEHICLE`.

3. **`DEBT.amount` — вычислять или хранить?** Сейчас хранится снимок суммы на момент создания. Если платежи поступают частично, фактическая задолженность может меняться. Рассмотреть nullable `remaining_amount` или вычислять через запрос.

4. **`TARIFF_RATE` — уникальность ставок** — сейчас уникальность применимой ставки контролируется бизнес-логикой. Рассмотреть составной UNIQUE или приоритетную логику выбора.

5. **`BOOKING.type` — допустимые значения?** В файле тип есть, но значения CHECK не зафиксированы. Уточнить: `CHECK(type IN ('STANDARD','CONTRACT','VISITOR',...))`

6. **`ORGANIZATION.inn` — nullable или NOT NULL?** Сейчас nullable + UNIQUE. Решить: должен ли ИНН быть обязательным при регистрации ЮЛ?

7. **Нумерация разделов «Таблицы»** — после добавления `CLIENT_PROFILE`, `REFUND`, `DEBT` нумерация сбилась. При возможности — упорядочить.

---

## Связанные документы

- **[ERD (temp-normalized-er-model)](../artifacts/temp-normalized-er-model.md)** — основной файл
- **[DDD Bounded Contexts](../architecture/ddd/ddd-bounded-contexts.md)**
- **[ADR-002](../architecture/adr/adr-002-booking-vs-session.md)** — бронирование и парковочная сессия
- **[ADR-003](../architecture/adr/adr-003-modular-monolith.md)** — модульный монолит и схемная изоляция
- **[Предыдущий контекст](chat-context-er-model-review-2-2026-03-31.md)** — детальные объяснения по каждому ERD-замечанию

# Временная ER-модель с нормализацией

## Table of Contents

- [Related Documents](#related-documents)
- [Назначение документа](#назначение-документа)
- [Легенда имен](#легенда-имен)
- [Соглашения по типам данных (PostgreSQL)](#соглашения-по-типам-данных-postgresql)
- [Атрибуты по сущностям (PostgreSQL)](#атрибуты-по-сущностям-postgresql)
- [Таблицы](#таблицы)
- [Сводка ключевых связей](#сводка-ключевых-связей)
- [Замечания по реализации](#замечания-по-реализации)
- [Статус документа](#статус-документа)

## Related Documents

- [Концептуальная модель с атрибутами](../conceptual-model-with-attributes.md)
- [ADR-002: бронирование и парковочная сессия](../../architecture/adr/adr-002-booking-vs-session.md)
- [Глоссарий проекта](../project-glossary.md)
- [ФТ: парковочная сессия](../../specs/functional-requirements/fr-parking-session.md)

```mermaid
erDiagram
    PARKING ||--o{ PARKING_SCHEDULE : has
    PARKING ||--o{ SECTOR : contains
    PARKING ||--o{ AP : has

    ZONE_TYPE ||--o{ SECTOR : classifies
    ZONE_TYPE ||--o{ ZONE_TYPE_VEHICLE_TYPE : allows
    VEHICLE_TYPE ||--o{ ZONE_TYPE_VEHICLE_TYPE : allowed_for
    ZONE_TYPE ||--o{ ZONE_TYPE_TARIFF : supports
    TARIFF ||--o{ ZONE_TYPE_TARIFF : applies_to
    TARIFF ||--o{ TARIFF_RATE : has_rates

    PARKING_TYPE ||--o{ PARKING : classifies
    OPERATIONAL_STATUS ||--o{ PARKING : has_status
    OPERATIONAL_STATUS ||--o{ SECTOR : has_status
    OPERATIONAL_STATUS ||--o{ PARKING_PLACE : has_status
    OPERATIONAL_STATUS ||--o{ AP : has_status

    SECTOR ||--o{ PARKING_PLACE : contains
    TARIFF ||--o{ PARKING_PLACE : overrides

    CLIENT |o--|| ORGANIZATION : has_ul_profile
    CLIENT ||--|| NOTIFICATION_SETTINGS : has
    NOTIFICATION_SETTINGS ||--o{ NOTIFICATION_SETTINGS_CHANNEL : has
    CLIENT ||--|| PAYMENT_SETTINGS : has
    CLIENT ||--o{ CLIENT_ACCOUNT : authenticates
    CLIENT ||--o{ VEHICLE : owns
    CLIENT ||--o{ CONSENT : gives
    CLIENT ||--o{ NOTIFICATION : receives
    CLIENT ||--o{ APPEAL : creates
    CLIENT ||--o| PASSPORT_DATA : uses
    CLIENT ||--o| BENEFIT_DOCUMENT : has
    ORGANIZATION ||--o{ ORGANIZATION_BANK_ACCOUNT : has

    CONTRACT_TEMPLATE ||--o{ CONTRACT : generates
    CLIENT ||--o{ CONTRACT : has

    VEHICLE_TYPE ||--o{ VEHICLE : classifies

    CONTRACT ||--o{ BOOKING : governs
    VEHICLE ||--o{ BOOKING : booked_for
    PARKING_PLACE ||--o{ BOOKING : reserved_as
    TARIFF ||--o{ BOOKING : priced_by

    BOOKING ||--o{ PARKING_SESSION : results_in
    AP ||--o{ PARKING_SESSION : entry_exit_for
    EMPLOYEE_ROLE ||--o{ EMPLOYEE : defines
    EMPLOYEE ||--o{ PARKING_SESSION : handles
    EMPLOYEE ||--|| EMPLOYEE_CREDENTIAL : authenticates

    BOOKING ||--o{ INVOICE : billed_as
    INVOICE ||--o{ PAYMENT : paid_by
    PAYMENT_METHOD ||--o{ PAYMENT : uses
    PAYMENT ||--o| RECEIPT : fiscalized_as
    PAYMENT ||--o{ REFUND : has_refunds
    INVOICE ||--o| DEBT : generates

    EMPLOYEE ||--o{ NOTIFICATION : initiates
    NOTIFICATION_TEMPLATE ||--o{ NOTIFICATION : generates

    EMPLOYEE ||--o{ APPEAL : handles

    AP ||--o{ ACCESS_LOG : records

    ACCESS_LOG {
        bigint id
        bigint ap_id
        bigint vehicle_id
        bigint client_id
        string direction
        string decision
        string reason
        datetime decided_at
        datetime created_at
    }

    PARKING {
        bigint id
        string name
        string address
        bigint parking_type_id
        string description
        bigint operational_status_id
    }

    PARKING_SCHEDULE {
        bigint id
        bigint parking_id
        int day_of_week
        time open_time
        time close_time
        bool is_closed
        date effective_from
        date effective_to
    }

    SECTOR {
        bigint id
        bigint parking_id
        bigint zone_type_id
        string name
        bigint operational_status_id
    }

    ZONE_TYPE {
        bigint id
        string code
        string name
        string description
    }

    VEHICLE_TYPE {
        bigint id
        string code
        string name
        string description
    }

    ZONE_TYPE_VEHICLE_TYPE {
        bigint zone_type_id
        bigint vehicle_type_id
    }

    ZONE_TYPE_TARIFF {
        bigint zone_type_id
        bigint tariff_id
    }

    PARKING_PLACE {
        bigint id
        bigint sector_id
        bigint override_tariff_id
        string place_number
        bigint operational_status_id
    }

    CLIENT {
        bigint id
        string type
        string phone
        string email
        string status
        string status_reason
        string last_name
        string first_name
        string middle_name
    }

    CLIENT_ACCOUNT {
        bigint id
        bigint client_id
        string auth_provider
        string login
        string phone_e164
        string email_normalized
        string password_hash
        string provider_subject_id
        string account_status
        datetime created_at
        datetime last_login_at
    }

    NOTIFICATION_SETTINGS {
        bigint id
        bigint client_id
        bool parking_session_enabled
        bool booking_enabled
        bool contract_enabled
        bool payment_enabled
        bool marketing_enabled
    }

    NOTIFICATION_SETTINGS_CHANNEL {
        bigint settings_id
        string channel
    }

    PAYMENT_SETTINGS {
        bigint id
        bigint client_id
        string external_payer_id
        bool auto_debit_contract
        bool auto_debit_parking_session
        decimal monthly_limit
    }

    PASSPORT_DATA {
        bigint id
        string document_type
        string series_and_number
        date issue_date
        string issued_by
        string department_code
        bigint client_id
    }

    BENEFIT_DOCUMENT {
        bigint id
        string benefit_category
        string document_type
        string document_number
        date issue_date
        date expiry_date
        string document_image_ref
        string verification_status
        bigint client_id
    }

    ORGANIZATION {
        bigint id
        bigint client_id
        string name
        string legal_form
        string legal_address
        string actual_address
        string inn
        string kpp
        string ogrn
        string email
        string phone
        string status
    }

    ORGANIZATION_BANK_ACCOUNT {
        bigint id
        bigint organization_id
        string bank_name
        string bik
        string account_number
        string correspondent_account
        bool is_primary
    }

    CONSENT {
        bigint id
        bigint client_id
        string consent_type
        bool consent_given
        datetime given_at
        datetime revoked_at
    }

    EMPLOYEE {
        bigint id
        bigint role_id
        string last_name
        string first_name
        string middle_name
        string phone
        string email
        string status
    }

    EMPLOYEE_CREDENTIAL {
        bigint employee_id
        string login
        string password_hash
        string totp_secret_encrypted
        string account_status
    }

    VEHICLE {
        bigint id
        bigint client_id
        bigint vehicle_type_id
        string license_plate
        string brand
        string model
        string color
    }

    AP {
        bigint id
        bigint parking_id
        string name
        string type
        string direction
        bigint operational_status_id
    }

    TARIFF {
        bigint id
        string name
        string type
        string benefit_category
        string billing_step_unit
        int billing_step_value
        decimal max_amount
        int grace_period_minutes
        date effective_from
        date effective_to
    }

    TARIFF_RATE {
        bigint id
        bigint tariff_id
        decimal rate
        int day_of_week
        time time_from
        time time_to
        int priority
    }

    CONTRACT_TEMPLATE {
        bigint id
        string code
        string name
        string version
        string type
        string body
        date effective_from
        date effective_to
    }

    CONTRACT {
        bigint id
        bigint client_id
        bigint contract_template_id
        string contract_number
        date start_date
        date end_date
        string status
        string document_file_ref
    }

    BOOKING {
        bigint id
        string booking_number
        bigint vehicle_id
        bigint parking_place_id
        bigint contract_id
        bigint tariff_id
        datetime start_at
        datetime end_at
        int duration_minutes
        string license_plate_snapshot
        string type
        string status
        decimal amount_due
    }

    INVOICE {
        bigint id
        bigint booking_id
        bigint contract_id
        string invoice_number
        string type
        string status
        decimal amount_due
        date billing_period_from
        date billing_period_to
        date issued_at
        date due_at
        datetime paid_at
    }

    PARKING_SESSION {
        bigint id
        bigint booking_id
        bigint entry_ap_id
        bigint exit_ap_id
        bigint employee_id
        datetime entry_time
        datetime exit_time
        string license_plate_snapshot
        string access_method
        string access_comment
        string status
    }

    PAYMENT {
        bigint id
        bigint invoice_id
        decimal amount
        string currency
        bigint payment_method_id
        string status
        datetime initiated_at
        datetime completed_at
        string provider_id
    }

    RECEIPT {
        bigint id
        bigint payment_id
        string fiscal_number
        datetime receipt_at
        string fiscal_status
        decimal amount
    }

    REFUND {
        bigint id
        bigint payment_id
        decimal amount
        string reason
        string refund_provider_id
        string status
        datetime initiated_at
        datetime completed_at
    }

    DEBT {
        bigint id
        bigint invoice_id
        bigint client_id
        decimal amount
        decimal remaining_amount
        date overdue_since
        string status
    }

    NOTIFICATION_TEMPLATE {
        bigint id
        string code
        string name
        string type
        string subject
        string body
    }

    NOTIFICATION {
        bigint id
        bigint notification_template_id
        bigint client_id
        bigint initiator_employee_id
        string channel
        string delivery_address
        string delivery_status
    }

    APPEAL {
        bigint id
        bigint client_id
        bigint employee_id
        string subject_type
        bigint subject_id
        string type
        string channel
        string subject
        string description
        string status
    }

    PARKING_TYPE {
        bigint id
        string code
        string name
        string description
    }

    OPERATIONAL_STATUS {
        bigint id
        string code
        string name
        string description
    }

    EMPLOYEE_ROLE {
        bigint id
        string code
        string name
        string description
    }

    PAYMENT_METHOD {
        bigint id
        string code
        string name
        string description
    }
```

> В блоке `erDiagram` выше типы атрибутов условные (`uuid`, `string`, …) и не задают физическую схему. Полный перечень атрибутов с целевыми типами PostgreSQL — в разделе [Атрибуты по сущностям (PostgreSQL)](#атрибуты-по-сущностям-postgresql); политика PK, деньги и время — в [Соглашения по типам данных (PostgreSQL)](#соглашения-по-типам-данных-postgresql).

## Назначение документа

Этот документ фиксирует **временную нормализованную ER-модель** на основе текущей концептуальной модели предметной области парковочной платформы.

Связь «бронирование — парковочная сессия» и отсутствие парковочной сессии без бронирования согласованы с решением **Option D** в [ADR-002](../../architecture/adr/adr-002-booking-vs-session.md) (сессия опирается на `BOOKING`).

Цель модели:

- показать, как концептуальные сущности могут быть преобразованы в более строгую логическую схему;
- устранить основные замечания по 1НФ, 3НФ и 4НФ;
- зафиксировать кандидатов в будущие таблицы и связи между ними.

Основные отличия от исходной концептуальной модели:

- `Клиент` разделен на общую сущность, подтипы `КлиентФЛ` и `КлиентЮЛ`, а также `Учетная запись клиента`;
- `Организация.банковскиеРеквизиты` вынесены в отдельную таблицу `ORGANIZATION_BANK_ACCOUNT`;
- `Парковка.временнойРежим` вынесен в отдельную таблицу `PARKING_SCHEDULE`;
- `Счет` (`INVOICE`) выделен как отдельная сущность финансового требования между основанием начисления и фактом оплаты;
- полиморфная ссылка в `Обращение` заменена набором явных nullable-FK на допустимые предметы обращения;
- `M:N` связи оформлены отдельными таблицами.

## Легенда имен

В Mermaid используются ASCII-имена сущностей и атрибутов для совместимости с редакторами и рендерерами; в тексте ниже пояснения по-русски. Связь `CLIENT ||--o{ CONTRACT : has` отражает доменную связь «клиент — договор».

## Соглашения по типам данных (PostgreSQL)

Раздел согласован с целевыми практиками производительности и эксплуатации (индексы под FK, компактные ключи, денежная точность) в духе ролей **database-optimizer** и **backend-architect**: не подменяет физическую миграцию и может уточняться при реализации.

### Идентификаторы: везде `BIGINT`

Все первичные ключи (`id`) и внешние ключи используют тип **`BIGINT GENERATED BY DEFAULT AS IDENTITY`**. Единое правило исключает расхождения типов между родительскими и дочерними таблицами и снимает риск переполнения диапазона при росте данных.

- **Не-ID целые** (`billing_step_value`, `grace_period_minutes`, `priority`, `duration_minutes`) — остаются `INTEGER`.
- **День недели** (`day_of_week`) — `SMALLINT` + `CHECK (day_of_week BETWEEN 1 AND 7)`.
- **Тип FK** всегда совпадает с типом PK родителя — `BIGINT`.
- Справочники с полем **`code`** — по-прежнему `VARCHAR` + `UNIQUE`; PK — `BIGINT`.

### Деньги, время, текст, булевы

- Суммы в валюте (тарифы, бронь, счет, платеж, чек, лимиты) — **`*_minor BIGINT`** (сумма в минорных единицах валюты, для `RUB` — копейки); тип `money` в PostgreSQL для целевой схемы не использовать как дефолт.
- Моменты событий (въезд, выезд, оплата, уведомления, согласия) — **`TIMESTAMPTZ`**; календарные даты без времени суток — **`DATE`**.
- Длительность в минутах (`duration_minutes`, льготные/тарифные интервалы) — **`INTEGER`**: диапазона `SMALLINT` может не хватить (например сутки = 1440 минут; длинные периоды — больше).
- Для **минут льготы/тарифа** (`grace_period_minutes` и т.п.) — тоже **`INTEGER`**, если домен допускает значения больше ~32767; иначе — `SMALLINT` + `CHECK`.
- Строки: осмысленные лимиты — **`VARCHAR(n)`**; длинный неструктурированный текст — **`TEXT`** (`CONTRACT_TEMPLATE.body`, описания, комментарии).
- Флаги — **`BOOLEAN`**.

### Идемпотентность и внешние платежные ссылки

- Идентификатор операции у провайдера и ключи идемпотентности — **`TEXT`** или **`VARCHAR(512)`** с **`UNIQUE`** по канонической строке от PSP, без принудительного приведения к UUID, если формат в контракте не фиксирован как UUID.
- Поле вроде `provider_subject_id` у учетной записи — **`VARCHAR(255)`** или **`TEXT`** по фактической длине у IdP.

### Сводка: сущность — PK и типы ключевых полей

В таблице ниже все **PK** — `BIGINT`; **FK** — `BIGINT` (совпадают с типом PK родителя). **`INT`** в столбце «Ключевые атрибуты» обозначает `INTEGER` для не-ключевых числовых полей.

| Сущность | PK | Ключевые атрибуты (целевой PostgreSQL) |
|----------|-----|----------------------------------------|
| `PARKING` | **BIGINT** | `name` VARCHAR, `address` TEXT; `parking_type_id` FK BIGINT → `PARKING_TYPE`; `operational_status_id` FK BIGINT → `OPERATIONAL_STATUS` |
| `PARKING_SCHEDULE` | **BIGINT** | FK **BIGINT** на парковку; `day_of_week` **SMALLINT** + `CHECK` 1–7; `open_time`/`close_time` TIME; даты DATE |
| `SECTOR` | **BIGINT** | FK **BIGINT** на парковку и тип зоны; `operational_status_id` FK BIGINT → `OPERATIONAL_STATUS` |
| `ZONE_TYPE`, `VEHICLE_TYPE` | **BIGINT** | `code` VARCHAR UNIQUE; наименования VARCHAR/TEXT |
| `PARKING_TYPE`, `OPERATIONAL_STATUS` | **BIGINT** | справочники `facility`; `code` VARCHAR UNIQUE; FK из `PARKING`, `SECTOR`, `PARKING_PLACE`, `AP` |
| `ZONE_TYPE_VEHICLE_TYPE`, `ZONE_TYPE_TARIFF` | составной PK (BIGINT, BIGINT) | FK типов совпадают с PK `ZONE_TYPE` / `VEHICLE_TYPE` / `TARIFF` |
| `PARKING_PLACE` | **BIGINT** | `place_number` VARCHAR; FK **BIGINT** на сектор и опционально на тариф; `operational_status_id` FK BIGINT → `OPERATIONAL_STATUS` |
| `CLIENT` | **BIGINT** | `type` CHECK('FL','UL'); `status` CHECK('ACTIVE','BLOCKED','PENDING'); ФИО (для FL) в `CLIENT` |
| `CLIENT_ACCOUNT` | **BIGINT** | схема `auth`; идентификаторы входа: `login` (nullable), `phone_e164` (nullable), `email_normalized` (nullable); `auth_provider` (открытый список); `account_status` CHECK |
| `NOTIFICATION_SETTINGS`, `PAYMENT_SETTINGS` | **BIGINT** | FK `client_id` BIGINT NOT NULL UNIQUE; булевы BOOLEAN; `monthly_limit_minor` BIGINT |
| `NOTIFICATION_SETTINGS_CHANNEL` | составной PK (BIGINT, VARCHAR) | FK BIGINT на `NOTIFICATION_SETTINGS`; `channel` VARCHAR CHECK('SMS','EMAIL','PUSH') |
| `PASSPORT_DATA`, `BENEFIT_DOCUMENT` | **BIGINT** | схема `pii` (152-ФЗ); связь с `CLIENT` через `client_id` (логическая); `series_and_number` BYTEA (зашифровано); `document_type` CHECK; даты DATE |
| `ORGANIZATION` | **BIGINT** | профиль ЮЛ; `client_id` BIGINT UNIQUE `REFERENCES client(id)`; ИНН/КПП/ОГРН VARCHAR; адреса TEXT; `status` CHECK('ACTIVE','BLOCKED','PENDING') |
| `ORGANIZATION_BANK_ACCOUNT` | **BIGINT** | FK **BIGINT** на организацию; реквизиты VARCHAR; `is_primary` BOOLEAN |
| `CONSENT` | **BIGINT** | FK **BIGINT** на клиента; `consent_type` CHECK; `given_at`/`revoked_at` TIMESTAMPTZ |
| `EMPLOYEE` | **BIGINT** | `role_id` FK BIGINT → `EMPLOYEE_ROLE`; контакты VARCHAR; `status` CHECK('ACTIVE','DISMISSED','BLOCKED') |
| `EMPLOYEE_ROLE` | **BIGINT** | справочник `employee`; `code` VARCHAR UNIQUE; FK из `EMPLOYEE.role_id` |
| `EMPLOYEE_CREDENTIAL` | **BIGINT** (PK=FK) | схема `auth`; `login` VARCHAR UNIQUE; `account_status` CHECK; `totp_secret_encrypted` TEXT |
| `VEHICLE` | **BIGINT** | FK **BIGINT** на клиента и тип ТС; `license_plate` VARCHAR `UNIQUE` (с нормализацией) |
| `AP` | **BIGINT** | FK **BIGINT** на парковку; `type` CHECK('MANUAL','AUTOMATIC','SEMI_AUTO'); `direction` CHECK; `operational_status_id` FK BIGINT → `OPERATIONAL_STATUS` |
| `TARIFF` | **BIGINT** | `type` CHECK('STANDARD','BENEFIT','SUBSCRIPTION'); `billing_step_unit` CHECK; `benefit_category` CHECK (nullable); `effective_from/to` DATE |
| `TARIFF_RATE` | **BIGINT** | FK **BIGINT** на тариф; `rate_minor` BIGINT `CHECK (rate_minor >= 0)`; `day_of_week` SMALLINT; `time_from/to` TIME |
| `CONTRACT_TEMPLATE` | **BIGINT** | `type` CHECK('INDIVIDUAL','CORPORATE'); `body` TEXT; период DATE |
| `CONTRACT` | **BIGINT** | FK **BIGINT** на клиента; `contract_number` VARCHAR `UNIQUE`; `status` CHECK('DRAFT','ACTIVE','EXPIRED','TERMINATED') |
| `BOOKING` | **BIGINT** | FK логические; `status` CHECK; `type` CHECK `('AUTO','SHORT_TERM','CONTRACT')`; `start_at`/`end_at` TIMESTAMPTZ; `amount_due_minor` nullable для AUTO |
| `INVOICE` | **BIGINT** | `type` CHECK('SINGLE','PERIODIC'); `status` CHECK('ISSUED','PAID','OVERDUE','CANCELLED'); `amount_due_minor` |
| `PARKING_SESSION` | **BIGINT** | FK логические; `access_method` CHECK; `status` CHECK; `duration_minutes` GENERATED ALWAYS AS STORED |
| `PAYMENT` | **BIGINT** | FK **BIGINT** на счет; `payment_method_id` FK BIGINT → `PAYMENT_METHOD`; `status` CHECK; `amount_minor` |
| `PAYMENT_METHOD` | **BIGINT** | справочник `payment`; `code` VARCHAR UNIQUE; FK из `PAYMENT.payment_method_id` |
| `RECEIPT` | **BIGINT** | FK **BIGINT** на платеж; `fiscal_number` VARCHAR UNIQUE; `fiscal_status` CHECK('PENDING','ISSUED','FAILED'); `amount_minor` |
| `REFUND` | **BIGINT** | схема `payment`; FK **BIGINT** на `PAYMENT`; `amount_minor`; `refund_provider_id` VARCHAR PARTIAL UNIQUE; `status` CHECK |
| `DEBT` | **BIGINT** | схема `payment`; FK **BIGINT** на `INVOICE`; `client_id` BIGINT логический; `amount_minor`; `remaining_amount_minor NOT NULL`; `overdue_since` DATE; `status` CHECK |
| `NOTIFICATION_TEMPLATE` | **BIGINT** | `type` CHECK('SMS','EMAIL','PUSH'); `body` TEXT; `subject` VARCHAR |
| `NOTIFICATION` | **BIGINT** | схема `notification`; `channel` CHECK; `delivery_status` CHECK; `delivery_address` VARCHAR(320) NOT NULL |
| `APPEAL` | **BIGINT** | схема `support`; `subject_type` VARCHAR CHECK; `subject_id` BIGINT; CHECK((subject_type IS NULL)=(subject_id IS NULL)) |
| `ACCESS_LOG` | **BIGINT** | схема `report`; `ap_id` BIGINT NOT NULL логический; `vehicle_id`/`client_id` BIGINT nullable; `direction` CHECK('IN','OUT'); `decision` CHECK('ALLOW','DENY','MANUAL'); `decided_at` TIMESTAMPTZ NOT NULL; append-only |

Индексы: на каждом столбце FK на стороне «многие» — B-tree (и частичные индексы под типовые `WHERE`, когда появятся профили нагрузки).

### Аудитные поля и перечисления (применяются ко всем таблицам)

- **Аудитные метки** — все таблицы несут `created_at TIMESTAMPTZ NOT NULL DEFAULT now()` и `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`. Обновление `updated_at` обеспечивается триггером `moddatetime`. Для краткости эти поля не повторяются в каждом разделе ниже, но подразумеваются везде.
- **Поля-перечисления** (`status`, `type`, `channel` и аналоги) — хранить как `VARCHAR(n)` с `CHECK(field IN (...))` или через `CREATE DOMAIN`. Конкретные допустимые значения фиксируются в ФТ и миграциях; в этом документе тип указывается как `VARCHAR(n)`.
- **Схемная изоляция** — таблицы распределяются по PostgreSQL-схемам в соответствии с bounded context (ADR-003): `facility`, `booking`, `session`, `tariff`, `payment`, `contract`, `client`, `support`, `employee`, `notification`, `auth`, `pii`. В REFERENCES ниже имена схем опущены — уточняются в миграциях.

## Атрибуты по сущностям (PostgreSQL)

Ниже — **целевой тип PostgreSQL для каждого атрибута** из диаграммы. **`INT`** = `INTEGER`. `NULL` допускается там, где в модели связь опциональна или поле необязательно по смыслу; иначе `NOT NULL` (в миграциях уточнять по ФТ).

> **DrawSQL.app — совместимость.** DrawSQL (PostgreSQL dialect) поддерживает: `INTEGER`, `BIGINT`, `SMALLINT`, `VARCHAR(n)`, `TEXT`, `BOOLEAN`, `DATE`, `TIME`, `TIMESTAMPTZ`, `NUMERIC(p,s)`, `CHAR(n)`, `BYTEA`, `UUID`. **Не поддерживаются в UI:** `CHECK` constraints, `GENERATED ALWAYS AS`, частичные индексы (`WHERE`), составные UNIQUE, `DEFAULT`-значения, типы-массивы (`TEXT[]`). Для каждого несовместимого элемента ниже добавлена пометка *DrawSQL*. Используйте поле **Table Notes** / Description в DrawSQL для документирования этих ограничений.

### `PARKING`

| Атрибут | Тип PostgreSQL |
|---------|------------------|
| `id` | `BIGINT` `GENERATED BY DEFAULT AS IDENTITY` `PRIMARY KEY` |
| `name` | `VARCHAR(200)` `NOT NULL` |
| `address` | `TEXT` `NOT NULL` |
| `parking_type_id` | `BIGINT` `NOT NULL` `REFERENCES parking_type(id)` |
| `description` | `TEXT` |
| `operational_status_id` | `BIGINT` `NOT NULL` `REFERENCES operational_status(id)` |

### `PARKING_SCHEDULE`

| Атрибут | Тип PostgreSQL |
|---------|------------------|
| `id` | `BIGINT` `GENERATED BY DEFAULT AS IDENTITY` `PRIMARY KEY` |
| `parking_id` | `BIGINT` `NOT NULL` `REFERENCES parking(id)` |
| `day_of_week` | `SMALLINT` `NOT NULL` `CHECK (day_of_week BETWEEN 1 AND 7)` |
| `open_time` | `TIME` |
| `close_time` | `TIME` |
| `is_closed` | `BOOLEAN` `NOT NULL` `DEFAULT false` |
| `effective_from` | `DATE` `NOT NULL` |
| `effective_to` | `DATE` |

Уникальное ограничение: `UNIQUE (parking_id, day_of_week, effective_from)`. *DrawSQL: составные UNIQUE в UI не задаются — используйте **Import from SQL** или укажите в Table Notes.*

### `SECTOR`

| Атрибут | Тип PostgreSQL |
|---------|------------------|
| `id` | `BIGINT` `GENERATED BY DEFAULT AS IDENTITY` `PRIMARY KEY` |
| `parking_id` | `BIGINT` `NOT NULL` `REFERENCES parking(id)` |
| `zone_type_id` | `BIGINT` `NOT NULL` `REFERENCES zone_type(id)` |
| `name` | `VARCHAR(200)` `NOT NULL` |
| `operational_status_id` | `BIGINT` `NOT NULL` `REFERENCES operational_status(id)` |

### `ZONE_TYPE`

| Атрибут | Тип PostgreSQL |
|---------|------------------|
| `id` | `BIGINT` `GENERATED BY DEFAULT AS IDENTITY` `PRIMARY KEY` |
| `code` | `VARCHAR(64)` `NOT NULL` `UNIQUE` |
| `name` | `VARCHAR(200)` `NOT NULL` |
| `description` | `TEXT` |

### `VEHICLE_TYPE`

| Атрибут | Тип PostgreSQL |
|---------|------------------|
| `id` | `BIGINT` `GENERATED BY DEFAULT AS IDENTITY` `PRIMARY KEY` |
| `code` | `VARCHAR(64)` `NOT NULL` `UNIQUE` |
| `name` | `VARCHAR(200)` `NOT NULL` |
| `description` | `TEXT` |

### `PARKING_TYPE`

> **Схема `facility`.** Справочник типов парковочных объектов. Используется в `PARKING.parking_type_id`.

| Атрибут | Тип PostgreSQL |
|---------|------------------|
| `id` | `BIGINT` `GENERATED BY DEFAULT AS IDENTITY` `PRIMARY KEY` |
| `code` | `VARCHAR(64)` `NOT NULL` `UNIQUE` |
| `name` | `VARCHAR(200)` `NOT NULL` |
| `description` | `TEXT` |

Примеры значений `code`: `SURFACE`, `MULTILEVEL`, `UNDERGROUND`, `ROOFTOP`. *DrawSQL: добавить через Table Notes.*

### `OPERATIONAL_STATUS`

> **Схема `facility`.** Единый справочник эксплуатационных статусов для инфраструктурных объектов: `PARKING`, `SECTOR`, `PARKING_PLACE`, `AP`. Общая таблица гарантирует согласованность набора значений.

| Атрибут | Тип PostgreSQL |
|---------|------------------|
| `id` | `BIGINT` `GENERATED BY DEFAULT AS IDENTITY` `PRIMARY KEY` |
| `code` | `VARCHAR(64)` `NOT NULL` `UNIQUE` |
| `name` | `VARCHAR(200)` `NOT NULL` |
| `description` | `TEXT` |

Примеры значений `code`: `ACTIVE`, `MAINTENANCE`, `CLOSED`, `RESERVED`. *DrawSQL: добавить через Table Notes.*

### `ZONE_TYPE_VEHICLE_TYPE`

| Атрибут | Тип PostgreSQL |
|---------|------------------|
| `zone_type_id` | `BIGINT` `NOT NULL` `REFERENCES zone_type(id)` |
| `vehicle_type_id` | `BIGINT` `NOT NULL` `REFERENCES vehicle_type(id)` |

Составной первичный ключ: `PRIMARY KEY (zone_type_id, vehicle_type_id)`.

### `ZONE_TYPE_TARIFF`

| Атрибут | Тип PostgreSQL |
|---------|------------------|
| `zone_type_id` | `BIGINT` `NOT NULL` `REFERENCES zone_type(id)` |
| `tariff_id` | `BIGINT` `NOT NULL` `REFERENCES tariff(id)` |

Составной первичный ключ: `PRIMARY KEY (zone_type_id, tariff_id)`.

### `PARKING_PLACE`

| Атрибут | Тип PostgreSQL |
|---------|------------------|
| `id` | `BIGINT` `GENERATED BY DEFAULT AS IDENTITY` `PRIMARY KEY` |
| `sector_id` | `BIGINT` `NOT NULL` `REFERENCES sector(id)` |
| `override_tariff_id` | `BIGINT` `REFERENCES tariff(id)` |
| `place_number` | `VARCHAR(32)` `NOT NULL` |
| `operational_status_id` | `BIGINT` `NOT NULL` `REFERENCES operational_status(id)` |

### `CLIENT`

| Атрибут | Тип PostgreSQL |
|---------|------------------|
| `id` | `BIGINT` `GENERATED BY DEFAULT AS IDENTITY` `PRIMARY KEY` |
| `type` | `VARCHAR(32)` `NOT NULL` `CHECK (type IN ('FL','UL'))` |
| `phone` | `VARCHAR(32)` |
| `email` | `VARCHAR(320)` |
| `status` | `VARCHAR(32)` `NOT NULL` `CHECK (status IN ('ACTIVE','BLOCKED','PENDING'))` |
| `status_reason` | `TEXT` |
| `last_name` | `VARCHAR(100)` — только для `type='FL'` |
| `first_name` | `VARCHAR(100)` — только для `type='FL'` |
| `middle_name` | `VARCHAR(100)` — только для `type='FL'` |

### `CLIENT_ACCOUNT`

> **Схема `auth` (инфраструктурный слой).** Таблица содержит credential-данные клиента и выделена из доменной схемы `client`. Только инфраструктурный слой аутентификации имеет доступ к этой схеме напрямую.

| Атрибут | Тип PostgreSQL |
|---------|------------------|
| `id` | `BIGINT` `GENERATED BY DEFAULT AS IDENTITY` `PRIMARY KEY` |
| `client_id` | `BIGINT` `NOT NULL` |
| `auth_provider` | `VARCHAR(64)` `NOT NULL` — открытый список провайдеров (LOCAL, PHONE, GOOGLE, YANDEX и т.п.); не фиксируется CHECK — расширяется при добавлении нового IdP |
| `login` | `VARCHAR(255)` |
| `phone_e164` | `VARCHAR(32)` — телефон в E.164 (нормализованный) |
| `email_normalized` | `VARCHAR(320)` — email в lower+trim (нормализованный) |
| `password_hash` | `VARCHAR(255)` — NULL для внешних IdP (GOOGLE, YANDEX, PHONE); NOT NULL при `auth_provider = 'LOCAL'`. Инвариант проверяется триггером или Application Service |
| `provider_subject_id` | `VARCHAR(255)` |
| `account_status` | `VARCHAR(32)` `NOT NULL` `CHECK (account_status IN ('ACTIVE','BLOCKED','PENDING_VERIFICATION'))` |
| `created_at` | `TIMESTAMPTZ` `NOT NULL` `DEFAULT now()` |
| `last_login_at` | `TIMESTAMPTZ` |

### `NOTIFICATION_SETTINGS`

| Атрибут | Тип PostgreSQL |
|---------|------------------|
| `id` | `BIGINT` `GENERATED BY DEFAULT AS IDENTITY` `PRIMARY KEY` |
| `client_id` | `BIGINT` `NOT NULL` `UNIQUE` `REFERENCES client(id)` |
| `parking_session_enabled` | `BOOLEAN` `NOT NULL` `DEFAULT false` |
| `booking_enabled` | `BOOLEAN` `NOT NULL` `DEFAULT false` |
| `contract_enabled` | `BOOLEAN` `NOT NULL` `DEFAULT false` |
| `payment_enabled` | `BOOLEAN` `NOT NULL` `DEFAULT false` |
| `marketing_enabled` | `BOOLEAN` `NOT NULL` `DEFAULT false` |

Каналы доставки хранятся в отдельной таблице `NOTIFICATION_SETTINGS_CHANNEL`.

### `NOTIFICATION_SETTINGS_CHANNEL`

| Атрибут | Тип PostgreSQL |
|---------|------------------|
| `settings_id` | `BIGINT` `NOT NULL` `REFERENCES notification_settings(id)` |
| `channel` | `VARCHAR(32)` `NOT NULL` `CHECK (channel IN ('SMS','EMAIL','PUSH'))` |

Составной первичный ключ: `PRIMARY KEY (settings_id, channel)`. *DrawSQL: отметьте оба поля как PK через флажок — DrawSQL поддерживает составные PK при PostgreSQL dialect.*

### `PAYMENT_SETTINGS`

| Атрибут | Тип PostgreSQL |
|---------|------------------|
| `id` | `BIGINT` `GENERATED BY DEFAULT AS IDENTITY` `PRIMARY KEY` |
| `client_id` | `BIGINT` `NOT NULL` `UNIQUE` `REFERENCES client(id)` |
| `external_payer_id` | `VARCHAR(100)` |
| `auto_debit_contract` | `BOOLEAN` `NOT NULL` `DEFAULT false` |
| `auto_debit_parking_session` | `BOOLEAN` `NOT NULL` `DEFAULT false` |
| `monthly_limit_minor` | `BIGINT` |

### `PASSPORT_DATA`

> **Схема `pii` (152-ФЗ).** Таблица хранится в отдельной схеме с ограниченными GRANT-правами. Только модуль `Клиент` (роль `client_app_role`) имеет доступ к данной схеме. `series_and_number` рекомендуется хранить в зашифрованном виде (pgcrypto или шифрование на уровне приложения с ротацией ключей).

| Атрибут | Тип PostgreSQL |
|---------|------------------|
| `id` | `BIGINT` `GENERATED BY DEFAULT AS IDENTITY` `PRIMARY KEY` |
| `document_type` | `VARCHAR(32)` `NOT NULL` `CHECK (document_type IN ('RF_PASSPORT','FOREIGN_PASSPORT','TEMP_ID'))` |
| `series_and_number` | `BYTEA` `NOT NULL` — *DrawSQL: тип `BYTEA` поддерживается в PostgreSQL dialect* |
| `issue_date` | `DATE` `NOT NULL` |
| `issued_by` | `VARCHAR(500)` |
| `department_code` | `VARCHAR(32)` |
| `client_id` | `BIGINT` `NOT NULL` — логическая ссылка на `client.client(id)` (без `REFERENCES`; схемная изоляция); `UNIQUE(client_id)` для 0..1 |

### `BENEFIT_DOCUMENT`

> **Схема `pii` (152-ФЗ).** Аналогично `PASSPORT_DATA` — ограниченный доступ.

| Атрибут | Тип PostgreSQL |
|---------|------------------|
| `id` | `BIGINT` `GENERATED BY DEFAULT AS IDENTITY` `PRIMARY KEY` |
| `benefit_category` | `VARCHAR(64)` `NOT NULL` `CHECK (benefit_category IN ('DISABLED_1','DISABLED_2','DISABLED_3','VETERAN','LARGE_FAMILY','OTHER'))` |
| `document_type` | `VARCHAR(32)` `NOT NULL` `CHECK (document_type IN ('CERTIFICATE','ID_CARD','BOOKLET','OTHER'))` |
| `document_number` | `VARCHAR(64)` `NOT NULL` |
| `issue_date` | `DATE` `NOT NULL` |
| `expiry_date` | `DATE` |
| `document_image_ref` | `VARCHAR(512)` |
| `verification_status` | `VARCHAR(32)` `NOT NULL` `CHECK (verification_status IN ('PENDING','VERIFIED','REJECTED'))` |
| `client_id` | `BIGINT` `NOT NULL` — логическая ссылка на `client.client(id)` (без `REFERENCES`; схемная изоляция); `UNIQUE(client_id)` для 0..1* |

\* Если требуется хранить несколько льготных документов, `UNIQUE(client_id)` убирается и вводится политика “активный/основной документ”.

### `ORGANIZATION`

| Атрибут | Тип PostgreSQL |
|---------|------------------|
| `id` | `BIGINT` `GENERATED BY DEFAULT AS IDENTITY` `PRIMARY KEY` |
| `client_id` | `BIGINT` `NOT NULL` `UNIQUE` `REFERENCES client(id)` — связь 1:1 с `CLIENT` при `CLIENT.type='UL'` |
| `name` | `VARCHAR(500)` `NOT NULL` |
| `legal_form` | `VARCHAR(64)` |
| `legal_address` | `TEXT` |
| `actual_address` | `TEXT` |
| `inn` | `VARCHAR(12)` `NOT NULL` `UNIQUE` — ИНН обязателен при регистрации ЮЛ; однозначно идентифицирует организацию; UNIQUE исключает дубли и документирует функциональную зависимость |
| `kpp` | `VARCHAR(9)` |
| `ogrn` | `VARCHAR(13)` `UNIQUE` — ОГРН тоже уникален; *NULL допустим при поэтапном заполнении реквизитов* |
| `email` | `VARCHAR(320)` |
| `phone` | `VARCHAR(32)` |
| `status` | `VARCHAR(32)` `NOT NULL` `CHECK (status IN ('ACTIVE','BLOCKED','PENDING'))` |

`inn NOT NULL UNIQUE` — ИНН обязателен (Q6); устраняет потенциальное нарушение BCNF: ИНН функционально определяет организацию, без UNIQUE `name`/`kpp` транзитивно зависели бы от `inn`, а не от `id`.

### `ORGANIZATION_BANK_ACCOUNT`

| Атрибут | Тип PostgreSQL |
|---------|------------------|
| `id` | `BIGINT` `GENERATED BY DEFAULT AS IDENTITY` `PRIMARY KEY` |
| `organization_id` | `BIGINT` `NOT NULL` `REFERENCES organization(id)` |
| `bank_name` | `VARCHAR(255)` `NOT NULL` |
| `bik` | `VARCHAR(9)` `NOT NULL` |
| `account_number` | `VARCHAR(32)` `NOT NULL` |
| `correspondent_account` | `VARCHAR(32)` |
| `is_primary` | `BOOLEAN` `NOT NULL` — *DrawSQL: тип `BOOLEAN`; снять Unique. Частичный индекс указать в Table Notes: `CREATE UNIQUE INDEX ON organization_bank_account(organization_id) WHERE is_primary = true`* |

Единственность основного счёта обеспечивается частичным уникальным индексом: `CREATE UNIQUE INDEX ON organization_bank_account(organization_id) WHERE is_primary = true`.

### `CONSENT`

| Атрибут | Тип PostgreSQL |
|---------|------------------|
| `id` | `BIGINT` `GENERATED BY DEFAULT AS IDENTITY` `PRIMARY KEY` |
| `client_id` | `BIGINT` `NOT NULL` `REFERENCES client(id)` |
| `consent_type` | `VARCHAR(64)` `NOT NULL` `CHECK (consent_type IN ('PERSONAL_DATA','MARKETING','ELECTRONIC_DOCS'))` |
| `consent_given` | `BOOLEAN` `NOT NULL` |
| `given_at` | `TIMESTAMPTZ` `NOT NULL` |
| `revoked_at` | `TIMESTAMPTZ` |

### `EMPLOYEE`

| Атрибут | Тип PostgreSQL |
|---------|------------------|
| `id` | `BIGINT` `GENERATED BY DEFAULT AS IDENTITY` `PRIMARY KEY` |
| `role_id` | `BIGINT` `NOT NULL` `REFERENCES employee_role(id)` |
| `last_name` | `VARCHAR(100)` `NOT NULL` |
| `first_name` | `VARCHAR(100)` `NOT NULL` |
| `middle_name` | `VARCHAR(100)` |
| `phone` | `VARCHAR(32)` |
| `email` | `VARCHAR(320)` |
| `status` | `VARCHAR(32)` `NOT NULL` `CHECK (status IN ('ACTIVE','DISMISSED','BLOCKED'))` |

### `EMPLOYEE_CREDENTIAL`

> **Схема `auth` (инфраструктурный слой).** Credential-данные сотрудника вынесены из доменной таблицы `employee`. `totp_secret_encrypted` хранится в зашифрованном виде (алгоритм и ротация ключей фиксируются в политике ИБ).

| Атрибут | Тип PostgreSQL |
|---------|------------------|
| `employee_id` | `BIGINT` `PRIMARY KEY` |
| `login` | `VARCHAR(64)` `NOT NULL` `UNIQUE` |
| `password_hash` | `VARCHAR(255)` `NOT NULL` |
| `totp_secret_encrypted` | `TEXT` |
| `account_status` | `VARCHAR(32)` `NOT NULL` `CHECK (account_status IN ('ACTIVE','BLOCKED','SUSPENDED'))` |
| `created_at` | `TIMESTAMPTZ` `NOT NULL` `DEFAULT now()` |
| `last_login_at` | `TIMESTAMPTZ` |

### `EMPLOYEE_ROLE`

> **Схема `employee`.** Справочник ролей сотрудников. Использование словарной таблицы вместо CHECK позволяет добавлять новые роли без изменения схемы БД.

| Атрибут | Тип PostgreSQL |
|---------|------------------|
| `id` | `BIGINT` `GENERATED BY DEFAULT AS IDENTITY` `PRIMARY KEY` |
| `code` | `VARCHAR(64)` `NOT NULL` `UNIQUE` |
| `name` | `VARCHAR(200)` `NOT NULL` |
| `description` | `TEXT` |

Примеры значений `code`: `OPERATOR`, `ADMIN`, `SECURITY`, `MANAGER`. *DrawSQL: добавить через Table Notes.*

### `VEHICLE`

| Атрибут | Тип PostgreSQL |
|---------|------------------|
| `id` | `BIGINT` `GENERATED BY DEFAULT AS IDENTITY` `PRIMARY KEY` |
| `client_id` | `BIGINT` `NOT NULL` `REFERENCES client(id)` |
| `vehicle_type_id` | `BIGINT` `NOT NULL` `REFERENCES vehicle_type(id)` |
| `license_plate` | `VARCHAR(32)` `NOT NULL` `UNIQUE` |
| `brand` | `VARCHAR(100)` |
| `model` | `VARCHAR(100)` |
| `color` | `VARCHAR(64)` |

`license_plate` хранится в нормализованном виде (UPPER + TRIM); нормализация применяется на уровне приложения или триггером `BEFORE INSERT/UPDATE`.

### `AP`

| Атрибут | Тип PostgreSQL |
|---------|------------------|
| `id` | `BIGINT` `GENERATED BY DEFAULT AS IDENTITY` `PRIMARY KEY` |
| `parking_id` | `BIGINT` `NOT NULL` `REFERENCES parking(id)` |
| `name` | `VARCHAR(200)` `NOT NULL` |
| `type` | `VARCHAR(32)` `NOT NULL` `CHECK (type IN ('MANUAL','AUTOMATIC','SEMI_AUTO'))` |
| `direction` | `VARCHAR(16)` `NOT NULL` `CHECK (direction IN ('ENTRY','EXIT','BIDIRECTIONAL'))` |
| `operational_status_id` | `BIGINT` `NOT NULL` `REFERENCES operational_status(id)` |

### `TARIFF`

| Атрибут | Тип PostgreSQL |
|---------|------------------|
| `id` | `BIGINT` `GENERATED BY DEFAULT AS IDENTITY` `PRIMARY KEY` |
| `name` | `VARCHAR(200)` `NOT NULL` |
| `type` | `VARCHAR(32)` `NOT NULL` `CHECK (type IN ('STANDARD','BENEFIT','SUBSCRIPTION'))` |
| `benefit_category` | `VARCHAR(64)` `CHECK (benefit_category IN ('DISABLED_1','DISABLED_2','DISABLED_3','VETERAN','LARGE_FAMILY','OTHER'))` — NULL для нельготных тарифов; домен совпадает с `BENEFIT_DOCUMENT.benefit_category` |
| `billing_step_unit` | `VARCHAR(16)` `NOT NULL` `CHECK (billing_step_unit IN ('MINUTE','HOUR','DAY'))` |
| `billing_step_value` | `INTEGER` `NOT NULL` `DEFAULT 1` |
| `max_amount_minor` | `BIGINT` |
| `grace_period_minutes` | `INTEGER` `NOT NULL` `DEFAULT 0` |
| `effective_from` | `DATE` `NOT NULL` |
| `effective_to` | `DATE` |

### `TARIFF_RATE`

Ставки тарифа в зависимости от дня недели и времени суток. При отсутствии записи на конкретный интервал применяется базовая ставка (запись с `day_of_week IS NULL` и `time_from IS NULL`).

| Атрибут | Тип PostgreSQL |
|---------|------------------|
| `id` | `BIGINT` `GENERATED BY DEFAULT AS IDENTITY` `PRIMARY KEY` |
| `tariff_id` | `BIGINT` `NOT NULL` `REFERENCES tariff(id)` |
| `rate_minor` | `BIGINT` `NOT NULL` `CHECK (rate_minor >= 0)` |
| `day_of_week` | `SMALLINT` `CHECK (day_of_week BETWEEN 1 AND 7)` |
| `time_from` | `TIME` |
| `time_to` | `TIME` |
| `priority` | `INTEGER` `NOT NULL` `DEFAULT 0` |

Уникальность применимой ставки гарантируется expression UNIQUE index (секция 5) и Application Service-проверкой перед INSERT/UPDATE. *DrawSQL Table Notes: `CREATE UNIQUE INDEX ON tariff_rate(tariff_id, COALESCE(day_of_week,0), COALESCE(time_from,'00:00'::TIME), COALESCE(time_to,'00:00'::TIME));`*

### `CONTRACT_TEMPLATE`

| Атрибут | Тип PostgreSQL |
|---------|------------------|
| `id` | `BIGINT` `GENERATED BY DEFAULT AS IDENTITY` `PRIMARY KEY` |
| `code` | `VARCHAR(64)` `NOT NULL` `UNIQUE` |
| `name` | `VARCHAR(200)` `NOT NULL` |
| `version` | `VARCHAR(32)` `NOT NULL` |
| `type` | `VARCHAR(32)` `NOT NULL` `CHECK (type IN ('INDIVIDUAL','CORPORATE'))` |
| `body` | `TEXT` `NOT NULL` |
| `effective_from` | `DATE` `NOT NULL` |
| `effective_to` | `DATE` |

### `CONTRACT`

| Атрибут | Тип PostgreSQL |
|---------|------------------|
| `id` | `BIGINT` `GENERATED BY DEFAULT AS IDENTITY` `PRIMARY KEY` |
| `client_id` | `BIGINT` `NOT NULL` `REFERENCES client(id)` |
| `contract_template_id` | `BIGINT` `REFERENCES contract_template(id)` |
| `contract_number` | `VARCHAR(64)` `NOT NULL` `UNIQUE` |
| `start_date` | `DATE` `NOT NULL` |
| `end_date` | `DATE` |
| `status` | `VARCHAR(32)` `NOT NULL` `CHECK (status IN ('DRAFT','ACTIVE','EXPIRED','TERMINATED'))` |
| `document_file_ref` | `VARCHAR(512)` |

### `BOOKING`

| Атрибут | Тип PostgreSQL |
|---------|------------------|
| `id` | `BIGINT` `GENERATED BY DEFAULT AS IDENTITY` `PRIMARY KEY` |
| `booking_number` | `VARCHAR(64)` `NOT NULL` `UNIQUE` |
| `vehicle_id` | `BIGINT` `NOT NULL` |
| `parking_place_id` | `BIGINT` |
| `contract_id` | `BIGINT` |
| `tariff_id` | `BIGINT` `NOT NULL` |
| `start_at` | `TIMESTAMPTZ` `NOT NULL` |
| `end_at` | `TIMESTAMPTZ` |
| `duration_minutes` | `INTEGER` — nullable; `NULL` для открытых бронирований без фиксированного конца (`end_at IS NULL`); устанавливается Application Service при завершении брони |
| `license_plate_snapshot` | `VARCHAR(32)` `NOT NULL` |
| `type` | `VARCHAR(32)` `NOT NULL` `CHECK (type IN ('AUTO', 'SHORT_TERM', 'CONTRACT'))` — `AUTO`: создаётся системой при въезде ТС через КПП; `SHORT_TERM`: краткосрочное бронирование клиентом; `CONTRACT`: долгосрочное по договору (ЮЛ) |
| `status` | `VARCHAR(32)` `NOT NULL` `CHECK (status IN ('PENDING','CONFIRMED','ACTIVE','COMPLETED','CANCELLED','NO_SHOW'))` |
| `amount_due_minor` | `BIGINT` — NULL при создании AUTO-брони (сумма не известна на момент въезда); заполняется Application Service при завершении сессии. NOT NULL для SHORT_TERM и CONTRACT. Инвариант проверяется Application Service |

Все FK в `BOOKING` хранятся без `REFERENCES`-constraint (схемная изоляция ADR-003). `license_plate_snapshot` — иммутабельный снимок ГРЗ на момент создания брони.

### `INVOICE`

> Таблица принадлежит схеме `payment` (контекст `Платёж`). FK на `booking` и `contract` хранятся без `REFERENCES`-constraint (схемная изоляция ADR-003).

| Атрибут | Тип PostgreSQL |
|---------|------------------|
| `id` | `BIGINT` `GENERATED BY DEFAULT AS IDENTITY` `PRIMARY KEY` |
| `booking_id` | `BIGINT` |
| `contract_id` | `BIGINT` |
| `invoice_number` | `VARCHAR(64)` `NOT NULL` `UNIQUE` |
| `type` | `VARCHAR(32)` `NOT NULL` `CHECK (type IN ('SINGLE','PERIODIC'))` |
| `status` | `VARCHAR(32)` `NOT NULL` `CHECK (status IN ('ISSUED','PAID','OVERDUE','CANCELLED'))` |
| `amount_due_minor` | `BIGINT` `NOT NULL` |
| `billing_period_from` | `DATE` |
| `billing_period_to` | `DATE` |
| `issued_at` | `DATE` `NOT NULL` |
| `due_at` | `DATE` |
| `paid_at` | `TIMESTAMPTZ` |

При `type = 'PERIODIC'`: `contract_id NOT NULL`, `billing_period_from NOT NULL`, `billing_period_to NOT NULL`, `booking_id IS NULL`. При `type = 'SINGLE'`: `booking_id NOT NULL`. Инвариант проверяется триггером или Application Service. *DrawSQL: условные NOT NULL в UI не задаются — указать в Table Notes.*

Оплаченная сумма по счёту вычисляется через запрос: `SELECT COALESCE(SUM(amount), 0) FROM payment WHERE invoice_id = ? AND status = 'COMPLETED'`. Поле `amount_paid` не хранится — исключает риск рассинхронизации между кэшем и фактом.

### `PARKING_SESSION`

| Атрибут | Тип PostgreSQL |
|---------|------------------|
| `id` | `BIGINT` `GENERATED BY DEFAULT AS IDENTITY` `PRIMARY KEY` |
| `booking_id` | `BIGINT` `NOT NULL` |
| `entry_ap_id` | `BIGINT` |
| `exit_ap_id` | `BIGINT` |
| `employee_id` | `BIGINT` |
| `entry_time` | `TIMESTAMPTZ` `NOT NULL` |
| `exit_time` | `TIMESTAMPTZ` |
| `duration_minutes` | `INTEGER` `GENERATED ALWAYS AS (EXTRACT(EPOCH FROM (exit_time - entry_time)) / 60)::INTEGER STORED` — *DrawSQL: тип `INTEGER`, NOT NULL снять; вычислимое поле в UI недоступно — добавить в Table Notes: `GENERATED ALWAYS AS (EXTRACT(EPOCH FROM (exit_time - entry_time)) / 60)::INTEGER STORED`* |
| `license_plate_snapshot` | `VARCHAR(32)` `NOT NULL` |
| `access_method` | `VARCHAR(32)` `NOT NULL` `CHECK (access_method IN ('PLATE_RECOGNITION','QR','RFID','MANUAL'))` |
| `access_comment` | `TEXT` |
| `status` | `VARCHAR(32)` `NOT NULL` `CHECK (status IN ('ACTIVE','COMPLETED','INTERRUPTED'))` |

FK в `PARKING_SESSION` хранятся без `REFERENCES`-constraint (схемная изоляция ADR-003). `license_plate_snapshot` — иммутабельный снимок ГРЗ ТС на момент въезда.

### `PAYMENT`

| Атрибут | Тип PostgreSQL |
|---------|------------------|
| `id` | `BIGINT` `GENERATED BY DEFAULT AS IDENTITY` `PRIMARY KEY` |
| `invoice_id` | `BIGINT` `NOT NULL` |
| `amount_minor` | `BIGINT` `NOT NULL` |
| `currency` | `CHAR(3)` `NOT NULL` `DEFAULT 'RUB'` — ISO 4217; на момент разработки используется только `RUB` |
| `payment_method_id` | `BIGINT` `NOT NULL` `REFERENCES payment_method(id)` |
| `status` | `VARCHAR(32)` `NOT NULL` `CHECK (status IN ('INITIATED','COMPLETED','FAILED','REFUNDED','CANCELLED'))` |
| `initiated_at` | `TIMESTAMPTZ` `NOT NULL` |
| `completed_at` | `TIMESTAMPTZ` |
| `provider_id` | `VARCHAR(512)` — *DrawSQL: тип `VARCHAR(512)`, без Unique-флажка. Частичный уникальный индекс указать в Table Notes: `CREATE UNIQUE INDEX ON payment(provider_id) WHERE provider_id IS NOT NULL`* |

`provider_id` — idempotency key от платёжного провайдера. Частичный уникальный индекс: `CREATE UNIQUE INDEX ON payment(provider_id) WHERE provider_id IS NOT NULL`.

### `RECEIPT`

| Атрибут | Тип PostgreSQL |
|---------|------------------|
| `id` | `BIGINT` `GENERATED BY DEFAULT AS IDENTITY` `PRIMARY KEY` |
| `payment_id` | `BIGINT` `NOT NULL` `REFERENCES payment(id)` |
| `fiscal_number` | `VARCHAR(64)` `NOT NULL` `UNIQUE` |
| `receipt_at` | `TIMESTAMPTZ` `NOT NULL` |
| `fiscal_status` | `VARCHAR(32)` `NOT NULL` `CHECK (fiscal_status IN ('PENDING','ISSUED','FAILED'))` |
| `amount_minor` | `BIGINT` `NOT NULL` |

### `REFUND`

> Таблица принадлежит схеме `payment`. Фиксирует факт возврата средств — отдельную транзакцию у PSP с собственным идентификатором, суммой и статусом.

| Атрибут | Тип PostgreSQL |
|---------|------------------|
| `id` | `BIGINT` `GENERATED BY DEFAULT AS IDENTITY` `PRIMARY KEY` |
| `payment_id` | `BIGINT` `NOT NULL` `REFERENCES payment(id)` |
| `amount_minor` | `BIGINT` `NOT NULL` |
| `reason` | `TEXT` |
| `refund_provider_id` | `VARCHAR(512)` — idempotency key возврата у PSP. Частичный уникальный индекс: `CREATE UNIQUE INDEX ON refund(refund_provider_id) WHERE refund_provider_id IS NOT NULL`. *DrawSQL: тип `VARCHAR(512)`, без Unique-флажка; индекс указать в Table Notes* |
| `status` | `VARCHAR(32)` `NOT NULL` `CHECK (status IN ('INITIATED','COMPLETED','FAILED'))` |
| `initiated_at` | `TIMESTAMPTZ` `NOT NULL` |
| `completed_at` | `TIMESTAMPTZ` |

### `DEBT`

> Таблица принадлежит схеме `payment`. Фиксирует просроченную задолженность клиента-ЮЛ по периодическому счёту. Создаётся scheduled job при `INVOICE.due_at < now()` и `status != 'PAID'`.

| Атрибут | Тип PostgreSQL |
|---------|------------------|
| `id` | `BIGINT` `GENERATED BY DEFAULT AS IDENTITY` `PRIMARY KEY` |
| `invoice_id` | `BIGINT` `NOT NULL` `REFERENCES invoice(id)` |
| `client_id` | `BIGINT` `NOT NULL` — логическая ссылка (без `REFERENCES`; схемная изоляция) |
| `amount_minor` | `BIGINT` `NOT NULL` — сумма задолженности на момент создания; иммутабельна |
| `remaining_amount_minor` | `BIGINT` `NOT NULL` — текущий остаток долга; инициализируется `= amount_minor`; уменьшается Payment Service атомарно при каждой частичной оплате; `CHECK (remaining_amount_minor >= 0 AND remaining_amount_minor <= amount_minor)` |
| `overdue_since` | `DATE` `NOT NULL` — дата возникновения просрочки (= `INVOICE.due_at`) |
| `status` | `VARCHAR(32)` `NOT NULL` `CHECK (status IN ('ACTIVE','PAID','WRITTEN_OFF'))` |

Инвариант: при `remaining_amount = 0` Payment Service устанавливает `status = 'PAID'` в той же транзакции. *DrawSQL: CHECK не поддерживается в UI — указать в Table Notes.*

### `PAYMENT_METHOD`

> **Схема `payment`.** Справочник способов оплаты. Использование словарной таблицы позволяет добавлять новые методы (например, при интеграции нового PSP) без изменения схемы БД.

| Атрибут | Тип PostgreSQL |
|---------|------------------|
| `id` | `BIGINT` `GENERATED BY DEFAULT AS IDENTITY` `PRIMARY KEY` |
| `code` | `VARCHAR(64)` `NOT NULL` `UNIQUE` |
| `name` | `VARCHAR(200)` `NOT NULL` |
| `description` | `TEXT` |

Примеры значений `code`: `CARD`, `SBP`, `ACCOUNT_DEBIT`, `CASH`. *DrawSQL: добавить через Table Notes.*

### `NOTIFICATION_TEMPLATE`

| Атрибут | Тип PostgreSQL |
|---------|------------------|
| `id` | `BIGINT` `GENERATED BY DEFAULT AS IDENTITY` `PRIMARY KEY` |
| `code` | `VARCHAR(64)` `NOT NULL` `UNIQUE` |
| `name` | `VARCHAR(200)` `NOT NULL` |
| `type` | `VARCHAR(32)` `NOT NULL` `CHECK (type IN ('SMS','EMAIL','PUSH'))` |
| `subject` | `VARCHAR(500)` |
| `body` | `TEXT` `NOT NULL` |

### `NOTIFICATION`

> Таблица принадлежит схеме `notification`. FK на `client` и `employee` хранятся без `REFERENCES`-constraint (схемная изоляция ADR-003). Адресат доставки передаётся в поле `delivery_address` и не требует JOIN к `CLIENT`.

| Атрибут | Тип PostgreSQL |
|---------|------------------|
| `id` | `BIGINT` `GENERATED BY DEFAULT AS IDENTITY` `PRIMARY KEY` |
| `notification_template_id` | `BIGINT` |
| `client_id` | `BIGINT` `NOT NULL` |
| `initiator_employee_id` | `BIGINT` |
| `channel` | `VARCHAR(32)` `NOT NULL` `CHECK (channel IN ('SMS','EMAIL','PUSH'))` |
| `delivery_address` | `VARCHAR(320)` `NOT NULL` |
| `delivery_status` | `VARCHAR(32)` `NOT NULL` `CHECK (delivery_status IN ('PENDING','SENT','DELIVERED','FAILED'))` |

### `APPEAL`

> Таблица принадлежит схеме `support`. Все FK хранятся без `REFERENCES`-constraint (схемная изоляция ADR-003). Предмет обращения задаётся полиморфной парой `subject_type + subject_id`.

| Атрибут | Тип PostgreSQL |
|---------|------------------|
| `id` | `BIGINT` `GENERATED BY DEFAULT AS IDENTITY` `PRIMARY KEY` |
| `client_id` | `BIGINT` `NOT NULL` |
| `employee_id` | `BIGINT` |
| `subject_type` | `VARCHAR(32)` `CHECK (subject_type IN ('BOOKING','SESSION','PAYMENT','RECEIPT','CONTRACT'))` |
| `subject_id` | `BIGINT` |
| `type` | `VARCHAR(32)` `NOT NULL` `CHECK (type IN ('COMPLAINT','QUESTION','REQUEST','FEEDBACK'))` |
| `channel` | `VARCHAR(32)` `NOT NULL` `CHECK (channel IN ('APP','EMAIL','PHONE','CHAT'))` |
| `subject` | `VARCHAR(500)` `NOT NULL` |
| `description` | `TEXT` |
| `status` | `VARCHAR(32)` `NOT NULL` `CHECK (status IN ('OPEN','IN_PROGRESS','RESOLVED','CLOSED'))` |

`subject_type IS NULL AND subject_id IS NULL` — обращение без конкретного предмета; `subject_type IS NOT NULL AND subject_id IS NOT NULL` — предмет задан. Инвариант: оба поля либо оба NULL, либо оба NOT NULL — обеспечивается `CHECK ((subject_type IS NULL) = (subject_id IS NULL))`. *DrawSQL: CHECK не поддерживается в UI — указать в Table Notes. Индекс `(subject_type, subject_id)` также добавить в Table Notes.*

### `ACCESS_LOG`

> Таблица принадлежит схеме `report`. Append-only журнал событий допуска на КПП. Все FK — логические (без REFERENCES-constraint; схемная изоляция ADR-003).

| Атрибут | Тип PostgreSQL |
|---------|------------------|
| `id` | `BIGINT` `GENERATED BY DEFAULT AS IDENTITY` `PRIMARY KEY` |
| `ap_id` | `BIGINT` `NOT NULL` |
| `vehicle_id` | `BIGINT` |
| `client_id` | `BIGINT` |
| `direction` | `VARCHAR(8)` `NOT NULL` `CHECK (direction IN ('IN', 'OUT'))` |
| `decision` | `VARCHAR(16)` `NOT NULL` `CHECK (decision IN ('ALLOW', 'DENY', 'MANUAL'))` |
| `reason` | `TEXT` |
| `decided_at` | `TIMESTAMPTZ` `NOT NULL` |
| `created_at` | `TIMESTAMPTZ` `NOT NULL` `DEFAULT now()` |

`vehicle_id` и `client_id` — nullable: при некоторых отказах (нераспознанный ГРЗ) идентифицировать ТС или клиента невозможно. Таблица immutable (INSERT only). *DrawSQL: CHECK не поддерживается в UI — указать в Table Notes.*

---

## Таблицы

### 1. `PARKING` — Парковка

Назначение: парковочный объект, в рамках которого определяются сектора, КПП и график работы.

Ключевые поля:

- `id` — идентификатор парковки;
- `name` — наименование;
- `address` — адрес;
- `type` — тип парковки;
- `description` — описание;
- `operational_status` — статус эксплуатации.

Связи:

- одна парковка имеет много записей графика работы;
- одна парковка имеет много секторов;
- одна парковка имеет много КПП.

### 2. `PARKING_SCHEDULE` — График работы парковки

Назначение: нормализованное представление режима работы парковки по дням недели и периодам действия.

Ключевые поля:

- `id`;
- `parking_id`;
- `day_of_week`;
- `open_time`;
- `close_time`;
- `is_closed`;
- `effective_from`;
- `effective_to`.

Связи:

- каждая запись графика относится к одной парковке.

### 3. `SECTOR` — Сектор

Назначение: логически или физически выделенная часть парковки.

Ключевые поля:

- `id`;
- `parking_id`;
- `zone_type_id`;
- `name`;
- `operational_status`.

Связи:

- каждый сектор принадлежит одной парковке;
- каждый сектор относится к одному типу зоны;
- один сектор содержит много парковочных мест.

### 4. `ZONE_TYPE` — Тип зоны

Назначение: справочник бизнес-режимов зон парковки.

Ключевые поля:

- `id`;
- `code`;
- `name`;
- `description`.

Связи:

- один тип зоны назначается многим секторам;
- один тип зоны может допускать много типов ТС через таблицу связи;
- один тип зоны может поддерживать много тарифов через таблицу связи.

### 5. `VEHICLE_TYPE` — Тип ТС

Назначение: справочник категорий транспортных средств.

Ключевые поля:

- `id`;
- `code`;
- `name`;
- `description`.

Связи:

- один тип ТС назначается многим транспортным средствам;
- один тип ТС может быть разрешен во многих типах зон через таблицу связи.

### 5а. `PARKING_TYPE` — Тип парковочного объекта

Назначение: справочник типов парковочных объектов. Заменяет поле `PARKING.type VARCHAR` — позволяет расширять список типов без изменения схемы.

Ключевые поля:

- `id`;
- `code` — строковый код (например, `SURFACE`, `MULTILEVEL`, `UNDERGROUND`, `ROOFTOP`);
- `name` — отображаемое наименование;
- `description` — описание.

Связи:

- один тип парковки назначается многим объектам `PARKING`.

### 5б. `OPERATIONAL_STATUS` — Эксплуатационный статус

Назначение: единый справочник эксплуатационных статусов для инфраструктурных объектов. Используется таблицами `PARKING`, `SECTOR`, `PARKING_PLACE`, `AP` через поле `operational_status_id`.

Ключевые поля:

- `id`;
- `code` — строковый код (например, `ACTIVE`, `MAINTENANCE`, `CLOSED`, `RESERVED`);
- `name` — отображаемое наименование;
- `description` — описание.

Связи:

- один статус назначается многим объектам через `*_id`-поля в `PARKING`, `SECTOR`, `PARKING_PLACE`, `AP`.

Комментарий:

- единый справочник вместо четырёх отдельных `CHECK`-ограничений исключает расхождение набора допустимых значений между таблицами инфраструктуры.

### 6. `ZONE_TYPE_VEHICLE_TYPE` — Разрешенный тип ТС в типе зоны

Назначение: нормализованная таблица `M:N` между `ZONE_TYPE` и `VEHICLE_TYPE`.

Ключевые поля:

- `zone_type_id`;
- `vehicle_type_id`.

Связи:

- каждая запись связывает один тип зоны с одним типом ТС.

Рекомендация:

- использовать составной первичный ключ `(zone_type_id, vehicle_type_id)`.

### 7. `ZONE_TYPE_TARIFF` — Применимость тарифа к типу зоны

Назначение: нормализованная таблица `M:N` между `ZONE_TYPE` и `TARIFF`.

Ключевые поля:

- `zone_type_id`;
- `tariff_id`.

Связи:

- каждая запись связывает один тип зоны с одним тарифом.

Рекомендация:

- использовать составной первичный ключ `(zone_type_id, tariff_id)`.

### 8. `PARKING_PLACE` — Парковочное место

Назначение: конкретное физическое место в секторе.

Ключевые поля:

- `id`;
- `sector_id`;
- `override_tariff_id`;
- `place_number`;
- `operational_status`.

Связи:

- каждое место принадлежит одному сектору;
- место может иметь опциональный индивидуальный тариф;
- место может фигурировать во многих бронированиях.

Комментарий:

- производные поля вроде `reserved`, `physically_occupied`, `current_booking_id` намеренно не включены в базовую таблицу, так как их лучше рассчитывать или материализовывать отдельно.

### 9. `CLIENT` — Клиент

Назначение: общая сущность клиента как получателя услуг парковки.

Ключевые поля:

- `id`;
- `type` — `'FL'` (физическое лицо) или `'UL'` (юридическое лицо);
- `phone`;
- `email`;
- `status`;
- `status_reason`.

Связи:

- при `type = 'FL'`: профиль ФЛ хранится в `CLIENT` (ФИО заполнены); `ORGANIZATION` отсутствует;
- при `type = 'UL'`: существует запись `ORGANIZATION` (строго 1:1 через `ORGANIZATION.client_id`); поля ФЛ в `CLIENT` должны быть NULL;
- инвариант обеспечивается триггером или Application Service;
- настройки уведомлений и настройки оплаты ссылаются на клиента через FK в `NOTIFICATION_SETTINGS.client_id` и `PAYMENT_SETTINGS.client_id` (а не наоборот);
- один клиент может иметь много учётных записей (схема `auth`);
- один клиент может иметь много ТС, согласий, договоров, уведомлений и обращений.

### 10. Профиль клиента ФЛ (внутри `CLIENT`)

Назначение: профиль клиента-физического лица хранится в `CLIENT` (поля ФИО). Паспортные данные и льготные документы хранятся в `pii` и связываются с `CLIENT` через поля `pii.*.client_id` (логические ссылки).

### 12. `CLIENT_ACCOUNT` — Учетная запись клиента

Назначение: данные аутентификации клиента и его способов входа.

Ключевые поля:

- `id`;
- `client_id`;
- `auth_provider`;
- `login`;
- `password_hash`;
- `provider_subject_id`;
- `account_status`;
- `created_at`;
- `last_login_at`.

Связи:

- одна учетная запись принадлежит одному клиенту;
- один клиент может иметь одну или несколько учетных записей.

Комментарий:

- именно сюда вынесены локальная аутентификация и SSO-идентичности.

### 13. `NOTIFICATION_SETTINGS` — Настройки уведомлений

Назначение: предпочтения клиента по типам уведомлений.

Ключевые поля:

- `id`;
- `client_id`;
- `parking_session_enabled`;
- `booking_enabled`;
- `contract_enabled`;
- `payment_enabled`;
- `marketing_enabled`.

Связи:

- одна запись настроек принадлежит одному клиенту;
- одна запись настроек имеет один или несколько разрешённых каналов через `NOTIFICATION_SETTINGS_CHANNEL`.

### 13а. `NOTIFICATION_SETTINGS_CHANNEL` — Разрешённый канал

Назначение: нормализованная таблица допустимых каналов доставки уведомлений.

Ключевые поля:

- `settings_id` — FK на `NOTIFICATION_SETTINGS`;
- `channel` — `'SMS'`, `'EMAIL'`, `'PUSH'`.

Рекомендация:

- составной первичный ключ `(settings_id, channel)` исключает дублирование канала.

### 14. `PAYMENT_SETTINGS` — Настройки оплаты

Назначение: настройки автосписания и лимитов клиента.

Ключевые поля:

- `id`;
- `external_payer_id`;
- `auto_debit_contract`;
- `auto_debit_parking_session`;
- `monthly_limit`.

Связи:

- одна запись настроек оплаты принадлежит одному клиенту.

### 15. `PASSPORT_DATA` — Паспортные данные

Назначение: отдельное хранение реквизитов удостоверяющего документа клиента-ФЛ.

Ключевые поля:

- `id`;
- `document_type`;
- `series_and_number`;
- `issue_date`;
- `issued_by`;
- `department_code`.

Связи:

- принадлежит одному клиенту через `pii.passport_data.client_id` (логическая ссылка).

### 16. `BENEFIT_DOCUMENT` — Льготный документ

Назначение: документ, подтверждающий право на льготу.

Ключевые поля:

- `id`;
- `benefit_category`;
- `document_type`;
- `document_number`;
- `issue_date`;
- `expiry_date`;
- `document_image_ref`;
- `verification_status`.

Связи:

- принадлежит одному клиенту через `pii.benefit_document.client_id` (логическая ссылка).

### 17. `ORGANIZATION` — Организация

Назначение: юридическое лицо клиента-ЮЛ.

Ключевые поля:

- `id`;
- `name`;
- `legal_form`;
- `legal_address`;
- `actual_address`;
- `inn` — `NOT NULL UNIQUE`; обязателен при регистрации ЮЛ;
- `kpp`;
- `ogrn`;
- `email`;
- `phone`;
- `status`.

Связи:

- организация связана с одним клиентом-ЮЛ через `ORGANIZATION.client_id` (строго 1:1);
- организация может иметь много банковских счетов.

### 18. `ORGANIZATION_BANK_ACCOUNT` — Банковский счет организации

Назначение: нормализованное хранение банковских реквизитов организации.

Ключевые поля:

- `id`;
- `organization_id`;
- `bank_name`;
- `bik`;
- `account_number`;
- `correspondent_account`;
- `is_primary`.

Связи:

- каждый счет принадлежит одной организации;
- одна организация может иметь много счетов.

### 19. `CONSENT` — Согласие

Назначение: история юридически значимых согласий клиента.

Ключевые поля:

- `id`;
- `client_id`;
- `consent_type`;
- `consent_given`;
- `given_at`;
- `revoked_at`.

Связи:

- каждое согласие принадлежит одному клиенту;
- один клиент может иметь много записей согласия.

### 20. `EMPLOYEE` — Сотрудник

Назначение: служебный профиль сотрудника парковки (контекст `Сотрудник`). Credential-данные (`login`, `password_hash`, `totp_secret_encrypted`) вынесены в `EMPLOYEE_CREDENTIAL` (схема `auth`).

Ключевые поля:

- `id`;
- `role`;
- `last_name`;
- `first_name`;
- `middle_name`;
- `phone`;
- `email`;
- `status`.

Связи:

- сотрудник может обрабатывать парковочные сессии (как actor reference);
- сотрудник может инициировать уведомления;
- сотрудник может обрабатывать обращения.

### 20а. `EMPLOYEE_CREDENTIAL` — Учётные данные сотрудника

Назначение: credential-модель сотрудника, вынесенная в инфраструктурную схему `auth`. `totp_secret_encrypted` хранится в зашифрованном виде.

Ключевые поля:

- `employee_id` — PK совпадает с `EMPLOYEE.id`;
- `login`;
- `password_hash`;
- `totp_secret_encrypted`;
- `account_status`.

### 20б. `EMPLOYEE_ROLE` — Роль сотрудника

Назначение: справочник ролей сотрудников. Заменяет поле `EMPLOYEE.role VARCHAR` — позволяет добавлять новые роли без изменения схемы.

Ключевые поля:

- `id`;
- `code` — строковый код (например, `OPERATOR`, `ADMIN`, `SECURITY`, `MANAGER`);
- `name` — отображаемое наименование;
- `description` — описание.

Связи:

- одна роль назначается многим сотрудникам.

### 21. `VEHICLE` — Транспортное средство

Назначение: транспортное средство клиента.

Ключевые поля:

- `id`;
- `client_id`;
- `vehicle_type_id`;
- `license_plate`;
- `brand`;
- `model`;
- `color`.

Связи:

- каждое ТС принадлежит одному клиенту;
- каждое ТС относится к одному типу ТС;
- одно ТС может участвовать во многих бронированиях.

### 22. `AP` — точка доступа (Access Point)

Назначение: точка въезда, выезда или двустороннего проезда. Поле `direction` явно кодирует направление движения и используется политиками доступа `ПолитикаДопускаНаВъезд` / `ПолитикаДопускаНаВыезд`.

Ключевые поля:

- `id`;
- `parking_id`;
- `name`;
- `type`;
- `direction` — `'ENTRY'`, `'EXIT'` или `'BIDIRECTIONAL'`;
- `status`.

Связи:

- каждый КПП принадлежит одной парковке;
- КПП может использоваться как точка въезда или выезда во многих парковочных сессиях.

### 23. `TARIFF` — Тариф

Назначение: правило тарификации парковки. Конкретные ставки (в т.ч. зависящие от времени суток/дня недели) хранятся в `TARIFF_RATE`. Поле `effective_from`/`effective_to` поддерживает версионирование тарифов.

Ключевые поля:

- `id`;
- `name`;
- `type`;
- `benefit_category`;
- `billing_step_unit` — единица тарифного шага: `'MINUTE'`, `'HOUR'`, `'DAY'`;
- `billing_step_value` — количество единиц в одном шаге;
- `max_amount`;
- `grace_period_minutes`;
- `effective_from`;
- `effective_to`.

Связи:

- тариф может быть применим ко многим типам зон через `ZONE_TYPE_TARIFF`;
- тариф имеет одну или несколько ставок через `TARIFF_RATE`;
- тариф может использоваться многими бронированиями;
- тариф может быть опционально назначен конкретному парковочному месту.

### 23а. `TARIFF_RATE` — Ставка тарифа

Назначение: ставки тарифа с поддержкой дифференциации по дню недели и времени суток.

Ключевые поля:

- `id`;
- `tariff_id`;
- `rate_minor` — ставка (минорные единицы валюты);
- `day_of_week` — день недели 1–7 или NULL (любой);
- `time_from`, `time_to` — интервал времени или NULL (весь день);
- `priority` — приоритет применения при пересечении правил (больше = выше приоритет).

### 24. `CONTRACT_TEMPLATE` — Шаблон договора

Назначение: шаблон текста и условий договора.

Ключевые поля:

- `id`;
- `code`;
- `name`;
- `version`;
- `type`;
- `body`;
- `effective_from`;
- `effective_to`.

Связи:

- один шаблон договора может породить много договоров.

### 25. `CONTRACT` — Договор

Назначение: юридическое соглашение между клиентом и оператором парковки.

Ключевые поля:

- `id`;
- `client_id`;
- `contract_template_id` — в целевой физической схеме допускает **NULL**, если договор может существовать без привязки к шаблону (согласование с концептуальной моделью);
- `contract_number`;
- `start_date`;
- `end_date`;
- `status`;
- `document_file_ref`.

Связи:

- договор принадлежит одному клиенту;
- договор может ссылаться на один шаблон;
- договор может использоваться во многих бронированиях;
- договор может фигурировать во многих обращениях.

### 26. `BOOKING` — Бронирование

Назначение: запись о плановом использовании парковочного пространства.

Ключевые поля:

- `id`;
- `booking_number`;
- `vehicle_id` — ID ТС (без FK-constraint; схемная изоляция);
- `parking_place_id` — конкретное место (опционально);
- `contract_id` — договор (опционально; без FK-constraint);
- `tariff_id` — применённый тариф (без FK-constraint);
- `start_at`;
- `end_at` — необязательное поле; фиксируется при завершении брони или задаётся при предварительном бронировании;
- `duration_minutes` — nullable; `NULL` для открытых бронирований (`end_at IS NULL`); устанавливается при завершении;
- `license_plate_snapshot` — ГРЗ ТС на момент создания брони (иммутабельный снимок);
- `type`;
- `status`;
- `amount_due`.

Связи:

- бронирование создаётся для одного ТС;
- бронирование может ссылаться на конкретное место;
- бронирование может ссылаться на договор;
- бронирование рассчитывается по одному тарифу;
- по одному бронированию может быть много счетов;
- по одному бронированию может быть много парковочных сессий;
- по одному бронированию может быть много обращений.

Комментарий:

- `booking_number` — внешний человекочитаемый идентификатор для интерфейсов, уведомлений, поиска;
- `amount_due` — снимок расчёта тарифа: NULL при создании AUTO-брони (сумма неизвестна на въезде); заполняется Application Service при завершении сессии; NOT NULL для SHORT_TERM и CONTRACT; не пересчитывается автоматически; юридически авторитетны суммы в `INVOICE.amount_due`;
- `sector_id` удалён: сектор выводится через `parking_place_id → parking_place.sector_id`.

### 27. `PARKING_SESSION` — Парковочная сессия

Назначение: фактический период нахождения ТС на парковке.

Ключевые поля:

- `id`;
- `booking_id` — обязательная ссылка на бронирование (инвариант ADR-002; без FK-constraint);
- `entry_ap_id`, `exit_ap_id` — точки доступа въезда и выезда (без FK-constraint);
- `employee_id` — сотрудник, если допуск был ручным (без FK-constraint);
- `entry_time`;
- `exit_time`;
- `duration_minutes` — `GENERATED ALWAYS AS` (вычисляется из `exit_time - entry_time`; NULL пока сессия активна);
- `license_plate_snapshot` — ГРЗ ТС на момент въезда (иммутабельный снимок);
- `access_method`;
- `access_comment`;
- `status`.

Связи:

- каждая сессия относится к одному бронированию;
- каждая сессия может ссылаться на КПП въезда и КПП выезда;
- каждая сессия может ссылаться на сотрудника, если допуск был ручным.

### 28. `INVOICE` — Счёт

Назначение: финансовое требование к оплате. Принадлежит контексту `Платёж` (схема `payment`). Поддерживает два типа: `SINGLE` (разовый счёт по бронированию) и `PERIODIC` (консолидированный счёт ЮЛ за период по договору).

Ключевые поля:

- `id`;
- `booking_id` — заполнен при `type = 'SINGLE'`, NULL при `type = 'PERIODIC'` (без FK-constraint);
- `contract_id` — обязателен при `type = 'PERIODIC'` (без FK-constraint);
- `invoice_number` — уникальный бизнес-ключ;
- `type` — `'SINGLE'` или `'PERIODIC'`;
- `status`;
- `amount_due` — выставленная к оплате сумма;
- `billing_period_from`, `billing_period_to` — период начисления (заполняются при `type = 'PERIODIC'`);
- `issued_at`;
- `due_at`;
- `paid_at` — момент полного погашения.

Связи:

- один счёт может быть оплачен одним или несколькими платежами;
- счёт может существовать без платежей.

Комментарий:

- `INVOICE` отделяет начисление от факта поступления денег;
- для ЮЛ и постоплаты консолидированный счёт (`PERIODIC`) объединяет несколько бронирований за расчётный период.

### 29. `PAYMENT` — Платеж

Назначение: факт поступления денег в счет оплаты ранее выставленного счета.

Ключевые поля:

- `id`;
- `invoice_id`;
- `amount`;
- `currency`;
- `payment_method`;
- `status`;
- `initiated_at`;
- `completed_at`;
- `provider_id`.

Связи:

- каждый платеж относится к одному счету;
- один платеж может иметь один чек;
- один платеж может фигурировать во многих обращениях.

Комментарий:

- связь `PAYMENT -> INVOICE` позволяет поддержать частичную оплату и единый учет задолженности;
- бронирование и при необходимости договор доступны по цепочке `PAYMENT -> INVOICE -> BOOKING` (в т.ч. `BOOKING.contract_id`).

### 30. `RECEIPT` — Чек

Назначение: фискальный документ по платежу.

Ключевые поля:

- `id`;
- `payment_id`;
- `fiscal_number`;
- `receipt_at`;
- `fiscal_status`;
- `amount`.

Связи:

- чек относится к одному платежу;
- один чек может фигурировать во многих обращениях.

### 31. `REFUND` — Возврат

Назначение: факт возврата средств по платежу. Фиксирует отдельную транзакцию возврата у PSP с собственным идентификатором и статусом жизненного цикла.

Ключевые поля:

- `id`;
- `payment_id` — FK на платёж, по которому производится возврат;
- `amount` — сумма возврата (может быть меньше суммы платежа — частичный возврат);
- `reason` — причина возврата;
- `refund_provider_id` — идентификатор транзакции возврата у PSP;
- `status` — `'INITIATED'`, `'COMPLETED'`, `'FAILED'`;
- `initiated_at`, `completed_at`.

Связи:

- каждый возврат относится к одному платежу;
- один платёж может иметь несколько возвратов (частичные возвраты).

Комментарий:

- при создании `REFUND` следует отправить запрос к PSP с `payment.provider_id` → получить `refund_provider_id`;
- при завершении возврата может потребоваться новый фискальный чек (тип «возврат»).

### 32. `DEBT` — Задолженность

Назначение: просроченная задолженность клиента-ЮЛ по периодическому счёту. Создаётся scheduled job при `INVOICE.due_at < now()` и `INVOICE.status != 'PAID'`.

Ключевые поля:

- `id`;
- `invoice_id` — FK на просроченный счёт;
- `client_id` — логическая ссылка на клиента (без FK-constraint; схемная изоляция);
- `amount` — сумма задолженности на момент создания; иммутабельна (юридический снимок);
- `remaining_amount` — текущий остаток долга; инициализируется `= amount`; обновляется Payment Service атомарно при частичных оплатах; `CHECK (0 ≤ remaining_amount ≤ amount)`;
- `overdue_since` — дата возникновения просрочки (= `INVOICE.due_at`);
- `status` — `'ACTIVE'`, `'PAID'`, `'WRITTEN_OFF'`.

Связи:

- каждая задолженность относится к одному счёту;
- один счёт имеет не более одной активной задолженности.

Комментарий:

- при `remaining_amount = 0` Payment Service атомарно выставляет `status = 'PAID'`;
- `WRITTEN_OFF` — списание по решению менеджмента; `remaining_amount` при этом не обнуляется (аудит).

### 32а. `PAYMENT_METHOD` — Способ оплаты

Назначение: справочник способов оплаты. Заменяет поле `PAYMENT.payment_method VARCHAR` — позволяет добавлять новые методы (например, при подключении нового PSP) без изменения схемы.

Ключевые поля:

- `id`;
- `code` — строковый код (например, `CARD`, `SBP`, `ACCOUNT_DEBIT`, `CASH`);
- `name` — отображаемое наименование;
- `description` — описание.

Связи:

- один способ оплаты используется во многих платежах.

### 34. `NOTIFICATION_TEMPLATE` — Шаблон уведомления

Назначение: шаблон текста и темы уведомления.

Ключевые поля:

- `id`;
- `code`;
- `name`;
- `type`;
- `subject`;
- `body`.

Связи:

- один шаблон может использоваться во многих уведомлениях.

### 35. `NOTIFICATION` — Уведомление

Назначение: задача на доставку сообщения клиенту. Принадлежит контексту `Уведомление` (схема `notification`). Физически автономна: не требует JOIN к `CLIENT` для отправки — адресат хранится в `delivery_address`.

Ключевые поля:

- `id`;
- `notification_template_id` (логическая ссылка без FK-constraint);
- `client_id` (логическая ссылка без FK-constraint);
- `initiator_employee_id` (логическая ссылка без FK-constraint);
- `channel`;
- `delivery_address` — фактический адресат на момент постановки задачи (телефон или email);
- `delivery_status`.

Связи:

- уведомление адресуется одному клиенту;
- уведомление может быть сформировано по одному шаблону;
- уведомление может быть инициировано сотрудником.

### 36. `APPEAL` — Обращение

Назначение: вопрос, жалоба или претензия клиента. Принадлежит контексту `Обращение` (схема `support`).

Ключевые поля:

- `id`;
- `client_id` (без FK-constraint);
- `employee_id` — обработчик (без FK-constraint);
- `subject_type` — тип предмета обращения: `'BOOKING'`, `'SESSION'`, `'PAYMENT'`, `'RECEIPT'`, `'CONTRACT'` или NULL;
- `subject_id` — ID предмета обращения или NULL (без FK-constraint);
- `type`;
- `channel`;
- `subject`;
- `description`;
- `status`.

Связи:

- обращение всегда принадлежит одному клиенту;
- обращение может обрабатываться одним сотрудником;
- обращение может ссылаться на один предмет из допустимого набора через `subject_type + subject_id`.

Комментарий:

- `subject_type` и `subject_id` — полиморфная пара вместо пяти отдельных nullable-FK; изолирует схему `support` от прямых зависимостей на другие схемы;
- инвариант: оба поля либо оба NULL, либо оба NOT NULL — обеспечивается `CHECK ((subject_type IS NULL) = (subject_id IS NULL))`.

### 37. `ACCESS_LOG` — Журнал событий КПП

Назначение: append-only журнал каждого события допуска (въезд или выезд) через КПП. Принадлежит схеме `report`. Создаётся системой при каждом решении о допуске — автоматическом или ручном.

Ключевые поля:

- `id`;
- `ap_id` — логическая ссылка на точку доступа (без FK-constraint);
- `vehicle_id` — логическая ссылка на ТС; nullable при нераспознанном ГРЗ;
- `client_id` — логическая ссылка на клиента; nullable;
- `direction` — направление: `'IN'` (въезд) или `'OUT'` (выезд);
- `decision` — результат: `'ALLOW'`, `'DENY'`, `'MANUAL'`;
- `reason` — комментарий при отказе или ручном решении;
- `decided_at` — момент принятия решения.

Связи:

- каждая запись относится к одному КПП;
- каждая запись может ссылаться на ТС и клиента (логически).

Комментарий:

- таблица иммутабельна (INSERT only); обновления и удаления запрещены;
- используется для аудита, отчётности и расследования инцидентов;
- `direction` — явное поле (не выводится из AP.direction), т.к. точка доступа может быть двусторонней.

---

## Сводка ключевых связей

### Структура парковки

- `PARKING` 1:N `PARKING_SCHEDULE`
- `PARKING` 1:N `SECTOR`
- `PARKING` 1:N `AP`
- `SECTOR` 1:N `PARKING_PLACE`
- `ZONE_TYPE` 1:N `SECTOR`

### Ограничения и тарификация

- `ZONE_TYPE` M:N `VEHICLE_TYPE` через `ZONE_TYPE_VEHICLE_TYPE`
- `ZONE_TYPE` M:N `TARIFF` через `ZONE_TYPE_TARIFF`
- `TARIFF` 1:N `TARIFF_RATE`
- `TARIFF` 1:N `BOOKING` (логическая ссылка без FK-constraint)
- `TARIFF` 1:N `PARKING_PLACE` как опциональный override

### Клиенты и идентичность

- `CLIENT` 1:0..1 `ORGANIZATION` (только для UL; `ORGANIZATION.client_id UNIQUE REFERENCES client(id)`)
- `CLIENT` 1:1 `NOTIFICATION_SETTINGS` (FK в `NOTIFICATION_SETTINGS.client_id`)
- `CLIENT` 1:1 `PAYMENT_SETTINGS` (FK в `PAYMENT_SETTINGS.client_id`)
- `CLIENT` 1:N `CLIENT_ACCOUNT` (схема `auth`)
- `EMPLOYEE` 1:1 `EMPLOYEE_CREDENTIAL` (схема `auth`)
- `CLIENT` 0..1:1 `PASSPORT_DATA` (схема `pii`; связь через `pii.passport_data.client_id` — логическая)
- `CLIENT` 0..1:1 `BENEFIT_DOCUMENT` (схема `pii`; связь через `pii.benefit_document.client_id` — логическая)
- `ORGANIZATION` 1:N `ORGANIZATION_BANK_ACCOUNT`

### Эксплуатация и договоры

- `CLIENT` 1:N `VEHICLE`
- `CLIENT` 1:N `CONTRACT`
- `VEHICLE` 1:N `BOOKING` (логическая ссылка без FK-constraint)
- `CONTRACT` 1:N `BOOKING` (логическая ссылка без FK-constraint)
- `BOOKING` 1:N `INVOICE` (логическая ссылка; `booking_id` nullable при `type='PERIODIC'`)
- `INVOICE` 1:N `PAYMENT`
- `BOOKING` 1:N `PARKING_SESSION`
- `PAYMENT` 1:0..1 `RECEIPT`
- `PAYMENT` 1:N `REFUND`
- `INVOICE` 1:0..1 `DEBT`

### Доступ и аудит

- `AP` 1:N `ACCESS_LOG` (append-only, логические FK)

### Коммуникации и поддержка

- `CLIENT` 1:N `NOTIFICATION`
- `NOTIFICATION_TEMPLATE` 1:N `NOTIFICATION`
- `CLIENT` 1:N `APPEAL`
- `EMPLOYEE` 1:N `APPEAL`
- предмет обращения задаётся полиморфной парой `subject_type + subject_id` (без FK-constraints)

---

## Замечания по реализации

### 1. Что хранить как базовые таблицы

В этой модели в диаграмму включены только базовые нормализованные таблицы.

Не включены как отдельные базовые таблицы:

- кэш статуса занятости места;
- текущая активная сессия места;
- агрегаты аналитики;
- materialized views.

### 2. Что можно денормализовать позже

Если потребуется оптимизация чтения, позже можно добавить:

- проекцию текущего состояния `PARKING_PLACE`;
- проекцию текущей активной парковочной сессии;
- снапшоты расчетных сумм и длительностей.

Но такие структуры лучше делать не первичными таблицами предметной области, а производными представлениями.

### 3. Что требует бизнес-инвариантов

Для корректной реализации этой модели важны инварианты:

- у `CLIENT` при `type = 'FL'` заполнены поля ФИО; запись `ORGANIZATION` отсутствует; при `type = 'UL'` существует `ORGANIZATION` (1:1 через `ORGANIZATION.client_id`), а поля ФИО в `CLIENT` пустые;
- у `APPEAL` `subject_type` и `subject_id` либо оба NULL, либо оба NOT NULL;
- у `PARKING_SESSION` каждая запись должна ссылаться на существующее `BOOKING` (проверяется Application Service из-за отсутствия FK-constraint);
- у `INVOICE` при `type = 'SINGLE'` — `booking_id NOT NULL`; при `type = 'PERIODIC'` — `contract_id NOT NULL`, `booking_id IS NULL`;
- у `PAYMENT` каждая запись должна ссылаться на существующее `INVOICE` (проверяется Application Service);
- у `DEBT` на один `INVOICE` не более одной записи со `status = 'ACTIVE'`;
- у `REFUND.amount` сумма не должна превышать `PAYMENT.amount` (проверяется Application Service);
- для `ZONE_TYPE_VEHICLE_TYPE` и `ZONE_TYPE_TARIFF` используются составные PK;
- у `CLIENT_ACCOUNT` при `auth_provider = 'LOCAL'` — `password_hash NOT NULL`; при внешнем IdP — `password_hash` может быть NULL (проверяется триггером или Application Service);
- у `BOOKING` при `type = 'AUTO'` — `amount_due` может быть NULL на момент создания; при `SHORT_TERM`/`CONTRACT` — `amount_due NOT NULL`; заполняется Application Service при завершении сессии.

### 4. Как закреплять инварианты в PostgreSQL

| Инвариант | CHECK на строке | Триггер / приложение |
|-----------|-----------------|----------------------|
| FL/UL инвариант клиента | `CHECK(type IN ('FL','UL'))` на `CLIENT.type` | `BEFORE INSERT/UPDATE` триггер или Application Service: при FL — обеспечить ФИО; при UL — обеспечить `ORGANIZATION` (1:1) и очистить ФИО |
| `APPEAL.subject_type / subject_id` | `CHECK ((subject_type IS NULL) = (subject_id IS NULL))` | — |
| `INVOICE` тип/поля | частично через `type CHECK` | триггер или Application Service |
| `CLIENT_ACCOUNT.password_hash` — LOCAL vs OAuth | — | Триггер `BEFORE INSERT/UPDATE`: при LOCAL — password_hash NOT NULL; при IdP — допустимо NULL |
| `BOOKING.amount_due` — AUTO vs SHORT_TERM/CONTRACT | — | Application Service: при создании AUTO — NULL; при завершении — заполнить; при SHORT_TERM/CONTRACT — NOT NULL при создании |
| Консистентность FK без REFERENCES | — | Application Service (валидация при записи) |
| `PARKING_SCHEDULE` уникальность | `UNIQUE (parking_id, day_of_week, effective_from)` | — |
| `ORGANIZATION_BANK_ACCOUNT.is_primary` единственность | `CREATE UNIQUE INDEX ... WHERE is_primary = true` | — |
| `PAYMENT.provider_id` уникальность | `CREATE UNIQUE INDEX ... WHERE provider_id IS NOT NULL` | — |
| `REFUND.refund_provider_id` уникальность | `CREATE UNIQUE INDEX ... WHERE refund_provider_id IS NOT NULL` | — |
| `DEBT`: один активный долг на счёт | — | Application Service проверяет `WHERE invoice_id = ? AND status = 'ACTIVE'` перед созданием |
| Уникальность пар в `ZONE_TYPE_*` | составной PK | — |

### 5. Критические индексы

> **Примечание (PostgreSQL):** FK-constraints **не** создают автоматические индексы на ссылающейся колонке. Нужно создавать явно.
> **DrawSQL:** индексы не отображаются в UI — документируйте их здесь и в Table Notes каждой таблицы.

```sql
-- ═══════════════════════════════════════════════════════
-- ОПЕРАЦИОННЫЙ ПУТЬ КПП (критический: sub-10ms)
-- ═══════════════════════════════════════════════════════
CREATE UNIQUE INDEX ON vehicle(license_plate);             -- LPR-распознавание на въезде

-- ═══════════════════════════════════════════════════════
-- БРОНИРОВАНИЯ
-- ═══════════════════════════════════════════════════════
CREATE INDEX ON booking(status) WHERE status IN ('ACTIVE','PENDING');
CREATE INDEX ON booking(start_at, end_at);
CREATE INDEX ON booking(vehicle_id);          -- JOIN vehicle→booking
CREATE INDEX ON booking(parking_place_id);    -- поиск броней по месту
CREATE INDEX ON booking(contract_id);         -- периодический счёт по договору
CREATE INDEX ON booking(tariff_id);           -- аудит тарифа

-- ═══════════════════════════════════════════════════════
-- ПАРКОВОЧНЫЕ СЕССИИ
-- ═══════════════════════════════════════════════════════
CREATE INDEX ON parking_session(status) WHERE status = 'ACTIVE';
CREATE INDEX ON parking_session(entry_time DESC);
CREATE INDEX ON parking_session(booking_id);  -- JOIN booking→session (КРИТИЧНО)

-- ═══════════════════════════════════════════════════════
-- ФИНАНСЫ
-- ═══════════════════════════════════════════════════════
CREATE INDEX ON invoice(status);
CREATE INDEX ON invoice(booking_id);          -- SINGLE-счёт → бронь
CREATE INDEX ON invoice(contract_id);         -- PERIODIC-счёт → договор
CREATE INDEX ON invoice(due_at) WHERE status NOT IN ('PAID','CANCELLED');  -- задолженности

CREATE INDEX ON payment(invoice_id);          -- оплаты по счёту (КРИТИЧНО)
CREATE INDEX ON payment(invoice_id, status, amount) WHERE status = 'COMPLETED';
                                              -- покрывающий индекс для SUM(amount) WHERE invoice_id=? AND status='COMPLETED'
CREATE INDEX ON payment(status) WHERE status NOT IN ('COMPLETED','CANCELLED');

CREATE INDEX ON receipt(payment_id);          -- чек по платежу
CREATE INDEX ON refund(payment_id);           -- возвраты по платежу
CREATE INDEX ON debt(invoice_id);             -- долг по счёту
CREATE INDEX ON debt(client_id);              -- все долги клиента
CREATE INDEX ON debt(status) WHERE status = 'ACTIVE';

-- ═══════════════════════════════════════════════════════
-- КЛИЕНТ И КОНТРАКТЫ
-- ═══════════════════════════════════════════════════════
CREATE INDEX ON contract(client_id);          -- все договоры клиента
CREATE INDEX ON vehicle(client_id);           -- все ТС клиента
CREATE INDEX ON consent(client_id);           -- согласия клиента
CREATE INDEX ON notification(client_id);      -- уведомления клиента
CREATE INDEX ON appeal(client_id);            -- обращения клиента
CREATE INDEX ON appeal(employee_id);          -- обращения у сотрудника
CREATE INDEX ON appeal(subject_type, subject_id);  -- полиморфный поиск

-- ═══════════════════════════════════════════════════════
-- ТАРИФ И ИНФРАСТРУКТУРА
-- ═══════════════════════════════════════════════════════
-- Уникальность ставки тарифа: COALESCE заменяет NULL-значения сентинелями,
-- чтобы UNIQUE работал корректно при nullable day_of_week/time_from/time_to.
-- Application Service обязан проверить отсутствие дублей перед INSERT/UPDATE.
CREATE UNIQUE INDEX ON tariff_rate(
    tariff_id,
    COALESCE(day_of_week, 0),
    COALESCE(time_from,   '00:00'::TIME),
    COALESCE(time_to,     '00:00'::TIME)
);
CREATE INDEX ON tariff_rate(tariff_id);       -- ставки тарифа (lookup)
CREATE INDEX ON parking_schedule(parking_id); -- FK на парковку (не покрыт PK)
CREATE INDEX ON organization_bank_account(organization_id);  -- счета организации

-- ═══════════════════════════════════════════════════════
-- ИНФРАСТРУКТУРА (FK не индексируются автоматически)
-- ═══════════════════════════════════════════════════════
CREATE INDEX ON sector(parking_id);           -- все секторы парковки
CREATE INDEX ON ap(parking_id);              -- все точки доступа парковки
CREATE INDEX ON parking_place(sector_id);     -- все места сектора

-- ═══════════════════════════════════════════════════════
-- ПАРКОВОЧНЫЕ СЕССИИ — КПП-ссылки
-- ═══════════════════════════════════════════════════════
CREATE INDEX ON parking_session(entry_ap_id);   -- события на въезде точки доступа
CREATE INDEX ON parking_session(exit_ap_id);    -- события на выезде точки доступа

-- ═══════════════════════════════════════════════════════
-- AUTH (cross-schema, но индекс обязателен)
-- ═══════════════════════════════════════════════════════
CREATE INDEX ON client_account(client_id);    -- все аккаунты клиента

-- ═══════════════════════════════════════════════════════
-- ACCESS_LOG (append-only; основные пути отчётов)
-- ═══════════════════════════════════════════════════════
CREATE INDEX ON access_log(ap_id);                                          -- события по точке доступа
CREATE INDEX ON access_log(decided_at DESC);                                 -- временные диапазоны аудита
CREATE INDEX ON access_log(vehicle_id) WHERE vehicle_id IS NOT NULL;         -- история по ТС
```

### 6. Анализ нормализации и архитектурные замечания

#### Нормализация (1НФ / 2НФ / 3НФ)

| Таблица | Статус | Комментарий |
|---------|--------|-------------|
| Все | **1НФ ✅** | Все атрибуты атомарны; `TEXT[]` заменён отдельной таблицей (`NOTIFICATION_SETTINGS_CHANNEL`) |
| `ZONE_TYPE_VEHICLE_TYPE`, `ZONE_TYPE_TARIFF` | **2НФ ✅** | Составные PK без не-ключевых атрибутов |
| `BOOKING.amount_due` | **3НФ — намеренная денормализация** | Снимок расчёта тарифа на момент создания брони; не пересчитывается автоматически. NULL для AUTO-броней до завершения сессии |
| `PARKING_SESSION.duration_minutes` | **3НФ — вычислимое поле** | `GENERATED ALWAYS AS STORED` — PostgreSQL гарантирует консистентность |
| `TARIFF_RATE` | **3НФ ✅** | `rate` зависит от `(tariff_id, day_of_week, time_from, time_to)` — корректная специализация тарифа; уникальность через expression UNIQUE index c COALESCE (секция 5) |
| `ORGANIZATION.inn` | **BCNF ✅ исправлено** | `inn VARCHAR(12) NOT NULL UNIQUE`; `ogrn UNIQUE`. ИНН обязателен (Q6) |

#### Архитектурные замечания

1. **✅ `ORGANIZATION.client_id` (1:1) зафиксировано:** `client_id BIGINT NOT NULL UNIQUE REFERENCES client(id)` — профиль ЮЛ хранится в `ORGANIZATION`, а `CLIENT` остаётся единой сущностью клиента.

2. **✅ `BOOKING.duration_minutes` → nullable применено:** `NULL` для открытых бронирований (`end_at IS NULL`); устанавливается Application Service при завершении брони.

3. **✅ Покрывающий индекс `payment(invoice_id, status, amount)` добавлен:** покрывает запрос `SUM(amount) WHERE invoice_id=? AND status='COMPLETED'` без обращения к heap.

4. **`DEBT.client_id` — логический FK (cross-schema):** индекс `ON debt(client_id)` добавлен в секцию 5. Application Service проверяет существование клиента при создании `DEBT`. **`remaining_amount`** инициализируется `= amount` при INSERT; уменьшается Payment Service в той же транзакции, что создаёт `PAYMENT`; при `remaining_amount = 0` — `status = 'PAID'`. Инвариант `CHECK (remaining_amount >= 0 AND remaining_amount <= amount)` добавить в Table Notes DrawSQL.

5. **Создание настроек при регистрации клиента:** `NOTIFICATION_SETTINGS` и `PAYMENT_SETTINGS` имеют `UNIQUE(client_id)`. Application Service обязан создавать дефолтные записи при регистрации клиента — иначе нарушится инвариант `CLIENT 1:1 NOTIFICATION_SETTINGS`. *(Не требует изменений в схеме — это контракт Application Service.)*

### 7. Схема `report` (контекст `Отчёт`)

Схема содержит таблицу `ACCESS_LOG` — append-only журнал событий КПП. Аналитические агрегаты и read-модели формируются через проекции доменных событий от `Бронирование`, `Сессия`, `Платёж`, `Доступ` и других контекстов. Физически — отдельная схема `report`; в перспективе — materialized views или отдельная read replica (ADR-003, Trade-offs).

## Статус документа

Временный рабочий черновик нормализованной ER-модели.

# Расхождения маппинга обмена данными с ЮKassa

Документ фиксирует расхождения между [yookassa-data-mapping.md](yookassa-data-mapping.md) и другими артефактами проекта — актуальной документацией ЮKassa, requirements в [docs/specs/](../../specs/), ERD, sequence-диаграммой UC-10.2, текстом UC-10.2 и payload/schema UC-10.2. Отчет подготовлен на Фазе 7 плана [2026-04-30-yookassa-mapping-table-format-alignment.md](../../../plans/2026-04-30-yookassa-mapping-table-format-alignment.md) по результатам сверки шести процессных таблиц и раздела «Маппинг значений» волной из шести исполнителей. Используй документ как чек-лист открытых вопросов: каждое расхождение имеет статус и предложенное действие, а сводная таблица в конце дает приоритеты для будущих планов.

## Оглавление

- [Контекст](#контекст)
- [Расхождения с актуальной документацией ЮKassa](#расхождения-с-актуальной-документацией-юkassa)
- [Расхождения с requirements (`docs/specs/`)](#расхождения-с-requirements-docsspecs)
- [Расхождения с ERD](#расхождения-с-erd)
- [Расхождения с sequence-диаграммой UC-10.2](#расхождения-с-sequence-диаграммой-uc-102)
- [Расхождения с use case UC-10.2](#расхождения-с-use-case-uc-102)
- [Расхождения с payload и schema UC-10.2](#расхождения-с-payload-и-schema-uc-102)
- [Открытые вопросы](#открытые-вопросы)
- [Сводная таблица](#сводная-таблица)
- [Связанные документы](#связанные-документы)

## Контекст

- Дата сверки: 2026-04-30.
- Источник истины по контракту ЮKassa: <https://yookassa.ru/developers/api>.
- Ограничение веб-доступа на момент Фазы 1: WebFetch к якорям ЮKassa отдает оглавление, но не полные структуры объектов; пункты, которые невозможно проверить через WebFetch, помечены как «требует онлайн-сверки».
- Область действия: [yookassa-data-mapping.md](yookassa-data-mapping.md), шесть процессных таблиц + раздел «Маппинг значений».
- Каждое расхождение имеет статус из набора: `новый план` (требуется отдельный план), `обсудить` (нужно решение команды), `принять как есть` (фиксируем как известное ограничение).

## Расхождения с актуальной документацией ЮKassa

### 1. Полный список значений `payment_method.type`

- Затронутые таблицы: [Ответ ЮKassa по платежу](yookassa-data-mapping.md#ответ-юkassa-по-платежу-источник-юkassa--приемник-модуль-оплата), [HTTP-уведомление по платежу](yookassa-data-mapping.md#http-уведомление-по-платежу-источник-юkassa--приемник-модуль-оплата), раздел [Способы оплаты `payment_method.type`](yookassa-data-mapping.md#способы-оплаты-payment_methodtype).
- Затронутое поле: `payment_method.type` (string).
- Что говорит текущая документация платформы: перечислены `bank_card`, `sbp`, `yoo_money`, `sberbank`, `cash`.
- Что говорит ЮKassa: возможны дополнительные типы — `tinkoff_bank`, `mobile_balance`, `installments`, `apple_pay`, `google_pay`. Точный список требует онлайн-сверки с разделом [#payment_method_object](https://yookassa.ru/developers/api#payment_method_object).
- Статус: `новый план`. Предложенное действие — отдельный план: либо расширить справочник `payment_methods.code` новыми кодами, либо явно зафиксировать ограничение в разделе «Ограничения текущей модели» yookassa-data-mapping.md с обоснованием.

### 2. Полный список значений `Payment.status` и `Refund.status`

- Затронутые таблицы: [Ответ ЮKassa по платежу](yookassa-data-mapping.md#ответ-юkassa-по-платежу-источник-юkassa--приемник-модуль-оплата), [HTTP-уведомление по платежу](yookassa-data-mapping.md#http-уведомление-по-платежу-источник-юkassa--приемник-модуль-оплата), [HTTP-уведомление по возврату](yookassa-data-mapping.md#http-уведомление-по-возврату-источник-юkassa--приемник-модуль-оплата), [Ответ ЮKassa по возврату](yookassa-data-mapping.md#ответ-юkassa-по-возврату-источник-юkassa--приемник-модуль-оплата), раздел [Статусы платежа](yookassa-data-mapping.md#статусы-платежа) и [Статусы возврата](yookassa-data-mapping.md#статусы-возврата).
- Затронутые поля: `Payment.status`, `Refund.status`.
- Что говорит текущая документация платформы: для платежа — `pending`, `waiting_for_capture`, `succeeded`, `canceled`; для возврата — `pending`, `succeeded`, `canceled`.
- Что говорит ЮKassa: требует онлайн-сверки с разделами [#payment_object](https://yookassa.ru/developers/api#payment_object) и [#refund_object_status](https://yookassa.ru/developers/api#refund_object_status). Возможно появление новых статусов, которые сейчас не покрыты.
- Статус: `обсудить`. Действие — провести онлайн-сверку перед реализацией интеграции и при необходимости расширить enum БД (`payment_status_enum`, `refund_status_enum`) или явно отметить пропуски в «Ограничениях текущей модели».

### 3. Имя поля `payment_method.type` в запросе на создание платежа

- Затронутая таблица: [Создание платежа](yookassa-data-mapping.md#создание-платежа-post-v3payments-источник-модуль-оплата--приемник-юkassa).
- Затронутое поле: способ оплаты в теле `POST /v3/payments`.
- Что говорит текущая документация платформы: используется `payment_method_data.type`.
- Что говорит ЮKassa: точное имя в запросе требует онлайн-сверки с [#create_payment](https://yookassa.ru/developers/api#create_payment); возможен вариант `payment_method.type` без префикса `_data`.
- Статус: `обсудить`. Действие — уточнить имя поля при онлайн-сверке и поправить таблицу при необходимости.

### 4. Допустимые значения `receipt.items[].vat_code`

- Затронутая таблица: [Создание платежа](yookassa-data-mapping.md#создание-платежа-post-v3payments-источник-модуль-оплата--приемник-юkassa).
- Затронутое поле: `Payment.receipt.items[].vat_code` (integer).
- Что говорит текущая документация платформы: фиксированное значение `0`.
- Что говорит ЮKassa: по примерам документации допустимые значения 1..6 (1 — без НДС, 2..6 — ставки); значение `0` в примерах не упомянуто и может быть невалидным. Требует онлайн-сверки с разделом [#receipt_object](https://yookassa.ru/developers/api#receipt_object).
- Статус: `новый план`. Действие — отдельный план: подобрать корректное значение `vat_code` под систему налогообложения паркинга и обновить таблицу.

### 5. Обязательность и дефолт поля `capture`

- Затронутая таблица: [Создание платежа](yookassa-data-mapping.md#создание-платежа-post-v3payments-источник-модуль-оплата--приемник-юkassa).
- Затронутое поле: `Payment.capture` (boolean).
- Что говорит текущая документация платформы: boolean, обычно `true`, конфигурационное.
- Что говорит ЮKassa: обязательность и дефолтное значение требуют онлайн-сверки с [#create_payment](https://yookassa.ru/developers/api#create_payment).
- Статус: `обсудить`. Действие — зафиксировать решение по двухстадийной оплате (capture true/false) и обновить комментарий в таблице.

### 6. Полный список `confirmation.type`

- Затронутая таблица: [Создание платежа](yookassa-data-mapping.md#создание-платежа-post-v3payments-источник-модуль-оплата--приемник-юkassa).
- Затронутое поле: `Payment.confirmation.type` (string).
- Что говорит текущая документация платформы: `redirect` для веба.
- Что говорит ЮKassa: помимо `redirect` возможны `embedded`, `external`, `qr`, `mobile_application`. Полный набор требует онлайн-сверки с [#create_payment](https://yookassa.ru/developers/api#create_payment).
- Статус: `принять как есть`. Действие — фиксируем `redirect` как единственный поддерживаемый сценарий для веб-парковки; остальные варианты — будущие задачи.

### 7. Формат `amount.value` (количество знаков после запятой, разделитель)

- Затронутые таблицы: [Создание платежа](yookassa-data-mapping.md#создание-платежа-post-v3payments-источник-модуль-оплата--приемник-юkassa), [Ответ ЮKassa по платежу](yookassa-data-mapping.md#ответ-юkassa-по-платежу-источник-юkassa--приемник-модуль-оплата), [HTTP-уведомление по платежу](yookassa-data-mapping.md#http-уведомление-по-платежу-источник-юkassa--приемник-модуль-оплата), [HTTP-уведомление по возврату](yookassa-data-mapping.md#http-уведомление-по-возврату-источник-юkassa--приемник-модуль-оплата), [Запрос возврата](yookassa-data-mapping.md#запрос-возврата-post-v3refunds-источник-модуль-оплата--приемник-юkassa), [Ответ ЮKassa по возврату](yookassa-data-mapping.md#ответ-юkassa-по-возврату-источник-юkassa--приемник-модуль-оплата).
- Затронутое поле: `amount.value` (string в major units).
- Что говорит текущая документация платформы: decimal string в формате `"123.45"`.
- Что говорит ЮKassa: string по документации; точное количество знаков после запятой и разделитель требуют сверки. Раздел «Правила валидации и хранения» yookassa-data-mapping.md фиксирует конверсию из `amount_minor` (BIGINT) в `amount.value` (string), но не подтверждает формат двух знаков после запятой ссылкой на документацию.
- Статус: `принять как есть`. Действие — фиксируем формат «строка с двумя знаками после запятой, разделитель `.`» как требование платформы; при онлайн-сверке подтвердить.

### 8. Структура `Payment.cancellation_details`

- Затронутые таблицы: [Ответ ЮKassa по платежу](yookassa-data-mapping.md#ответ-юkassa-по-платежу-источник-юkassa--приемник-модуль-оплата), [HTTP-уведомление по платежу](yookassa-data-mapping.md#http-уведомление-по-платежу-источник-юkassa--приемник-модуль-оплата), [Ответ ЮKassa по возврату](yookassa-data-mapping.md#ответ-юkassa-по-возврату-источник-юkassa--приемник-модуль-оплата).
- Затронутое поле: `cancellation_details.party`, `cancellation_details.reason`.
- Что говорит текущая документация платформы: содержит `party` и `reason`, в БД не пишется. Поля используются как **вход бизнес-правила** маппинга `canceled` → `CANCELLED` или `FAILED` (раздел [Статусы платежа](yookassa-data-mapping.md#статусы-платежа)). Без этих полей правило не работает: непонятно, отнести отмену к пользовательской или к технической.
- Что говорит ЮKassa: точные enum-значения `party` и `reason` требуют онлайн-сверки с [#payment_object_cancellation_details](https://yookassa.ru/developers/api#payment_object_cancellation_details). Без знания полного набора enum-значений правило `CANCELLED` vs `FAILED` остается приближенным.
- Статус: `обсудить`. Действия: (а) онлайн-сверкой подтвердить полный набор `party` и `reason`, (б) определить, нужно ли сохранять `cancellation_details` в журнале интеграции (например, в `shared.outbox_events.payload` при `event_type='payment.canceled'`) для расследований и поддержки.

### 9. Поля webhook платежа: дополнительные блоки

- Затронутая таблица: [HTTP-уведомление по платежу](yookassa-data-mapping.md#http-уведомление-по-платежу-источник-юkassa--приемник-модуль-оплата).
- Затронутое поле: `object.risk_data`, `object.verification_data`, иные расширения объекта `Payment` в webhook.
- Что говорит текущая документация платформы: эти поля не упомянуты.
- Что говорит ЮKassa: возможна передача `risk_data` и `verification_data` для антифрода. Требует онлайн-сверки с [#webhook](https://yookassa.ru/developers/api#webhook).
- Статус: `принять как есть`. Действие — фиксируем, что эти поля игнорируются на текущем этапе; сохранение в `shared.outbox_events.payload` обеспечит хранение полного payload без необходимости править маппинг.

### 10. Структура `POST /v3/refunds` — поля `sources`, `receipt`, `deal`

- Затронутая таблица: [Запрос возврата](yookassa-data-mapping.md#запрос-возврата-post-v3refunds-источник-модуль-оплата--приемник-юkassa).
- Затронутые поля: `sources`, `receipt`, `deal`.
- Что говорит текущая документация платформы: эти поля не упомянуты.
- Что говорит ЮKassa: опциональные поля для частичных возвратов, чека возврата и сделок/рассрочек. Требуют онлайн-сверки с [#create_refund](https://yookassa.ru/developers/api#create_refund).
- Статус: `обсудить`. Действие — определить, поддерживает ли паркинг частичные возвраты и фискализацию чеков по возвратам; добавить поля в маппинг при необходимости.

### 11. Структура объекта `Refund` — поле `receipt_registration`

- Затронутые таблицы: [HTTP-уведомление по возврату](yookassa-data-mapping.md#http-уведомление-по-возврату-источник-юkassa--приемник-модуль-оплата), [Ответ ЮKassa по возврату](yookassa-data-mapping.md#ответ-юkassa-по-возврату-источник-юkassa--приемник-модуль-оплата).
- Затронутое поле: `Refund.receipt_registration`.
- Что говорит текущая документация платформы: не упомянуто.
- Что говорит ЮKassa: возможен признак фискализации чека по возврату. Требует онлайн-сверки с [#refund_object](https://yookassa.ru/developers/api#refund_object).
- Статус: `принять как есть`. Действие — отметить в «Ограничениях текущей модели», что фискализация возвратов вне текущего скоупа.

### 12. События webhook возврата помимо `refund.succeeded`

- Затронутая таблица: [HTTP-уведомление по возврату](yookassa-data-mapping.md#http-уведомление-по-возврату-источник-юkassa--приемник-модуль-оплата).
- Затронутое поле: `event` (string).
- Что говорит текущая документация платформы: единственное событие — `refund.succeeded`.
- Что говорит ЮKassa: возможны `refund.canceled` и иные события. Требует онлайн-сверки с [#webhook](https://yookassa.ru/developers/api#webhook).
- Статус: `обсудить`. Действие — уточнить полный список событий и принять решение по обработке `refund.canceled`.

### 13. Семантика `Refund.created_at` (initiated vs completed)

- Затронутые таблицы: [HTTP-уведомление по возврату](yookassa-data-mapping.md#http-уведомление-по-возврату-источник-юkassa--приемник-модуль-оплата), [Ответ ЮKassa по возврату](yookassa-data-mapping.md#ответ-юkassa-по-возврату-источник-юkassa--приемник-модуль-оплата).
- Затронутое поле: `Refund.created_at` → `refunds.initiated_at` или `refunds.completed_at`.
- Что говорит текущая документация платформы: `Refund.created_at` маппится в `refunds.initiated_at`.
- Что говорит ЮKassa: семантика `created_at` (момент инициации vs момент фискального завершения) требует онлайн-сверки с [#refund_object](https://yookassa.ru/developers/api#refund_object).
- Статус: `обсудить`. Действие — зафиксировать политику: `initiated_at` заполняется при отправке `POST /v3/refunds`, `completed_at` — при получении webhook `refund.succeeded`. Уточнить в правилах валидации yookassa-data-mapping.md.

### 14. Поля ЮKassa, исключенные из маппинга в текущем скоупе MVP

- Затронутые таблицы: [Ответ ЮKassa по платежу](yookassa-data-mapping.md#ответ-юkassa-по-платежу-источник-юkassa--приемник-модуль-оплата), [HTTP-уведомление по платежу](yookassa-data-mapping.md#http-уведомление-по-платежу-источник-юkassa--приемник-модуль-оплата).
- Затронутые поля: `Payment.paid` / `object.paid`, `Payment.created_at` / `object.created_at`, `Payment.expires_at` / `object.expires_at`, `Payment.payment_method.id` / `object.payment_method.id`.
- Что говорит ЮKassa: эти поля присутствуют в объекте `Payment` в синхронном ответе и в webhook (точное наличие `created_at` / `expires_at` в синхронном ответе требует онлайн-сверки, см. [Открытые вопросы](#открытые-вопросы)).
- Что говорит текущая документация платформы: поля сознательно **не включены** в таблицы маппинга. Обоснование:
  - `paid` дублирует `status` для одностадийной оплаты (`Payment.capture = true`). Защитная кросс-проверка `paid === true && status === 'succeeded'` не покрывает реалистичных сценариев отказа провайдера; целостность обеспечивается сверкой суммы и валюты ([правило 6 в «Правилах валидации»](yookassa-data-mapping.md#правила-валидации-и-хранения)) и подписью webhook.
  - `created_at` дублируется внутренним `payments.initiated_at` (момент создания записи в `payment.payments`); отдельный журнал интеграции, способный хранить провайдерский timestamp, в текущей модели отсутствует.
  - `expires_at` имеет смысл только при наличии в UI таймера оплаты или авто-повторной попытки; ни то, ни другое в скоупе UC-10.2 не требуется (см. [uc-10-2-pay-online-short-term-rental.md](../../artifacts/use-case/uc-10-2-pay-online-short-term-rental.md)).
  - `payment_method.id` нужен только для рекуррентных платежей и сохраненных способов оплаты; рекурренты в скоупе паркинга не моделируются.
- Статус: `принять как есть`. Действия: (а) фиксируем как ограничение в [«Ограничениях текущей модели»](yookassa-data-mapping.md#ограничения-текущей-модели); (б) при появлении требования (таймер UI, повторная попытка, сохранение способа оплаты, журнал интеграции с провайдерскими timestamps) поля возвращаются в маппинг отдельным изменением вместе с потребителем.

## Расхождения с requirements (`docs/specs/`)

Все шесть исполнителей сверились с [docs/specs/integration/integration-requirements.md](../../specs/integration/integration-requirements.md) и подтвердили: маппинг полностью покрывает требование INT-004 («Платеж.ЗапросОплаты.ПлатежныйПровайдер», «ПлатежныйПровайдер.СтатусОплаты.Платеж», «Платеж.ЗапросВозврата.ПлатежныйПровайдер») в части обязательных атрибутов: сумма, валюта, способ оплаты, внутренний ID операции, ссылка на исходную операцию, статус, время завершения. Маппинг детализирует INT-004 на уровне имен полей ЮKassa — это уточнение, а не расхождение. Статус: `принять как есть`. Дополнительные правки `docs/specs/` в рамках текущего плана не требуются. Открытым остается единственный пункт ниже.

### Уточнение: `metadata` ЮKassa и идемпотентность

- Требование: INT-004 упоминает «реквизиты для идемпотентности» как обязательную часть запроса.
- Что говорит маппинг: ключ идемпотентности (`Idempotence-Key`) — HTTP-заголовок, в таблицу [Создание платежа](yookassa-data-mapping.md#создание-платежа-post-v3payments-источник-модуль-оплата--приемник-юkassa) не вынесен (заголовки за рамками маппинга полей).
- Действие: `принять как есть`. Зафиксировать в «Правилах валидации и хранения», что заголовок `Idempotence-Key` формируется на стороне модуля Оплата по `payments.id` и не является телом запроса. Дополнительный план по требованиям не нужен.

## Расхождения с ERD

ERD ([erd-normalized-er-model.md](../database/erd/erd-normalized-er-model.md)) и DDL ([chartdb-postgresql-erd-normalized-public.sql](../../../sql/database/chartdb-postgresql-erd-normalized-public.sql)) сверены со всеми шестью таблицами маппинга. Большинство полей согласуется без правок: типы и длины (`payments.provider_id VARCHAR(512)`, `refunds.refund_provider_id VARCHAR(512)`, `payments.completed_at TIMESTAMPTZ`, `refunds.amount_minor BIGINT`) точно соответствуют тому, что приходит/уходит по маппингу. Ниже — точки, требующие явного действия.

### 1. Конверсия `amount_minor` (BIGINT, minor) ↔ `amount.value` (string, major)

- Затронутые поля БД: `payments.amount_minor`, `refunds.amount_minor`, `receipts.amount_minor`.
- Что говорит ERD/DDL: `BIGINT NOT NULL`, хранение в копейках (minor units).
- Что приходит/уходит по маппингу: `string` в рублях с двумя знаками после запятой.
- Статус: `принять как есть`. Действие — формула конверсии задокументирована в разделе «Правила валидации и хранения» yookassa-data-mapping.md; правок ERD/DDL не требуется.

### 2. Покрытие `payment_methods.code` всеми типами ЮKassa

- Затронутое поле БД: `payment_methods.code VARCHAR(64) NOT NULL UNIQUE`.
- Что говорит ERD/DDL: справочник `payment_methods` (тип данных и обязательность поля), enum-значения хранятся как строки в `code`.
- Что приходит по маппингу: `payment_method.type` от ЮKassa, через value mapping в [Способы оплаты `payment_method.type`](yookassa-data-mapping.md#способы-оплаты-payment_methodtype). В справочнике сейчас отсутствуют записи для `tinkoff_bank`, `mobile_balance`, `installments`, `apple_pay`, `google_pay`.
- Статус: `новый план`. Действие — отдельный план на расширение справочника `payment_methods` под актуальный список ЮKassa либо явное ограничение скоупа в «Ограничениях текущей модели».

### 3. Семантика `refunds.initiated_at` vs `refunds.completed_at`

- Затронутые поля БД: `refunds.initiated_at TIMESTAMPTZ NOT NULL`, `refunds.completed_at TIMESTAMPTZ`.
- Что говорит ERD/DDL: оба поля присутствуют, `initiated_at` обязательное.
- Что приходит по маппингу: `Refund.created_at` маппится в `initiated_at`; для `completed_at` источник в маппинге явно не зафиксирован при webhook `refund.succeeded`.
- Статус: `обсудить`. Действие — добавить правило в «Правилах валидации и хранения»: `initiated_at` = время отправки `POST /v3/refunds`, `completed_at` = время получения webhook `refund.succeeded`. Подтвердить семантику онлайн-сверкой с ЮKassa.

### 4. Хранение `Payment.created_at` и `Payment.expires_at`

- Затронутые поля БД: `payments.initiated_at TIMESTAMPTZ NOT NULL` — есть; для `Payment.expires_at` отдельного поля в `payments` нет.
- Что говорит ERD/DDL: только `initiated_at`, `completed_at`, `created_at`, `updated_at`.
- Что приходит по маппингу: после правки [пункта 14](#14-поля-юkassa-исключенные-из-маппинга-в-текущем-скоупе-mvp) поля `Payment.created_at` и `Payment.expires_at` исключены из таблиц ответа и webhook платежа в [yookassa-data-mapping.md](yookassa-data-mapping.md). Расхождение с ERD больше не возникает на уровне маппинга.
- Статус: `принять как есть`. Действие — закрыто правкой пункта 14; при возврате этих полей в маппинг (если появится потребитель) пересмотреть необходимость хранения вместе с самим маппингом.

## Расхождения с sequence-диаграммой UC-10.2

[sequence-uc-10-2-pay-online-short-term-rental.md](sequence-uc-10-2-pay-online-short-term-rental.md) описывает только поток оплаты, без возвратов. Поля диаграммы сверены с шестью таблицами маппинга.

### 1. Терминология: `provider_payment_id` ≡ `Payment.id`

- Что говорит диаграмма: на шаге «provider-->>platform: confirmation_url и provider_payment_id» используется имя `provider_payment_id`.
- Что говорит маппинг: единственный идентификатор платежа в ответе ЮKassa — `Payment.id` (string), маппится в `payments.provider_id`.
- Статус: `обсудить`. Действие — синхронизировать терминологию в sequence-диаграмме: `provider_payment_id` ≡ `Payment.id` ≡ `payments.provider_id`. Не править в текущем плане; пометить отдельной задачей.

### 2. Терминология: `provider_transaction_id`

- Что говорит диаграмма: на шаге «provider-->>platform: Успешная оплата и provider_transaction_id» используется имя `provider_transaction_id`.
- Что говорит маппинг: в объекте `Payment` отдельного поля `transaction_id` нет; единственный идентификатор — `Payment.id`. В webhook платежа — `object.id`.
- Статус: `обсудить`. Действие — пересмотреть терминологию в sequence-диаграмме: `provider_transaction_id` фактически совпадает с `Payment.id`. Возможно, исторически имена расходились — требует подтверждения через онлайн-сверку с [#payment_object](https://yookassa.ru/developers/api#payment_object).

### 3. Поток возврата на sequence-диаграмме отсутствует

- Что говорит диаграмма: сценарий возврата не показан.
- Что говорит маппинг: возврат полностью описан в таблицах [Запрос возврата](yookassa-data-mapping.md#запрос-возврата-post-v3refunds-источник-модуль-оплата--приемник-юkassa), [Ответ ЮKassa по возврату](yookassa-data-mapping.md#ответ-юkassa-по-возврату-источник-юkassa--приемник-модуль-оплата), [HTTP-уведомление по возврату](yookassa-data-mapping.md#http-уведомление-по-возврату-источник-юkassa--приемник-модуль-оплата).
- Статус: `новый план`. Действие — отдельный план на построение sequence-диаграммы для возврата; не в скоупе текущего плана.

### 4. Шаги webhook не упомянуты в диаграмме UC-10.2

- Что говорит диаграмма: фокус на синхронных шагах оплаты (создание платежа, ответ с `confirmation_url`, переход клиента, статус оплаты).
- Что говорит маппинг: финальный статус платежа подтверждается через асинхронный webhook (`payment.succeeded` / `payment.canceled`).
- Статус: `обсудить`. Действие — уточнить sequence-диаграмму: добавить асинхронную ветку webhook. Не в скоупе текущего плана.

## Расхождения с use case UC-10.2

[uc-10-2-pay-online-short-term-rental.md](../../artifacts/use-case/uc-10-2-pay-online-short-term-rental.md) описывает основной поток оплаты на русском языке. Возврат в UC-10.2 не описан.

### 1. «ID сессии (invoice_id)» в шаге 3

- Что говорит UC: «параметры: сумма, ID сессии (invoice_id), callbackURL, данные клиента».
- Что говорит маппинг: интеграция передает `invoices.id` через `metadata.invoice_id` и `bookings.id` через `metadata.booking_id` отдельными metadata-полями. UC объединяет эти понятия в «ID сессии».
- Статус: `обсудить`. Действие — уточнить в UC-10.2: «ID счета как `invoice_id` и ID бронирования как `booking_id` (метаданные платежа)». Не в скоупе текущего плана.

### 2. «Идентификатор транзакции» в шагах 6–7

- Что говорит UC: «номер транзакции от шлюза» и «идентификаторТранзакции» — на русском.
- Что говорит маппинг: `Payment.id` → `payments.provider_id` (VARCHAR(512)). UC и ERD используют разные имена для одного и того же.
- Статус: `обсудить`. Действие — синхронизировать терминологию: «идентификаторТранзакции» ≡ `provider_id`. Отдельный план на правки UC-10.2.

### 3. UC-10.2 не описывает webhook как источник финального статуса

- Что говорит UC: шаги 5–6 описывают «синхронный ответ и извлечение статуса».
- Что говорит маппинг: финальный статус платежа фиксируется через webhook (`payment.succeeded`), а не через синхронный ответ на `POST /v3/payments` (тот возвращает `pending` / `waiting_for_capture`).
- Статус: `обсудить`. Действие — уточнить UC-10.2: финальный статус подтверждается асинхронным webhook. Отдельный план.

### 4. UC-10.2 не описывает обработку `waiting_for_capture`

- Что говорит UC: статус `waiting_for_capture` (двухстадийная оплата) не упоминается.
- Что говорит маппинг: статус мапится в `INITIATED` через value mapping ([Статусы платежа](yookassa-data-mapping.md#статусы-платежа)), но альтернативный поток в UC-10.2 не описан.
- Статус: `принять как есть`. Действие — двухстадийная оплата не входит в текущий скоуп паркинга; зафиксировать решение по `Payment.capture` (см. пункт 5 в разделе про ЮKassa).

### 5. UC-10.2 не описывает поток возврата

- Что говорит UC: возврат отсутствует.
- Что говорит маппинг: возврат покрыт в [Запрос возврата](yookassa-data-mapping.md#запрос-возврата-post-v3refunds-источник-модуль-оплата--приемник-юkassa) и [Ответ ЮKassa по возврату](yookassa-data-mapping.md#ответ-юkassa-по-возврату-источник-юkassa--приемник-модуль-оплата).
- Статус: `новый план`. Действие — отдельный UC (например, UC-10.3) на возврат.

## Расхождения с payload и schema UC-10.2

[payload-uc-10-2-payment.md](payload-uc-10-2-payment.md) и [schema-uc-10-2-payment.md](schema-uc-10-2-payment.md) описывают внутренний контракт между платформой и ее клиентом (UI), а не контракт с ЮKassa. Различие границ контрактов — нормальное; ниже фиксируются только точки, требующие явного действия.

### 1. Запрос к ЮKassa нигде формально не зафиксирован

- Что говорит payload/schema: schema описывает только ответ платформы клиенту.
- Что говорит маппинг: запрос к ЮKassa описан как маппинг полей в таблице [Создание платежа](yookassa-data-mapping.md#создание-платежа-post-v3payments-источник-модуль-оплата--приемник-юkassa), но JSON Schema или OpenAPI-спецификация запроса отсутствует.
- Статус: `новый план`. Действие — отдельный план на формализацию контракта запроса к ЮKassa (JSON Schema или OpenAPI). Не в скоупе текущего плана.

### 2. `result.paymentDate` для не финальных статусов

- Что говорит schema: `result.paymentDate` — ISO 8601 UTC, обязательный для статуса `SUCCESS`.
- Что говорит маппинг: маппинг фиксирует `Payment.captured_at` → `payments.completed_at`; для статусов `pending` и `waiting_for_capture` `captured_at` отсутствует, и `paymentDate` не определен.
- Статус: `обсудить`. Действие — уточнить в schema: `paymentDate` выводится из `captured_at` для статуса `COMPLETED`, иначе `null` (или поле отсутствует).

### 3. `result.receiptNumber` — отдельный канал данных

- Что говорит schema: `result.receiptNumber` — номер чека от ОФД.
- Что говорит маппинг: `receiptNumber` не приходит из объекта `Payment` ЮKassa; источник — `receipts.fiscal_number` (отдельный канал фискализации).
- Статус: `принять как есть`. Действие — отметить в комментарии schema, что `receiptNumber` — отдельный канал данных, не из ответа ЮKassa.

### 4. Возврат не покрыт payload/schema UC-10.2

- Что говорит payload/schema: описывают только успех/ошибку оплаты.
- Что говорит маппинг: возврат покрыт в [Запрос возврата](yookassa-data-mapping.md#запрос-возврата-post-v3refunds-источник-модуль-оплата--приемник-юkassa) и [HTTP-уведомление по возврату](yookassa-data-mapping.md#http-уведомление-по-возврату-источник-юkassa--приемник-модуль-оплата).
- Статус: `новый план`. Действие — отдельный payload/schema контракт для возврата при создании UC возврата.

## Открытые вопросы

- Какое точное имя поля в запросе `POST /v3/payments`: `payment_method_data.type` или `payment_method.type`? Канал получения ответа: WebFetch к [#create_payment](https://yookassa.ru/developers/api#create_payment) или переписка с интеграционной командой ЮKassa.
- Является ли поле `capture` обязательным и каково его дефолтное значение? Канал: WebFetch к [#create_payment](https://yookassa.ru/developers/api#create_payment).
- Полный список допустимых значений `Payment.confirmation.type` на 2026-04-30? Канал: WebFetch к [#create_payment](https://yookassa.ru/developers/api#create_payment).
- Какие значения `vat_code` допустимы в `receipt.items` (только 1..6 или также 0)? Канал: WebFetch к [#receipt_object](https://yookassa.ru/developers/api#receipt_object).
- Является ли `receipt` обязательным в `POST /v3/payments` при включенной фискализации? Канал: WebFetch к [#create_payment](https://yookassa.ru/developers/api#create_payment).
- Содержит ли `Payment.amount.value` ровно 2 знака после запятой и какой разделитель используется? Канал: WebFetch к [#payment_object](https://yookassa.ru/developers/api#payment_object).
- Является ли `Payment.id` единственным идентификатором, или у платежа есть отдельный `transaction_id` (на чем основана терминология sequence-диаграммы)? Канал: WebFetch к [#payment_object](https://yookassa.ru/developers/api#payment_object).
- Полный список значений `Payment.payment_method.type` на 2026-04-30 (включая `tinkoff_bank`, `mobile_balance`, `installments`, `apple_pay`, `google_pay`)? Канал: WebFetch к [#payment_method_object](https://yookassa.ru/developers/api#payment_method_object). Упомянут в результатах агентов B, C, F.
- Полная структура `Payment.cancellation_details` (enum `party`, enum `reason`)? Канал: WebFetch к [#payment_object_cancellation_details](https://yookassa.ru/developers/api#payment_object_cancellation_details). Критично: эти поля — вход бизнес-правила маппинга `canceled` → `CANCELLED` или `FAILED`, см. пункт 8 выше.
- Полный список значений `object.status` в webhook платежа? Канал: WebFetch к [#webhook](https://yookassa.ru/developers/api#webhook).
- Поддерживает ли ЮKassa дополнительные поля (`risk_data`, `verification_data`) в webhook платежа? Канал: WebFetch к [#webhook](https://yookassa.ru/developers/api#webhook).
- Минимальные требования к timeout и retry-политике обработки webhook ЮKassa? Канал: <https://yookassa.ru/developers/using-api/webhooks>.
- Требуется ли проверка digital signature (HMAC-SHA256) или достаточна валидация IP-адреса источника webhook? Канал: <https://yookassa.ru/developers/using-api/webhooks>.
- Какие поля присутствуют в объекте `Refund` на 2026-04-30 (`sources`, `receipt_registration`, `status`, `cancellation_details`)? Канал: WebFetch к [#refund_object](https://yookassa.ru/developers/api#refund_object).
- При webhook `refund.succeeded`: какое поле БД заполняется из `object.created_at` — `initiated_at`, `completed_at` или оба? Канал: WebFetch к [#refund_object](https://yookassa.ru/developers/api#refund_object) + правило в «Правилах валидации и хранения» yookassa-data-mapping.md.
- Бывает ли webhook `refund.canceled`? Канал: WebFetch к [#webhook](https://yookassa.ru/developers/api#webhook).
- Полностью ли совпадают поля webhook возврата (`refund.succeeded.object`) с ответом `POST /v3/refunds` (`Refund`)? Канал: WebFetch к [#webhook](https://yookassa.ru/developers/api#webhook) и [#refund_object](https://yookassa.ru/developers/api#refund_object).
- Поля `sources` и `receipt` в `POST /v3/refunds` — обязательные или опциональные? Канал: WebFetch к [#create_refund](https://yookassa.ru/developers/api#create_refund).
- Поддерживает ли интеграция паркинга частичные возвраты или только полные? Канал: решение команды + бизнес-аналитик.
- Максимальное количество попыток retry при ошибке возврата на стороне ЮKassa? Канал: <https://yookassa.ru/developers/using-api/webhooks> + решение команды.
- Как обрабатывать `canceled` статус `Refund`: пересоздание или запись `FAILED` в `refunds.status`? Канал: решение команды.
- Полный список статусов `Refund.status` на 2026-04-30 (есть ли `pending`)? Канал: WebFetch к [#refund_object_status](https://yookassa.ru/developers/api#refund_object_status). Упомянут у агентов D, E, F.
- Стратегия обработки новых типов `payment_method.type` при их появлении: автоматическое расширение справочника или явное ограничение? Канал: решение команды + отдельный план.

## Сводная таблица

| Расхождение                                                                                                 | Затронутый артефакт                                                                                    | Предлагаемое действие                                                                                                            | Приоритет |
| ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- | --------- |
| Полный список `payment_method.type`                                                                         | yookassa-data-mapping.md, ERD `payment_methods.code`                                                   | Новый план: расширить справочник или зафиксировать ограничение                                                                   | средний   |
| Полный список `Payment.status` и `Refund.status`                                                            | yookassa-data-mapping.md, ERD `payments.status`, `refunds.status`                                      | Обсудить: онлайн-сверка перед реализацией, при необходимости расширить enum                                                      | средний   |
| Имя поля `payment_method.type` в `POST /v3/payments`                                                        | yookassa-data-mapping.md                                                                               | Обсудить: онлайн-сверка с [#create_payment](https://yookassa.ru/developers/api#create_payment), правка таблицы при необходимости | высокий   |
| Допустимые значения `vat_code`                                                                              | yookassa-data-mapping.md                                                                               | Новый план: подобрать корректное значение под систему налогообложения                                                            | высокий   |
| Обязательность и дефолт `Payment.capture`                                                                   | yookassa-data-mapping.md                                                                               | Обсудить: решение по двухстадийной оплате                                                                                        | средний   |
| Полный список `Payment.confirmation.type`                                                                   | yookassa-data-mapping.md                                                                               | Принять как есть: фиксируем `redirect`                                                                                           | низкий    |
| Формат `amount.value` (знаки и разделитель)                                                                 | yookassa-data-mapping.md                                                                               | Принять как есть: фиксируем «строка с двумя знаками после запятой, разделитель `.`»                                              | низкий    |
| Структура `Payment.cancellation_details`                                                                    | yookassa-data-mapping.md                                                                               | Обсудить: решение по сохранению в журнале интеграции                                                                             | средний   |
| `risk_data`, `verification_data` в webhook платежа                                                          | yookassa-data-mapping.md                                                                               | Принять как есть: игнорируем; полный payload хранится в журнале                                                                  | низкий    |
| `sources`, `receipt`, `deal` в `POST /v3/refunds`                                                           | yookassa-data-mapping.md                                                                               | Обсудить: решение по частичным возвратам и фискализации                                                                          | средний   |
| `Refund.receipt_registration`                                                                               | yookassa-data-mapping.md                                                                               | Принять как есть: фискализация возвратов вне скоупа                                                                              | низкий    |
| События webhook возврата помимо `refund.succeeded`                                                          | yookassa-data-mapping.md                                                                               | Обсудить: уточнить полный список и обработку `refund.canceled`                                                                   | средний   |
| Семантика `Refund.created_at` (initiated vs completed)                                                      | yookassa-data-mapping.md, ERD `refunds.initiated_at`, `refunds.completed_at`                           | Обсудить: зафиксировать политику в «Правилах валидации»                                                                          | средний   |
| Идемпотентность `POST /v3/payments`                                                                         | docs/specs/integration/integration-requirements.md (INT-004), yookassa-data-mapping.md                 | Принять как есть: документировать `Idempotence-Key` в правилах валидации                                                         | низкий    |
| Конверсия `amount_minor` ↔ `amount.value`                                                                   | ERD `payments.amount_minor`, `refunds.amount_minor`, `receipts.amount_minor`, yookassa-data-mapping.md | Принять как есть: формула в «Правилах валидации»                                                                                 | низкий    |
| Покрытие `payment_methods.code` всеми типами ЮKassa                                                         | ERD `payment_methods.code`                                                                             | Новый план: расширить справочник или зафиксировать ограничение                                                                   | средний   |
| Поля ЮKassa, исключенные из маппинга в скоупе MVP (`paid`, `created_at`, `expires_at`, `payment_method.id`) | yookassa-data-mapping.md                                                                               | Принять как есть: исключены за отсутствием потребителя; зафиксированы в «Ограничениях»                                           | низкий    |
| Терминология `provider_payment_id` ≡ `Payment.id`                                                           | sequence-uc-10-2-pay-online-short-term-rental.md                                                       | Обсудить: синхронизировать в отдельной задаче                                                                                    | низкий    |
| Терминология `provider_transaction_id`                                                                      | sequence-uc-10-2-pay-online-short-term-rental.md                                                       | Обсудить: пересмотреть в отдельной задаче                                                                                        | низкий    |
| Поток возврата отсутствует на sequence-диаграмме                                                            | sequence-uc-10-2-pay-online-short-term-rental.md                                                       | Новый план: построить sequence-диаграмму возврата                                                                                | средний   |
| Webhook не упомянут в sequence-диаграмме UC-10.2                                                            | sequence-uc-10-2-pay-online-short-term-rental.md                                                       | Обсудить: добавить асинхронную ветку                                                                                             | средний   |
| «ID сессии (`invoice_id`)» в UC-10.2                                                                        | uc-10-2-pay-online-short-term-rental.md                                                                | Обсудить: уточнить терминологию (`invoice_id` vs `booking_id` как metadata)                                                      | низкий    |
| «Идентификатор транзакции» в UC-10.2                                                                        | uc-10-2-pay-online-short-term-rental.md                                                                | Обсудить: синхронизировать с `provider_id`                                                                                       | низкий    |
| UC-10.2 не описывает webhook как источник финального статуса                                                | uc-10-2-pay-online-short-term-rental.md                                                                | Обсудить: уточнить UC                                                                                                            | средний   |
| UC-10.2 не описывает обработку `waiting_for_capture`                                                        | uc-10-2-pay-online-short-term-rental.md                                                                | Принять как есть: двухстадийная оплата вне скоупа                                                                                | низкий    |
| UC-10.2 не описывает поток возврата                                                                         | uc-10-2-pay-online-short-term-rental.md                                                                | Новый план: отдельный UC возврата (UC-10.3)                                                                                      | средний   |
| Запрос к ЮKassa не зафиксирован JSON Schema / OpenAPI                                                       | yookassa-data-mapping.md                                                                               | Новый план: формализовать контракт запроса                                                                                       | средний   |
| `result.paymentDate` для не финальных статусов                                                              | schema-uc-10-2-payment.md                                                                              | Обсудить: уточнить контракт (null vs отсутствие поля)                                                                            | средний   |
| `result.receiptNumber` — отдельный канал данных                                                             | schema-uc-10-2-payment.md                                                                              | Принять как есть: пометить в schema                                                                                              | низкий    |
| Возврат не покрыт payload/schema UC-10.2                                                                    | payload-uc-10-2-payment.md, schema-uc-10-2-payment.md                                                  | Новый план: контракт для возврата                                                                                                | средний   |

## Связанные документы

- [yookassa-data-mapping.md](yookassa-data-mapping.md) — собранный маппинг шести процессов и значений; основной артефакт сверки.
- [docs/specs/integration/integration-requirements.md](../../specs/integration/integration-requirements.md) — требования INT-004, INT-006 (источник истины по требованиям).
- [docs/architecture/database/erd/erd-normalized-er-model.md](../database/erd/erd-normalized-er-model.md) — логическая ERD.
- [sql/database/chartdb-postgresql-erd-normalized-public.sql](../../../sql/database/chartdb-postgresql-erd-normalized-public.sql) — DDL public-схемы.
- [sequence-uc-10-2-pay-online-short-term-rental.md](sequence-uc-10-2-pay-online-short-term-rental.md) — sequence-диаграмма UC-10.2.
- [uc-10-2-pay-online-short-term-rental.md](../../artifacts/use-case/uc-10-2-pay-online-short-term-rental.md) — текст use case.
- [payload-uc-10-2-payment.md](payload-uc-10-2-payment.md) — payload внутреннего контракта UC-10.2.
- [schema-uc-10-2-payment.md](schema-uc-10-2-payment.md) — JSON Schema внутреннего контракта UC-10.2.
- [plans/2026-04-30-yookassa-mapping-table-format-alignment.md](../../../plans/2026-04-30-yookassa-mapping-table-format-alignment.md) — план, в рамках которого построен отчет.
- <https://yookassa.ru/developers/api> — официальная документация ЮKassa REST API (источник истины по контракту).
- <https://yookassa.ru/developers/using-api/webhooks> — гид по webhook ЮKassa.

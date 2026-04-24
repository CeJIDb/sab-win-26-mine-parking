# JSON-схема ответа — UC-10.2-1 Обработка оплаты парковочной сессии

Документ фиксирует формальную JSON Schema ответа платежного сервиса в сценарии оплаты парковочной сессии (UC-10.2-1).

Схема соответствует спецификации JSON Schema draft 2019-09 и описывает как успешный ответ, так и ответ с ошибкой.

## Оглавление

- [Назначение](#назначение)
- [Контекст применения](#контекст-применения)
- [JSON Schema](#json-schema)
- [Инварианты и ограничения](#инварианты-и-ограничения)
- [Связанные документы](#связанные-документы)

## Назначение

Документ нужен, чтобы:

- задать формальный контракт ответа для процесса UC-10.2-1;
- служить опорой для автоматической валидации ответов в тестах и в рантайме;
- фиксировать допустимые значения статусов и обязательные поля.

## Контекст применения

Схема описывает ответ по итогам операции оплаты, возвращаемый после завершения взаимодействия с внешним платежным провайдером. Каноничные примеры полезной нагрузки приведены в артефакте [JSON-пример ответа — UC-10.2-1](payload-uc-10-2-payment.md).

## JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2019-09/schema",
  "$id": "http://example.com/payment-response.json",
  "type": "object",
  "default": {},
  "title": "Payment Response Schema",
  "required": ["result", "error"],
  "properties": {
    "result": {
      "type": ["object", "null"],
      "default": null,
      "title": "The result Schema",
      "required": [
        "paymentId",
        "amount",
        "currency",
        "status",
        "transactionId",
        "receiptNumber",
        "paymentDate",
        "receiptDate"
      ],
      "properties": {
        "paymentId": {
          "type": "integer",
          "title": "The paymentId Schema",
          "examples": [12345]
        },
        "amount": {
          "type": "number",
          "title": "The amount Schema",
          "examples": [150.0]
        },
        "currency": {
          "type": "string",
          "title": "The currency Schema",
          "examples": ["RUB"]
        },
        "status": {
          "type": "string",
          "title": "The status Schema",
          "enum": ["SUCCESS", "FAILED", "CANCELED"],
          "examples": ["SUCCESS"]
        },
        "transactionId": {
          "type": "string",
          "title": "The transactionId Schema",
          "examples": ["txn_abc123def456"]
        },
        "receiptNumber": {
          "type": "string",
          "title": "The receiptNumber Schema",
          "examples": ["CH-789012"]
        },
        "paymentDate": {
          "type": "string",
          "format": "date-time",
          "title": "The paymentDate Schema",
          "examples": ["2024-06-15T14:30:00Z"]
        },
        "receiptDate": {
          "type": "string",
          "format": "date-time",
          "title": "The receiptDate Schema",
          "examples": ["2024-06-15T14:30:05Z"]
        }
      },
      "examples": [
        {
          "paymentId": 12345,
          "amount": 150.0,
          "currency": "RUB",
          "status": "SUCCESS",
          "transactionId": "txn_abc123def456",
          "receiptNumber": "CH-789012",
          "paymentDate": "2024-06-15T14:30:00Z",
          "receiptDate": "2024-06-15T14:30:05Z"
        }
      ]
    },
    "error": {
      "type": ["object", "null"],
      "default": null,
      "title": "The error Schema",
      "required": ["error_id", "text_error"],
      "properties": {
        "error_id": {
          "type": "integer",
          "title": "The error_id Schema",
          "examples": [400]
        },
        "text_error": {
          "type": "string",
          "title": "The text_error Schema",
          "examples": ["Недостаточно средств на карте для оплаты."]
        }
      },
      "examples": [
        {
          "error_id": 400,
          "text_error": "Недостаточно средств на карте для оплаты."
        }
      ]
    }
  },
  "examples": [
    {
      "result": {
        "paymentId": 12345,
        "amount": 150.0,
        "currency": "RUB",
        "status": "SUCCESS",
        "transactionId": "txn_abc123def456",
        "receiptNumber": "CH-789012",
        "paymentDate": "2024-06-15T14:30:00Z",
        "receiptDate": "2024-06-15T14:30:05Z"
      },
      "error": null
    },
    {
      "result": null,
      "error": {
        "error_id": 400,
        "text_error": "Недостаточно средств на карте для оплаты."
      }
    }
  ]
}
```

## Инварианты и ограничения

- Поля `result` и `error` обязательны на верхнем уровне: одно из них — объект, другое — `null`. Комбинация «оба не null» в штатных сценариях не допускается.
- Допустимые значения `result.status` ограничены перечислением `SUCCESS`, `FAILED`, `CANCELED`.
- Поля `result.paymentDate` и `result.receiptDate` — строки в формате ISO 8601 в UTC.
- Поля `error.error_id` и `error.text_error` — обязательны при наличии объекта `error`.

## Связанные документы

- [JSON-пример ответа — UC-10.2-1](payload-uc-10-2-payment.md) — каноничные примеры полезной нагрузки для успеха и ошибки.
- [UML Sequence — UC-10.2 Онлайн-оплата краткосрочной аренды](sequence-uc-10-2-pay-online-short-term-rental.md) — последовательность вызовов, в рамках которой возвращается этот ответ.
- [Маппинг обмена данными с ЮKassa](yookassa-data-mapping.md) — соответствие полей ответа внутренней модели `payment.*`.
- [Регламент взаимодействия ИС](is-interaction-regulation.md) — направления обмена для онлайн-оплаты.
- [Индекс интеграционной архитектуры](readme.md) — общий каталог раздела.

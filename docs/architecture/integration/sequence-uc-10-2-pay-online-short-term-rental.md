# Sequence Diagram — UC-10.2 Оплатить онлайн (краткосрочная аренда)

Этот артефакт визуализирует интеграционную последовательность для сценария [UC-10.2 Оплатить онлайн (краткосрочная аренда)](../../artifacts/use-case/uc-10-2-pay-online-short-term-rental.md) на основе [требований к интеграции](../../specs/integration/integration-requirements.md) и [маппинга обмена данными с ЮKassa](yookassa-data-mapping.md).

В диаграмму включены межсистемные взаимодействия и ключевые статусы сущностей `payment`, `session` и `receipt`. Ранние внутренние сбои `1a` и `2a` намеренно оставлены только в тексте use case, чтобы sequence diagram оставалась читаемой и фокусировалась на внешних интеграциях.

## Диаграмма Mermaid

```mermaid
sequenceDiagram
    accTitle: UC-10.2 Payment Sequence
    accDescr: Sequence diagram showing online payment for a short-term parking rental from client initiation through YooKassa confirmation, OFD fiscalization, and notification delivery, including key failure branches.

    participant client as 👤 Клиент ФЛ
    participant platform as 🖥️ SAB Platform / Платежный модуль
    participant provider as 💰 Платежный провайдер (ЮKassa)
    participant ofd as 🧾 ОФД
    participant notify as 📤 Сервис уведомлений

    client->>platform: Инициировать оплату сессии
    platform->>platform: ⚙️ Создать payment = Инициализирован
    platform->>platform: ⚙️ Обновить session = Ожидание оплаты
    platform->>provider: 📤 Зарегистрировать операцию оплаты

    rect rgb(255, 235, 235)
        break ❌ Провайдер недоступен или не вернул URL оплаты
            Note over platform,provider: Таймаут создания операции или отсутствует средство перехода к оплате
            platform->>platform: ⚙️ Оставить payment = Инициализирован или Ошибка
            platform->>platform: ⚙️ Оставить session = Ожидание оплаты или вернуть допустимый статус
            opt ⚠️ Если у провайдера создана незавершенная операция
                platform->>provider: 🔄 Запросить отмену незавершенной операции
                provider-->>platform: 📥 Подтверждение отмены или принятия запроса
            end
            platform-->>client: ⚠️ Показать сообщение о временной недоступности оплаты
        end
    end

    provider-->>platform: 📥 confirmation_url и provider_payment_id
    platform-->>client: Перенаправить на страницу оплаты
    client->>provider: Подтвердить оплату на стороне ЮKassa

    rect rgb(255, 235, 235)
        break ❌ Оплата отклонена или отменена клиентом
            provider-->>platform: 📥 Статус оплаты = canceled или failed
            platform->>platform: ⚙️ Обновить payment = Отклонен или Ошибка
            platform->>platform: ⚙️ Оставить session = не Оплачено
            platform-->>client: ❌ Показать, что оплата не завершена
        end
    end

    rect rgb(255, 235, 235)
        break ⏰ Финальный статус оплаты не подтвержден в срок
            platform->>platform: ⚙️ Зафиксировать таймаут ожидания результата
            platform->>provider: 🔍 Запросить актуальный статус операции
            provider-->>platform: 📥 Финальный статус не получен
            platform->>platform: ⚙️ Обновить payment = Ошибка или Отменен по политике
            platform->>platform: ⚙️ Вернуть session = допустимый не Оплачено статус
            platform-->>client: ⚠️ Сообщить о неподтвержденной оплате и предложить повтор позже
        end
    end

    rect rgb(255, 235, 235)
        break ⚠️ Ответ провайдера неоднозначен
            provider-->>platform: 📥 Неполный или неоднозначный статус
            platform->>provider: 🔍 Запросить актуальный статус операции
            provider-->>platform: 📥 Статус не прояснен или требуется ручная проверка
            platform->>platform: ⚙️ Не переводить payment в Успешен автоматически
            platform->>platform: ⚙️ Оставить payment в промежуточном статусе по политике
            platform->>platform: ⚙️ Вернуть session = допустимый не Оплачено статус
            platform-->>client: ⚠️ Сообщить об уточнении статуса оплаты
        end
    end

    provider-->>platform: 📥 Успешная оплата и provider_transaction_id
    platform->>platform: ⚙️ Обновить payment = Успешен
    platform->>platform: ⚙️ Обновить session = Оплачено
    platform->>platform: ⚙️ Создать receipt = Ожидание
    platform->>ofd: 📤 Запросить фискализацию чека

    rect rgb(255, 235, 235)
        break ❌ ОФД не ответил, вернул отказ или данные не согласованы
            ofd-->>platform: 📥 Ошибка, отказ или неоднозначные данные чека
            platform->>platform: ⚙️ Оставить receipt = Ожидание или Ошибка
            platform->>platform: ⚙️ Поставить повтор или сверку с ОФД по регламенту
            platform-->>client: ⚠️ Показать, что оплата принята, чек формируется
        end
    end

    ofd-->>platform: 📥 Номер чека и статус Зарегистрирован
    platform->>platform: ⚙️ Обновить receipt = Зарегистрирован
    platform->>notify: 📤 Отправить уведомление об успешной оплате

    rect rgb(255, 235, 235)
        break ⚠️ Доставка уведомления не удалась
            notify-->>platform: 📥 Ошибка доставки
            loop 🔄 Повтор по регламенту с тем же ключом идемпотентности
                platform->>notify: 📤 Повторить отправку уведомления
                notify-->>platform: 📥 Статус доставки
            end
            platform-->>client: ✅ Оплата зафиксирована и чек доступен в ЛК
        end
    end

    notify-->>platform: 📥 Уведомление принято в обработку
    platform-->>client: ✅ Оплата зафиксирована, чек доступен в ЛК, уведомление отправлено в доставку
```

## Связанные документы

- [UC-10.2 Оплатить онлайн (краткосрочная аренда)](../../artifacts/use-case/uc-10-2-pay-online-short-term-rental.md) — бизнес-сценарий, который эта диаграмма детализирует на уровне интеграционных взаимодействий.
- [Требования к интеграции](../../specs/integration/integration-requirements.md) — фиксируют требования класса `INT-*`, покрываемые последовательностью онлайн-оплаты.
- [Маппинг обмена данными с ЮKassa](yookassa-data-mapping.md) — задает provider-specific поля и статусы для сценария онлайн-оплаты.

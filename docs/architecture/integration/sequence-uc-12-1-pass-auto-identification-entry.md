# Sequence Diagram — UC-12.1 Пройти автоматическую идентификацию на въезде

Этот артефакт визуализирует интеграционную последовательность для сценария [UC-12.1 Пройти автоматическую идентификацию на въезде](../../artifacts/use-case/uc-12-1-pass-auto-identification-entry.md).

Диаграмма показывает цепочку проверок от фиксации ГРЗ до решения `ALLOW/DENY`: распознавание номера, поиск ТС и клиента, проверка статуса и задолженностей, поиск бронирования (с автосозданием при отсутствии), транзакционная запись решения и асинхронное уведомление через дисплей. Каждый reject-случай оформлен как `break`-блок.

## Диаграмма Mermaid

```mermaid
sequenceDiagram
    accTitle: UC-12.1 Entry Auto-Identification Sequence
    accDescr: Sequence diagram for automatic vehicle identification at parking entry using LPR adapter, access control checks against profile, billing and booking services, and session initiation.

    participant client as 👤 Клиент
    participant lpr as 📷 LPR-адаптер (СКУД)
    participant acs as 🔐 ACS (Служба контроля доступа)
    participant db as 🗄️ БД
    participant cps as 👤 CPS (Сервис профилей)
    participant bs as 💳 Сервис биллинга
    participant bks as 📋 Сервис бронирования
    participant ss as 🚗 Сервис сессий
    participant da as 🖥️ Адаптер дисплея (Outbox)

    client->>lpr: Фиксация ГРЗ на въезде
    lpr->>acs: POST /v1/verify-access (access_point_id, license_plate, timestamp)

    rect rgb(255, 235, 235)
        break 1а. ГРЗ не распознан / отсутствует
            acs->>db: INSERT access_logs (decision=MANUAL, reason=LPR_UNREADABLE)
            acs-->>lpr: HTTP 200 (decision=DENY)
            Note over acs: → UC-12.14 Ручная идентификация
        end
    end

    acs->>acs: Валидация access_point_id (operational_status, direction)
    acs->>db: SELECT client_id, vehicle_id FROM vehicles WHERE license_plate

    rect rgb(255, 235, 235)
        break 3а. ТС не найдено
            acs->>db: INSERT access_logs (decision=DENY, reason=VEHICLE_NOT_FOUND)
            acs->>db: INSERT outbox_events (payload: «ТС не найдено»)
            acs-->>lpr: HTTP 200 (decision=DENY)
        end
    end

    acs->>cps: GET /clients/{id}/status
    cps-->>acs: status (ACTIVE / BLOCKED)

    rect rgb(255, 235, 235)
        break 4а. Клиент заблокирован
            acs->>db: INSERT access_logs (decision=DENY, reason=CLIENT_BLOCKED)
            acs->>db: INSERT outbox_events (payload: «Въезд запрещен»)
            acs-->>lpr: HTTP 200 (decision=DENY)
        end
    end

    acs->>bs: GET /debts?client_id={id}&status=ACTIVE
    bs-->>acs: List Debt

    rect rgb(255, 235, 235)
        break 5а. Есть активная задолженность
            acs->>db: INSERT access_logs (decision=DENY, reason=CLIENT_HAS_DEBT)
            acs->>db: INSERT outbox_events (payload: «Погасите долг»)
            acs-->>lpr: HTTP 200 (decision=DENY)
        end
    end

    acs->>bks: GET /bookings?vehicle_id={id}&status=ACTIVE
    bks-->>acs: booking_status (FOUND / NOT_FOUND)

    opt 6а. Бронирование не найдено → автосоздание (→ UC-12.2)
        acs->>bks: POST /auto-booking
        bks-->>acs: Success / Fail
    end

    rect rgb(255, 235, 235)
        break 6а.3 Ошибка квоты (нет свободных мест)
            acs->>db: INSERT access_logs (decision=DENY, reason=NO_QUOTA)
            acs->>db: INSERT outbox_events (payload: «Нет мест»)
            acs-->>lpr: HTTP 200 (decision=DENY)
        end
    end

    Note over acs,db: Транзакционный блок
    acs->>db: INSERT access_logs (decision=ALLOW)
    acs->>db: INSERT outbox_events (aggregate=TABLO, type=ACCESS_GRANTED)
    acs-->>lpr: HTTP 200 (decision=ALLOW)
    acs->>ss: POST /sessions (→ UC-12.4 Создать ПС)
    ss-->>acs: Ack

    db-->>da: CDC / Outbox Polling (асинхронно)
    da-->>client: Сообщение на дисплее (ГРЗ, Доступ разрешен, тариф, сектор/ПМ)
```

## Связанные документы

- [UC-12.1 Пройти автоматическую идентификацию на въезде](../../artifacts/use-case/uc-12-1-pass-auto-identification-entry.md) — бизнес-сценарий, который эта диаграмма детализирует на уровне интеграционных взаимодействий.
- [UC-12.2 Создать бронирование автоматически на въезде](../../artifacts/use-case/uc-12-2-create-booking-auto-entry.md) — вызывается из диаграммы при отсутствии активного бронирования.
- [UC-12.4 Создать ПС](../../artifacts/use-case/uc-12-4-create-parking-session.md) — финальный переход после успешного решения ALLOW.
- [Регламент взаимодействия ИС](is-interaction-regulation.md) — описывает блок «Контроль доступа (СКУД)» на уровне направлений обмена.

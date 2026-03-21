# DDD Bounded Contexts: псевдокод — учебная версия

## Оглавление

- [Зачем нужен этот файл](#зачем-нужен-этот-файл)
- [Доменная логика](#доменная-логика)
- [Инфраструктурный адаптер](#инфраструктурный-адаптер)
- [Оркестрация: въезд](#оркестрация-въезд)
- [Оркестрация: выезд](#оркестрация-выезд)
- [Где здесь EDA](#где-здесь-eda)
- [Где лучше не использовать EDA](#где-лучше-не-использовать-eda)
- [Что важно запомнить](#что-важно-запомнить)

## Зачем нужен этот файл

В [DDD Bounded Contexts: учебная версия](ddd-bounded-contexts-study.md) объясняется, **что** такое bounded contexts.

Здесь показано, **как** это выглядит на практике:

- где находится доменная логика;
- где работает `Application Service`;
- где уместны события;
- где лучше оставить синхронный вызов.

Псевдокод специально упрощён. Он показывает структуру, а не конкретный язык программирования.

Имена контекстов (`Booking`, `Session`, `Access`, `Tariff`, `Payment`) соответствуют таблице из [DDD Bounded Contexts: учебная версия](ddd-bounded-contexts-study.md) и используются как код, а не как русскоязычные термины.

## Доменная логика

### `Tariff.calculate()`

`Tariff` получает готовые входные данные и возвращает сумму.

Он не ищет клиента в базе и не вызывает `Payment`.

```text
Tariff.calculate(input):
    base = input.rate * input.units

    if input.discountPercent exists:
        total = base * (1 - input.discountPercent / 100)
    else:
        total = base

    if input.cap exists and total > input.cap:
        total = input.cap

    return total
```

### `Access.evaluate()`

`Access` принимает уже подготовленные статусы и выдаёт решение.

```text
Access.evaluate(input):
    if input.vehicleFound = false:
        return deny(VEHICLE_NOT_FOUND)

    if input.blacklisted = true:
        return deny(BLACKLISTED)

    if input.hasDebt = true:
        return deny(DEBT)

    if input.hasActiveBooking = true:
        return allow(BOOKING_FOUND)

    if input.autoBookingAllowed = true:
        return allow(AUTO_BOOKING_REQUIRED)

    return deny(NO_ACCESS_RULE_FOUND)
```

### `Session.complete()`

`Session` меняет только своё состояние.

```text
Session.complete(session, exitTime):
    session.exitTime = exitTime
    session.duration = exitTime - session.entryTime
    session.status = COMPLETED

    return SessionCompleted(session.id, session.duration)
```

Важно: `Session` не вызывает `Payment` и не отправляет уведомления сама.

## Инфраструктурный адаптер

Адаптер только переводит внешний сигнал в вызов системы.

```text
LprSkudAdapter.listen():
    packet = udp.receive()
    plate = packet.plate
    gateId = packet.gateId

    // Упрощение: случай plate = null (нераспознанный номер) здесь не показан.
    // В реальной системе адаптер должен зафиксировать инцидент и уведомить охранника,
    // не передавая пустой номер в ApplicationService.

    ApplicationService.handleEntry(plate, gateId)
```

Адаптер не решает, можно ли открыть шлагбаум. Это делает доменная логика.

## Оркестрация: въезд

Вот где работает `Application Service`.

Он:

1. собирает данные из нескольких контекстов;
2. вызывает доменную логику;
3. координирует транзакцию.

```text
ApplicationService.handleEntry(plate, gateId):
    vehicle = Client.findVehicleByPlate(plate)
    bookingStatus = Booking.getStatus(vehicle, gateId)
    debtStatus = Payment.getDebtStatus(vehicle.clientId)
    gateRules = Facility.getGateRules(gateId)

    decision = Access.evaluate({
        vehicleFound: vehicle exists,
        blacklisted: vehicle.blacklisted,
        hasDebt: debtStatus.hasDebt,
        hasActiveBooking: bookingStatus.active,
        autoBookingAllowed: gateRules.autoBookingAllowed
    })

    if decision is deny:
        SkudAdapter.keepClosed(gateId)
        // Упрощение: в реальном сценарии здесь также вызываются
        // DisplayAdapter.showDenyReason(gateId, decision.reason) и AccessLog.record(...)
        return

    if decision.reason = AUTO_BOOKING_REQUIRED:
        transaction:
            booking = Booking.createAuto(vehicle.id, gateId)
            session = Session.open(booking.id)
    else:
        transaction:
            session = Session.open(bookingStatus.bookingId)

    SkudAdapter.openGate(gateId)
```

Главная мысль:

- `Access` не создаёт бронь;
- `Booking` не открывает шлагбаум;
- всё склеивает `Application Service`.

## Оркестрация: выезд

Для выезда важен быстрый и предсказуемый результат, поэтому основной путь остаётся синхронным.

```text
ApplicationService.handleExit(plate, gateId):
    session = Session.findActiveByPlate(plate)
    booking = Booking.get(session.bookingId)
    client = Client.getByVehicle(booking.vehicleId)

    amount = Tariff.calculate({
        rate: booking.rate,
        units: session.currentUnits(),
        discountPercent: client.discountPercent,
        cap: booking.cap
    })

    paymentResult = Payment.requestCharge(booking.id, amount)

    if paymentResult.success = false:
        SkudAdapter.keepClosed(gateId)
        return

    transaction:
        Payment.recordSuccess(paymentResult)
        Booking.complete(booking.id)
        event = Session.complete(session, now())
        Outbox.save(event)
        Outbox.save(PaymentSucceeded(booking.id, amount))

    SkudAdapter.openGate(gateId)
```

Главная мысль:

- оплата на выезде — синхронная часть сценария;
- события появляются **после** успешной фиксации результата;
- события не заменяют критический путь КПП.

## Где здесь EDA

EDA удобно использовать после завершения основной операции.

Например:

```text
on SessionCompleted:
    Report.updateParkingStats()

on PaymentSucceeded:
    Notification.sendReceipt()
    Report.updateRevenue()
```

Это хороший пример событийной архитектуры:

- `Session` не знает про `Report`;
- `Payment` не знает про `Notification`;
- подписчики сами реагируют на событие.

## Где лучше не использовать EDA

На критическом пути лучше не делать так:

```text
EntryDetected -> EventBus -> Access -> EventBus -> Booking -> EventBus -> Session -> EventBus -> GateOpen
```

Для шлагбаума это слишком сложно и рискованно.

Поэтому для въезда и выезда лучше:

- синхронная оркестрация через `Application Service`;
- события только для фоновых и вторичных действий.

## Что важно запомнить

- Доменная логика принимает решения внутри своего контекста.
- `Application Service` связывает контексты между собой.
- Адаптеры общаются с внешним миром.
- EDA хорошо подходит для уведомлений и отчётов.
- EDA не должна ломать критический путь КПП.

Если коротко:

- **DDD** разделяет систему по смыслу;
- **EDA** помогает этим частям общаться менее жёстко;
- **Application Service** удерживает основной сценарий под контролем.

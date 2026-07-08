## ADDED Requirements

### Requirement: Клиент дублирует данные физики на сервер
`NBodySystem.tsx` SHALL отправлять структурированную запись на `POST /api/log` при каждом цикле логирования (каждые 60 physics-шагов). Отправка MUST быть fire-and-forget — она НЕ ДОЛЖНА блокировать physics step.

#### Scenario: Данные отправляются параллельно с console.log
- **WHEN** `frameCount % 60 === 0` и симуляция запущена
- **THEN** браузер отправляет `fetch('/api/log', { method: 'POST', body: JSON.stringify({step, t: Date.now(), bodies}) })` без `await`

#### Scenario: Сервер недоступен — симуляция продолжается
- **WHEN** сервер на порту 4000 не запущен и `fetch` завершается ошибкой
- **THEN** ошибка перехватывается через `.catch(console.warn)`, симуляция не прерывается

### Requirement: Структура payload соответствует серверной схеме
Поле `bodies` в payload MUST содержать данные всех тел из `bodyRefs.current`, для которых доступны `translation()` и `linvel()`. Числа MUST быть округлены до 2 знаков.

#### Scenario: Payload содержит все активные тела
- **WHEN** в симуляции 3 тела и все имеют rigidBody ref
- **THEN** `bodies` в payload содержит 3 элемента с полями `id, mass, px, py, pz, vx, vy, vz`

### Requirement: Сброс лога при новом запуске симуляции
При переходе `isRunning` из `false` в `true` (когда `hasLoggedSetup.current === false`) NBodySystem SHALL отправлять `POST /api/log/reset` перед первой записью данных. Это MUST быть fire-and-forget.

#### Scenario: Новый запуск очищает предыдущий лог
- **WHEN** пользователь нажимает "New Random Scenario" и затем "Start"
- **THEN** браузер отправляет `POST /api/log/reset`, после чего `logs/simulation.jsonl` содержит только записи новой симуляции

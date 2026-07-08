## ADDED Requirements

### Requirement: Vite-плагин предоставляет API для записи логов
Файл `vite-plugin-sim-logger.ts` SHALL экспортировать Vite-плагин с `apply: 'serve'` и хуком `configureServer`, регистрирующим два middleware на том же порту, что и Vite dev сервер.

#### Scenario: Плагин активен только в dev режиме
- **WHEN** запускается `vite build`
- **THEN** плагин не добавляет никаких middleware (apply: 'serve')

### Requirement: POST /api/log сохраняет запись в JSONL
Middleware `POST /api/log` SHALL читать JSON-тело запроса, валидировать наличие поля `step`, и дописывать одну строку в `logs/simulation.jsonl`.

#### Scenario: Успешная запись
- **WHEN** браузер отправляет `POST /api/log` с `{ step: 60, t: 1234567890, bodies: [...] }`
- **THEN** в `logs/simulation.jsonl` появляется новая строка с валидным JSON и сервер отвечает `200 { ok: true }`

#### Scenario: Невалидный payload
- **WHEN** тело запроса не содержит поле `step`
- **THEN** сервер отвечает `400 { error: "invalid payload" }` и файл не изменяется

### Requirement: POST /api/log/reset очищает лог-файл
Middleware `POST /api/log/reset` SHALL перезаписывать `logs/simulation.jsonl` пустым содержимым (создавая файл если не существует).

#### Scenario: Сброс файла
- **WHEN** браузер отправляет `POST /api/log/reset`
- **THEN** `logs/simulation.jsonl` становится пустым и сервер отвечает `200 { ok: true }`

### Requirement: Папка logs/ создаётся автоматически
При инициализации плагина SHALL проверяться существование папки `logs/` и создаваться через `fs.mkdirSync` если отсутствует.

#### Scenario: Первый запуск без папки logs/
- **WHEN** папка `logs/` не существует и Vite запускается
- **THEN** папка создаётся автоматически, `/api/log` работает без ошибок

### Requirement: Формат JSONL
Каждая строка MUST быть валидным JSON со схемой: `{ step: number, t: number, bodies: [{id, mass, px, py, pz, vx, vy, vz}] }`. Строки разделяются `\n`.

#### Scenario: Файл читаем построчно
- **WHEN** файл содержит несколько записей
- **THEN** каждая строка парсится через `JSON.parse()` без ошибок

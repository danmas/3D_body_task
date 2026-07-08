## 1. Vite плагин

- [x] 1.1 Создать `vite-plugin-sim-logger.ts`: импорты `fs`, `path`, `Plugin` из `vite`; создание папки `logs/` при инициализации; экспорт функции возвращающей плагин с `name`, `apply: 'serve'`, `configureServer`
- [x] 1.2 Добавить в плагин middleware `POST /api/log/reset` — перезаписывает `logs/simulation.jsonl` пустой строкой, отвечает `200 { ok: true }`
- [x] 1.3 Добавить в плагин middleware `POST /api/log` — читает тело через `req` data/end события, парсит JSON, валидирует `step`, дописывает строку JSONL через `fs.appendFileSync`, отвечает `200 { ok: true }` или `400`

## 2. Vite конфиг

- [x] 2.1 В `vite.config.ts` импортировать плагин из `./vite-plugin-sim-logger` и добавить его в массив `plugins`

## 3. Клиентская интеграция

- [x] 3.1 В `NBodySystem.tsx` при `hasLoggedSetup.current === false` добавить fire-and-forget `fetch('/api/log/reset', { method: 'POST' }).catch(console.warn)` перед установкой флага
- [x] 3.2 В `NBodySystem.tsx` внутри блока `if (frameCount.current % 60 === 0)` добавить fire-and-forget `fetch('/api/log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ step: frameCount.current, t: Date.now(), bodies: [...] }) }).catch(console.warn)` — `bodies` содержит данные из `bodyRefs.current` с полями `id, mass, px, py, pz, vx, vy, vz` округлёнными до 2 знаков

## 4. Проверка

- [x] 4.1 Перезапустить Vite, открыть браузер, запустить симуляцию, убедиться что `logs/simulation.jsonl` появляется и заполняется валидными JSON-строками
- [x] 4.2 Запустить `npm run lint` — убедиться что нет TypeScript ошибок

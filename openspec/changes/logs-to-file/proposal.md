## Why

Данные о положениях и скоростях тел уже выводятся в консоль браузера каждые ~1 сек, но недоступны для последующего анализа ИИ — они исчезают при закрытии вкладки. Нужно дублировать эти данные в файл на сервере в структурированном формате (JSONL), чтобы ИИ мог загрузить и проанализировать историю симуляции.

## What Changes

- Добавить Vite-плагин (`vite-plugin-sim-logger.ts`) с хуком `configureServer` — вставляет два middleware прямо в Vite dev сервер на том же порту: `POST /api/log` и `POST /api/log/reset`
- В `vite.config.ts` подключить плагин (один импорт)
- В `NBodySystem.tsx` рядом с `console.log(logStr)` добавить fire-and-forget `fetch('/api/log', ...)` со структурированным payload (step, timestamp, тела с id/mass/pos/vel)
- При старте новой симуляции вызывать `POST /api/log/reset` (fire-and-forget)

Отдельный сервер, proxy и `concurrently` **не нужны** — всё работает на одном порту Vite.

## Capabilities

### New Capabilities

- `simulation-log-server`: Vite-плагин с middleware для записи лог-данных симуляции в `logs/simulation.jsonl`
- `simulation-log-client`: Клиентская часть — отправка структурированных данных из NBodySystem

### Modified Capabilities

_(нет — поведение существующей консольной записи не меняется)_

## Impact

- Новый файл: `vite-plugin-sim-logger.ts` (Vite plugin, Node.js fs)
- `vite.config.ts`: добавить импорт и использование плагина
- `src/components/NBodySystem.tsx`: добавить вызовы fetch к API (fire-and-forget)
- `logs/simulation.jsonl`: файл с данными (уже в `.gitignore`)
- `package.json`: без изменений

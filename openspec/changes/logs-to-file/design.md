## Context

Браузерный компонент `NBodySystem.tsx` уже пишет строку `Step N: [i] p:x,y,z v:vx,vy,vz | ...` в консоль каждые 60 physics-шагов (~1 сек реального времени). Vite dev сервер работает на базе Connect (Node.js HTTP middleware framework). Хук `configureServer` в Vite-плагине даёт доступ к `server.middlewares`, куда можно добавить любой Connect-совместимый обработчик. Таким образом `/api/*` маршруты обрабатываются тем же Vite-процессом — отдельный порт не нужен.

## Goals / Non-Goals

**Goals:**
- Vite-плагин (`vite-plugin-sim-logger.ts`) регистрирует два middleware: `POST /api/log` и `POST /api/log/reset`
- `POST /api/log` принимает `{ step, t, bodies }`, дописывает строку в `logs/simulation.jsonl`
- `POST /api/log/reset` очищает/создаёт файл
- Браузерный клиент отправляет данные fire-and-forget, симуляция не блокируется
- Один порт для всего (Vite + API)

**Non-Goals:**
- Production build поддержка (плагин работает только в dev)
- Real-time streaming, WebSocket
- Аутентификация
- Ротация/лимит логов

## Decisions

### 1. Vite plugin с `configureServer` вместо отдельного Express

Vite dev сервер — это Connect-приложение. `configureServer(server)` даёт `server.middlewares.use(path, handler)`. Это стандартный способ добавить серверную логику без второго процесса и порта. Альтернатива (отдельный Express + proxy) сложнее в запуске и требует `concurrently`.

### 2. Вручную парсим тело запроса (без express.json)

В Vite middleware нет express middleware pipeline, поэтому `req.body` не доступен автоматически. Читаем тело через `data`/`end` события на `req`, парсим `JSON.parse`. Это 10 строк и не требует зависимостей.

### 3. Синхронная запись `fs.appendFileSync`

При логировании раз в ~1 сек и малом размере записи (~200 байт) синхронная запись незначима. Асинхронная усложнит код без реального выигрыша.

### 4. JSONL формат

Один JSON-объект на строку. Оптимален для дозаписи и построчного чтения ИИ.

### 5. Плагин подключается только в dev

Оборачиваем в `apply: 'serve'` — в production build плагин не активен.

## Risks / Trade-offs

- **Размер файла**: растёт неограниченно. Non-goal для этой итерации.
- **Сервер (Vite) не запущен**: при `npm run build && serve dist` API не работает. Это dev-only инструмент — ожидаемо.
- **Одновременный доступ**: `appendFileSync` не защищён от race condition, но один браузер пишет один поток — проблемы нет.

## Migration Plan

1. Создать `vite-plugin-sim-logger.ts`
2. Обновить `vite.config.ts` — добавить плагин
3. Обновить `NBodySystem.tsx` — добавить fetch вызовы
4. Проверить: `npm run dev`, открыть браузер, запустить симуляцию, проверить `logs/simulation.jsonl`

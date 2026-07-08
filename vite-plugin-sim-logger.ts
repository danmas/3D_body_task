import fs from 'fs';
import path from 'path';
import type { IncomingMessage, ServerResponse } from 'http';
import type { Plugin } from 'vite';

const LOGS_DIR = path.resolve('logs');
const LOG_FILE = path.join(LOGS_DIR, 'simulation.jsonl');

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function json(res: ServerResponse, status: number, body: object) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

export function simLoggerPlugin(): Plugin {
  return {
    name: 'sim-logger',
    apply: 'serve',
    configureServer(server) {
      fs.mkdirSync(LOGS_DIR, { recursive: true });

      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? '';

        if (url === '/api/log/reset' && req.method === 'POST') {
          fs.writeFileSync(LOG_FILE, '');
          return json(res, 200, { ok: true });
        }

        if (url === '/api/log' && req.method === 'POST') {
          try {
            const raw = await readBody(req);
            const payload = JSON.parse(raw);
            if (typeof payload.step !== 'number') {
              return json(res, 400, { error: 'invalid payload' });
            }
            fs.appendFileSync(LOG_FILE, JSON.stringify(payload) + '\n');
            return json(res, 200, { ok: true });
          } catch {
            return json(res, 400, { error: 'invalid payload' });
          }
        }

        next();
      });
    },
  };
}

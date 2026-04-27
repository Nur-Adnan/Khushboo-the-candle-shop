import fs from 'node:fs';
import path from 'node:path';
import pino from 'pino';
import pinoHttp from 'pino-http';

const logsDir = path.resolve(process.cwd(), 'logs');
fs.mkdirSync(logsDir, { recursive: true });

const logDate = new Date().toISOString().slice(0, 10);
const appLogStream = fs.createWriteStream(path.join(logsDir, `app-${logDate}.log`), { flags: 'a' });
const errorLogStream = fs.createWriteStream(path.join(logsDir, `error-${logDate}.log`), { flags: 'a' });

export const logger = pino(
  {
    level: process.env.LOG_LEVEL ?? 'info',
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'password',
        '*.password',
        '*.password_hash',
        '*.token',
      ],
      censor: '[redacted]',
    },
  },
  pino.multistream([
    { stream: appLogStream },
    { level: 'error', stream: errorLogStream },
    { stream: process.stdout },
  ]),
);

export const requestLogger = pinoHttp({
  logger,
  serializers: {
    req(req) {
      return {
        method: req.method,
        url: req.url,
        remoteAddress: req.remoteAddress,
      };
    },
    res(res) {
      return {
        statusCode: res.statusCode,
      };
    },
  },
});

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const minLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel | undefined) ?? 'info';

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[minLevel];
}

function log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
  if (!shouldLog(level)) return;

  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  };

  if (level === 'error') {
    // eslint-disable-next-line no-console
    console.error(JSON.stringify(entry));
  } else if (level === 'warn') {
    // eslint-disable-next-line no-console
    console.warn(JSON.stringify(entry));
  } else {
    // eslint-disable-next-line no-console
    console.info(JSON.stringify(entry));
  }
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>): void => log('debug', message, meta),
  info: (message: string, meta?: Record<string, unknown>): void => log('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>): void => log('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>): void => log('error', message, meta),
};

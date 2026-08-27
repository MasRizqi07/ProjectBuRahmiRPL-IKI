import { randomUUID } from 'node:crypto'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'
type LogContext = Readonly<Record<string, unknown>>

const sensitiveKeyPattern = /authorization|cookie|email|nik|password|phone|secret|server.?key|token/i

function sanitize(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value === null || typeof value !== 'object') return value
  if (seen.has(value)) return '[circular]'
  seen.add(value)

  if (Array.isArray(value)) return value.map((entry) => sanitize(entry, seen))

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      sensitiveKeyPattern.test(key) ? '[redacted]' : sanitize(entry, seen),
    ]),
  )
}

export interface Logger {
  debug(message: string, context?: LogContext): void
  info(message: string, context?: LogContext): void
  warn(message: string, context?: LogContext): void
  error(message: string, context?: LogContext): void
  child(context: LogContext): Logger
}

export function createLogger(baseContext: LogContext = {}): Logger {
  const write = (level: LogLevel, message: string, context: LogContext = {}): void => {
    const record = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...sanitize({ ...baseContext, ...context }) as Record<string, unknown>,
    }
    const line = JSON.stringify(record)
    if (level === 'error') console.error(line)
    else if (level === 'warn') console.warn(line)
    else console.log(line)
  }

  return {
    debug: (message, context) => write('debug', message, context),
    info: (message, context) => write('info', message, context),
    warn: (message, context) => write('warn', message, context),
    error: (message, context) => write('error', message, context),
    child: (context) => createLogger({ ...baseContext, ...context }),
  }
}

export function requestId(candidate: string | null): string {
  if (candidate !== null && /^[a-zA-Z0-9_-]{8,128}$/.test(candidate)) return candidate
  return randomUUID()
}

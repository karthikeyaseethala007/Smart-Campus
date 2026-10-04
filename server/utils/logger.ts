export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface StructuredLogEntry {
  timestamp: string;
  level: LogLevel;
  subsystem: string;
  message: string;
  requestId?: string;
  eventId?: string;
  deviceId?: string;
  userId?: string;
  zoneId?: string;
  errorClassification?: string;
  details?: Record<string, unknown>;
}

export class Logger {
  private static sanitize(obj: unknown): unknown {
    if (!obj || typeof obj !== 'object') return obj;
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (/password|secret|token|credential|key|auth/i.test(key)) {
        sanitized[key] = '***REDACTED***';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = Logger.sanitize(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  public static log(entry: StructuredLogEntry): void {
    const formatted: StructuredLogEntry = {
      ...entry,
      timestamp: entry.timestamp || new Date().toISOString(),
      details: entry.details ? (Logger.sanitize(entry.details) as Record<string, unknown>) : undefined,
    };

    const out = JSON.stringify(formatted);
    if (entry.level === 'ERROR') {
      console.error(out);
    } else if (entry.level === 'WARN') {
      console.warn(out);
    } else {
      console.log(out);
    }
  }

  public static info(subsystem: string, message: string, meta?: Partial<StructuredLogEntry>): void {
    Logger.log({ timestamp: new Date().toISOString(), level: 'INFO', subsystem, message, ...meta });
  }

  public static warn(subsystem: string, message: string, meta?: Partial<StructuredLogEntry>): void {
    Logger.log({ timestamp: new Date().toISOString(), level: 'WARN', subsystem, message, ...meta });
  }

  public static error(subsystem: string, message: string, meta?: Partial<StructuredLogEntry>): void {
    Logger.log({ timestamp: new Date().toISOString(), level: 'ERROR', subsystem, message, ...meta });
  }

  public static debug(subsystem: string, message: string, meta?: Partial<StructuredLogEntry>): void {
    if (process.env.DEBUG || process.env.NODE_ENV === 'development') {
      Logger.log({ timestamp: new Date().toISOString(), level: 'DEBUG', subsystem, message, ...meta });
    }
  }
}

export default Logger;

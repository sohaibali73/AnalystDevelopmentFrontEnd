/**
 * Centralized logging utility with environment awareness
 */

import { isDevelopment } from './env';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private enabled: boolean;

  constructor() {
    this.enabled = isDevelopment();
  }

  /**
   * Sanitize sensitive data from logs
   */
  private sanitize(data: unknown): unknown {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sanitized = { ...data } as Record<string, unknown>;
    const sensitiveKeys = ['password', 'token', 'secret', 'authorization', 'auth'];

    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Format log message with context
   */
  private format(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(this.sanitize(context))}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  /**
   * Log debug message (development only)
   */
  debug(message: string, context?: LogContext): void {
    if (this.enabled) {
      console.log(this.format('debug', message, context));
    }
  }

  /**
   * Log info message (development only)
   */
  info(message: string, context?: LogContext): void {
    if (this.enabled) {
      console.info(this.format('info', message, context));
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    console.warn(this.format('warn', message, context));
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext = error instanceof Error 
      ? { message: error.message, stack: error.stack, ...context }
      : { error, ...context };
    
    console.error(this.format('error', message, errorContext));
  }

  /**
   * Enable logging
   */
  enable(): void {
    this.enabled = true;
  }

  /**
   * Disable logging
   */
  disable(): void {
    this.enabled = false;
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions
export const debug = logger.debug.bind(logger);
export const info = logger.info.bind(logger);
export const warn = logger.warn.bind(logger);
export const error = logger.error.bind(logger);

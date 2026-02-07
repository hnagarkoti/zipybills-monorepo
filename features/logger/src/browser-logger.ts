/**
 * Browser Logger
 * Optimized console logging for frontend applications with styling and formatting
 */

import type { ILogger, LogContext, LoggerConfig, LogLevel } from './types';

const LOG_COLORS = {
  debug: '#6B7280', // Gray
  info: '#3B82F6', // Blue
  warn: '#F59E0B', // Orange
  error: '#EF4444', // Red
};

const LOG_STYLES = {
  timestamp: 'color: #9CA3AF; font-weight: normal;',
  service: 'color: #8B5CF6; font-weight: bold;',
  message: 'font-weight: normal;',
  context: 'color: #10B981; font-style: italic;',
};

export class BrowserLogger implements ILogger {
  private config: Required<LoggerConfig>;
  private childContext: LogContext;

  constructor(config: LoggerConfig = {}, childContext: LogContext = {}) {
    this.config = {
      level: config.level ?? 'info',
      serviceName: config.serviceName ?? 'app',
      environment: config.environment ?? 'development',
      enableColors: config.enableColors ?? true,
      enableTimestamps: config.enableTimestamps ?? true,
    };
    this.childContext = childContext;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const configLevelIndex = levels.indexOf(this.config.level);
    const currentLevelIndex = levels.indexOf(level);
    return currentLevelIndex >= configLevelIndex;
  }

  private formatMessage(level: LogLevel, message: string): string[] {
    const timestamp = this.config.enableTimestamps
      ? new Date().toISOString()
      : '';
    
    if (this.config.enableColors) {
      return [
        `%c[${timestamp}] %c[${this.config.serviceName}] %c${level.toUpperCase()}: %c${message}`,
        LOG_STYLES.timestamp,
        LOG_STYLES.service,
        `color: ${LOG_COLORS[level]}; font-weight: bold;`,
        LOG_STYLES.message,
      ];
    }

    return [`[${timestamp}] [${this.config.serviceName}] ${level.toUpperCase()}: ${message}`];
  }

  private logContext(context?: LogContext): void {
    if (!context && Object.keys(this.childContext).length === 0) return;

    const mergedContext = { ...this.childContext, ...context };
    
    if (this.config.enableColors) {
      console.log('%cContext:', LOG_STYLES.context, mergedContext);
    } else {
      console.log('Context:', mergedContext);
    }
  }

  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog('debug')) return;
    const formatted = this.formatMessage('debug', message);
    console.debug(...formatted);
    this.logContext(context);
  }

  info(message: string, context?: LogContext): void {
    if (!this.shouldLog('info')) return;
    const formatted = this.formatMessage('info', message);
    console.info(...formatted);
    this.logContext(context);
  }

  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog('warn')) return;
    const formatted = this.formatMessage('warn', message);
    console.warn(...formatted);
    this.logContext(context);
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (!this.shouldLog('error')) return;
    const formatted = this.formatMessage('error', message);
    console.error(...formatted);
    
    if (error) {
      console.error('Error Details:', error);
      if (error instanceof Error && error.stack) {
        console.error('Stack Trace:', error.stack);
      }
    }
    
    this.logContext(context);
  }

  child(context: LogContext): ILogger {
    return new BrowserLogger(this.config, { ...this.childContext, ...context });
  }
}

/**
 * Create a browser logger instance
 */
export function createBrowserLogger(config?: LoggerConfig): ILogger {
  return new BrowserLogger(config);
}

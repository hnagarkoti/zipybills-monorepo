/**
 * Logger Types
 * Shared interfaces for browser and Node.js logger implementations
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface LogContext {
  [key: string]: unknown;
}

export interface ILogger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, error?: Error | unknown, context?: LogContext): void;
  child(context: LogContext): ILogger;
}

export interface LoggerConfig {
  level?: LogLevel;
  serviceName?: string;
  environment?: string;
  enableColors?: boolean;
  enableTimestamps?: boolean;
}

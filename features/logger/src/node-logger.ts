/**
 * Node.js Logger
 * Production-ready structured logging using Pino for backend services
 */

import pino from 'pino';
import type { ILogger, LogContext, LoggerConfig } from './types';

export class NodeLogger implements ILogger {
  private logger: pino.Logger;

  constructor(config: LoggerConfig = {}, childContext: LogContext = {}) {
    const level = config.level ?? 'info';
    const serviceName = config.serviceName ?? 'app';
    const environment = config.environment ?? process.env.NODE_ENV ?? 'development';

    this.logger = pino({
      level,
      name: serviceName,
      base: {
        env: environment,
        ...childContext,
      },
      timestamp: config.enableTimestamps !== false ? pino.stdTimeFunctions.isoTime : false,
      formatters: {
        level: (label) => {
          return { level: label.toUpperCase() };
        },
      },
      transport:
        environment === 'development'
          ? {
              target: 'pino-pretty',
              options: {
                colorize: config.enableColors !== false,
                translateTime: 'HH:MM:ss',
                ignore: 'pid,hostname',
                singleLine: false,
              },
            }
          : undefined,
    });
  }

  debug(message: string, context?: LogContext): void {
    this.logger.debug(context ?? {}, message);
  }

  info(message: string, context?: LogContext): void {
    this.logger.info(context ?? {}, message);
  }

  warn(message: string, context?: LogContext): void {
    this.logger.warn(context ?? {}, message);
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext: LogContext = { ...context };

    if (error instanceof Error) {
      errorContext.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    } else if (error) {
      errorContext.error = error;
    }

    this.logger.error(errorContext, message);
  }

  child(context: LogContext): ILogger {
    const childLogger = new NodeLogger();
    childLogger.logger = this.logger.child(context);
    return childLogger;
  }
}

/**
 * Create a Node.js logger instance
 */
export function createNodeLogger(config?: LoggerConfig): ILogger {
  return new NodeLogger(config);
}

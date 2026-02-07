/**
 * Logger Module
 * Universal logging system for ZipyBills monorepo
 * 
 * @example Browser Usage
 * ```ts
 * import { createBrowserLogger } from '@zipybills/logger';
 * 
 * const logger = createBrowserLogger({
 *   serviceName: 'barcode-scanner-web',
 *   level: 'debug'
 * });
 * 
 * logger.info('Application started');
 * logger.error('Failed to fetch data', error, { userId: '123' });
 * ```
 * 
 * @example Node.js Usage
 * ```ts
 * import { createNodeLogger } from '@zipybills/logger';
 * 
 * const logger = createNodeLogger({
 *   serviceName: 'machines-service',
 *   environment: 'production'
 * });
 * 
 * logger.info('Server started', { port: 3006 });
 * logger.error('Database connection failed', error);
 * ```
 * 
 * @example Child Logger
 * ```ts
 * const requestLogger = logger.child({ requestId: 'abc-123' });
 * requestLogger.info('Processing request'); // Includes requestId in all logs
 * ```
 */

/**
 * Logger Module - Universal Entry Point
 * This file provides automatic environment detection
 * For explicit imports, use:
 * - import { createBrowserLogger } from '@zipybills/logger/browser'
 * - import { createNodeLogger } from '@zipybills/logger/node'
 */

// Always safe to export browser logger for all environments
import { createBrowserLogger as _createBrowserLogger, BrowserLogger } from './browser-logger';
export { createBrowserLogger, BrowserLogger } from './browser-logger';
export { LogLevel, type ILogger, type LogContext, type LoggerConfig } from './types';

// Type-only export for Node logger (actual implementation loaded conditionally)
export type { NodeLogger } from './node-logger';

/**
 * Auto-detect environment and create appropriate logger
 * Uses BrowserLogger for web/React Native, NodeLogger for Node.js
 */
export function createLogger(config?: import('./types').LoggerConfig): import('./types').ILogger {
  return _createBrowserLogger(config);
}

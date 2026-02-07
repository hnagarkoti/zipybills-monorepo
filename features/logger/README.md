# @zipybills/logger

Universal logging system for ZipyBills monorepo with support for both browser and Node.js environments.

## Features

✅ **Browser Logger** - Styled console logging with colors and timestamps  
✅ **Node.js Logger** - Production-ready structured logging with Pino  
✅ **Child Loggers** - Create contextual loggers with inherited metadata  
✅ **Log Levels** - DEBUG, INFO, WARN, ERROR with filtering  
✅ **TypeScript** - Full type safety  
✅ **Auto-Detection** - Automatically selects browser or Node.js logger

## Installation

```bash
pnpm add @zipybills/logger
```

## Usage

### Browser (React/Vite)

```typescript
import { createBrowserLogger } from '@zipybills/logger';

const logger = createBrowserLogger({
  serviceName: 'barcode-scanner-web',
  level: 'debug',
  enableColors: true,
  enableTimestamps: true,
});

logger.info('User logged in', { userId: '123', email: 'user@example.com' });
logger.warn('API rate limit approaching', { remaining: 10 });
logger.error('Failed to save data', error, { retryCount: 3 });
```

### Node.js (Express/Backend)

```typescript
import { createNodeLogger } from '@zipybills/logger';

const logger = createNodeLogger({
  serviceName: 'machines-service',
  environment: 'production',
  level: 'info',
});

logger.info('Server started', { port: 3006, pid: process.pid });
logger.error('Database connection failed', error, { host: 'localhost' });
```

### Child Loggers (Request Context)

```typescript
// Create a child logger with request context
app.use((req, res, next) => {
  req.logger = logger.child({
    requestId: req.id,
    method: req.method,
    path: req.path,
  });
  next();
});

// All logs from this logger include the request context
req.logger.info('Processing request'); // Includes requestId, method, path
```

### Auto-Detection

```typescript
import { createLogger } from '@zipybills/logger';

// Automatically uses browser logger in browser, Node logger in Node.js
const logger = createLogger({ serviceName: 'my-service' });
```

## Log Levels

```typescript
import { LogLevel } from '@zipybills/logger';

const logger = createLogger({
  level: LogLevel.WARN, // Only logs WARN and ERROR
});

logger.debug('Not logged'); // Filtered out
logger.info('Not logged'); // Filtered out
logger.warn('Logged!');
logger.error('Logged!');
```

## Configuration

```typescript
interface LoggerConfig {
  level?: LogLevel; // Minimum log level
  serviceName?: string; // Service identifier
  environment?: string; // 'development' | 'production'
  enableColors?: boolean; // Colored output
  enableTimestamps?: boolean; // ISO timestamps
}
```

## Examples in Monorepo

### Backend Service Example

```typescript
// features/barcode-feature/machines/machines-service/service-runtime/src/index.ts
import { createNodeLogger } from '@zipybills/logger';

const logger = createNodeLogger({
  serviceName: 'machines-service',
  level: 'debug',
});

app.get('/api/machines', async (req, res) => {
  logger.info('Fetching machines', { userId: req.user?.id });
  
  try {
    const machines = await getMachines();
    logger.debug('Machines retrieved', { count: machines.length });
    res.json(machines);
  } catch (error) {
    logger.error('Failed to fetch machines', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### Frontend Example

```typescript
// features/barcode-feature/scanning/scanning-frontend/src/App.tsx
import { createBrowserLogger } from '@zipybills/logger';

const logger = createBrowserLogger({
  serviceName: 'scanning-web',
  level: 'debug',
});

function ScannerPage() {
  useEffect(() => {
    logger.info('Scanner page mounted');
    
    return () => {
      logger.debug('Scanner page unmounted');
    };
  }, []);

  const handleScan = async (barcode: string) => {
    logger.info('Barcode scanned', { barcode });
    
    try {
      await scanBarcode(barcode);
      logger.debug('Scan successful');
    } catch (error) {
      logger.error('Scan failed', error, { barcode });
    }
  };
}
```

## Best Practices

1. **Create one logger per service/app** with appropriate serviceName
2. **Use child loggers for request context** to track related operations
3. **Log structured data** using the context parameter
4. **Set appropriate log levels** - DEBUG for development, INFO+ for production
5. **Always pass errors** to logger.error() for proper stack trace logging

## Development vs Production

**Development:**
- Pretty-printed logs with colors
- Full timestamps
- Stack traces visible

**Production:**
- JSON structured logs
- Optimized for log aggregation (ELK, CloudWatch, etc.)
- Automatic error serialization

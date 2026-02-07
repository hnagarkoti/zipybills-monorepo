import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

/**
 * FactoryOS PostgreSQL Database Configuration
 *
 * Supports both on-prem (local PostgreSQL) and cloud deployments.
 * Connection is configured via environment variables with sensible defaults.
 */

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  max: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
}

export function getDatabaseConfig(): DatabaseConfig {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'factory_os',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: parseInt(process.env.DB_POOL_MAX || '20', 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };
}

let pool: pg.Pool | null = null;

/**
 * Get or create the PostgreSQL connection pool.
 * The pool is a singleton — created on first call, reused thereafter.
 */
export function getPool(): pg.Pool {
  if (!pool) {
    const config = getDatabaseConfig();
    pool = new pg.Pool(config);

    pool.on('error', (err) => {
      console.error('[FactoryOS DB] Unexpected pool error:', err.message);
    });

    pool.on('connect', () => {
      console.log('[FactoryOS DB] New client connected to pool');
    });
  }
  return pool;
}

/**
 * Execute a SQL query using the pool.
 */
export async function query<T extends pg.QueryResultRow = any>(
  text: string,
  params?: any[],
): Promise<pg.QueryResult<T>> {
  const client = await getPool().connect();
  try {
    return await client.query<T>(text, params);
  } finally {
    client.release();
  }
}

/**
 * Execute multiple statements inside a transaction.
 */
export async function transaction<T>(
  fn: (client: pg.PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Close the pool gracefully.
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('[FactoryOS DB] Pool closed');
  }
}

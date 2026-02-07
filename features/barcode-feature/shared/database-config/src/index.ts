import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const DB_NAME = process.env.DB_NAME || 'barcode_tracking';

/**
 * Shared SQL Server configuration for all barcode services
 */
export const dbConfig: sql.config = {
  server: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '1433'),
  database: DB_NAME,
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_CERT === 'true',
  },
};

/** Config pointing at master — used to CREATE the target database */
const masterConfig: sql.config = {
  ...dbConfig,
  database: 'master',
};

let pool: sql.ConnectionPool | null = null;

/**
 * Ensure the target database exists, then get or create a connection pool to it.
 */
export async function getDbPool(): Promise<sql.ConnectionPool> {
  if (!pool) {
    // First connect to master and ensure the DB exists
    const masterPool = await sql.connect(masterConfig);
    await masterPool.request().query(`
      IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = '${DB_NAME}')
      BEGIN
        CREATE DATABASE [${DB_NAME}];
        PRINT 'Created database ${DB_NAME}';
      END
    `);
    await masterPool.close();
    console.log(`✅ Database [${DB_NAME}] verified/created`);

    // Now connect to the actual database
    pool = await sql.connect(dbConfig);
    console.log(`✅ Connected to SQL Server → [${DB_NAME}]`);
  }
  return pool;
}

/**
 * Close the database connection
 */
export async function closeDbPool(): Promise<void> {
  if (pool) {
    await pool.close();
    pool = null;
    console.log('✅ Database connection closed');
  }
}

export { sql };

import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const DB_NAME = process.env.DB_NAME || 'barcode_tracking';

/** Config pointing at the target database */
const config: sql.config = {
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

/** Config pointing at master — used to CREATE/DROP the target database */
const masterConfig: sql.config = {
  ...config,
  database: 'master',
};

let pool: sql.ConnectionPool;

/**
 * Ensure the target database exists, then connect to it and create tables.
 */
export async function initializeSQLServerDatabase() {
  try {
    // 1. Connect to master and create the target DB if it doesn't exist
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

    // 2. Now connect to the actual database
    pool = await sql.connect(config);
    console.log(`✅ Connected to SQL Server → [${DB_NAME}]`);

    // 3. Create tables if they don't exist (no demo data)
    await createTablesIfNotExist();
    console.log('✅ Database schema verified');
  } catch (error) {
    console.error('❌ SQL Server connection error:', error);
    throw error;
  }
}

async function createTablesIfNotExist() {
  try {
    // Create machines table (NEW)
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='machines' AND xtype='U')
      CREATE TABLE machines (
        machine_id INT PRIMARY KEY,
        machine_name VARCHAR(100) NOT NULL,
        machine_code VARCHAR(50) NOT NULL UNIQUE,
        sequence_order INT NOT NULL UNIQUE,
        description VARCHAR(500) NULL,
        is_active BIT DEFAULT 1,
        can_generate_barcode BIT DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
      )
    `);

    // Create barcodes table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='barcodes' AND xtype='U')
      CREATE TABLE barcodes (
        barcode_id INT IDENTITY(1,1) PRIMARY KEY,
        barcode VARCHAR(100) NOT NULL UNIQUE,
        generated_by_machine INT NOT NULL DEFAULT 1,
        generated_at DATETIME NOT NULL DEFAULT GETDATE(),
        status VARCHAR(50) DEFAULT 'ACTIVE',
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
      )
    `);

    // Create machine_data table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='machine_data' AND xtype='U')
      CREATE TABLE machine_data (
        data_id INT IDENTITY(1,1) PRIMARY KEY,
        barcode VARCHAR(100) NOT NULL,
        machine_id INT NOT NULL,
        processed_at DATETIME NOT NULL DEFAULT GETDATE(),
        machine_parameters NVARCHAR(MAX) NULL,
        notes VARCHAR(500) NULL,
        status VARCHAR(50) DEFAULT 'SUCCESS',
        created_at DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_machine_data_barcode FOREIGN KEY (barcode) REFERENCES barcodes(barcode),
        CONSTRAINT FK_machine_data_machine FOREIGN KEY (machine_id) REFERENCES machines(machine_id),
        CONSTRAINT UQ_barcode_machine UNIQUE (barcode, machine_id)
      )
    `);

    // Create activity_log table — tracks EVERY action (success + failure)
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='activity_log' AND xtype='U')
      CREATE TABLE activity_log (
        log_id INT IDENTITY(1,1) PRIMARY KEY,
        action VARCHAR(50) NOT NULL,
        barcode VARCHAR(100) NULL,
        machine_id INT NULL,
        user_id VARCHAR(100) NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
        error_message VARCHAR(500) NULL,
        details NVARCHAR(MAX) NULL,
        ip_address VARCHAR(45) NULL,
        created_at DATETIME DEFAULT GETDATE()
      )
    `);

    // Create indexes
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IDX_machine_data_barcode')
      CREATE INDEX IDX_machine_data_barcode ON machine_data(barcode)
    `);

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IDX_machines_sequence')
      CREATE INDEX IDX_machines_sequence ON machines(sequence_order)
    `);

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IDX_activity_log_created')
      CREATE INDEX IDX_activity_log_created ON activity_log(created_at DESC)
    `);

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IDX_activity_log_action')
      CREATE INDEX IDX_activity_log_action ON activity_log(action, status)
    `);

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IDX_activity_log_barcode')
      CREATE INDEX IDX_activity_log_barcode ON activity_log(barcode)
    `);

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IDX_activity_log_machine')
      CREATE INDEX IDX_activity_log_machine ON activity_log(machine_id)
    `);

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IDX_barcodes_generated_at')
      CREATE INDEX IDX_barcodes_generated_at ON barcodes(generated_at DESC)
    `);

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IDX_machine_data_processed')
      CREATE INDEX IDX_machine_data_processed ON machine_data(processed_at DESC)
    `);
  } catch (error) {
    console.error('Error creating tables:', error);
  }
}

export const sqlServerOperations = {
  // ─── Activity Logging ──────────────────────────────────────────────────────
  async logActivity(
    action: string,
    status: 'SUCCESS' | 'FAILED',
    opts: { barcode?: string; machineId?: number; userId?: string; error?: string; details?: object; ip?: string } = {}
  ) {
    try {
      await pool
        .request()
        .input('action', sql.VarChar, action)
        .input('barcode', sql.VarChar, opts.barcode || null)
        .input('machine_id', sql.Int, opts.machineId || null)
        .input('user_id', sql.VarChar, opts.userId || null)
        .input('status', sql.VarChar, status)
        .input('error_message', sql.VarChar, opts.error || null)
        .input('details', sql.NVarChar, opts.details ? JSON.stringify(opts.details) : null)
        .input('ip_address', sql.VarChar, opts.ip || null)
        .query(`
          INSERT INTO activity_log (action, barcode, machine_id, user_id, status, error_message, details, ip_address)
          VALUES (@action, @barcode, @machine_id, @user_id, @status, @error_message, @details, @ip_address)
        `);
    } catch (err) {
      console.error('Failed to write activity log:', err);
    }
  },

  // ─── Core Barcode Operations ───────────────────────────────────────────────
  generateBarcode(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `BC${timestamp}${random}`;
  },

  async createBarcode(barcode: string, machineId: number = 1) {
    await pool
      .request()
      .input('barcode', sql.VarChar, barcode)
      .input('machine_id', sql.Int, machineId)
      .query('INSERT INTO barcodes (barcode, generated_by_machine) VALUES (@barcode, @machine_id)');
  },

  async getAllBarcodes() {
    const result = await pool.request().query('SELECT * FROM barcodes ORDER BY generated_at DESC');
    return result.recordset;
  },

  async getBarcodeByValue(barcode: string) {
    const result = await pool
      .request()
      .input('barcode', sql.VarChar, barcode)
      .query('SELECT * FROM barcodes WHERE barcode = @barcode');
    return result.recordset[0];
  },

  async getBarcodeHistory(barcode: string) {
    const result = await pool
      .request()
      .input('barcode', sql.VarChar, barcode)
      .query(`
        SELECT * FROM machine_data 
        WHERE barcode = @barcode 
        ORDER BY machine_id
      `);
    return result.recordset;
  },

  async addMachineData(barcode: string, machineId: number, parameters: object, notes?: string) {
    await pool
      .request()
      .input('barcode', sql.VarChar, barcode)
      .input('machine_id', sql.Int, machineId)
      .input('params', sql.NVarChar, JSON.stringify(parameters))
      .input('notes', sql.VarChar, notes || '')
      .query(`
        INSERT INTO machine_data (barcode, machine_id, machine_parameters, notes)
        VALUES (@barcode, @machine_id, @params, @notes)
      `);
  },

  async barcodeExists(barcode: string): Promise<boolean> {
    const result = await pool
      .request()
      .input('barcode', sql.VarChar, barcode)
      .query('SELECT COUNT(*) as count FROM barcodes WHERE barcode = @barcode');
    return result.recordset[0].count > 0;
  },

  async machineProcessed(barcode: string, machineId: number): Promise<boolean> {
    const result = await pool
      .request()
      .input('barcode', sql.VarChar, barcode)
      .input('machine_id', sql.Int, machineId)
      .query('SELECT COUNT(*) as count FROM machine_data WHERE barcode = @barcode AND machine_id = @machine_id');
    return result.recordset[0].count > 0;
  },

  async validateSequentialProcessing(barcode: string, machineId: number): Promise<{ valid: boolean; message: string }> {
    const machineResult = await pool
      .request()
      .input('machine_id', sql.Int, machineId)
      .query('SELECT sequence_order, machine_name, can_generate_barcode FROM machines WHERE machine_id = @machine_id AND is_active = 1');

    if (machineResult.recordset.length === 0) {
      return { valid: false, message: `Machine ${machineId} not found or inactive` };
    }

    const currentMachine = machineResult.recordset[0];
    const currentSequence = currentMachine.sequence_order;

    if (currentMachine.can_generate_barcode) {
      return { valid: true, message: 'Machine can generate barcodes' };
    }

    const previousMachineResult = await pool
      .request()
      .input('previous_sequence', sql.Int, currentSequence - 1)
      .query('SELECT machine_id, machine_name FROM machines WHERE sequence_order = @previous_sequence AND is_active = 1');

    if (previousMachineResult.recordset.length === 0) {
      return { valid: true, message: 'First machine in sequence' };
    }

    const previousMachine = previousMachineResult.recordset[0];

    const processedResult = await pool
      .request()
      .input('barcode', sql.VarChar, barcode)
      .input('previous_machine_id', sql.Int, previousMachine.machine_id)
      .query('SELECT COUNT(*) as count FROM machine_data WHERE barcode = @barcode AND machine_id = @previous_machine_id');

    if (processedResult.recordset[0].count === 0) {
      return {
        valid: false,
        message: `Cannot process on ${currentMachine.machine_name}. Barcode must be processed by ${previousMachine.machine_name} first.`
      };
    }

    return { valid: true, message: 'Sequential validation passed' };
  },

  // ─── Machine Management ────────────────────────────────────────────────────
  async getAllMachines() {
    const result = await pool.request().query('SELECT * FROM machines ORDER BY sequence_order');
    return result.recordset;
  },

  async getMachineById(machineId: number) {
    const result = await pool
      .request()
      .input('machine_id', sql.Int, machineId)
      .query('SELECT * FROM machines WHERE machine_id = @machine_id');
    return result.recordset[0];
  },

  async createMachine(machineId: number, machineName: string, machineCode: string, sequenceOrder: number, description?: string, canGenerateBarcode: boolean = false) {
    await pool
      .request()
      .input('machine_id', sql.Int, machineId)
      .input('machine_name', sql.VarChar, machineName)
      .input('machine_code', sql.VarChar, machineCode)
      .input('sequence_order', sql.Int, sequenceOrder)
      .input('description', sql.VarChar, description || '')
      .input('can_generate', sql.Bit, canGenerateBarcode ? 1 : 0)
      .query(`
        INSERT INTO machines (machine_id, machine_name, machine_code, sequence_order, description, can_generate_barcode)
        VALUES (@machine_id, @machine_name, @machine_code, @sequence_order, @description, @can_generate)
      `);
  },

  async updateMachine(machineId: number, updates: { machineName?: string; machineCode?: string; sequenceOrder?: number; description?: string; isActive?: boolean; canGenerateBarcode?: boolean }) {
    const fields: string[] = [];
    const request = pool.request().input('machine_id', sql.Int, machineId);

    if (updates.machineName !== undefined) { fields.push('machine_name = @machine_name'); request.input('machine_name', sql.VarChar, updates.machineName); }
    if (updates.machineCode !== undefined) { fields.push('machine_code = @machine_code'); request.input('machine_code', sql.VarChar, updates.machineCode); }
    if (updates.sequenceOrder !== undefined) { fields.push('sequence_order = @sequence_order'); request.input('sequence_order', sql.Int, updates.sequenceOrder); }
    if (updates.description !== undefined) { fields.push('description = @description'); request.input('description', sql.VarChar, updates.description); }
    if (updates.isActive !== undefined) { fields.push('is_active = @is_active'); request.input('is_active', sql.Bit, updates.isActive ? 1 : 0); }
    if (updates.canGenerateBarcode !== undefined) { fields.push('can_generate_barcode = @can_generate'); request.input('can_generate', sql.Bit, updates.canGenerateBarcode ? 1 : 0); }

    if (fields.length > 0) {
      fields.push('updated_at = GETDATE()');
      await request.query(`UPDATE machines SET ${fields.join(', ')} WHERE machine_id = @machine_id`);
    }
  },

  async deleteMachine(machineId: number) {
    await pool
      .request()
      .input('machine_id', sql.Int, machineId)
      .query('UPDATE machines SET is_active = 0, updated_at = GETDATE() WHERE machine_id = @machine_id');
  },

  // ─── Processing Status ─────────────────────────────────────────────────────
  async getProcessingStatus() {
    const result = await pool.request().query(`
      SELECT 
        b.barcode,
        b.generated_at,
        COUNT(DISTINCT md.machine_id) as machines_processed,
        STRING_AGG(CAST(md.machine_id AS VARCHAR), ',') as machine_ids,
        MAX(md.machine_id) as last_machine,
        MAX(md.processed_at) as last_processed_at
      FROM barcodes b
      LEFT JOIN machine_data md ON b.barcode = md.barcode
      GROUP BY b.barcode, b.generated_at
      ORDER BY b.generated_at DESC
    `);
    return result.recordset;
  },

  // ─── Enhanced Dashboard ────────────────────────────────────────────────────
  async getDashboardStats() {
    // Total machines count
    const machinesResult = await pool.request().query(
      'SELECT COUNT(*) as total FROM machines WHERE is_active = 1'
    );
    const totalMachines = machinesResult.recordset[0].total;

    // Summary counts
    const summaryResult = await pool.request().query(`
      SELECT
        (SELECT COUNT(*) FROM barcodes) as totalBarcodes,
        (SELECT COUNT(*) FROM machine_data) as totalProcessed,
        (SELECT COUNT(*) FROM barcodes WHERE CAST(generated_at AS DATE) = CAST(GETDATE() AS DATE)) as todayBarcodes,
        (SELECT COUNT(*) FROM machine_data WHERE CAST(processed_at AS DATE) = CAST(GETDATE() AS DATE)) as todayScans
    `);
    const summary = summaryResult.recordset[0];

    // Per-machine scan counts
    const machineStatsResult = await pool.request().query(`
      SELECT md.machine_id, COUNT(*) as count, m.machine_name, m.machine_code
      FROM machine_data md
      LEFT JOIN machines m ON md.machine_id = m.machine_id
      GROUP BY md.machine_id, m.machine_name, m.machine_code
      ORDER BY md.machine_id
    `);

    // Completion stats: count barcodes processed by ALL active machines
    const completionResult = await pool.request().query(`
      SELECT
        COUNT(*) as completed
      FROM barcodes b
      WHERE (
        SELECT COUNT(DISTINCT md.machine_id)
        FROM machine_data md
        WHERE md.barcode = b.barcode
      ) >= ${totalMachines}
      AND ${totalMachines} > 0
    `);

    // In-progress: processed by at least 1 machine but not all
    const inProgressResult = await pool.request().query(`
      SELECT COUNT(*) as in_progress
      FROM barcodes b
      WHERE (
        SELECT COUNT(DISTINCT md.machine_id)
        FROM machine_data md
        WHERE md.barcode = b.barcode
      ) BETWEEN 1 AND ${Math.max(totalMachines - 1, 0)}
    `);

    // Pending: barcodes with 0 scans (beyond generator)
    const pendingResult = await pool.request().query(`
      SELECT COUNT(*) as pending
      FROM barcodes b
      WHERE (
        SELECT COUNT(DISTINCT md.machine_id)
        FROM machine_data md
        INNER JOIN machines mm ON md.machine_id = mm.machine_id AND mm.can_generate_barcode = 0
        WHERE md.barcode = b.barcode
      ) = 0
    `);

    // Recent activity (last 20 actions)
    const recentActivityResult = await pool.request().query(`
      SELECT TOP 20 log_id, action, barcode, machine_id, user_id, status, error_message, created_at
      FROM activity_log
      ORDER BY created_at DESC
    `);

    // Failure count today
    const failuresTodayResult = await pool.request().query(`
      SELECT COUNT(*) as failures
      FROM activity_log
      WHERE status = 'FAILED'
        AND CAST(created_at AS DATE) = CAST(GETDATE() AS DATE)
    `);

    // Average processing time (time between first and last machine scan per barcode)
    const avgTimeResult = await pool.request().query(`
      SELECT AVG(DATEDIFF(MINUTE, first_scan, last_scan)) as avg_minutes
      FROM (
        SELECT barcode, MIN(processed_at) as first_scan, MAX(processed_at) as last_scan
        FROM machine_data
        GROUP BY barcode
        HAVING COUNT(DISTINCT machine_id) > 1
      ) t
    `);

    return {
      totalBarcodes: summary.totalBarcodes,
      totalProcessed: summary.totalProcessed,
      todayBarcodes: summary.todayBarcodes,
      todayScans: summary.todayScans,
      completed: completionResult.recordset[0].completed,
      inProgress: inProgressResult.recordset[0].in_progress,
      pending: pendingResult.recordset[0].pending,
      totalMachines,
      machineStats: machineStatsResult.recordset,
      recentActivity: recentActivityResult.recordset,
      failuresToday: failuresTodayResult.recordset[0].failures,
      avgProcessingMinutes: avgTimeResult.recordset[0].avg_minutes || 0,
    };
  },

  // ─── Reports ───────────────────────────────────────────────────────────────

  /** Build a WHERE clause for a date range on a given column */
  _dateFilter(column: string, period: string, request: sql.Request): string {
    const now = new Date();
    switch (period) {
      case 'today':
        return `CAST(${column} AS DATE) = CAST(GETDATE() AS DATE)`;
      case 'week':
        return `${column} >= DATEADD(DAY, -7, GETDATE())`;
      case 'month':
        return `${column} >= DATEADD(MONTH, -1, GETDATE())`;
      case 'year':
        return `${column} >= DATEADD(YEAR, -1, GETDATE())`;
      case 'custom': {
        // startDate and endDate should be set on the request before calling
        return `${column} BETWEEN @startDate AND @endDate`;
      }
      default:
        return '1=1'; // all time
    }
  },

  /** Summary report — key metrics for a period */
  async getReportSummary(period: string, startDate?: string, endDate?: string) {
    const request = pool.request();
    if (startDate) request.input('startDate', sql.DateTime, new Date(startDate));
    if (endDate) request.input('endDate', sql.DateTime, new Date(endDate));

    const barcodeFilter = this._dateFilter('b.generated_at', period, request);
    const scanFilter = this._dateFilter('md.processed_at', period, request);

    // For scan count we need a separate request because input names conflict
    const request2 = pool.request();
    if (startDate) request2.input('startDate', sql.DateTime, new Date(startDate));
    if (endDate) request2.input('endDate', sql.DateTime, new Date(endDate));

    const request3 = pool.request();
    if (startDate) request3.input('startDate', sql.DateTime, new Date(startDate));
    if (endDate) request3.input('endDate', sql.DateTime, new Date(endDate));

    const barcodesGenerated = await request.query(`
      SELECT COUNT(*) as total FROM barcodes b WHERE ${barcodeFilter}
    `);
    const totalScans = await request2.query(`
      SELECT COUNT(*) as total FROM machine_data md WHERE ${scanFilter}
    `);
    const failedAttempts = await request3.query(`
      SELECT COUNT(*) as total FROM activity_log WHERE status = 'FAILED' AND ${this._dateFilter('created_at', period, request3)}
    `);

    // Completion count for the period
    const machinesResult = await pool.request().query('SELECT COUNT(*) as total FROM machines WHERE is_active = 1');
    const totalMachines = machinesResult.recordset[0].total;

    const request4 = pool.request();
    if (startDate) request4.input('startDate', sql.DateTime, new Date(startDate));
    if (endDate) request4.input('endDate', sql.DateTime, new Date(endDate));

    const completedResult = await request4.query(`
      SELECT COUNT(*) as total
      FROM barcodes b
      WHERE ${this._dateFilter('b.generated_at', period, request4)}
        AND (SELECT COUNT(DISTINCT md.machine_id) FROM machine_data md WHERE md.barcode = b.barcode) >= ${totalMachines}
        AND ${totalMachines} > 0
    `);

    const successRate = (totalScans.recordset[0].total + failedAttempts.recordset[0].total) > 0
      ? ((totalScans.recordset[0].total / (totalScans.recordset[0].total + failedAttempts.recordset[0].total)) * 100).toFixed(1)
      : '100.0';

    return {
      barcodesGenerated: barcodesGenerated.recordset[0].total,
      totalScans: totalScans.recordset[0].total,
      failedAttempts: failedAttempts.recordset[0].total,
      completed: completedResult.recordset[0].total,
      successRate: parseFloat(successRate),
      totalMachines,
    };
  },

  /** Per-machine activity breakdown for a period */
  async getMachineActivity(period: string, startDate?: string, endDate?: string) {
    const request = pool.request();
    if (startDate) request.input('startDate', sql.DateTime, new Date(startDate));
    if (endDate) request.input('endDate', sql.DateTime, new Date(endDate));

    const filter = this._dateFilter('md.processed_at', period, request);

    const result = await request.query(`
      SELECT
        m.machine_id,
        m.machine_name,
        m.machine_code,
        m.can_generate_barcode,
        COUNT(md.data_id) as scan_count,
        MIN(md.processed_at) as first_scan,
        MAX(md.processed_at) as last_scan,
        (SELECT COUNT(*) FROM activity_log al
         WHERE al.machine_id = m.machine_id AND al.status = 'FAILED'
           AND ${this._dateFilter('al.created_at', period, request).replace(/@startDate/g, '@startDate').replace(/@endDate/g, '@endDate')}) as failed_count
      FROM machines m
      LEFT JOIN machine_data md ON m.machine_id = md.machine_id AND ${filter}
      WHERE m.is_active = 1
      GROUP BY m.machine_id, m.machine_name, m.machine_code, m.can_generate_barcode
      ORDER BY m.machine_id
    `);
    return result.recordset;
  },

  /** Completion stats — barcodes segmented by how many machines have processed them */
  async getCompletionStats(period: string, startDate?: string, endDate?: string) {
    const request = pool.request();
    if (startDate) request.input('startDate', sql.DateTime, new Date(startDate));
    if (endDate) request.input('endDate', sql.DateTime, new Date(endDate));

    const filter = this._dateFilter('b.generated_at', period, request);

    const result = await request.query(`
      SELECT
        b.barcode,
        b.generated_at,
        b.generated_by_machine,
        COUNT(DISTINCT md.machine_id) as machines_processed,
        (SELECT COUNT(*) FROM machines WHERE is_active = 1) as total_machines,
        CASE
          WHEN COUNT(DISTINCT md.machine_id) >= (SELECT COUNT(*) FROM machines WHERE is_active = 1) THEN 'COMPLETED'
          WHEN COUNT(DISTINCT md.machine_id) > 0 THEN 'IN_PROGRESS'
          ELSE 'PENDING'
        END as completion_status,
        STRING_AGG(CAST(md.machine_id AS VARCHAR), ',') as processed_by_machines,
        MIN(md.processed_at) as first_scan_at,
        MAX(md.processed_at) as last_scan_at
      FROM barcodes b
      LEFT JOIN machine_data md ON b.barcode = md.barcode
      WHERE ${filter}
      GROUP BY b.barcode, b.generated_at, b.generated_by_machine
      ORDER BY b.generated_at DESC
    `);
    return result.recordset;
  },

  /** Failed scans — all failed activity log entries */
  async getFailedScans(period: string, startDate?: string, endDate?: string) {
    const request = pool.request();
    if (startDate) request.input('startDate', sql.DateTime, new Date(startDate));
    if (endDate) request.input('endDate', sql.DateTime, new Date(endDate));

    const filter = this._dateFilter('al.created_at', period, request);

    const result = await request.query(`
      SELECT
        al.log_id,
        al.action,
        al.barcode,
        al.machine_id,
        m.machine_name,
        m.machine_code,
        al.user_id,
        al.error_message,
        al.details,
        al.created_at
      FROM activity_log al
      LEFT JOIN machines m ON al.machine_id = m.machine_id
      WHERE al.status = 'FAILED' AND ${filter}
      ORDER BY al.created_at DESC
    `);
    return result.recordset;
  },

  /** Hourly activity breakdown for charts */
  async getHourlyActivity(period: string, startDate?: string, endDate?: string) {
    const request = pool.request();
    if (startDate) request.input('startDate', sql.DateTime, new Date(startDate));
    if (endDate) request.input('endDate', sql.DateTime, new Date(endDate));

    const filter = this._dateFilter('md.processed_at', period, request);

    const result = await request.query(`
      SELECT
        DATEPART(HOUR, md.processed_at) as hour,
        COUNT(*) as scan_count,
        COUNT(DISTINCT md.barcode) as unique_barcodes
      FROM machine_data md
      WHERE ${filter}
      GROUP BY DATEPART(HOUR, md.processed_at)
      ORDER BY hour
    `);
    return result.recordset;
  },

  /** Daily activity breakdown for trend charts */
  async getDailyActivity(period: string, startDate?: string, endDate?: string) {
    const request = pool.request();
    if (startDate) request.input('startDate', sql.DateTime, new Date(startDate));
    if (endDate) request.input('endDate', sql.DateTime, new Date(endDate));

    const filter = this._dateFilter('md.processed_at', period, request);

    const result = await request.query(`
      SELECT
        CAST(md.processed_at AS DATE) as date,
        COUNT(*) as scan_count,
        COUNT(DISTINCT md.barcode) as unique_barcodes,
        COUNT(DISTINCT md.machine_id) as active_machines
      FROM machine_data md
      WHERE ${filter}
      GROUP BY CAST(md.processed_at AS DATE)
      ORDER BY date DESC
    `);
    return result.recordset;
  },

  /** Full journey of a single barcode through all machines */
  async getBarcodeJourney(barcode: string) {
    const barcodeInfo = await pool
      .request()
      .input('barcode', sql.VarChar, barcode)
      .query('SELECT * FROM barcodes WHERE barcode = @barcode');

    if (barcodeInfo.recordset.length === 0) return null;

    const steps = await pool
      .request()
      .input('barcode', sql.VarChar, barcode)
      .query(`
        SELECT
          md.data_id,
          md.machine_id,
          m.machine_name,
          m.machine_code,
          m.sequence_order,
          md.processed_at,
          md.machine_parameters,
          md.notes,
          md.status
        FROM machine_data md
        LEFT JOIN machines m ON md.machine_id = m.machine_id
        WHERE md.barcode = @barcode
        ORDER BY m.sequence_order, md.processed_at
      `);

    const logs = await pool
      .request()
      .input('barcode', sql.VarChar, barcode)
      .query(`
        SELECT log_id, action, machine_id, user_id, status, error_message, created_at
        FROM activity_log
        WHERE barcode = @barcode
        ORDER BY created_at
      `);

    const allMachines = await pool.request().query('SELECT machine_id, machine_name, machine_code, sequence_order FROM machines WHERE is_active = 1 ORDER BY sequence_order');

    return {
      barcode: barcodeInfo.recordset[0],
      steps: steps.recordset,
      activityLog: logs.recordset,
      allMachines: allMachines.recordset,
      totalMachines: allMachines.recordset.length,
      machinesProcessed: steps.recordset.length,
      isComplete: steps.recordset.length >= allMachines.recordset.length,
    };
  },

  /** Activity log with pagination */
  async getActivityLog(page: number = 1, limit: number = 50, filters?: { action?: string; status?: string; machineId?: number; period?: string; startDate?: string; endDate?: string }) {
    const request = pool.request();
    const conditions: string[] = [];

    if (filters?.action) {
      conditions.push('action = @action');
      request.input('action', sql.VarChar, filters.action);
    }
    if (filters?.status) {
      conditions.push('status = @filter_status');
      request.input('filter_status', sql.VarChar, filters.status);
    }
    if (filters?.machineId) {
      conditions.push('machine_id = @filter_machine');
      request.input('filter_machine', sql.Int, filters.machineId);
    }
    if (filters?.period) {
      if (filters.startDate) request.input('startDate', sql.DateTime, new Date(filters.startDate));
      if (filters.endDate) request.input('endDate', sql.DateTime, new Date(filters.endDate));
      conditions.push(this._dateFilter('created_at', filters.period, request));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    const countResult = await pool.request().query(`SELECT COUNT(*) as total FROM activity_log ${whereClause.replace(/@\w+/g, 'NULL')}`);
    // Re-do count with proper params
    const countReq = pool.request();
    if (filters?.action) countReq.input('action', sql.VarChar, filters.action);
    if (filters?.status) countReq.input('filter_status', sql.VarChar, filters.status);
    if (filters?.machineId) countReq.input('filter_machine', sql.Int, filters.machineId);
    if (filters?.period && filters?.startDate) countReq.input('startDate', sql.DateTime, new Date(filters.startDate));
    if (filters?.period && filters?.endDate) countReq.input('endDate', sql.DateTime, new Date(filters.endDate));
    const totalResult = await countReq.query(`SELECT COUNT(*) as total FROM activity_log ${whereClause}`);

    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);

    const result = await request.query(`
      SELECT al.*, m.machine_name, m.machine_code
      FROM activity_log al
      LEFT JOIN machines m ON al.machine_id = m.machine_id
      ${whereClause}
      ORDER BY al.created_at DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

    return {
      logs: result.recordset,
      total: totalResult.recordset[0].total,
      page,
      limit,
      totalPages: Math.ceil(totalResult.recordset[0].total / limit),
    };
  },

  // ─── Database Management ───────────────────────────────────────────────────
  async clearAllData() {
    await pool.request().query('DELETE FROM activity_log');
    await pool.request().query('DELETE FROM machine_data');
    await pool.request().query('DELETE FROM barcodes');
    console.log('✅ All data cleared from database');
  },

  async dropDatabase() {
    try {
      await pool.close();
      const masterPool = await sql.connect(masterConfig);
      await masterPool.request().query(`
        IF EXISTS (SELECT name FROM sys.databases WHERE name = '${DB_NAME}')
        BEGIN
          ALTER DATABASE [${DB_NAME}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
          DROP DATABASE [${DB_NAME}];
          PRINT 'Dropped database ${DB_NAME}';
        END
      `);
      await masterPool.close();
      console.log(`✅ Database [${DB_NAME}] dropped`);
      await initializeSQLServerDatabase();
      console.log('✅ Fresh database created with empty tables');
    } catch (error) {
      console.error('Error dropping database:', error);
      throw error;
    }
  },

  async resetDatabase() {
    await this.clearAllData();
    console.log('✅ Database reset — tables preserved, data cleared');
  },
};

export default pool;

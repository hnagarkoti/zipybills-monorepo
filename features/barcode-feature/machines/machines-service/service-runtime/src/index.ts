import express from 'express';
import cors from 'cors';
import { getDbPool, sql } from '@zipybills/barcode-database-config';

const app = express();
const PORT = process.env.PORT || 3006;

app.use(cors());
app.use(express.json());

// Machine operations
const machineOperations = {
  async getAllMachines() {
    const pool = await getDbPool();
    const result = await pool.request().query('SELECT * FROM machines ORDER BY sequence_order');
    return result.recordset;
  },

  async getMachineById(machineId: number) {
    const pool = await getDbPool();
    const result = await pool
      .request()
      .input('machine_id', sql.Int, machineId)
      .query('SELECT * FROM machines WHERE machine_id = @machine_id');
    return result.recordset[0];
  },

  async createMachine(
    machineId: number,
    machineName: string,
    machineCode: string,
    sequenceOrder: number,
    description?: string,
    canGenerateBarcode: boolean = false
  ) {
    const pool = await getDbPool();
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

  async updateMachine(
    machineId: number,
    updates: {
      machineName?: string;
      machineCode?: string;
      sequenceOrder?: number;
      description?: string;
      isActive?: boolean;
      canGenerateBarcode?: boolean;
    }
  ) {
    const pool = await getDbPool();
    const fields = [];
    const request = pool.request().input('machine_id', sql.Int, machineId);

    if (updates.machineName !== undefined) {
      fields.push('machine_name = @machine_name');
      request.input('machine_name', sql.VarChar, updates.machineName);
    }
    if (updates.machineCode !== undefined) {
      fields.push('machine_code = @machine_code');
      request.input('machine_code', sql.VarChar, updates.machineCode);
    }
    if (updates.sequenceOrder !== undefined) {
      fields.push('sequence_order = @sequence_order');
      request.input('sequence_order', sql.Int, updates.sequenceOrder);
    }
    if (updates.description !== undefined) {
      fields.push('description = @description');
      request.input('description', sql.VarChar, updates.description);
    }
    if (updates.isActive !== undefined) {
      fields.push('is_active = @is_active');
      request.input('is_active', sql.Bit, updates.isActive ? 1 : 0);
    }
    if (updates.canGenerateBarcode !== undefined) {
      fields.push('can_generate_barcode = @can_generate');
      request.input('can_generate', sql.Bit, updates.canGenerateBarcode ? 1 : 0);
    }

    if (fields.length > 0) {
      fields.push('updated_at = GETDATE()');
      await request.query(`UPDATE machines SET ${fields.join(', ')} WHERE machine_id = @machine_id`);
    }
  },

  async deleteMachine(machineId: number) {
    const pool = await getDbPool();
    // Soft delete - set is_active to 0
    await pool
      .request()
      .input('machine_id', sql.Int, machineId)
      .query('UPDATE machines SET is_active = 0, updated_at = GETDATE() WHERE machine_id = @machine_id');
  },
};

// Initialize database tables on startup
async function initializeDatabase() {
  try {
    const pool = await getDbPool();

    // Create machines table
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

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IDX_machines_sequence')
      CREATE INDEX IDX_machines_sequence ON machines(sequence_order)
    `);

    console.log('✅ Database schema verified');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
}

// API Endpoints
app.get('/health', (req, res) => {
  res.json({ service: 'machines', status: 'ok' });
});

app.get('/api/machines', async (req, res) => {
  try {
    const machines = await machineOperations.getAllMachines();
    res.json({ success: true, machines });
  } catch (error) {
    console.error('Error fetching machines:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch machines' });
  }
});

app.get('/api/machines/:id', async (req, res) => {
  try {
    const machineId = parseInt(req.params.id);
    const machine = await machineOperations.getMachineById(machineId);
    if (!machine) {
      return res.status(404).json({ success: false, error: 'Machine not found' });
    }
    res.json({ success: true, machine });
  } catch (error) {
    console.error('Error fetching machine:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch machine' });
  }
});

app.post('/api/machines', async (req, res) => {
  try {
    const { machineId, machineName, machineCode, sequenceOrder, description, canGenerateBarcode } = req.body;

    if (!machineId || !machineName || !machineCode || sequenceOrder === undefined) {
      return res.status(400).json({ success: false, error: 'machineId, machineName, machineCode, and sequenceOrder are required' });
    }

    await machineOperations.createMachine(machineId, machineName, machineCode, sequenceOrder, description, canGenerateBarcode);
    res.json({ success: true, message: 'Machine created successfully' });
  } catch (error) {
    console.error('Error creating machine:', error);
    res.status(500).json({ success: false, error: 'Failed to create machine. May be duplicate ID or sequence.' });
  }
});

app.put('/api/machines/:id', async (req, res) => {
  try {
    const machineId = parseInt(req.params.id);
    const updates = req.body;

    await machineOperations.updateMachine(machineId, updates);
    res.json({ success: true, message: 'Machine updated successfully' });
  } catch (error) {
    console.error('Error updating machine:', error);
    res.status(500).json({ success: false, error: 'Failed to update machine' });
  }
});

app.delete('/api/machines/:id', async (req, res) => {
  try {
    const machineId = parseInt(req.params.id);
    await machineOperations.deleteMachine(machineId);
    res.json({ success: true, message: 'Machine deactivated successfully' });
  } catch (error) {
    console.error('Error deleting machine:', error);
    res.status(500).json({ success: false, error: 'Failed to delete machine' });
  }
});

// Initialize database and start server
initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🏭 Machines Service running on port ${PORT}`);
      console.log(`📊 Connected to SQL Server`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });

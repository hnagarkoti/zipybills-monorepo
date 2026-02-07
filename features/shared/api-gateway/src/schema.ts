/**
 * FactoryOS Database Schema Initializer
 *
 * Creates all tables and indexes. Called once on API gateway startup.
 */

import { query } from '@zipybills/factory-database-config';

export async function initializeDatabase(): Promise<void> {
  console.log('[FactoryOS DB] Initializing schema...');

  await query(`
    CREATE TABLE IF NOT EXISTS users (
      user_id       SERIAL PRIMARY KEY,
      username      VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      full_name     VARCHAR(200) NOT NULL,
      role          VARCHAR(20) NOT NULL DEFAULT 'OPERATOR'
                    CHECK (role IN ('ADMIN', 'SUPERVISOR', 'OPERATOR')),
      is_active     BOOLEAN DEFAULT true,
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      updated_at    TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS machines (
      machine_id    SERIAL PRIMARY KEY,
      machine_code  VARCHAR(50) UNIQUE NOT NULL,
      machine_name  VARCHAR(200) NOT NULL,
      department    VARCHAR(100),
      machine_type  VARCHAR(100),
      status        VARCHAR(20) DEFAULT 'ACTIVE'
                    CHECK (status IN ('ACTIVE', 'INACTIVE', 'MAINTENANCE')),
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      updated_at    TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS shifts (
      shift_id    SERIAL PRIMARY KEY,
      shift_name  VARCHAR(100) NOT NULL,
      start_time  TIME NOT NULL,
      end_time    TIME NOT NULL,
      is_active   BOOLEAN DEFAULT true,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS production_plans (
      plan_id          SERIAL PRIMARY KEY,
      machine_id       INT NOT NULL REFERENCES machines(machine_id),
      shift_id         INT NOT NULL REFERENCES shifts(shift_id),
      plan_date        DATE NOT NULL,
      product_name     VARCHAR(200) NOT NULL,
      product_code     VARCHAR(100),
      target_quantity  INT NOT NULL DEFAULT 0,
      status           VARCHAR(20) DEFAULT 'PLANNED'
                       CHECK (status IN ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
      created_by       INT REFERENCES users(user_id),
      created_at       TIMESTAMPTZ DEFAULT NOW(),
      updated_at       TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS production_logs (
      log_id             SERIAL PRIMARY KEY,
      plan_id            INT REFERENCES production_plans(plan_id),
      machine_id         INT NOT NULL REFERENCES machines(machine_id),
      shift_id           INT NOT NULL REFERENCES shifts(shift_id),
      operator_id        INT REFERENCES users(user_id),
      quantity_produced  INT NOT NULL DEFAULT 0,
      quantity_ok        INT NOT NULL DEFAULT 0,
      quantity_rejected  INT NOT NULL DEFAULT 0,
      rejection_reason   VARCHAR(500),
      hour_slot          VARCHAR(20),
      notes              TEXT,
      logged_at          TIMESTAMPTZ DEFAULT NOW(),
      created_at         TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS downtime_logs (
      downtime_id  SERIAL PRIMARY KEY,
      machine_id   INT NOT NULL REFERENCES machines(machine_id),
      shift_id     INT REFERENCES shifts(shift_id),
      operator_id  INT REFERENCES users(user_id),
      reason       VARCHAR(500) NOT NULL,
      category     VARCHAR(30) DEFAULT 'OTHER'
                   CHECK (category IN ('BREAKDOWN', 'MAINTENANCE', 'CHANGEOVER', 'MATERIAL', 'POWER', 'QUALITY', 'OTHER')),
      started_at   TIMESTAMPTZ NOT NULL,
      ended_at     TIMESTAMPTZ,
      duration_min INT,
      notes        TEXT,
      created_at   TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS activity_log (
      activity_id  SERIAL PRIMARY KEY,
      user_id      INT REFERENCES users(user_id),
      action       VARCHAR(100) NOT NULL,
      entity_type  VARCHAR(50),
      entity_id    INT,
      details      TEXT,
      ip_address   VARCHAR(45),
      created_at   TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Indexes
  await query(`CREATE INDEX IF NOT EXISTS idx_production_plans_date ON production_plans(plan_date);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_production_plans_machine ON production_plans(machine_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_production_logs_plan ON production_logs(plan_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_production_logs_machine ON production_logs(machine_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_production_logs_logged ON production_logs(logged_at);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_downtime_logs_machine ON downtime_logs(machine_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_downtime_logs_started ON downtime_logs(started_at);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id);`);

  console.log('[FactoryOS DB] ✅ Schema initialized');
}

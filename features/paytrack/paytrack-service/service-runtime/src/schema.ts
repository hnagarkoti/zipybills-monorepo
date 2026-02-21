/**
 * PayTrack – Database Schema
 * Material tracking & payment management tables.
 * All tables use `tenant_id` for row-level multi-tenancy isolation.
 * Prefix: `pt_` to namespace and avoid collisions with FactoryOS tables.
 */

import { query } from '@zipybills/factory-database-config';

export async function initializePayTrackSchema(): Promise<void> {
  console.log('[PayTrack] Initializing database schema…');

  /* ── Vendors ── */
  await query(`
    CREATE TABLE IF NOT EXISTS pt_vendors (
      id            SERIAL PRIMARY KEY,
      tenant_id     INTEGER NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
      name          VARCHAR(255) NOT NULL,
      phone         VARCHAR(30),
      email         VARCHAR(255),
      gstin         VARCHAR(20),
      address       TEXT,
      notes         TEXT,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      deleted_at    TIMESTAMPTZ,
      UNIQUE(tenant_id, name)
    );
  `);

  /* ── Projects ── */
  await query(`
    CREATE TABLE IF NOT EXISTS pt_projects (
      id            SERIAL PRIMARY KEY,
      tenant_id     INTEGER NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
      name          VARCHAR(255) NOT NULL,
      client_name   VARCHAR(255),
      description   TEXT,
      budget        NUMERIC(14,2),
      status        VARCHAR(20) NOT NULL DEFAULT 'active',
      created_by    INTEGER REFERENCES users(user_id),
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      deleted_at    TIMESTAMPTZ,
      UNIQUE(tenant_id, name)
    );
  `);

  /* ── Materials ── */
  await query(`
    CREATE TABLE IF NOT EXISTS pt_materials (
      id                SERIAL PRIMARY KEY,
      tenant_id         INTEGER NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
      project_id        INTEGER NOT NULL REFERENCES pt_projects(id) ON DELETE CASCADE,
      vendor_id         INTEGER NOT NULL REFERENCES pt_vendors(id) ON DELETE CASCADE,
      material_name     VARCHAR(255) NOT NULL,
      quantity          NUMERIC(12,2) NOT NULL DEFAULT 1,
      unit              VARCHAR(20) NOT NULL DEFAULT 'pcs',
      invoice_number    VARCHAR(100),
      invoice_image_url TEXT,
      amount            NUMERIC(14,2) NOT NULL DEFAULT 0,
      gst_amount        NUMERIC(14,2) NOT NULL DEFAULT 0,
      total_amount      NUMERIC(14,2) NOT NULL DEFAULT 0,
      notes             TEXT,
      status            VARCHAR(20) NOT NULL DEFAULT 'pending',
      created_by        INTEGER NOT NULL REFERENCES users(user_id),
      approved_by       INTEGER,
      approved_at       TIMESTAMPTZ,
      created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      deleted_at        TIMESTAMPTZ
    );
  `);

  /* ── Payments ── */
  await query(`
    CREATE TABLE IF NOT EXISTS pt_payments (
      id                SERIAL PRIMARY KEY,
      tenant_id         INTEGER NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
      material_id       INTEGER NOT NULL REFERENCES pt_materials(id) ON DELETE CASCADE,
      payment_mode      VARCHAR(20) NOT NULL,
      transaction_id    VARCHAR(255),
      payment_date      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      paid_amount       NUMERIC(14,2) NOT NULL,
      proof_image_url   TEXT,
      notes             TEXT,
      created_by        INTEGER NOT NULL REFERENCES users(user_id),
      created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  /* ── Indexes for performance ── */
  await query(`CREATE INDEX IF NOT EXISTS idx_pt_vendors_tenant     ON pt_vendors(tenant_id)     WHERE deleted_at IS NULL;`);
  await query(`CREATE INDEX IF NOT EXISTS idx_pt_projects_tenant    ON pt_projects(tenant_id)    WHERE deleted_at IS NULL;`);
  await query(`CREATE INDEX IF NOT EXISTS idx_pt_materials_tenant   ON pt_materials(tenant_id)   WHERE deleted_at IS NULL;`);
  await query(`CREATE INDEX IF NOT EXISTS idx_pt_materials_project  ON pt_materials(tenant_id, project_id)  WHERE deleted_at IS NULL;`);
  await query(`CREATE INDEX IF NOT EXISTS idx_pt_materials_vendor   ON pt_materials(tenant_id, vendor_id)   WHERE deleted_at IS NULL;`);
  await query(`CREATE INDEX IF NOT EXISTS idx_pt_materials_invoice  ON pt_materials(tenant_id, invoice_number) WHERE deleted_at IS NULL;`);
  await query(`CREATE INDEX IF NOT EXISTS idx_pt_materials_status   ON pt_materials(tenant_id, status)      WHERE deleted_at IS NULL;`);
  await query(`CREATE INDEX IF NOT EXISTS idx_pt_payments_tenant    ON pt_payments(tenant_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_pt_payments_material  ON pt_payments(tenant_id, material_id);`);

  console.log('[PayTrack] Schema initialized ✓');
}

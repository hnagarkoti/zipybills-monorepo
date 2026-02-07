/**
 * FactoryOS API Gateway
 *
 * Single entry point that:
 * 1. Initializes the database schema
 * 2. Seeds default data (admin user, shifts)
 * 3. Mounts all per-feature Express routers under /api
 *
 * Each feature service is an independent package that exports an Express Router.
 */

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';

// Schema & seed helpers
import { initializeDatabase } from './schema.js';
import { authRouter, seedDefaultAdmin } from '@zipybills/factory-auth-service-runtime';
import { machinesRouter } from '@zipybills/factory-machines-service-runtime';
import { shiftsRouter, seedDefaultShifts } from '@zipybills/factory-shifts-service-runtime';
import { planningRouter } from '@zipybills/factory-planning-service-runtime';
import { downtimeRouter } from '@zipybills/factory-downtime-service-runtime';
import { dashboardRouter } from '@zipybills/factory-dashboard-service-runtime';
import { reportsRouter } from '@zipybills/factory-reports-service-runtime';

const app = express();
const PORT = parseInt(process.env.PORT || '4000', 10);

app.use(cors());
app.use(express.json());

// ─── Health Check ────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    service: 'FactoryOS API Gateway',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ─── Mount Feature Routers ───────────────────

app.use('/api', authRouter);       // /api/auth/*, /api/users/*
app.use('/api', machinesRouter);    // /api/machines/*
app.use('/api', shiftsRouter);      // /api/shifts/*
app.use('/api', planningRouter);    // /api/plans/*, /api/production-logs/*
app.use('/api', downtimeRouter);    // /api/downtime/*
app.use('/api', dashboardRouter);   // /api/dashboard
app.use('/api', reportsRouter);     // /api/reports/*

// ─── Startup ─────────────────────────────────

async function startServer(): Promise<void> {
  try {
    await initializeDatabase();
    await seedDefaultAdmin();
    await seedDefaultShifts();

    app.listen(PORT, () => {
      console.log(`\n🏭 FactoryOS API Gateway running on http://localhost:${PORT}`);
      console.log(`   Health:     GET  http://localhost:${PORT}/api/health`);
      console.log(`   Auth:       POST http://localhost:${PORT}/api/auth/login`);
      console.log(`   Machines:   GET  http://localhost:${PORT}/api/machines`);
      console.log(`   Shifts:     GET  http://localhost:${PORT}/api/shifts`);
      console.log(`   Plans:      GET  http://localhost:${PORT}/api/plans`);
      console.log(`   Dashboard:  GET  http://localhost:${PORT}/api/dashboard`);
      console.log(`   Reports:    GET  http://localhost:${PORT}/api/reports/production\n`);
    });
  } catch (err) {
    console.error('[FactoryOS] ❌ Failed to start server:', err);
    process.exit(1);
  }
}

startServer();

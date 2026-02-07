/**
 * FactoryOS Reports Service Runtime
 *
 * Express router for all report endpoints.
 * Routes: /api/reports/*
 */

import { Router } from 'express';
import * as db from './database.js';

export const reportsRouter = Router();

reportsRouter.get('/reports/production', async (req, res) => {
  try {
    const { start_date, end_date, machine_id, shift_id } = req.query;
    if (!start_date || !end_date) {
      res.status(400).json({ success: false, error: 'start_date and end_date required' });
      return;
    }
    const data = await db.getProductionReport({
      start_date: start_date as string,
      end_date: end_date as string,
      machine_id: machine_id ? parseInt(machine_id as string, 10) : undefined,
      shift_id: shift_id ? parseInt(shift_id as string, 10) : undefined,
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch production report' });
  }
});

reportsRouter.get('/reports/machine-wise', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    if (!start_date || !end_date) {
      res.status(400).json({ success: false, error: 'start_date and end_date required' });
      return;
    }
    const data = await db.getMachineWiseReport(start_date as string, end_date as string);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch machine-wise report' });
  }
});

reportsRouter.get('/reports/shift-wise', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    if (!start_date || !end_date) {
      res.status(400).json({ success: false, error: 'start_date and end_date required' });
      return;
    }
    const data = await db.getShiftWiseReport(start_date as string, end_date as string);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch shift-wise report' });
  }
});

reportsRouter.get('/reports/rejections', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    if (!start_date || !end_date) {
      res.status(400).json({ success: false, error: 'start_date and end_date required' });
      return;
    }
    const data = await db.getRejectionReport(start_date as string, end_date as string);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch rejection report' });
  }
});

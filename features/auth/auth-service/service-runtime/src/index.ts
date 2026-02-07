/**
 * FactoryOS Auth Service Runtime
 *
 * Express router for authentication & user management.
 * Routes: /api/auth/*, /api/users/*
 */

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import {
  generateToken,
  requireAuth,
  requireRole,
  type AuthenticatedRequest,
} from '@zipybills/factory-auth-middleware';
import { logActivity } from '@zipybills/factory-activity-log';
import * as db from './database.js';

export const authRouter = Router();

// ─── Auth Routes ─────────────────────────────

authRouter.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ success: false, error: 'Username and password required' });
      return;
    }

    const user = await db.getUserByUsername(username);
    if (!user || !user.is_active) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    const token = generateToken({
      user_id: user.user_id,
      username: user.username,
      role: user.role,
      full_name: user.full_name,
    });

    await logActivity(user.user_id, 'LOGIN', 'user', user.user_id, `User ${user.username} logged in`, req.ip);

    res.json({
      success: true,
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

authRouter.get('/auth/me', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await db.getUserById(req.user!.user_id);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }
    const { password_hash, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch user' });
  }
});

// ─── User Management Routes ─────────────────

authRouter.get('/users', requireAuth, requireRole('ADMIN', 'SUPERVISOR'), async (_req, res) => {
  try {
    const users = await db.getAllUsers();
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

authRouter.post('/users', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res) => {
  try {
    const { username, password, full_name, role } = req.body;
    if (!username || !password || !full_name || !role) {
      res.status(400).json({ success: false, error: 'All fields required: username, password, full_name, role' });
      return;
    }

    const existing = await db.getUserByUsername(username);
    if (existing) {
      res.status(409).json({ success: false, error: 'Username already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await db.createUser(username, passwordHash, full_name, role);
    await logActivity(req.user!.user_id, 'CREATE_USER', 'user', user.user_id, `Created user ${username} (${role})`, req.ip);

    const { password_hash, ...safeUser } = user;
    res.status(201).json({ success: true, user: safeUser });
  } catch (err) {
    console.error('[Users] Create error:', err);
    res.status(500).json({ success: false, error: 'Failed to create user' });
  }
});

authRouter.put('/users/:id', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res) => {
  try {
    const userId = parseInt(String(req.params.id), 10);
    const user = await db.updateUser(userId, req.body);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }
    await logActivity(req.user!.user_id, 'UPDATE_USER', 'user', userId, JSON.stringify(req.body), req.ip);

    const { password_hash, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update user' });
  }
});

// ─── Seed helpers (used by API gateway on startup) ───

export async function seedDefaultAdmin(): Promise<void> {
  const count = await db.getUserCount();
  if (count === 0) {
    const username = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
    const password = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
    const hash = await bcrypt.hash(password, 10);
    await db.createUser(username, hash, 'Administrator', 'ADMIN');
    console.log(`[FactoryOS] ✅ Default admin created: ${username} / ${password}`);
  }
}

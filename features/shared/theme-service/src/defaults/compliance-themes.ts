/**
 * Compliance Themes
 *
 * Layer 5: Regulatory and compliance-driven UI overlays.
 * These enforce visual indicators for audit trails, validation states,
 * and traceability requirements.
 */
import type { ThemeDefinition } from '../types.js';

export const COMPLIANCE_THEMES: ThemeDefinition[] = [
  // ─── Standard (no compliance overlay) ─────────
  {
    id: 'compliance:standard',
    name: 'Standard',
    description: 'No compliance overlay – normal operation mode',
    layer: 'compliance',
    tokens: {
      behavior: {
        complianceWatermark: false,
        auditTrailVisible: false,
        readOnlyMode: false,
      },
    },
    meta: { version: '1.0.0', isSystem: true, tags: ['standard', 'normal'] },
  },

  // ─── Audit Mode ──────────────────────────────
  // Visual watermark, forced audit trail visibility, no destructive actions
  {
    id: 'compliance:audit-mode',
    name: 'Audit Mode',
    description: 'Audit compliance mode – watermark, visible audit trail, restricted destructive actions',
    layer: 'compliance',
    tokens: {
      colors: {
        surface: {
          background: '#fffbeb',
          foreground: '#111827',
          card: '#ffffff',
          cardForeground: '#111827',
          muted: '#fef3c7',
          mutedForeground: '#92400e',
          border: '#fcd34d',
          input: '#fde68a',
          ring: '#f59e0b',
        },
        brand: {
          primary: '#f59e0b',
          primaryForeground: '#ffffff',
          accent: '#d97706',
          accentForeground: '#ffffff',
        },
      },
      behavior: {
        complianceWatermark: true,
        auditTrailVisible: true,
        readOnlyMode: false,
        animationsEnabled: false,
      },
    },
    meta: { version: '1.0.0', isSystem: true, tags: ['audit', 'compliance', 'watermark'] },
  },

  // ─── Validation Mode ─────────────────────────
  // Read-only, validation indicators, locked UI
  {
    id: 'compliance:validation-mode',
    name: 'Validation Mode',
    description: 'Validation compliance mode – read-only UI, validation indicators, locked configuration',
    layer: 'compliance',
    tokens: {
      colors: {
        surface: {
          background: '#eff6ff',
          foreground: '#111827',
          card: '#ffffff',
          cardForeground: '#111827',
          muted: '#dbeafe',
          mutedForeground: '#1e40af',
          border: '#93c5fd',
          input: '#bfdbfe',
          ring: '#3b82f6',
        },
        brand: {
          primary: '#3b82f6',
          primaryForeground: '#ffffff',
          accent: '#2563eb',
          accentForeground: '#ffffff',
        },
      },
      behavior: {
        complianceWatermark: true,
        auditTrailVisible: true,
        readOnlyMode: true,
        animationsEnabled: false,
      },
    },
    meta: { version: '1.0.0', isSystem: true, tags: ['validation', 'compliance', 'read-only', 'locked'] },
  },

  // ─── Traceability Mode ───────────────────────
  // Full traceability: every action logged, enhanced timestamps, chain-of-custody UI
  {
    id: 'compliance:traceability-mode',
    name: 'Traceability Mode',
    description: 'Traceability compliance mode – every action logged, timestamps visible, chain-of-custody indicators',
    layer: 'compliance',
    tokens: {
      colors: {
        surface: {
          background: '#f0fdf4',
          foreground: '#111827',
          card: '#ffffff',
          cardForeground: '#111827',
          muted: '#dcfce7',
          mutedForeground: '#166534',
          border: '#86efac',
          input: '#bbf7d0',
          ring: '#22c55e',
        },
        brand: {
          primary: '#22c55e',
          primaryForeground: '#ffffff',
          accent: '#16a34a',
          accentForeground: '#ffffff',
        },
      },
      behavior: {
        complianceWatermark: true,
        auditTrailVisible: true,
        readOnlyMode: false,
        animationsEnabled: false,
      },
    },
    meta: { version: '1.0.0', isSystem: true, tags: ['traceability', 'compliance', 'chain-of-custody'] },
  },
];

/**
 * ─── Contact Configuration ─────────────────────────────────────
 * Single source of truth for all contact details across the
 * marketing site.  Reads env vars first, falls back to defaults.
 *
 * Server Components  → import directly (process.env is available).
 * Client Components  → import the NEXT_PUBLIC_* re-exports.
 * ────────────────────────────────────────────────────────────── */

function env(key: string, fallback: string): string {
  return process.env[key] ?? process.env[`NEXT_PUBLIC_${key}`] ?? fallback;
}

/* ── Phone numbers ── */
export const PHONE_PRIMARY   = env('CONTACT_PHONE_PRIMARY',   '+91 98912 41863');
export const PHONE_ALTERNATE = env('CONTACT_PHONE_ALTERNATE', '+91 98115 64873');

/** WhatsApp number — digits only, no + or spaces (country code + number) */
export const WHATSAPP_NUMBER = env('CONTACT_WHATSAPP', '919891241863');

/** Display string: "primary / alternate" */
export const PHONE_DISPLAY = `${PHONE_PRIMARY} / ${PHONE_ALTERNATE}`;

/** tel: link-safe primary number (digits only with leading +) */
export const PHONE_PRIMARY_TEL = PHONE_PRIMARY.replace(/\s/g, '');

/** tel: link-safe alternate number */
export const PHONE_ALTERNATE_TEL = PHONE_ALTERNATE.replace(/\s/g, '');

/* ── Email ── */
export const CONTACT_EMAIL = env('CONTACT_EMAIL', 'contact@factoryos.in');

/* ── Business hours ── */
export const BUSINESS_HOURS = env('CONTACT_BUSINESS_HOURS', 'Mon–Sat, 9 AM–6 PM IST');

/* ── Schema.org telephone (dashes for structured data) ── */
export const SCHEMA_TELEPHONE = PHONE_PRIMARY.replace(/\s/g, '-');

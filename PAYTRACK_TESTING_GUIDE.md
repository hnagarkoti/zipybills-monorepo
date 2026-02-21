# PayTrack Module — Testing Guide

## Quick Start

```bash
# Terminal 1: API server
pnpm dev:factory-api

# Terminal 2: Web app
pnpm dev:factory-web
```

Open `http://localhost:8081` in your browser.

---

## 1. Plan Tier Gating (FREE vs STARTER+)

### Test: FREE plan hides PayTrack
1. Log in as a user on a **FREE** plan tenant.
2. Check the sidebar/bottom nav — **PayTrack** should **NOT** appear.
3. Directly navigate to `/paytrack` — you should be redirected or see an empty page.

### Test: STARTER+ plan shows PayTrack
1. Log in as a user on a **STARTER** (or higher) plan tenant.
2. The sidebar should show the **PayTrack** icon (Receipt icon).
3. Clicking it navigates to `/paytrack`.

---

## 2. Feature Flag (Platform Admin Toggle)

### Test: Disable PayTrack for a tenant
1. In your **Platform Admin** console, find the tenant.
2. Disable the `paytrack` feature flag (calls `featureRegistry.disableFeature('paytrack')`).
3. That tenant's users should no longer see PayTrack in the nav — even if on STARTER+ plan.

### Test: Re-enable
1. Enable the `paytrack` feature again.
2. PayTrack reappears for that tenant's users.

---

## 3. Sub-Route Navigation

### Desktop (≥ 768px width)
1. Navigate to `/paytrack` — you should be auto-redirected to `/paytrack/dashboard` (or `/paytrack/materials` for operators).
2. A **sidebar** appears on the left with module cards: Dashboard, Materials, Projects, Vendors, Payments.
3. Click each tab — the URL changes and the right panel displays the correct page.
4. The active tab is highlighted with a left border accent.

### Mobile (< 768px)
1. Navigate to `/paytrack` — you see a **module card list** (similar to Settings mobile view).
2. Tap any module card → navigates to the full-screen sub-page (e.g., `/paytrack/materials`).
3. Use the back button/gesture to return to the PayTrack index.

### Expected routes:
| Route | Page |
|---|---|
| `/paytrack` | Index (redirects on desktop, card list on mobile) |
| `/paytrack/dashboard` | Dashboard summary |
| `/paytrack/materials` | Material entries list |
| `/paytrack/projects` | Projects management |
| `/paytrack/vendors` | Vendors management |
| `/paytrack/payments` | Payment history |

---

## 4. Role-Based Access

### ADMIN role
- **Dashboard**: Sees all stats — total materials, total amount (₹), paid amount, pending amount, vendor breakdown, monthly expenses, project financials.
- **Materials**: Can Add, Edit, Approve, Request Payment, Mark Paid, Reject entries.
- **Projects**: Can Add, Edit, Delete projects.
- **Vendors**: Can Add, Edit, Delete vendors.
- **Payments**: Views all payment history.
- **Sidebar**: All 5 tabs visible.

### SUPERVISOR role
- **Dashboard**: Sees material counts, status breakdown, project names/counts — **NO financial amounts** (no ₹).
- **Materials**: Can Add, Edit, Approve, Request Payment, Reject — **cannot Mark Paid**.
- **Projects**: Can Add, Edit — **cannot Delete**.
- **Vendors**: Can Add, Edit — **cannot Delete**.
- **Payments**: Tab visible, views payment status.
- **Sidebar**: All 5 tabs visible.

### OPERATOR role
- **Dashboard**: Tab hidden (not in sidebar).
- **Materials**: Can view and add own entries — **cannot Approve, Request Payment, Mark Paid, Reject**.
- **Projects**: Can **view only** — no Add, Edit, Delete buttons.
- **Vendors**: Can **view only** — no Add, Edit, Delete buttons.
- **Payments**: Tab hidden (not in sidebar).
- **Sidebar**: Only Materials, Projects, Vendors visible.

### How to test roles:
- Change the `user.role` in your auth store to `'ADMIN'`, `'SUPERVISOR'`, or `'OPERATOR'`.
- Or use different test accounts with different roles assigned in the database.

---

## 5. Backup & Data — Module Selection

### Test: Module checkboxes
1. Go to **Settings → Backup & Data** (`/settings/backup`).
2. Above the backup action cards, you should see a **"Select Modules"** section.
3. All modules are checked by default: PayTrack, Production Planning, Shifts, Machines, Downtime, Reports, Settings.
4. Uncheck some modules → the bottom status shows the count (e.g., "3 modules selected").
5. Click "Select All" / "Deselect All" toggle.

### Test: Encryption toggle
1. Below the module checkboxes, there's an **"Encrypt Backup"** switch (ON by default).
2. Toggle it OFF → status shows "3 modules selected" (without "· Encrypted").
3. Toggle it ON → status shows "3 modules selected · Encrypted".

### Test: Backup with modules
1. Select only **PayTrack** and **Shifts**.
2. Enable encryption.
3. Click **"Export & Download"** → the export request sends `{ modules: ['paytrack', 'shifts'], encrypted: true }` to the server.
4. Same for **Cloud Backup** and **Google Drive Backup** — they all pass the module selection + encryption flag.

### Test: No modules selected
1. Deselect all modules.
2. Click any backup button → see error toast: "Please select at least one module".

### Server-side encryption
- The `BACKUP_ENCRYPTION_KEY` env variable must be set on the server.
- When `encrypted: true` is passed, the backup service encrypts data with AES-256 before storing/uploading.

---

## 6. i18n (Multi-language)

### Test translations
1. Switch language to **Hindi** (Settings → Language).
2. Navigate to `/paytrack` — verify:
   - Tab labels are in Hindi (डैशबोर्ड, सामग्री, परियोजनाएं, विक्रेता, भुगतान).
   - Tab descriptions appear in Hindi.
   - Page subtitle shows Hindi text.
3. Switch to **French** or **Spanish** and repeat.
4. In Backup page, module names should also be translated.

---

## 7. Env Variables

Ensure these are set in your `.env`:

```
# Required for Google Drive backup encryption
BACKUP_ENCRYPTION_KEY=your-256-bit-secret-key-here

# Google Drive OAuth (for Google Drive backup feature)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=...
```

---

## Troubleshooting

| Issue | Solution |
|---|---|
| PayTrack doesn't appear in nav | Check user's plan is STARTER+, and `paytrack` feature flag is enabled |
| No dashboard for Operator | Expected — Operators don't get the Dashboard tab |
| Buttons missing for Operator | Expected — Operators have read-only access to Projects and Vendors |
| Backup modules section missing | Ensure `settings-frontend` has the latest `BackupSettings.tsx` changes |
| Locale keys showing raw keys | Run `pnpm install` to rebuild i18n-engine after locale file changes |

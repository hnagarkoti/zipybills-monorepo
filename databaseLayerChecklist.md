🧱 A. Database Layer Checklist
Tenant Core

 tenants table created

 slug unique constraint

 plan enum defined

 license_type enum (saas | onprem)

 settings JSONB column

 is_active flag

 expires_at field

 Index on slug

Tenant Column Enforcement

For EVERY business table:

 tenant_id UUID NOT NULL

 Foreign key → tenants(id)

 Composite index (tenant_id, id)

 Composite index (tenant_id, created_at)

 Migration backfill completed

 No nullable tenant_id remains

Tables to verify:

 users

 roles

 machines

 shifts

 production

 downtime

 reports

 audit_logs

 backups

🔐 B. Authentication Checklist

 JWT contains tenant_id

 JWT contains role

 JWT contains permissions

 Tenant validation middleware implemented

 Tenant suspension blocks login

 Expired subscription blocks login (SaaS mode)

 License validation blocks login (On-prem mode)

🧠 C. Tenant Context Layer

 Centralized TenantContext middleware exists

 tenant_id never accepted from request body

 tenant_id extracted only from JWT

 All repositories receive tenant_id implicitly

 No service manually queries without tenant filter

💳 D. Plan Enforcement

 Plan config table or config object exists

 max_users enforced

 max_machines enforced

 Feature gating implemented

 Structured error for plan limit exceeded

 Plan enforcement tested

👑 E. Superadmin

 Superadmin role not tied to tenant

 Global tenant listing page

 Activate / suspend tenant

 Change plan

 View tenant usage metrics

 Impersonation feature

 Impersonation logged in audit

 Revenue dashboard

 Tenant deletion / export feature

📜 F. Audit System

 tenant_id logged in every entry

 user_id logged

 IP address logged

 entity change diff stored

 Cross-tenant audit search blocked

 Superadmin global audit search exists

⚙️ G. Configurability

 Branding stored in tenant.settings

 Feature flags per tenant

 Shift config per tenant

 Language per tenant

 Backup settings per tenant

 Settings cached (Redis optional)

📡 H. Frontend

 Tenant settings fetched after login

 Dynamic branding applied

 Plan restrictions reflected in UI

 Feature flags respected

 No manual tenant_id in API calls

🔄 I. Deployment Mode Safety

 DEPLOYMENT_MODE env implemented

 SaaS logic disabled in on-prem

 Superadmin disabled in on-prem

 License validation active in on-prem

🛡 J. Security

 No endpoint allows cross-tenant data

 Rate limiting per tenant

 Cross-tenant access attempts logged

 Enumeration attack tested

 Soft delete implemented
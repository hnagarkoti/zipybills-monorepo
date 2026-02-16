

Todo Item once base is ready:

# FactoryOS – Core Technical Blueprint

This document defines the foundational technical assets required to build, deploy, and scale **FactoryOS – Hybrid Production Monitoring Platform (SaaS + On-Prem)**.

---

## 1. UI Wireframes (Functional Structure)

### Core Screens

* **Login / Auth**

  * Username/password
  * Role-based login
  * On-Prem vs SaaS detection

* **Dashboard (Live View)**

  * Production KPIs
  * Machine status grid
  * Shift performance
  * Downtime alerts
  * Rejection metrics

* **Machine Management**

  * Machine list
  * Machine configuration
  * Status mapping
  * Line/group mapping

* **Production Planning**

  * Shift planning
  * Target setting
  * Operator assignment
  * Machine scheduling

* **Operator Input Screen**

  * Production entry
  * Rejection entry
  * Downtime reason entry
  * Shift selection

* **Reports**

  * Machine-wise reports
  * Shift-wise reports
  * Operator-wise reports
  * Rejection reports
  * Export (PDF/Excel)

* **Admin Panel**

  * User roles
  * Permissions
  * License management
  * Backup control
  * System config

---

## 2. API Design (Service-Oriented)

### Core Services

**Auth Service**

* POST /auth/login
* POST /auth/logout
* POST /auth/register
* GET /auth/me

**User Service**

* GET /users
* POST /users
* PUT /users/:id
* DELETE /users/:id

**Machine Service**

* GET /machines
* POST /machines
* PUT /machines/:id
* DELETE /machines/:id

**Production Service**

* POST /production/plan
* POST /production/entry
* GET /production/live

**Shift Service**

* GET /shifts
* POST /shifts
* PUT /shifts/:id

**Downtime Service**

* POST /downtime
* GET /downtime/reasons

**Reports Service**

* GET /reports/production
* GET /reports/machines
* GET /reports/shifts
* GET /reports/rejections

**Admin Service**

* POST /license/activate
* GET /system/health
* POST /backup/create

---

## 3. DB Schema (Core Entities)

### PostgreSQL (Production Data)

**users**

* id (PK)
* name
* role
* email
* password_hash
* status

**machines**

* id (PK)
* name
* line
* status
* capacity

**shifts**

* id (PK)
* name
* start_time
* end_time

**production_plans**

* id (PK)
* machine_id (FK)
* shift_id (FK)
* target_qty
* date

**production_logs**

* id (PK)
* machine_id (FK)
* operator_id (FK)
* qty
* shift_id (FK)
* timestamp

**downtime_logs**

* id (PK)
* machine_id (FK)
* reason
* duration
* shift_id (FK)

**rejections**

* id (PK)
* machine_id (FK)
* reason
* qty
* shift_id (FK)

### MongoDB (Logs)

**audit_logs**

* action
* user
* timestamp
* module

**system_logs**

* service
* level
* message
* timestamp

---

## 4. Architecture Diagram (Logical View)

### On-Prem Architecture

[Expo App]
→ [Nginx]
→ [Node.js API Server]
→ [PostgreSQL]
→ [MongoDB]

Local LAN Access Only
Offline Capable

---

### SaaS Architecture

[Mobile/Web Apps]
→ [API Gateway]
→ [Auth Service]
→ [Production Service]
→ [Reporting Service]
→ [PostgreSQL Cluster]
→ [Redis Cache]

Multi-Tenant Cloud Deployment

---

## 5. Installer Script Design (On-Prem)

### Installer Flow

1. System Check

   * OS validation
   * Docker check
   * Port availability

2. Dependency Setup

   * Docker install
   * Docker Compose install

3. Service Deployment

   * Node.js container
   * PostgreSQL container
   * MongoDB container
   * Nginx container

4. Configuration

   * Environment variables
   * LAN IP binding
   * Storage volumes

5. Database Init

   * Schema creation
   * Seed data
   * Admin user creation

6. License Activation

   * License key input
   * Local validation

7. System Boot

   * Start all services
   * Health checks
   * Admin panel URL output

### Output

* Local access URL
* Admin credentials
* Backup path
* System status report

---

This blueprint is designed to support:

* On-Prem enterprise deployments
* SaaS scalability
* Offline-first factories
* Government/secure environments
* Future SaaS migration
* Modular expansion

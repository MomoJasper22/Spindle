# Master System & Engineering Prompt: Build "Spindle"

## 1. Role & Antigravity Global Skills Activation

You are a Principal Full-Stack Architect, Senior Product Designer, and PostgreSQL Database Engineer tasked with building **Spindle**—a production-grade, commercial-quality Appliance Repair, Field Service Scheduling, and Customer Operations CRM web application tailored specifically for the **Philippine market**.

Before writing any code, SQL migration, or UI component, you **MUST** load, consult, and strictly enforce the patterns from the following **Antigravity Global Skills**:
1. **`tailwindcss`** (from Antigravity global skills store) — Apply modern Tailwind CSS architecture, semantic design tokens, responsive container queries/breakpoints, and zero-bloat utility composition.
2. **`ui-ux-pro-max`** (from Antigravity global skills store) — Apply enterprise SaaS visual hierarchy, accessible contrast ratios, refined micro-interactions, skeleton loading states, empty-state ergonomics, and high-clarity data density inspired by **Salesforce, ClickUp, Monday.com, Zoho CRM, Zendesk, and Pipedrive**.
3. **`supabase-postgres-best-practices`** (from Antigravity global skills store) — Enforce indexed foreign keys, optimized Row-Level Security (RLS) using `(select auth.uid())`, parameterized queries, strict ACID transactions, row-level locking, and SSR cookie-based session security.

---

## 2. Hard Guardrails & Non-Negotiable Constraints

You must adhere strictly to every rule below throughout the entire codebase and database:

1. **Commercial Production Authenticity (Like a Normal Live Website)**:
   - Build **Spindle** as a real, commercial Philippine appliance repair & service operations platform.
   - **DO NOT** put any traces, labels, footers, badges, disclaimers, or copy implying the site was created for a school project, capstone, academic exercise, or prototype.
2. **NO Demo Accounts or Demo Data**:
   - **DO NOT** create demo login buttons, pre-filled test credentials, fake customer/repair seed rows, or hardcoded mock JSON arrays in any dashboard or table.
   - All lists, charts, pipelines, and tables must query live Supabase PostgreSQL data and display clean, actionable empty states when no records exist.
   - *Exception*: Seed **only** the three mandatory system role definitions in `public.user_types` (`UTP-CUST`, `UTP-TECH`, `UTP-ADMIN`) so new user sign-ups and RBAC foreign keys function immediately.
3. **NO Notification Feature**:
   - **DO NOT** add a notification bell, notification center, unread badge counter, `notifications` database table, or system alert feed anywhere in the UI or backend.
4. **NO Inventory Feature**:
   - **DO NOT** add spare parts catalogs, stock-in/stock-out tracking, parts warehouses, or inventory management tables/pages.
5. **NO Warranty Feature**:
   - **DO NOT** add warranty tracking, warranty expiry dates, warranty validation, or warranty claim toggles anywhere in the database schema, forms, filters, or UI (explicitly omit `warranty_expiry_date` and `is_warranty_claim` from the database and application).
6. **Strict Subfolder Separation**:
   - Physically separate the **Customer**, **Technician**, and **Admin** routes and feature modules into dedicated `customer`, `technician`, and `admin` subfolders in both `src/app/` and `src/features/`.

---

## 3. Core Tech Stack & Environment Setup

- **Framework**: Next.js (App Router, Feature-Based Architecture, Server Components + Server Actions / Route Handlers)
- **Language**: TypeScript (`strict: true`, zero `any` types)
- **Styling & UI**: Tailwind CSS + `shadcn/ui` + Lucide Icons
- **Database & Authentication**: Supabase (Free Tier — PostgreSQL, Supabase Auth with `@supabase/ssr`, Row-Level Security, PL/pgSQL RPC Transactions)
- **Form State & Validation**: React Hook Form + `@hookform/resolvers/zod` + Zod (shared client & server validation schemas)
- **Hosting & CI/CD Target**: GitHub + Vercel (enforcing HTTPS/SSL, clean `next build` with zero TypeScript or ESLint errors)

### Environment Variables (`.env.local` & `.env.example`)
Configure the environment layer using the exact project credentials below, exposing public variables safely to Next.js client bundles while isolating the secret key strictly on the server (`import 'server-only'`):

~~~env
# Provided Supabase Credentials
SUPABASE_URL=https://juooobshtrcnnmcticzt.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_pGFJ1vqz3-MGuFdCQuMqJA_DKxlqag3
SUPABASE_SECRET_KEY=sb_secret_zN_BNL43CxmCVmQjAM4WbA_p5UpwjW8
SUPABASE_JWKS_URL=https://juooobshtrcnnmcticzt.supabase.co/auth/v1/.well-known/jwks.json

# Next.js Client-Compatible Public Mappings
NEXT_PUBLIC_SUPABASE_URL=https://juooobshtrcnnmcticzt.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_pGFJ1vqz3-MGuFdCQuMqJA_DKxlqag3
~~~

- **Security Rule**: Never import or reference `SUPABASE_SECRET_KEY` in client components. Verify user sessions on every request via `@supabase/ssr` and `SUPABASE_JWKS_URL` / `supabase.auth.getUser()`.

---

## 4. Brand Identity, Color Palette & UX Inspiration

### Brand Name: **Spindle**
*Positioning*: Precision home and commercial appliance repair scheduling, dispatch, and service lifecycle management across the Philippines.

### Design References & How to Apply Them
- **Zendesk & Linear**: Crisp ticket views, clean typography, uncluttered landing page, structured detail drawers.
- **Monday.com & ClickUp**: High-contrast color-coded status pills, priority indicators, quick-filter toolbars, and scannable data tables.
- **Pipedrive**: Visual stage progression for technicians tracking assigned repair jobs (`Pending -> Confirmed -> Assigned -> In Progress -> Awaiting Payment -> Completed`).
- **Salesforce & Zoho CRM**: Structured multi-panel KPI summaries, master-detail record inspection, and role-governed operational command views for Admins.

### Selected Color Palette ("Precision Cobalt & Slate")
Configure semantic CSS variables in `globals.css` for `shadcn/ui` and Tailwind:
- **Background Primary**: `#F8FAFC` (Crisp Alabaster Slate — clean workspace canvas)
- **Surface / Card**: `#FFFFFF` with `#E2E8F0` (`1px` subtle border)
- **Sidebar / Brand Panel Ink**: `#0F172A` (Deep Midnight Slate)
- **Primary Brand Action**: `#1D4ED8` (Spindle Cobalt Blue; hover `#1E40AF`, subtle tint `#EFF6FF`)
- **Secondary Accent**: `#0D9488` (Precision Teal — active field service & verified badges)
- **Typography**: `#0F172A` (Primary headings/data), `#475569` (Secondary labels), `#94A3B8` (Muted metadata)
- **Semantic Status Palette**:
  - *Pending / Requested*: Amber (`#D97706` text on `#FEF3C7` pill)
  - *Confirmed / Scheduled*: Sky (`#0284C7` text on `#E0F2FE` pill)
  - *In Progress / Assigned*: Indigo (`#4F46E5` text on `#EEF2FF` pill)
  - *Awaiting Payment*: Orange (`#EA580C` text on `#FFEDD5` pill)
  - *Completed / Verified*: Emerald (`#059669` text on `#D1FAE5` pill)
  - *Cancelled / Inactive*: Rose/Slate (`#E11D48` text on `#FFE4E6` pill)

### Responsive Web Design
Every page, table, modal, split-screen layout, and sidebar must adapt seamlessly across **Desktop (`>=1024px`)**, **Tablet (`768px-1023px`)**, and **Mobile (`<768px`)** viewports (using collapsible mobile navigation drawers and responsive card/horizontal-scroll tables).

---

## 5. Philippine Market Localization

All copy, forms, validations, formatting, and domain options must reflect real Philippine operations:
- **Currency**: Philippine Peso (`PHP` / `₱`), formatted via `Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })`.
- **Timezone**: `Asia/Manila` (Philippine Standard Time, `UTC+8`).
- **Phone Number Validation**: Philippine mobile/landline format (`+63 9XX XXX XXXX` or `09XX XXX XXXX`).
- **Philippine Address Structure** (matching database columns):
  - `address_street` (House/Unit No., Building, Street, Subdivision/Village)
  - `address_barangay` (e.g., *Brgy. San Antonio*, *Brgy. Poblacion*, *Brgy. Lahug*)
  - `address_city` (City / Municipality, e.g., *Quezon City*, *Makati City*, *Pasig City*, *Cebu City*, *Davao City*)
  - `address_province` (e.g., *Metro Manila*, *Cavite*, *Laguna*, *Bulacan*, *Cebu*, *Davao del Sur*)
  - `address_zip_code` (4-digit PH Postal Code, e.g., `1100`, `1226`, `6000`, `8000`)
- **Service Branches (`branch_location`)**:
  - `Metro Manila - North (Quezon City)`
  - `Metro Manila - Central (Makati / Pasig)`
  - `Metro Manila - South (Alabang / Paranaque)`
  - `CALABARZON Hub (Sta. Rosa, Laguna)`
  - `Central Visayas Hub (Cebu City)`
  - `Southern Mindanao Hub (Davao City)`
- **Appliance Categories & Brands**:
  - Categories: *Split-Type Aircon*, *Window-Type Aircon*, *Inverter Refrigerator*, *Front-Load Washing Machine*, *Top-Load Washing Machine*, *Gas / Induction Range*, *Commercial Chiller / Freezer*, *Microwave Oven*, *Water Dispenser*.
  - Brand Suggestions (in UI comboboxes/placeholders only): *Carrier, Condura, Panasonic, LG, Samsung, Daikin, Koppel, Whirlpool, Fujidenzo, Sharp, Midea, Haier*.
- **Payment Methods (`payment_method`)**:
  - `Cash`, `GCash`, `Maya`, `QR Ph`, `Bank Transfer (BPI / BDO / UnionBank)`, `Credit / Debit Card`.

---

## 6. Feature-Based App Router Folder Structure

Enforce strict separation between `customer`, `technician`, and `admin` in both `src/app/` routes and `src/features/` domain modules:

~~~text
spindle/
├── supabase/
│   └── migrations/
│       ├── 001_schema_and_alphanumeric_ids.sql
│       ├── 002_rls_policies.sql
│       └── 003_transactions_and_locking_rpcs.sql
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   │   └── page.tsx                        # 1. Landing Page (concise, focused)
│   │   ├── (auth)/
│   │   │   ├── layout.tsx                      # Split-screen layout (Left: Brand Design | Right: Auth Form)
│   │   │   ├── login/page.tsx                  # 2a. Sign In view
│   │   │   └── signup/page.tsx                 # 2b. Sign Up view
│   │   ├── onboarding/
│   │   │   └── page.tsx                        # 3. Onboarding Page
│   │   ├── customer/                           # DEDICATED CUSTOMER SUBFOLDER
│   │   │   ├── layout.tsx                      # Customer RBAC guard + navigation shell
│   │   │   ├── home/page.tsx                   # 4. Customer Home Page
│   │   │   └── profile/page.tsx                # 5. Profile + Settings Page (Customer Only)
│   │   ├── technician/                         # DEDICATED TECHNICIAN SUBFOLDER
│   │   │   ├── layout.tsx                      # Technician RBAC guard + workspace shell
│   │   │   ├── dashboard/page.tsx              # 6. Technician Dashboard Page
│   │   │   └── profile/page.tsx                # 7. Profile + Settings Page (Technician Only)
│   │   ├── admin/                              # DEDICATED ADMIN SUBFOLDER
│   │   │   ├── layout.tsx                      # Admin RBAC guard + CRM sidebar shell
│   │   │   ├── dashboard/page.tsx              # 8. Admin Dashboard Page
│   │   │   └── profile/page.tsx                # 9. Profile + Settings Page (Admin Only)
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── features/
│   │   ├── auth/                               # Auth actions, Zod schemas, split-screen forms
│   │   ├── onboarding/                         # Onboarding multi-step form & server actions
│   │   ├── customer/                           # CUSTOMER FEATURE MODULE
│   │   │   ├── components/                     # Appliances manager, repair booking, payment modal, profile forms
│   │   │   ├── actions/                        # Customer server actions & JOIN queries
│   │   │   ├── schemas/                        # Customer Zod validation schemas
│   │   │   └── types/
│   │   ├── technician/                         # TECHNICIAN FEATURE MODULE
│   │   │   ├── components/                     # Pipeline board, schedule agenda, diagnostics drawer, payment capture, profile forms
│   │   │   ├── actions/                        # Technician server actions & RPC calls
│   │   │   ├── schemas/                        # Technician Zod validation schemas
│   │   │   └── types/
│   │   └── admin/                              # ADMIN FEATURE MODULE
│   │       ├── components/                     # KPI overview, user CRUD, tech assignment, appliance verification, repair/payment/schedule tables, profile forms
│   │       ├── actions/                        # Admin server actions, SQL JOIN reports, transactional RPCs
│   │       ├── schemas/                        # Admin Zod validation schemas
│   │       └── types/
│   ├── components/
│   │   ├── ui/                                 # shadcn/ui primitives
│   │   └── shared/                             # Brand logo, status badges, empty states, confirmation dialogs
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                       # Browser client (@supabase/ssr)
│   │   │   ├── server.ts                       # Server Component / Action client (@supabase/ssr)
│   │   │   ├── admin.ts                        # Server-only secret client (import 'server-only')
│   │   │   └── proxy.ts                        # Session refresh + strict RBAC route protection
│   │   ├── formatters.ts                       # PHP currency, Asia/Manila dates, +63 phone helpers
│   │   └── utils.ts
│   └── proxy.ts                                # Next.js request proxy/middleware enforcing RBAC & onboarding redirects
~~~

---

## 7. Relational Database Architecture (SQL, Alphanumeric PKs, Locking & Security)

Base the PostgreSQL schema directly on the provided ERD (`user_types`, `users`, `customer_appliances`, `repair`, `payments`), omit all warranty fields, and add targeted relational tables (`technician_profiles`, `appointments`, `activity_logs`) to fulfill Technician Management, Appointment/Scheduling, and Dashboard Recent Activities cleanly.

### 7.1 Alphanumeric Primary Keys Requirement (MANDATORY)
- **Every table Primary Key MUST be `VARCHAR(20)` using a unique alphanumeric format** (letters + numbers, e.g., `USR-8K4M2P9X`, `TKT-5R9W3L7Q`, `APL-2N6H8J4C`, `PAY-7V3B9M1Z`, `APT-4D8F2G6K`, `TCP-9X2C5V8N`, `LOG-6T1Y4U8P`), **never** purely numeric `SERIAL`/`BIGINT` IDs.
- Create a PostgreSQL helper function `public.generate_alphanumeric_id(prefix TEXT)` using `pgcrypto` `gen_random_bytes` mapped to uppercase alphanumeric characters (`A-Z`, `0-9`) to auto-generate default primary keys safely on insert.

### 7.2 Complete Table Definitions

1. **`public.user_types`**
   - `user_type_id VARCHAR(20) PRIMARY KEY` — Seed ONLY: `'UTP-CUST'`, `'UTP-TECH'`, `'UTP-ADMIN'`
   - `type_name VARCHAR(30) UNIQUE NOT NULL` — `'customer'`, `'technician'`, `'admin'`
   - `description TEXT`
   - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

2. **`public.users`**
   - `user_id VARCHAR(20) PRIMARY KEY DEFAULT public.generate_alphanumeric_id('USR')`
   - `auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE` (bridges Supabase Auth to alphanumeric `user_id`)
   - `first_name VARCHAR(100) NOT NULL`
   - `last_name VARCHAR(100) NOT NULL`
   - `middle_name VARCHAR(100) NULL`
   - `email VARCHAR(255) UNIQUE NOT NULL`
   - `password VARCHAR(255) NOT NULL` (store `pgcrypto` bcrypt hash via `crypt(raw_password, gen_salt('bf', 10))` alongside Supabase Auth credentials; never store plaintext)
   - `phone VARCHAR(25)`
   - `user_type_id VARCHAR(20) NOT NULL REFERENCES public.user_types(user_type_id)`
   - `branch_location VARCHAR(100)`
   - `address_street VARCHAR(150)`
   - `address_barangay VARCHAR(100)`
   - `address_city VARCHAR(100)`
   - `address_province VARCHAR(100)`
   - `address_zip_code VARCHAR(10)`
   - `is_onboarded BOOLEAN NOT NULL DEFAULT FALSE`
   - `is_active BOOLEAN NOT NULL DEFAULT TRUE`
   - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
   - `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

3. **`public.technician_profiles`** *(Added for Technician Management Module)*
   - `tech_profile_id VARCHAR(20) PRIMARY KEY DEFAULT public.generate_alphanumeric_id('TCP')`
   - `technician_id VARCHAR(20) UNIQUE NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE`
   - `specializations TEXT[] NOT NULL DEFAULT '{}'` (e.g., Aircon, Refrigerator, Washing Machine)
   - `certification_no VARCHAR(100)` (e.g., TESDA NC II Certificate No.)
   - `availability_status VARCHAR(30) NOT NULL DEFAULT 'available'` (`'available'`, `'busy'`, `'off_duty'`)
   - `max_daily_jobs INT NOT NULL DEFAULT 4 CHECK (max_daily_jobs BETWEEN 1 AND 15)`
   - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
   - `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

4. **`public.customer_appliances`** *(Warranty column intentionally omitted)*
   - `appliance_id VARCHAR(20) PRIMARY KEY DEFAULT public.generate_alphanumeric_id('APL')`
   - `customer_id VARCHAR(20) NOT NULL REFERENCES public.users(user_id) ON DELETE RESTRICT`
   - `brand VARCHAR(50) NOT NULL`
   - `category VARCHAR(50) NOT NULL`
   - `model_number VARCHAR(100) NOT NULL`
   - `serial_number VARCHAR(100) UNIQUE NOT NULL`
   - `purchase_date DATE`
   - `registration_status VARCHAR(30) NOT NULL DEFAULT 'pending_verification'` (`'pending_verification'`, `'verified'`, `'cancelled'`)
   - `notes TEXT`
   - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
   - `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

5. **`public.repair`** *(Exact ERD table name; warranty column intentionally omitted)*
   - `ticket_id VARCHAR(20) PRIMARY KEY DEFAULT public.generate_alphanumeric_id('TKT')`
   - `customer_id VARCHAR(20) NOT NULL REFERENCES public.users(user_id) ON DELETE RESTRICT`
   - `technician_id VARCHAR(20) NULL REFERENCES public.users(user_id) ON DELETE SET NULL`
   - `appliance_id VARCHAR(20) NOT NULL REFERENCES public.customer_appliances(appliance_id) ON DELETE RESTRICT`
   - `service_type VARCHAR(30) NOT NULL` (`'diagnostic'`, `'repair'`, `'maintenance_cleaning'`, `'installation'`)
   - `issue_description TEXT NOT NULL`
   - `diagnostic_notes TEXT`
   - `status VARCHAR(30) NOT NULL DEFAULT 'pending'` (`'pending'`, `'confirmed'`, `'assigned'`, `'in_progress'`, `'awaiting_payment'`, `'completed'`, `'cancelled'`)
   - `priority VARCHAR(20) NOT NULL DEFAULT 'normal'` (`'low'`, `'normal'`, `'high'`, `'urgent'`)
   - `estimated_cost_php NUMERIC(10,2) DEFAULT 0.00 CHECK (estimated_cost_php >= 0)`
   - `final_cost_php NUMERIC(10,2) NULL CHECK (final_cost_php IS NULL OR final_cost_php >= 0)`
   - `scheduled_date DATE NOT NULL`
   - `completed_at TIMESTAMPTZ NULL`
   - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
   - `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

6. **`public.appointments`** *(Added for Appointment / Scheduling Module)*
   - `appointment_id VARCHAR(20) PRIMARY KEY DEFAULT public.generate_alphanumeric_id('APT')`
   - `ticket_id VARCHAR(20) NOT NULL REFERENCES public.repair(ticket_id) ON DELETE CASCADE`
   - `customer_id VARCHAR(20) NOT NULL REFERENCES public.users(user_id) ON DELETE RESTRICT`
   - `technician_id VARCHAR(20) NULL REFERENCES public.users(user_id) ON DELETE SET NULL`
   - `scheduled_date DATE NOT NULL`
   - `time_slot VARCHAR(30) NOT NULL` (`'08:00 AM - 10:00 AM'`, `'10:00 AM - 12:00 PM'`, `'01:00 PM - 03:00 PM'`, `'03:00 PM - 05:00 PM'`)
   - `service_address TEXT NOT NULL`
   - `appointment_status VARCHAR(30) NOT NULL DEFAULT 'requested'` (`'requested'`, `'confirmed'`, `'rescheduled'`, `'completed'`, `'cancelled'`)
   - `remarks TEXT`
   - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
   - `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

7. **`public.payments`**
   - `payment_id VARCHAR(20) PRIMARY KEY DEFAULT public.generate_alphanumeric_id('PAY')`
   - `ticket_id VARCHAR(20) NOT NULL REFERENCES public.repair(ticket_id) ON DELETE RESTRICT`
   - `received_by VARCHAR(20) NULL REFERENCES public.users(user_id) ON DELETE SET NULL`
   - `payment_method VARCHAR(30) NOT NULL`
   - `amount_php NUMERIC(10,2) NOT NULL CHECK (amount_php > 0)`
   - `installment_no INT NULL CHECK (installment_no IS NULL OR installment_no >= 1)`
   - `payment_date DATE NOT NULL DEFAULT CURRENT_DATE`
   - `reference_no VARCHAR(100)`
   - `payment_status VARCHAR(30) NOT NULL DEFAULT 'pending_verification'` (`'pending_verification'`, `'verified'`, `'cancelled'`)
   - `remarks TEXT`
   - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

8. **`public.activity_logs`** *(Added for Dashboard Recent Activities)*
   - `log_id VARCHAR(20) PRIMARY KEY DEFAULT public.generate_alphanumeric_id('LOG')`
   - `actor_id VARCHAR(20) NULL REFERENCES public.users(user_id) ON DELETE SET NULL`
   - `entity_type VARCHAR(30) NOT NULL` (`'user'`, `'appliance'`, `'repair'`, `'appointment'`, `'payment'`, `'technician'`)
   - `entity_id VARCHAR(20) NOT NULL`
   - `action VARCHAR(60) NOT NULL`
   - `description TEXT NOT NULL`
   - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

### 7.3 SQL JOINs, Transactions, Locking & Security Requirements
- **Multi-Table SQL JOINs**: Implement database views or explicit joined queries combining `repair` + `users` (customer & technician aliases) + `customer_appliances` + `appointments` + `payments` so UI tables display rich relational records cleanly.
- **ACID Transactions & Row-Level Locking (`FOR UPDATE`)**:
  Create PostgreSQL RPC functions (`003_transactions_and_locking_rpcs.sql`) invoked via `supabase.rpc(...)` that execute atomic transactions with explicit row-level locking and automatic rollback on failure (and include documented SQL transaction blocks using `START TRANSACTION` / `COMMIT` / `ROLLBACK`):
  1. `rpc_create_repair_with_appointment(...)` — Locks the target `customer_appliances` row (`SELECT ... FOR UPDATE`), validates appliance ownership and active status, inserts `repair` ticket, inserts initial `appointments` record, writes to `activity_logs`, or rolls back atomically on error.
  2. `rpc_assign_technician_and_confirm_slot(...)` — Locks the `repair` row, `technician_profiles` row, and existing `appointments` rows (`SELECT ... FOR UPDATE`) to prevent double-booking a technician in the same `scheduled_date` + `time_slot` or exceeding `max_daily_jobs`, updates both `repair` and `appointments`, and logs the activity.
  3. `rpc_record_and_verify_payment(...)` — Locks the `repair` row (`SELECT ... FOR UPDATE`), calculates cumulative verified payments against `final_cost_php`, inserts/updates `payments`, transitions `repair.status` to `'completed'` (setting `completed_at = NOW()`) once settled in full, and logs the transaction.
- **Row-Level Security (RLS) & RBAC**:
  - Enable RLS on every table in `public`.
  - Customers can only read/mutate their own `users` profile, their own `customer_appliances`, their own `repair` tickets, their own `appointments`, and view/submit payments for their own tickets.
  - Technicians can read/update assigned `repair` tickets, assigned `appointments`, record on-site `payments` (`received_by`), and manage their own `users` + `technician_profiles` records.
  - Admins have full CRUD oversight across all operational tables.
  - Inactive users (`is_active = FALSE`) must be blocked at both the RLS and Next.js proxy/middleware layers.

---

## 8. Detailed Page-by-Page & Functional Specifications

Build **exact** implementations for the **9 required pages**, ensuring all core system modules (User Management, Dashboard, Data Management, Registration, Repair Transactions, Technician Management, Payments, and Appointment/Scheduling) are seamlessly integrated without clutter.

### Page 1: Landing Page (`/`)
- **Constraint**: **Do NOT overload with information.** Keep it sharp, credible, and scannable.
- **Structure**:
  1. Minimal sticky header: Spindle wordmark/icon, concise navigation links (*Services*, *How It Works*, *Service Areas*), *Sign In* button, and *Book a Repair* primary CTA.
  2. Crisp Hero Section: Clear headline tailored for Philippine homes and businesses (*"Reliable Appliance Repair, Scheduled Around Your Day"*), 2-line value proposition, primary CTA (*Schedule Service*), and a clean visual preview card showing live workflow stages (Request -> Dispatch -> Repair -> Pay).
  3. Compact 3-Card Capability Strip: *Certified Local Technicians*, *Transparent PHP Estimates & Digital Payments*, *Real-Time Appointment Scheduling*.
  4. Supported Service Hubs strip (Metro Manila, Laguna, Cebu, Davao) + clean minimal footer with copyright and standard commercial links.

### Page 2: Login & Sign Up Page (`/login` & `/signup`)
- **Mandatory Layout**: **Split-Screen Layout** on desktop/tablet (gracefully stacked on mobile):
  - **Left Side (Brand & Visual Showcase)**: Deep Midnight Slate (`#0F172A`) architectural panel featuring Spindle branding, refined geometric mechanical/workflow illustration or structured UI preview cards, concise value pillars for Philippine service excellence, and subtle operational highlights.
  - **Right Side (Clean Authentication Form)**: Crisp white canvas centered with:
    - **Sign In (`/login`)**: Email + Password form (Zod + React Hook Form), show/hide password toggle, inline error handling, link to `/signup`. Remember: **NO demo login buttons or test credentials**.
    - **Sign Up (`/signup`)**: First Name, Middle Name (optional), Last Name, Email, Password, Confirm Password. Creates a Customer account by default (`UTP-CUST`), hashes password securely, authenticates session, and redirects to `/onboarding`.

### Page 3: Onboarding Page (`/onboarding`)
- Triggered automatically after first sign-up (or whenever `users.is_onboarded = FALSE`).
- Clean, distraction-free stepped card (inspired by ClickUp / Monday onboarding):
  - **Step 1 — Contact & Branch Region**: Philippine mobile number (`+63`), preferred nearest Spindle `branch_location`.
  - **Step 2 — Service Address (Philippine Standard)**: Street/Unit, Barangay, City/Municipality, Province, 4-digit ZIP Code.
  - *(Role-aware)*: If an Admin creates a Technician user who logs in for the first time, prompt the Technician to confirm their Appliance Specializations and TESDA Certification No.
- Upon submission, updates `public.users`, sets `is_onboarded = TRUE`, and routes the user directly to their role-specific home/dashboard (`/customer/home`, `/technician/dashboard`, or `/admin/dashboard`).

### Page 4: Customer Home Page (`/customer/home`)
- Inspired by **Zendesk Customer Portal & ClickUp Workspaces**, organized with a clean top/side workspace switcher so customers manage everything smoothly without page bloat:
  1. **Overview & Recent Activity**: Summary cards (*Registered Appliances*, *Active Repairs*, *Upcoming Appointments*, *Total Paid in PHP*) + live Recent Activity log for the customer.
  2. **My Appliances (Registration & Data Management)**: Add/Register new appliance (`brand`, `category`, `model_number`, `serial_number`, `purchase_date`, `notes` — **no warranty fields**), view registration verification badge (`Pending Verification` / `Verified`), search appliances, update details, or cancel/delete unlinked registrations.
  3. **Book & Manage Appointments / Repairs (Transactions & Scheduling)**:
     - Create Repair Request + Appointment Slot (`appliance_id`, `service_type`, `priority`, `issue_description`, `scheduled_date`, `time_slot`, pre-filled PH service address) via atomic transaction RPC.
     - View active & past tickets with joined Technician & Appliance info, search/filter by status, reschedule or cancel pending appointments.
  4. **Payments & Billing**: View itemized `estimated_cost_php` and `final_cost_php` per ticket, submit payment details (`GCash`, `Maya`, `Bank Transfer`, `QR Ph`, `Cash`, installment number, reference number), and view full Payment History with verification status.

### Page 5: Dedicated Customer Profile + Settings Page (`/customer/profile`)
- Accessible **only** to `customer` role (`UTP-CUST`).
- Sections:
  - Personal Information (First, Middle, Last Name, Email display, +63 Phone).
  - Default Philippine Service Address & Preferred Branch Location.
  - Security: Change Password form (validates current password, updates Supabase Auth + hashed `users.password`).
  - Account Control: Deactivate Account confirmation dialog (`sets is_active = FALSE` and signs out).

### Page 6: Technician Dashboard Page (`/technician/dashboard`)
- Inspired by **Pipedrive, Monday.com & Zendesk Field Service**:
  1. **KPI Summary & Recent Activity**: *Today's Appointments*, *Assigned Active Jobs*, *Completed This Month*, *Pending Collections (PHP)* + recent job activity feed.
  2. **Repair Pipeline & Job Queue**: Toggleable Kanban Board / Structured Table of assigned `repair` tickets joined with Customer name, phone, Barangay/City address, and Appliance model/serial. Search & filter by priority/status.
  3. **Diagnostic & Repair Execution Drawer**: Update ticket status (`confirmed -> in_progress -> awaiting_payment -> completed`), record detailed `diagnostic_notes`, enter `estimated_cost_php` and `final_cost_php`.
  4. **Schedule & Appointments Manager**: Daily/Weekly agenda view of assigned time slots; confirm requested slots, propose reschedule, or mark appointments completed.
  5. **On-Site Payment Recording**: Record customer cash or digital payment collected in the field (`received_by = current technician user_id`, `amount_php`, `payment_method`, `reference_no`, `installment_no`).

### Page 7: Dedicated Technician Profile + Settings Page (`/technician/profile`)
- Accessible **only** to `technician` role (`UTP-TECH`).
- Sections:
  - Technician Identity & Contact Info (Name, Phone, Assigned Branch Location, PH Address).
  - Field Service Credentials: Appliance Specializations multi-select, TESDA / Technical Certification No., Max Daily Job Capacity, and Quick Availability Status (`Available`, `Busy`, `Off Duty`).
  - Security: Change Password form & session sign-out.

### Page 8: Admin Dashboard Page (`/admin/dashboard`)
- Inspired by **Salesforce, Zoho CRM & Monday.com Operations Hub** with modular sidebar/tab navigation inside the Admin workspace:
  1. **Executive Summary, Statistics & Recent Activities**: Revenue collected (`PHP`), Active Repair Tickets by Status, Technician Utilization, Pending Verifications count, and real-time System-Wide Activity Log (**no notification bell/feed**).
  2. **User Management Module**: Full CRUD + Search/Filter across Customers, Technicians, and Admins; create internal staff accounts, manage/change roles (`user_type_id`), update records, and activate/deactivate accounts (`is_active`).
  3. **Technician Management Module**: Add/onboard technicians, update specializations & branch assignments, monitor live workload/active job counts, assign or reassign technicians to repair tickets using the row-locked RPC, or remove/deactivate technicians.
  4. **Appliance Registration & Master Data Management**: Search all customer appliance registrations across branches, inspect serial/model details, **Verify** or **Cancel** registrations, and manage master records with full CRUD.
  5. **Repair Transactions Oversight**: Master multi-JOIN table of all repair tickets (`repair` + `customer` + `technician` + `appliance`), create walk-in/phone-in repair tickets, update priority/costs/status, or cancel tickets.
  6. **Appointments & Dispatch Scheduling**: Master schedule board across branches and time slots; confirm, reschedule, assign technician with slot-conflict locking, cancel, or complete appointments.
  7. **Payments & Verification Ledger**: Master ledger of all PHP payments; inspect `reference_no` (GCash/Maya/Bank), **Verify Payment** (via atomic RPC that updates ticket completion when fully paid), update remarks, cancel invalid payment entries, and export/search payment history.

### Page 9: Dedicated Admin Profile + Settings Page (`/admin/profile`)
- Accessible **only** to `admin` role (`UTP-ADMIN`).
- Sections:
  - Administrator Profile (Name, Contact Number, Primary Managed Branch Location, PH Office Address).
  - Administrative Security: Change Password form, active role/branch badge summary, and account security controls.

---

## 9. Implementation Quality Bar & Verification Checklist

Before finalizing the implementation, verify every item below:
- [ ] **Antigravity Global Skills** (`tailwindcss`, `ui-ux-pro-max`, `supabase-postgres-best-practices`) are reflected across styling, UX ergonomics, and SQL/RLS design.
- [ ] **Alphanumeric Primary Keys (`VARCHAR(20)`)** are enforced on every database table (`user_types`, `users`, `technician_profiles`, `customer_appliances`, `repair`, `appointments`, `payments`, `activity_logs`).
- [ ] **SQL JOINs, ACID Transactions, and Row-Level Locking (`SELECT ... FOR UPDATE`)** are implemented in SQL migrations and actively invoked by the application.
- [ ] **Strict RBAC** protects `/customer/*`, `/technician/*`, and `/admin/*` on both server routes/middleware and PostgreSQL RLS policies.
- [ ] **Zero Excluded Features**: Confirmed **NO** demo accounts/data, **NO** academic/project traces, **NO** notification feature, **NO** inventory feature, and **NO** warranty feature (`warranty_expiry_date` and `is_warranty_claim` completely absent).
- [ ] **Zod + React Hook Form** powers every form with Philippine-localized validation (`+63` phone, 4-digit PH postal codes, PHP currency amounts).
- [ ] **Vercel Production Readiness**: `npm run build` / `pnpm build` passes cleanly with zero TypeScript or linting errors.
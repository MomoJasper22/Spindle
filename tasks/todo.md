# Spindle — Task List

---

## Phase 1: Project Scaffolding & Database Foundation

### Task 1: Initialize Next.js project with TypeScript, Tailwind CSS, and shadcn/ui

**Description:** Scaffold the Next.js App Router project with strict TypeScript, Tailwind CSS v4, shadcn/ui component library, and Lucide Icons. Configure `tsconfig.json` with `strict: true` and zero `any` tolerance. Set up ESLint. Create the feature-based folder structure from the spec (all empty directories/placeholder files).

**Acceptance criteria:**
- [ ] `npx create-next-app` with App Router, TypeScript strict, Tailwind CSS
- [ ] shadcn/ui initialized with the Spindle "Precision Cobalt & Slate" color palette configured in `globals.css`
- [ ] Lucide Icons installed
- [ ] All spec folder structure directories created (`src/app/(public)`, `(auth)`, `onboarding`, `customer`, `technician`, `admin`, `src/features/{auth,onboarding,customer,technician,admin}`, `src/components/{ui,shared}`, `src/lib/supabase/`)
- [ ] `npm run build` passes clean

**Verification:**
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: folder structure matches spec §6

**Dependencies:** None

**Files likely touched:**
- `package.json`, `tsconfig.json`, `tailwind.config.ts`, `src/app/globals.css`, `src/app/layout.tsx`, `src/lib/utils.ts`
- All directory scaffold files

**Estimated scope:** Medium (3-5 files + directories)

---

### Task 2: Configure Supabase clients and environment variables

**Description:** Create `.env.local` and `.env.example` with the provided Supabase credentials. Build three Supabase client utilities: browser client (`@supabase/ssr`), server client, and admin/service-role client (guarded with `import 'server-only'`). Create the RBAC proxy/middleware skeleton.

**Acceptance criteria:**
- [ ] `.env.local` and `.env.example` created with exact credentials from spec §3
- [ ] `src/lib/supabase/client.ts` — browser Supabase client using `@supabase/ssr`
- [ ] `src/lib/supabase/server.ts` — server component/action client using `@supabase/ssr`
- [ ] `src/lib/supabase/admin.ts` — service-role client with `import 'server-only'`
- [ ] `SUPABASE_SECRET_KEY` is never imported in any client component

**Verification:**
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: grep for `SUPABASE_SECRET_KEY` returns only `admin.ts` and `.env*` files

**Dependencies:** Task 1

**Files likely touched:**
- `.env.local`, `.env.example`, `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/admin.ts`

**Estimated scope:** Small (1-2 files core + env files)

---

### Task 3: Create Philippine localization formatters

**Description:** Build shared utility module with PHP currency formatter (`Intl.NumberFormat('en-PH')`), Asia/Manila timezone date formatter, and Philippine phone number formatter/validator (`+63 9XX XXX XXXX`). These are used across all three roles.

**Acceptance criteria:**
- [ ] `formatPHP(amount)` returns `₱` formatted currency string
- [ ] `formatDate(date)` returns Asia/Manila localized date string
- [ ] `formatPhone(phone)` and `validatePHPhone(phone)` handle `+63` / `09XX` formats
- [ ] All formatters are pure functions with no side effects

**Verification:**
- [ ] Build succeeds: `npm run build`

**Dependencies:** Task 1

**Files likely touched:**
- `src/lib/formatters.ts`

**Estimated scope:** XS (1 file)

---

### Task 4: SQL Migration 001 — Schema, alphanumeric IDs, and seed data

**Description:** Write the complete PostgreSQL migration creating all 8 tables (`user_types`, `users`, `technician_profiles`, `customer_appliances`, `repair`, `appointments`, `payments`, `activity_logs`) with alphanumeric `VARCHAR(20)` PKs. Create the `generate_alphanumeric_id(prefix)` function using `pgcrypto`. Seed the three `user_types` rows. Omit all warranty columns. Add `updated_at` trigger function.

**Acceptance criteria:**
- [ ] `generate_alphanumeric_id(prefix TEXT)` PL/pgSQL function exists using `pgcrypto`
- [ ] All 8 tables created with exact columns from spec §7.2
- [ ] `warranty_expiry_date` and `is_warranty_claim` are completely absent
- [ ] `user_types` seeded with `UTP-CUST`, `UTP-TECH`, `UTP-ADMIN`
- [ ] All foreign keys, CHECK constraints, and UNIQUE constraints match spec
- [ ] `updated_at` auto-update trigger on relevant tables

**Verification:**
- [ ] Migration runs without errors against Supabase SQL editor
- [ ] Manual check: `SELECT * FROM user_types` returns 3 rows

**Dependencies:** None (can run in parallel with Tasks 1-3)

**Files likely touched:**
- `supabase/migrations/001_schema_and_alphanumeric_ids.sql`

**Estimated scope:** Medium (1 file, ~200 lines SQL)

---

### Task 5: SQL Migration 002 — Row-Level Security policies

**Description:** Enable RLS on all 8 `public` tables and create granular policies: Customers see/mutate only their own data, Technicians see/mutate assigned records + own profile, Admins have full CRUD. Use `(select auth.uid())` pattern for stable query plans. Block inactive users (`is_active = FALSE`).

**Acceptance criteria:**
- [ ] RLS enabled on every `public` table
- [ ] Customer policies restrict to `auth_user_id = (select auth.uid())` chain
- [ ] Technician policies restrict to assigned tickets/appointments + own profile
- [ ] Admin policies grant full access
- [ ] Inactive user blocking policy on `users` table
- [ ] Uses `(select auth.uid())` subquery pattern (not bare function call)

**Verification:**
- [ ] Migration runs without errors
- [ ] Manual check: attempt to query across roles confirms isolation

**Dependencies:** Task 4

**Files likely touched:**
- `supabase/migrations/002_rls_policies.sql`

**Estimated scope:** Medium (1 file, ~150 lines SQL)

---

### Task 6: SQL Migration 003 — Transactional RPCs with row-level locking

**Description:** Create three PL/pgSQL RPC functions with explicit `SELECT ... FOR UPDATE` locking, `START TRANSACTION` / `COMMIT` / `ROLLBACK` semantics, and `activity_logs` insertion: `rpc_create_repair_with_appointment`, `rpc_assign_technician_and_confirm_slot`, `rpc_record_and_verify_payment`.

**Acceptance criteria:**
- [ ] `rpc_create_repair_with_appointment(...)` — locks appliance row, validates ownership, inserts repair + appointment + activity_log, or rollback
- [ ] `rpc_assign_technician_and_confirm_slot(...)` — locks repair + tech profile + appointments, prevents double-booking (same date+slot) and exceeding `max_daily_jobs`, updates records, logs activity
- [ ] `rpc_record_and_verify_payment(...)` — locks repair row, inserts payment, calculates cumulative payments vs `final_cost_php`, auto-completes ticket when fully paid, logs activity
- [ ] All RPCs raise exceptions with meaningful error messages on validation failure

**Verification:**
- [ ] Migration runs without errors
- [ ] Manual check: call each RPC with test parameters via Supabase SQL editor

**Dependencies:** Task 5

**Files likely touched:**
- `supabase/migrations/003_transactions_and_locking_rpcs.sql`

**Estimated scope:** Medium (1 file, ~250 lines SQL)

---

## Checkpoint: Phase 1 — Foundation
- [ ] All 3 SQL migrations run clean against Supabase
- [ ] `npm run build` passes with zero errors
- [ ] Folder structure matches spec §6
- [ ] Supabase clients can connect (browser + server)
- [ ] Review with human before proceeding

---

## Phase 2: Auth, RBAC & Onboarding

### Task 7: Build shared UI components (logo, status badges, empty states, confirmation dialogs)

**Description:** Create the reusable shared components used across all roles: Spindle brand logo/wordmark, semantic status badge pills (Pending/Confirmed/In Progress/Awaiting Payment/Completed/Cancelled with spec colors), empty state component (clean illustration + CTA), and confirmation dialog (using shadcn/ui AlertDialog).

**Acceptance criteria:**
- [ ] `SpindleLogo` component renders brand wordmark/icon
- [ ] `StatusBadge` component accepts a status string and renders correct color pill per spec §4 palette
- [ ] `EmptyState` component with configurable icon, title, description, and optional CTA button
- [ ] `ConfirmationDialog` wraps shadcn AlertDialog with configurable title/description/actions

**Verification:**
- [ ] Build succeeds: `npm run build`

**Dependencies:** Task 1

**Files likely touched:**
- `src/components/shared/spindle-logo.tsx`
- `src/components/shared/status-badge.tsx`
- `src/components/shared/empty-state.tsx`
- `src/components/shared/confirmation-dialog.tsx`

**Estimated scope:** Small (4 files)

---

### Task 8: Auth feature module — Zod schemas, server actions, and split-screen layout

**Description:** Build the authentication feature module: shared Zod validation schemas for login and signup (with PH phone validation), server actions for `signIn` and `signUp` (creating both Supabase Auth user and `public.users` row with hashed password), and the split-screen auth layout (left: brand panel with Deep Midnight Slate background; right: white form canvas).

**Acceptance criteria:**
- [ ] `loginSchema` and `signupSchema` Zod schemas with proper validations
- [ ] `signIn` server action — validates credentials via Supabase Auth, checks `is_active`, redirects by role
- [ ] `signUp` server action — creates Supabase Auth user, creates `public.users` row (Customer default), hashes password, redirects to `/onboarding`
- [ ] Split-screen auth layout: left brand panel (`#0F172A`) with branding, right white form
- [ ] No demo login buttons, no test credentials, no academic/project traces

**Verification:**
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: layout renders correctly on desktop and mobile

**Dependencies:** Tasks 2, 4, 7

**Files likely touched:**
- `src/features/auth/schemas/auth-schemas.ts`
- `src/features/auth/actions/auth-actions.ts`
- `src/app/(auth)/layout.tsx`

**Estimated scope:** Medium (3-5 files)

---

### Task 9: Login and Signup pages

**Description:** Build the Sign In (`/login`) and Sign Up (`/signup`) pages using React Hook Form + Zod resolvers within the split-screen auth layout. Login: email + password with show/hide toggle, inline errors, link to signup. Signup: first/middle/last name, email, password, confirm password.

**Acceptance criteria:**
- [ ] `/login` page with email + password form, show/hide toggle, inline validation errors, link to `/signup`
- [ ] `/signup` page with first name, middle name (optional), last name, email, password, confirm password
- [ ] Both use `useForm` with `zodResolver` and call respective server actions
- [ ] Loading states on submit buttons
- [ ] Responsive: stacked layout on mobile

**Verification:**
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: forms submit, validate inline, show errors

**Dependencies:** Task 8

**Files likely touched:**
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/signup/page.tsx`
- `src/features/auth/components/login-form.tsx`
- `src/features/auth/components/signup-form.tsx`

**Estimated scope:** Medium (4 files)

---

### Task 10: RBAC middleware and route protection

**Description:** Build the Next.js middleware (`src/proxy.ts`) that: verifies session on every request via `@supabase/ssr`, resolves the user's role from `public.users`, enforces RBAC route protection (`/customer/*` → Customer only, `/technician/*` → Technician only, `/admin/*` → Admin only), redirects unauthenticated users to `/login`, redirects un-onboarded users to `/onboarding`, and blocks inactive users.

**Acceptance criteria:**
- [ ] Middleware intercepts all `/customer/*`, `/technician/*`, `/admin/*`, and `/onboarding` routes
- [ ] Unauthenticated requests redirect to `/login`
- [ ] Role mismatch redirects to correct role dashboard
- [ ] `is_onboarded = FALSE` redirects to `/onboarding`
- [ ] `is_active = FALSE` signs out and redirects to `/login`

**Verification:**
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: attempt to access `/admin/dashboard` as customer → redirected

**Dependencies:** Tasks 2, 8

**Files likely touched:**
- `src/proxy.ts` (or `src/middleware.ts`)
- `src/lib/supabase/proxy.ts`

**Estimated scope:** Small (2 files)

---

### Task 11: Onboarding page

**Description:** Build the multi-step onboarding page (`/onboarding`) triggered when `is_onboarded = FALSE`. Step 1: PH phone number + branch location selection. Step 2: Philippine address (street, barangay, city, province, ZIP). Role-aware: if Technician, add specializations multi-select and TESDA certification field. On submit, update `public.users` + `technician_profiles`, set `is_onboarded = TRUE`, redirect to role dashboard.

**Acceptance criteria:**
- [ ] Multi-step card UI (Step 1: Contact & Branch, Step 2: Address)
- [ ] Philippine phone validation (`+63 9XX XXX XXXX`)
- [ ] Branch location dropdown with 6 Philippine service hubs from spec
- [ ] Address fields: street, barangay, city, province, 4-digit ZIP
- [ ] Technician-specific: specializations multi-select, TESDA cert number
- [ ] Server action updates `users` and conditionally `technician_profiles`
- [ ] Sets `is_onboarded = TRUE` and redirects to role dashboard

**Verification:**
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: complete onboarding as customer → arrives at `/customer/home`

**Dependencies:** Tasks 3, 9, 10

**Files likely touched:**
- `src/app/onboarding/page.tsx`
- `src/features/onboarding/components/onboarding-form.tsx`
- `src/features/onboarding/actions/onboarding-actions.ts`
- `src/features/onboarding/schemas/onboarding-schemas.ts`

**Estimated scope:** Medium (4 files)

---

## Checkpoint: Phase 2 — Auth & Onboarding
- [ ] User can sign up, complete onboarding, and land on role dashboard
- [ ] User can sign in and be routed to correct dashboard
- [ ] RBAC blocks cross-role access
- [ ] Inactive users are blocked
- [ ] `npm run build` passes clean
- [ ] Review with human before proceeding

---

## Phase 3: Customer Portal

### Task 12: Customer layout shell and Home page — Overview & Activity

**Description:** Build the Customer RBAC layout shell (`/customer/layout.tsx`) with responsive navigation (sidebar on desktop, drawer on mobile) and the first section of the Customer Home page: summary cards (Registered Appliances, Active Repairs, Upcoming Appointments, Total Paid in PHP) + Recent Activity log querying `activity_logs`.

**Acceptance criteria:**
- [ ] Customer layout with responsive nav (sidebar desktop, drawer mobile)
- [ ] RBAC guard in layout verifying `UTP-CUST` role
- [ ] Summary cards with live counts from Supabase queries
- [ ] Recent Activity feed from `activity_logs` for the customer
- [ ] Empty states when no data exists

**Verification:**
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: dashboard shows empty states for new user

**Dependencies:** Task 11

**Files likely touched:**
- `src/app/customer/layout.tsx`
- `src/app/customer/home/page.tsx`
- `src/features/customer/components/overview-cards.tsx`
- `src/features/customer/components/activity-feed.tsx`
- `src/features/customer/actions/dashboard-actions.ts`

**Estimated scope:** Medium (5 files)

---

### Task 13: Customer — My Appliances (Registration & Data Management)

**Description:** Build the "My Appliances" section: add/register new appliance form (brand combobox with PH brands, category dropdown, model number, serial number, purchase date, notes — no warranty fields), appliance list with verification badge, search, update, cancel/delete unlinked registrations.

**Acceptance criteria:**
- [ ] Add Appliance form with brand combobox (PH brands from spec), category dropdown, model/serial, purchase date
- [ ] No warranty fields anywhere
- [ ] Appliance list table/cards with `registration_status` badge (Pending/Verified)
- [ ] Search/filter appliances
- [ ] Edit appliance details
- [ ] Cancel/delete unlinked registrations (not linked to active repairs)
- [ ] Zod schema for appliance validation

**Verification:**
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: add appliance, see it in list, search works

**Dependencies:** Task 12

**Files likely touched:**
- `src/features/customer/components/appliance-form.tsx`
- `src/features/customer/components/appliance-list.tsx`
- `src/features/customer/actions/appliance-actions.ts`
- `src/features/customer/schemas/appliance-schemas.ts`

**Estimated scope:** Medium (4 files)

---

### Task 14: Customer — Book & Manage Repairs + Appointments

**Description:** Build the repair booking flow: select appliance → choose service type, priority, describe issue → pick date + time slot → confirm (calls `rpc_create_repair_with_appointment`). Show active & past tickets with joined technician + appliance info, search/filter by status, reschedule or cancel pending appointments.

**Acceptance criteria:**
- [ ] Repair request form: appliance selector, service type, priority, issue description, scheduled date, time slot, pre-filled PH address
- [ ] Calls `rpc_create_repair_with_appointment` via server action
- [ ] Ticket list with SQL JOIN data (technician name, appliance model, status)
- [ ] Search/filter tickets by status
- [ ] Reschedule pending appointments (date + time slot update)
- [ ] Cancel pending appointments/tickets

**Verification:**
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: book a repair, see ticket in list, cancel works

**Dependencies:** Tasks 6, 13

**Files likely touched:**
- `src/features/customer/components/repair-booking-form.tsx`
- `src/features/customer/components/ticket-list.tsx`
- `src/features/customer/actions/repair-actions.ts`
- `src/features/customer/schemas/repair-schemas.ts`

**Estimated scope:** Medium (4-5 files)

---

### Task 15: Customer — Payments & Billing

**Description:** Build the payments section: view estimated and final costs per ticket, submit payment details (method dropdown with PH payment methods, amount, reference number, installment number), view payment history with verification status.

**Acceptance criteria:**
- [ ] Payment cost breakdown per ticket (`estimated_cost_php`, `final_cost_php`)
- [ ] Submit payment form: method (Cash, GCash, Maya, QR Ph, Bank Transfer, Card), amount, reference number, installment number
- [ ] Payment history table with `payment_status` badges
- [ ] PHP currency formatting throughout
- [ ] Zod schema for payment validation

**Verification:**
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: submit payment, see it in history

**Dependencies:** Task 14

**Files likely touched:**
- `src/features/customer/components/payment-form.tsx`
- `src/features/customer/components/payment-history.tsx`
- `src/features/customer/actions/payment-actions.ts`
- `src/features/customer/schemas/payment-schemas.ts`

**Estimated scope:** Medium (4 files)

---

### Task 16: Customer Profile + Settings page

**Description:** Build the dedicated `/customer/profile` page: Personal info (name, email, phone), default Philippine service address & branch, change password form (validates current → updates Supabase Auth + hashed `users.password`), account deactivation with confirmation dialog.

**Acceptance criteria:**
- [ ] Personal info display/edit (first, middle, last name, email, +63 phone)
- [ ] Address & branch location edit
- [ ] Change Password: validates current password, updates both Supabase Auth and hashed `users.password`
- [ ] Deactivate Account: confirmation dialog → sets `is_active = FALSE`, signs out
- [ ] Only accessible to `UTP-CUST` role

**Verification:**
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: update profile info, change password, deactivation flow

**Dependencies:** Task 12

**Files likely touched:**
- `src/app/customer/profile/page.tsx`
- `src/features/customer/components/profile-form.tsx`
- `src/features/customer/actions/profile-actions.ts`
- `src/features/customer/schemas/profile-schemas.ts`

**Estimated scope:** Medium (4 files)

---

## Checkpoint: Phase 3 — Customer Portal
- [ ] Customer can register appliances, book repairs, submit payments, manage profile
- [ ] All customer operations use proper Zod validation and server actions
- [ ] RLS ensures customers see only their own data
- [ ] Empty states display correctly when no records exist
- [ ] `npm run build` passes clean
- [ ] Review with human before proceeding

---

## Phase 4: Technician Workspace

### Task 17: Technician layout shell and Dashboard — KPIs & Activity

**Description:** Build the Technician RBAC layout shell with responsive navigation and the KPI summary section: Today's Appointments, Assigned Active Jobs, Completed This Month, Pending Collections (PHP) + recent job activity feed.

**Acceptance criteria:**
- [ ] Technician layout with responsive nav and `UTP-TECH` guard
- [ ] KPI summary cards with live Supabase queries
- [ ] Recent activity feed for technician's assigned jobs
- [ ] PHP currency formatting for pending collections
- [ ] Empty states for new/unassigned technician

**Verification:**
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: dashboard shows KPIs or empty states

**Dependencies:** Task 11

**Files likely touched:**
- `src/app/technician/layout.tsx`
- `src/app/technician/dashboard/page.tsx`
- `src/features/technician/components/kpi-cards.tsx`
- `src/features/technician/components/activity-feed.tsx`
- `src/features/technician/actions/dashboard-actions.ts`

**Estimated scope:** Medium (5 files)

---

### Task 18: Technician — Repair Pipeline board & Job Queue

**Description:** Build the toggleable Kanban board / structured table of assigned repair tickets with SQL JOINed customer name, phone, barangay/city address, and appliance model/serial. Search & filter by priority and status.

**Acceptance criteria:**
- [ ] Kanban board view with columns matching ticket statuses (Confirmed → In Progress → Awaiting Payment → Completed)
- [ ] Table view alternative (toggle switch)
- [ ] Each card/row shows customer name, phone, address, appliance model/serial
- [ ] Search by customer name or ticket ID
- [ ] Filter by priority and status
- [ ] Data from SQL JOINs across `repair` + `users` + `customer_appliances`

**Verification:**
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: pipeline displays assigned tickets, filters work

**Dependencies:** Task 17

**Files likely touched:**
- `src/features/technician/components/pipeline-board.tsx`
- `src/features/technician/components/job-table.tsx`
- `src/features/technician/actions/repair-actions.ts`

**Estimated scope:** Medium (3-4 files)

---

### Task 19: Technician — Diagnostic drawer, status updates, and payment recording

**Description:** Build the diagnostic/repair execution drawer: update ticket status through the pipeline (`confirmed → in_progress → awaiting_payment → completed`), record `diagnostic_notes`, enter `estimated_cost_php` and `final_cost_php`. Also build the on-site payment recording form (`received_by = current technician`, amount, method, reference, installment).

**Acceptance criteria:**
- [ ] Slide-over drawer for selected ticket
- [ ] Status transition buttons with valid state machine transitions
- [ ] Diagnostic notes text area (save to `repair.diagnostic_notes`)
- [ ] Cost entry: `estimated_cost_php` and `final_cost_php`
- [ ] On-site payment form: amount, method, reference_no, installment_no
- [ ] `received_by` auto-set to current technician's `user_id`
- [ ] Server actions with proper validation

**Verification:**
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: open drawer, update status, record payment

**Dependencies:** Task 18

**Files likely touched:**
- `src/features/technician/components/diagnostic-drawer.tsx`
- `src/features/technician/components/payment-capture.tsx`
- `src/features/technician/actions/repair-actions.ts` (extend)
- `src/features/technician/actions/payment-actions.ts`
- `src/features/technician/schemas/repair-schemas.ts`

**Estimated scope:** Medium (5 files)

---

### Task 20: Technician — Schedule & Appointments Manager

**Description:** Build the daily/weekly agenda view of assigned time slots. Confirm requested appointment slots, propose reschedule, or mark appointments completed.

**Acceptance criteria:**
- [ ] Daily agenda view showing time slots (8-10, 10-12, 1-3, 3-5) with assigned appointments
- [ ] Weekly overview showing appointment density per day
- [ ] Confirm requested appointment button
- [ ] Reschedule action (change date + time slot)
- [ ] Mark appointment completed
- [ ] Data from `appointments` JOIN `repair` JOIN `users` (customer info)

**Verification:**
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: agenda displays appointments, confirm/reschedule works

**Dependencies:** Task 17

**Files likely touched:**
- `src/features/technician/components/schedule-agenda.tsx`
- `src/features/technician/actions/appointment-actions.ts`
- `src/features/technician/schemas/appointment-schemas.ts`

**Estimated scope:** Medium (3 files)

---

### Task 21: Technician Profile + Settings page

**Description:** Build `/technician/profile`: identity & contact info, field service credentials (specializations multi-select, TESDA cert, max daily jobs, availability status quick-toggle), change password, session sign-out.

**Acceptance criteria:**
- [ ] Personal info display/edit (name, phone, branch, PH address)
- [ ] Specializations multi-select editor
- [ ] TESDA certification number field
- [ ] Max daily job capacity (1-15 slider/input)
- [ ] Availability status toggle (Available/Busy/Off Duty)
- [ ] Change password form
- [ ] Only accessible to `UTP-TECH` role

**Verification:**
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: update specializations, change availability status

**Dependencies:** Task 17

**Files likely touched:**
- `src/app/technician/profile/page.tsx`
- `src/features/technician/components/profile-form.tsx`
- `src/features/technician/actions/profile-actions.ts`
- `src/features/technician/schemas/profile-schemas.ts`

**Estimated scope:** Medium (4 files)

---

## Checkpoint: Phase 4 — Technician Workspace
- [ ] Technician can view pipeline, update job status, record diagnostics and payments
- [ ] Schedule/agenda view works with time slot management
- [ ] Technician profile with specializations and availability works
- [ ] RLS ensures technicians see only assigned tickets
- [ ] `npm run build` passes clean
- [ ] Review with human before proceeding

---

## Phase 5: Admin Operations Hub

### Task 22: Admin layout shell with sidebar navigation

**Description:** Build the Admin RBAC layout with modular sidebar/tab navigation (inspired by Salesforce/Zoho). Sidebar links: Dashboard, Users, Technicians, Appliances, Repairs, Appointments, Payments, Profile.

**Acceptance criteria:**
- [ ] Admin layout with sidebar navigation (desktop) and collapsible drawer (mobile)
- [ ] `UTP-ADMIN` RBAC guard
- [ ] Active link highlighting
- [ ] Sidebar collapses to icons on medium screens
- [ ] Responsive: mobile navigation drawer

**Verification:**
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: sidebar navigation works, responsive collapse

**Dependencies:** Task 11

**Files likely touched:**
- `src/app/admin/layout.tsx`
- `src/features/admin/components/admin-sidebar.tsx`

**Estimated scope:** Small (2 files)

---

### Task 23: Admin Dashboard — Executive KPIs & System Activity Log

**Description:** Build the Admin dashboard landing: revenue collected (PHP), active repair tickets by status breakdown, technician utilization metrics, pending verifications count, and real-time system-wide activity log. No notification bell.

**Acceptance criteria:**
- [ ] Revenue KPI card with PHP formatting
- [ ] Ticket status breakdown (count per status)
- [ ] Technician utilization (active/total, jobs today)
- [ ] Pending verifications count (appliances + payments)
- [ ] System-wide activity log from `activity_logs` (all actors)
- [ ] No notification bell or notification feed

**Verification:**
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: KPIs show zeros/empty for fresh system

**Dependencies:** Task 22

**Files likely touched:**
- `src/app/admin/dashboard/page.tsx`
- `src/features/admin/components/executive-kpis.tsx`
- `src/features/admin/components/system-activity-log.tsx`
- `src/features/admin/actions/dashboard-actions.ts`

**Estimated scope:** Medium (4 files)

---

### Task 24: Admin — User Management Module

**Description:** Full CRUD + search/filter across all users (Customers, Technicians, Admins). Create internal staff accounts, manage/change roles, update records, activate/deactivate accounts.

**Acceptance criteria:**
- [ ] User list table with search and role filter
- [ ] Create new user form (all roles — Customer/Technician/Admin)
- [ ] Edit user details
- [ ] Change user role (`user_type_id` update)
- [ ] Activate/deactivate toggle with confirmation
- [ ] Pagination for large user lists

**Verification:**
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: create user, search, change role, deactivate

**Dependencies:** Task 23

**Files likely touched:**
- `src/features/admin/components/user-management.tsx`
- `src/features/admin/components/user-form.tsx`
- `src/features/admin/actions/user-actions.ts`
- `src/features/admin/schemas/user-schemas.ts`

**Estimated scope:** Medium (4 files)

---

### Task 25: Admin — Technician Management Module

**Description:** Add/onboard technicians, update specializations & branch assignments, monitor live workload/active job counts, assign/reassign technicians to repair tickets via `rpc_assign_technician_and_confirm_slot`, remove/deactivate technicians.

**Acceptance criteria:**
- [ ] Technician roster table with workload indicators (active jobs / max daily)
- [ ] Assign technician to repair ticket (calls `rpc_assign_technician_and_confirm_slot`)
- [ ] Update technician specializations and branch
- [ ] Monitor availability status per technician
- [ ] Deactivate/remove technician with cascade handling

**Verification:**
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: assign tech to ticket, verify slot-conflict prevention

**Dependencies:** Tasks 6, 24

**Files likely touched:**
- `src/features/admin/components/technician-management.tsx`
- `src/features/admin/components/tech-assignment-modal.tsx`
- `src/features/admin/actions/technician-actions.ts`
- `src/features/admin/schemas/technician-schemas.ts`

**Estimated scope:** Medium (4 files)

---

### Task 26: Admin — Appliance Registration & Master Data Management

**Description:** Search all customer appliance registrations across branches, inspect serial/model details, verify or cancel registrations, manage master records with full CRUD.

**Acceptance criteria:**
- [ ] All-appliance master table with search (serial, model, brand, customer name)
- [ ] Filter by registration status and branch
- [ ] Verify registration button (updates `registration_status` to `'verified'`)
- [ ] Cancel registration button (with confirmation)
- [ ] View appliance details with linked customer info (SQL JOIN)
- [ ] Edit master record fields

**Verification:**
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: search appliance, verify registration

**Dependencies:** Task 23

**Files likely touched:**
- `src/features/admin/components/appliance-management.tsx`
- `src/features/admin/actions/appliance-actions.ts`

**Estimated scope:** Small (2-3 files)

---

### Task 27: Admin — Repair Transactions Oversight

**Description:** Master multi-JOIN table of all repair tickets (`repair` + `customer` + `technician` + `appliance`). Create walk-in/phone-in tickets, update priority/costs/status, cancel tickets.

**Acceptance criteria:**
- [ ] Master repair table with multi-JOIN data (customer name, tech name, appliance model, all ticket fields)
- [ ] Search by ticket ID, customer name, appliance serial
- [ ] Filter by status, priority, branch, date range
- [ ] Create walk-in/phone-in repair ticket (admin-initiated)
- [ ] Edit ticket priority, costs, status
- [ ] Cancel ticket with confirmation

**Verification:**
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: view all tickets, create new, update status

**Dependencies:** Task 23

**Files likely touched:**
- `src/features/admin/components/repair-oversight.tsx`
- `src/features/admin/components/repair-form.tsx`
- `src/features/admin/actions/repair-actions.ts`
- `src/features/admin/schemas/repair-schemas.ts`

**Estimated scope:** Medium (4 files)

---

### Task 28: Admin — Appointments & Dispatch Scheduling

**Description:** Master schedule board across branches and time slots. Confirm, reschedule, assign technician with slot-conflict locking, cancel, or complete appointments.

**Acceptance criteria:**
- [ ] Master schedule view across all branches (filterable)
- [ ] Time slot grid showing appointments per day
- [ ] Confirm appointment from `requested` status
- [ ] Reschedule with date/time slot picker
- [ ] Assign technician (triggers `rpc_assign_technician_and_confirm_slot`)
- [ ] Cancel and complete appointment actions

**Verification:**
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: view schedule, confirm/reschedule appointment

**Dependencies:** Tasks 6, 23

**Files likely touched:**
- `src/features/admin/components/appointment-dispatch.tsx`
- `src/features/admin/actions/appointment-actions.ts`
- `src/features/admin/schemas/appointment-schemas.ts`

**Estimated scope:** Medium (3 files)

---

### Task 29: Admin — Payments & Verification Ledger

**Description:** Master ledger of all PHP payments. Inspect reference numbers, verify payments via `rpc_record_and_verify_payment` (auto-completes ticket when fully paid), update remarks, cancel invalid entries, search/export payment history.

**Acceptance criteria:**
- [ ] Master payment ledger with all payments across system
- [ ] Search by reference number, ticket ID, customer name
- [ ] Filter by payment status, method, date range
- [ ] Verify Payment button (calls `rpc_record_and_verify_payment`)
- [ ] Cancel invalid payment entry
- [ ] Update remarks
- [ ] PHP currency formatting throughout

**Verification:**
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: view payments, verify one, see ticket auto-complete when fully paid

**Dependencies:** Tasks 6, 23

**Files likely touched:**
- `src/features/admin/components/payment-ledger.tsx`
- `src/features/admin/actions/payment-actions.ts`
- `src/features/admin/schemas/payment-schemas.ts`

**Estimated scope:** Medium (3 files)

---

### Task 30: Admin Profile + Settings page

**Description:** Build `/admin/profile`: administrator profile (name, contact, managed branch, PH office address), administrative security (change password, role/branch badge summary, security controls).

**Acceptance criteria:**
- [ ] Admin profile display/edit (name, phone, branch, address)
- [ ] Active role and branch badge summary
- [ ] Change password form
- [ ] Only accessible to `UTP-ADMIN` role

**Verification:**
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: edit profile, change password

**Dependencies:** Task 22

**Files likely touched:**
- `src/app/admin/profile/page.tsx`
- `src/features/admin/components/profile-form.tsx`
- `src/features/admin/actions/profile-actions.ts`
- `src/features/admin/schemas/profile-schemas.ts`

**Estimated scope:** Small (4 files)

---

## Checkpoint: Phase 5 — Admin Operations Hub
- [ ] All 7 admin modules functional (KPIs, Users, Technicians, Appliances, Repairs, Appointments, Payments)
- [ ] Admin can manage full lifecycle across all entities
- [ ] Transactional RPCs work end-to-end (assign tech, verify payment)
- [ ] `npm run build` passes clean
- [ ] Review with human before proceeding

---

## Phase 6: Landing Page & Production Polish

### Task 31: Landing page

**Description:** Build the public landing page (`/`): minimal sticky header with Spindle wordmark, nav links, Sign In + Book a Repair CTA. Hero section with headline for PH market, value prop, workflow preview (Request → Dispatch → Repair → Pay). 3-card capability strip. Service hubs strip + minimal footer. No academic/project traces.

**Acceptance criteria:**
- [ ] Sticky header: logo, nav (Services, How It Works, Service Areas), Sign In, Book a Repair CTA
- [ ] Hero: PH-focused headline, 2-line value prop, primary CTA, workflow preview card
- [ ] 3-card capability strip (Certified Technicians, Transparent PHP Estimates, Real-Time Scheduling)
- [ ] Service hubs strip (Metro Manila, Laguna, Cebu, Davao)
- [ ] Clean minimal footer with copyright
- [ ] No school/capstone/academic traces or disclaimers
- [ ] Fully responsive (desktop/tablet/mobile)

**Verification:**
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: landing page renders correctly, CTAs link to `/signup` and `/login`

**Dependencies:** Task 7

**Files likely touched:**
- `src/app/(public)/page.tsx`
- `src/features/landing/components/` (hero, capabilities, service-hubs, footer)

**Estimated scope:** Medium (4-5 files)

---

### Task 32: Responsive pass, empty state polish, and production build verification

**Description:** Final responsive audit across all 9 pages at desktop (≥1024px), tablet (768-1023px), and mobile (<768px). Polish all empty states for tables, lists, and charts. Verify `npm run build` produces zero TypeScript and ESLint errors. Confirm all guardrails: no demo data, no academic traces, no notifications, no inventory, no warranty.

**Acceptance criteria:**
- [ ] All 9 pages responsive across desktop, tablet, mobile viewports
- [ ] All tables use horizontal scroll or card layout on mobile
- [ ] Mobile navigation drawers work on all role layouts
- [ ] All empty states have clean illustrations, descriptive text, and CTAs where appropriate
- [ ] `npm run build` → zero TypeScript errors, zero ESLint errors
- [ ] Grep confirms: no `warranty`, no `notification`, no `inventory`, no `demo`, no `capstone`/`school project`/`academic`

**Verification:**
- [ ] Build succeeds: `npm run build` (zero errors)
- [ ] Manual check: test all 9 pages at 3 viewport sizes

**Dependencies:** Tasks 31, 30 (all previous tasks complete)

**Files likely touched:**
- Various component files across all roles (responsive tweaks)

**Estimated scope:** Medium (multiple files, minor tweaks)

---

## Checkpoint: Final — Production Ready
- [ ] All 9 pages built and functional
- [ ] All 8 database tables with RLS and RPCs working
- [ ] All 8 system modules implemented (User Mgmt, Dashboard, Data Mgmt, Registration, Transactions, Technician Mgmt, Payments, Appointments)
- [ ] Zero excluded features confirmed (no demo, no academic, no notifications, no inventory, no warranty)
- [ ] `npm run build` passes clean — Vercel deployment ready
- [ ] Ready for review and deployment

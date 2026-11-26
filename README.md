# Spindle

**Spindle** is a Philippine home appliance repair and service scheduling platform built with **Next.js 16**, **TypeScript**, **Tailwind CSS v4**, and **Supabase**. It connects homeowners, field technicians, and operations coordinators through three role-tailored portals backed by PostgreSQL Row-Level Security (RLS) and atomic transaction RPCs.

---

## Key Capabilities

### Public, Authentication & Role Onboarding
- **Landing Showcase (`/`)**: Plain-language service overview, supported appliance categories, Philippine brand strip (`public/images/brands/`), and step-by-step booking explanation.
- **Auth (`/login`, `/signup`)**: Email/password login and self-signup (Customer or Technician), automatic role routing, and active-account enforcement.
- **Role-Aware Onboarding (`/onboarding`)**:
  - **Customer**: Completes personal details and 5-part Philippine service address.
  - **Technician**: Submits technician nickname (`nickname`), TESDA / trade certification (`certification_no`), service branch, proposed appliance specializations (`proposed_specializations`), and service address.

### Homeowner / Customer Portal (`/customer/*`)
- **Home (`/customer/home`)**: Upcoming visit passbook summary, quick repair booking action, registered unit count, and recent activity feed.
- **My Appliances (`/customer/appliances`)**: Register, edit, or inspect household appliances (13 categories including air conditioners, refrigerators, washers/dryers, ranges, TVs, electric fans, and water heaters) with verification status.
- **Bookings (`/customer/bookings`, `/customer/bookings/[ticketId]`)**: Book service visits (creating ticket + appointment atomically), track plain-language status timelines, reschedule future visits (with Manila date & technician slot conflict validation), cancel bookings, and view full visit/payment details.
- **Payments (`/customer/payments`)**: Review bills/receipts, submit GCash/Maya/Card/Bank Transfer payment references, and track verification progress.
- **Profile (`/customer/profile`)**: Update contact details, Philippine address, interactive focal-framed avatar (`ProfilePhotoField`), password, or deactivate account.

### Technician Portal (`/technician/*`)
- **Dashboard (`/technician/dashboard`)**: Daily job KPIs, active queue snapshot, upcoming schedule, and self-service availability status toggle (`available`, `busy`, `on_leave`) recorded in `technician_status_logs`.
- **Assigned Jobs (`/technician/jobs`)**: Search/filter assigned repair tickets and slide-over diagnostic & billing workbench (`DiagnosticDrawer`) to log findings, update estimated/final PHP costs, transition status, and record cash/e-wallet collections.
- **Schedule (`/technician/schedule`)**: Inspect upcoming home visits and reschedule/update visit status with slot-conflict checks.
- **Collections (`/technician/collections`)**: Track collected and verified payments per ticket.
- **Profile (`/technician/profile`)**: Manage avatar focal framing, password, and inspect locked certification/specialization profile details.

### Operations Admin Portal (`/admin/*`)
Granular RBAC controlled via `users.admin_permissions`: **Super Admins** (`null`) can access every module; **Limited Admins** (`string[]` matching `ADMIN_FEATURES`) see and route exclusively within their granted modules.
- **Executive Summary (`/admin/dashboard`)**: Operations KPIs, repair status pipeline distribution, and system-wide activity feed.
- **Repair Tickets (`/admin/repairs`)**: Create walk-in/phone tickets atomically, assign technicians, inspect diagnostics, and update repair status/pricing.
- **Dispatch Board (`/admin/appointments`)**: Assign technicians with slot-conflict prevention, confirm slots (`rpc_assign_technician_and_confirm_slot`), reschedule visits, and filter by branch/date/status.
- **Payments Ledger (`/admin/payments`)**: Record and verify payments atomically (`rpc_record_and_verify_payment`), inspect outstanding balances, and export filtered CSVs.
- **Technicians Roster (`/admin/technicians`)**: Approve specializations, set daily job capacities, toggle availability, and inspect each technician's productivity tracker (`TechnicianProductivitySheet`: lifetime completions, revenue verified, weekly output, recent tickets, status history).
- **Appliances Registry (`/admin/appliances`)**: Verify customer-registered appliances and serial numbers.
- **Users & Roles (`/admin/users`)**: Create accounts, assign roles/branches/admin permissions, activate/deactivate accounts, and reset passwords cleanly (`hash_password_bcrypt`).
- **Profile (`/admin/profile`)**: Update personal admin profile, avatar framing, and password.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js `16.4.6` (App Router, `cacheComponents: true`, `partialPrefetching: true`) |
| UI Runtime | React `19.3.0`, TypeScript `^5` |
| Styling | Tailwind CSS `4.3.3` + `@tailwindcss/turbopack`, Radix UI primitives, `lucide-react` |
| Forms & Validation | `react-hook-form`, `@hookform/resolvers`, `zod` v4 |
| Backend & Auth | Supabase (`@supabase/ssr`, `@supabase/supabase-js`) — Postgres, Auth, Storage (`avatars`) |

---

## Project Structure

```text
src/
├── proxy.ts                        # Next.js 16 request proxy (delegates to updateSession)
├── app/
│   ├── layout.tsx                  # Root layout (Manrope, Bricolage Grotesque, JetBrains Mono)
│   ├── globals.css                 # Tactile Service Passbook theme tokens & utility classes
│   ├── icon.svg                    # App icon
│   ├── (public)/page.tsx           # Marketing & service overview landing page
│   ├── (auth)/                     # /login and /signup routes
│   ├── onboarding/page.tsx         # Role-aware customer/technician onboarding
│   ├── customer/                   # Customer portal pages + layout + loading
│   ├── technician/                 # Technician portal pages + layout + loading
│   └── admin/                      # Admin portal pages + layout + loading
├── components/
│   ├── shared/                     # CustomerShell, PortalShell, PhilippineAddressFields,
│   │                               # ProfilePhotoField, UserAvatar, StatusBadge, etc.
│   └── ui/                         # Radix + Tailwind primitives
├── features/
│   ├── landing/                    # Landing showcase components
│   ├── auth/                       # Login/signup/password/avatar forms, schemas & actions
│   ├── onboarding/                 # Onboarding form, dynamic role schema & action
│   ├── customer/                   # Home, appliances, bookings, payments, profile modules
│   ├── technician/                 # Overview, pipeline, diagnostic drawer, schedule, collections
│   └── admin/                      # Executive summary, repairs, dispatch, payments,
│                                   # technicians, productivity sheet, appliances, users
├── lib/
│   ├── auth/session.ts             # requireRole, getCurrentUserProfile, getRoleHomePath
│   ├── data/portal-data.ts         # Private cached per-portal data loaders
│   ├── supabase/                   # client, server, admin, and proxy helpers
│   ├── avatar.ts                   # Non-destructive { x, y, zoom } avatar framing helpers
│   ├── constants.ts                # Branches, 13 appliance categories, slots, statuses, RBAC keys
│   ├── formatters.ts               # PHP currency, Manila dates/times, initials, name helpers
│   └── utils.ts                    # cn() class merging helper
└── types/database.ts               # Database table & view TypeScript contracts

supabase/migrations/
├── 001_schema_and_alphanumeric_ids.sql
├── 002_rls_policies.sql
├── 003_transactions_and_locking_rpcs.sql
├── 004_user_avatar_and_storage.sql
└── 005_nickname_status_logs_and_admin_permissions.sql
```

Design tokens, typography, color contrast rules, and component aesthetics are documented in [DESIGN.md](./DESIGN.md). Agent engineering contracts live in [AGENTS.md](./AGENTS.md).

---

## Database & Security Architecture

All domain tables use human-readable alphanumeric IDs (`USR-*`, `TCP-*`, `TSL-*`, `APL-*`, `TKT-*`, `APT-*`, `PAY-*`, `LOG-*`) generated by `public.generate_alphanumeric_id`:

- **Tables**: `user_types`, `users`, `technician_profiles`, `technician_status_logs`, `customer_appliances`, `repair`, `appointments`, `payments`, `activity_logs`
- **Views (`security_invoker = true`)**: `v_repair_details`, `v_appointment_details`, `v_payment_details`
- **Atomic RPCs (`003`)**:
  - `rpc_create_repair_with_appointment`: creates repair ticket + scheduled appointment atomically
  - `rpc_assign_technician_and_confirm_slot`: locks technician time slot and confirms appointment
  - `rpc_record_and_verify_payment`: records and/or verifies customer or technician payments consistently
- **Triggers & Locks (`005`)**: `enforce_technician_user_field_locks` and `enforce_technician_profile_locks` restrict self-service edits on verified technician profile fields once onboarding completes.
- **Storage (`004`)**: Public `avatars` bucket (2 MB cap, JPEG/PNG/WebP) with RLS restricting writes/deletes to the owner's `auth.uid()` folder prefix.

---

## Getting Started

### 1. Environment Variables
Copy `.env.example` to `.env.local` and configure your Supabase project values:

```bash
cp .env.example .env.local
```

Required variables (see `.env.example`):
- `SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY` & `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY` (used server-side in `src/lib/supabase/admin.ts`)
- `SUPABASE_JWKS_URL`

### 2. Apply Supabase Migrations
Run the SQL files in `supabase/migrations/` in numeric order (`001` -> `005`) in your Supabase SQL Editor or via the Supabase CLI.

### 3. Install & Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Verification Commands

```bash
npx tsc --noEmit   # TypeScript typecheck
npm run lint       # ESLint checks
npm run build      # Production build & route verification
```

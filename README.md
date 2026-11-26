# Spindle

**Spindle** is a multi-role home appliance repair and service scheduling platform built for Philippine households and regional service teams across Metro Manila, Cavite, Laguna, Cebu, and Davao.

Designed around the **Tactile Service Passbook** interface system, Spindle pairs plain, everyday language on customer-facing surfaces with dedicated desktop top navigation, mobile bottom tab bars, clickable staff sidebar footers, interactive profile photo framing, and transactional Supabase scheduling and payment workflows.

---

## Key Features

### Customer Portal (No Sidebar, Plain Language)
- **Public Landing (`/`):** Clear service promise, Philippine branch directory, interactive **Brands & Appliances** showcase with plain-language care details, and a **Schedule a Visit** CTA.
- **Auth & Onboarding (`/login`, `/signup`, `/onboarding`):** Mobile-first forms (`+63` / `09XX` mobile numbers, barangay/city/province address setup, preferred branch).
- **Customer Home (`/customer/home`):** Greeting, next scheduled visit passbook highlight, quick summary counters, and plain-language recent updates.
- **My Appliances (`/customer/appliances`):** Card grid for saved appliances with progressive-disclosure details drawer and add/edit forms.
- **My Bookings (`/customer/bookings`, `/customer/bookings/[ticketId]`):** Home visit scheduling cards, 4-step progress tracker, assigned technician card, transparent PHP cost breakdown, reschedule, and cancel.
- **My Payments (`/customer/payments`):** Separated **Service Bills** and expandable **Past Payments** receipts supporting `GCash`, `Maya`, `QR Ph`, `Bank Transfer`, `Credit/Debit Card`, and `Cash`.
- **Profile & Settings (`/customer/profile`):** Contact details, service address, password updates, profile picture upload, and interactive **pan & zoom photo positioning**.

### Technician Portal (Sidebar + Mobile Bottom Bar)
- **Overview (`/technician/dashboard`):** Daily visit count, active jobs, monthly completions, pending collections, and today's agenda.
- **Assigned Jobs (`/technician/jobs`):** Kanban pipeline and responsive table/card list paired with the slide-out `DiagnosticDrawer` for updating repair stages, diagnostic notes, PHP pricing, and on-site payment capture.
- **Schedule (`/technician/schedule`):** Today / Upcoming / All dispatch slots with Confirm, Reschedule, and Complete actions.
- **Field Collections (`/technician/collections`):** On-site payments tied to assigned repairs.
- **Profile & Credentials (`/technician/profile`):** Accessible via the clickable bottom-left sidebar profile footer; configures TESDA certification, appliance specializations, daily capacity, availability, and avatar framing.

### Admin Portal (Sidebar + Mobile Bottom Bar)
- **Overview (`/admin/dashboard`):** Collected PHP revenue, active repairs, technician availability, pending verification queues, stage breakdown, and system-wide activity log.
- **Operations Modules:** Focused dedicated pages for **Repairs** (`/admin/repairs`), **Appointments** (`/admin/appointments`), **Technicians** (`/admin/technicians`), **Appliances** (`/admin/appliances`), **Users** (`/admin/users`), and **Payments** (`/admin/payments`), each with mobile card views and desktop management tables.
- **Admin Profile (`/admin/profile`):** Accessible from the clickable bottom-left sidebar footer, including profile photo upload and focal position editor.

---

## Tech Stack

- **Framework:** Next.js `16.4.6` (App Router, `cacheComponents: true`, `partialPrefetching: true`, Turbopack)
- **Language & UI:** React `19.3.0`, TypeScript `5`, Tailwind CSS `4.3.3`, Radix UI (`Dialog`, `Select`, `Tabs`, `AlertDialog`, `Checkbox`, `Popover`), `lucide-react`
- **Forms & Validation:** `react-hook-form` + `zod` + `@hookform/resolvers`
- **Typography:** `Bricolage Grotesque` (headings), `Manrope` (UI/body), `JetBrains Mono` (reference IDs & tabular PHP amounts)
- **Backend & Auth:** Supabase (`@supabase/supabase-js`, `@supabase/ssr`), PostgreSQL views & transactional RPCs, Supabase Storage (`avatars` bucket)

---

## Route Map

| Surface | Route | Purpose |
| --- | --- | --- |
| Public | `/` | Landing page & interactive appliance showcase |
| Auth | `/login`, `/signup`, `/onboarding` | Sign in, customer registration, first-time setup |
| Customer | `/customer/home` | Uncluttered home summary & next scheduled visit |
| Customer | `/customer/appliances` | Saved appliances cards & detail sheet |
| Customer | `/customer/bookings` | Home visit cards & booking modal |
| Customer | `/customer/bookings/[ticketId]` | 4-step visit tracker, technician card & cost summary |
| Customer | `/customer/payments` | Bills due & expandable payment receipts |
| Customer | `/customer/profile` | Contact info, address, avatar position & password |
| Technician | `/technician/dashboard` | KPIs, today's agenda & active repair queue |
| Technician | `/technician/jobs` | Pipeline/table queue + `DiagnosticDrawer` |
| Technician | `/technician/schedule` | Dispatch schedule management |
| Technician | `/technician/collections` | On-site PHP collections |
| Technician | `/technician/profile` | TESDA credentials, specializations & avatar position |
| Admin | `/admin/dashboard` | Executive KPIs, verification shortcuts & audit feed |
| Admin | `/admin/repairs` | Master repair tickets & walk-in intake |
| Admin | `/admin/appointments` | Dispatch scheduling & technician assignment |
| Admin | `/admin/technicians` | Technician roster, workload & credentials |
| Admin | `/admin/appliances` | Appliance registration verification |
| Admin | `/admin/users` | Customer, technician & admin directory |
| Admin | `/admin/payments` | Payment verification & walk-in ledger |
| Admin | `/admin/profile` | Admin profile, managed branch & avatar position |

---

## Getting Started

### 1. Environment Variables
Copy `.env.example` to `.env.local` and provide your Supabase project credentials:

```bash
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_publishable_key
SUPABASE_SECRET_KEY=sb_secret_your_secret_key
SUPABASE_JWKS_URL=https://your-project-ref.supabase.co/auth/v1/.well-known/jwks.json

NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_publishable_key
```

### 2. Supabase Database Migrations
Run the SQL migrations in `supabase/migrations/` in numeric order against your Supabase project:
1. `001_schema_and_alphanumeric_ids.sql` — Core tables (`users`, `user_types`, `technician_profiles`, `customer_appliances`, `repair`, `appointments`, `payments`, `activity_logs`), views (`v_repair_details`, `v_appointment_details`, `v_payment_details`), and custom alphanumeric ID generators.
2. `002_rls_policies.sql` — Row-level security policies per role.
3. `003_transactions_and_locking_rpcs.sql` — Atomic RPCs (`rpc_create_repair_with_appointment`, `rpc_assign_technician_and_confirm_slot`, `rpc_record_and_verify_payment`).
4. `004_user_avatar_and_storage.sql` — Profile `avatar_url` and `avatar_position` (`{ x, y, zoom }` JSONB) columns plus Supabase Storage policies for the `avatars` bucket (framing also syncs to Supabase Auth `user_metadata` for graceful backwards compatibility).

### 3. Install Dependencies & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

| Script | Command | Description |
| --- | --- | --- |
| Development server | `npm run dev` | Runs Next.js dev server with Turbopack |
| Production build | `npm run build` | Builds the Next.js production bundle & verifies types/routes |
| Production server | `npm run start` | Starts the built production server |
| Linter | `npm run lint` | Runs ESLint (`eslint-config-next`) |
| TypeScript check | `npx tsc --noEmit` | Strict TypeScript validation |

---

## Architecture & Conventions

- **Next.js 16 `cacheComponents: true`:** Server components that call `requireRole()` or read `searchParams` / `params` (via `Promise`) are wrapped inside `<Suspense fallback={<PageSkeleton />}>`.
- **Route Proxy Guard:** Role-based access checks and onboarding redirects are handled in `src/proxy.ts` and `src/lib/supabase/proxy.ts`.
- **Feature Modules:** Business logic, Zod schemas, Server Actions, and UI components are organized under `src/features/{landing,auth,onboarding,customer,technician,admin}`.
- **Shared Design Documentation:** Visual tokens, component specs, and the **Tactile Service Passbook** direction rules live in `DESIGN.md` and `.impeccable/design.json`.

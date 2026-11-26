# Implementation Plan: Spindle — Philippine Appliance Repair & Field Service CRM

## Overview

Spindle is a production-grade, commercial-quality web application for appliance repair scheduling, field service dispatch, and customer operations — built for the Philippine market. It features three RBAC roles (Customer, Technician, Admin) across 9 pages, backed by a Supabase PostgreSQL database with alphanumeric primary keys, row-level security, and ACID transactions with row-level locking. The frontend uses Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, Zod + React Hook Form. This is a greenfield build — no code exists yet.

## Architecture Decisions

- **Vertical slicing by feature phase**: Each phase delivers working, testable end-to-end functionality rather than building all DB → all API → all UI.
- **Database-first foundation**: Migrations, RLS, and RPCs are created before any application code, since every feature depends on a working schema.
- **Feature-based folder structure**: Strict `customer/`, `technician/`, `admin/` subfolder separation in both `src/app/` and `src/features/` per spec requirements.
- **Supabase Auth + custom `users` table bridge**: `auth.users(id)` ↔ `public.users(auth_user_id)` with alphanumeric `user_id` PKs. Session verification via `@supabase/ssr` and `supabase.auth.getUser()`.
- **Server Components + Server Actions pattern**: Data-fetching in Server Components; mutations via Server Actions calling Supabase RPCs. No client-side Supabase mutations for sensitive operations.
- **Shared Zod schemas**: Validation schemas shared between client forms (React Hook Form) and Server Actions for single source of truth.
- **Philippine localization baked in from day one**: Currency (₱ PHP), timezone (Asia/Manila), phone format (+63), address structure (barangay/city/province/zip) built into schemas, formatters, and seed data.

## Dependency Graph

```
Phase 1: Project Scaffolding & Database Foundation
    │
    ├── Next.js + TypeScript + Tailwind + shadcn/ui setup
    ├── Supabase client config (browser, server, admin)
    ├── Environment variables (.env.local, .env.example)
    ├── SQL Migration 001: Schema + alphanumeric IDs + seed user_types
    ├── SQL Migration 002: RLS policies
    ├── SQL Migration 003: RPC transactions & locking
    └── Philippine formatters (currency, date, phone)
        │
Phase 2: Auth & Onboarding (vertical slice)
    │
    ├── Shared UI components (logo, status badges, empty states)
    ├── Auth feature module (Zod schemas, server actions, split-screen forms)
    ├── Login page (/login)
    ├── Signup page (/signup)
    ├── RBAC middleware/proxy
    └── Onboarding page (/onboarding)
        │
Phase 3: Customer Portal (vertical slice)
    │
    ├── Customer RBAC layout shell
    ├── Customer Home — Overview & Activity cards
    ├── Customer Home — My Appliances (registration CRUD)
    ├── Customer Home — Book & Manage Repairs + Appointments
    ├── Customer Home — Payments & Billing
    └── Customer Profile + Settings (/customer/profile)
        │
Phase 4: Technician Workspace (vertical slice)
    │
    ├── Technician RBAC layout shell
    ├── Technician Dashboard — KPIs & Activity feed
    ├── Technician Dashboard — Pipeline board / job queue
    ├── Technician Dashboard — Diagnostic drawer + status updates
    ├── Technician Dashboard — Schedule & appointments manager
    ├── Technician Dashboard — On-site payment recording
    └── Technician Profile + Settings (/technician/profile)
        │
Phase 5: Admin Operations Hub (vertical slice)
    │
    ├── Admin RBAC layout + sidebar shell
    ├── Admin Dashboard — Executive KPIs & activity log
    ├── Admin Dashboard — User Management CRUD
    ├── Admin Dashboard — Technician Management
    ├── Admin Dashboard — Appliance Registration & Master Data
    ├── Admin Dashboard — Repair Transactions Oversight
    ├── Admin Dashboard — Appointments & Dispatch Scheduling
    ├── Admin Dashboard — Payments & Verification Ledger
    └── Admin Profile + Settings (/admin/profile)
        │
Phase 6: Landing Page & Polish
    │
    ├── Landing page (/) — hero, capabilities, service hubs, footer
    ├── Responsive pass across all viewports
    ├── Empty state polish for all tables/lists
    └── Build verification (zero TS/ESLint errors)
```

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Supabase free-tier RLS complexity — complex multi-join RLS policies may hit performance limits | Medium | Use `(select auth.uid())` pattern for stable plans; test RLS with `EXPLAIN ANALYZE` early |
| Alphanumeric PK generation collisions under concurrent inserts | Low | Use `pgcrypto` `gen_random_bytes` with 8-char suffix — collision probability negligible at app scale |
| Row-level locking RPCs (`FOR UPDATE`) may deadlock on concurrent tech assignment | Medium | Acquire locks in consistent table order within each RPC; add deadlock retry logic in server actions |
| Split-screen auth layout responsiveness on small tablets | Low | Test at 768px breakpoint early; use CSS grid with `auto-fit` |
| Supabase Auth ↔ custom `users` table race condition on signup | High | Use Supabase Auth trigger (`on_auth_user_created`) or atomic server action to create both records in sequence; verify with integration test |
| Scope creep — 9 pages with many sub-features across 3 roles | High | Strict vertical slicing; each task is S/M sized; checkpoints after each phase with working app |

## Open Questions

- **Auth trigger vs. server action for user creation**: Should we use a Supabase DB trigger (`auth.users` → `public.users`) or handle the bridge in the signup server action? (Recommendation: server action for more control over error handling and onboarding flow.)
- **Deployment**: Is the Supabase project already created with these credentials, or do we need to run migrations against a fresh project?
- **Email verification**: Does the signup flow require email verification, or is immediate access acceptable?
- **Admin user seeding**: How should the first Admin account be created? (Recommendation: manual SQL insert or Supabase dashboard after migration.)

## Task List

Tasks tracked in `tasks/todo.md` — see that file for the full ordered checklist with acceptance criteria.

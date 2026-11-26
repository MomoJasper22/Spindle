<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Repository Overview

**Spindle** is a Philippine home appliance repair and service scheduling platform built on **Next.js `16.4.6`** (`App Router`, `cacheComponents: true`, `partialPrefetching: true`, `images.formats: ['image/avif', 'image/webp']`), **React `19.3.0`**, **TypeScript**, **Tailwind CSS v4** (`@tailwindcss/turbopack` + CSS theme tokens in `src/app/globals.css`), **React Hook Form + Zod v4**, and **Supabase** (`@supabase/ssr` + `@supabase/supabase-js`).

### Directory Layout

- `src/proxy.ts` -> delegates request session/role gating to `updateSession` in `src/lib/supabase/proxy.ts`
- `src/app/` -> App Router layouts and pages:
  - `(public)/page.tsx` -> public landing experience
  - `(auth)/login/page.tsx`, `(auth)/signup/page.tsx` -> authentication views
  - `onboarding/page.tsx` -> role-aware onboarding (Customer or Technician)
  - `customer/{home,appliances,bookings,bookings/[ticketId],payments,profile}/page.tsx` -> homeowner portal
  - `technician/{dashboard,jobs,schedule,collections,profile}/page.tsx` -> field technician portal
  - `admin/{dashboard,repairs,appointments,technicians,appliances,users,payments,profile}/page.tsx` -> operations admin portal
- `src/components/ui/` -> Radix UI + Tailwind primitives (`alert-dialog`, `badge`, `button`, `card`, `checkbox`, `dialog`, `input`, `label`, `select`, `separator`, `sheet`, `skeleton`, `table`, `textarea`)
- `src/components/shared/` -> cross-portal shell & UI components (`customer-shell`, `portal-shell`, `ph-address-fields`, `profile-photo-field`, `user-avatar`, `status-badge`, `spindle-logo`, `confirmation-dialog`, `empty-state`, `form-banner`, `page-skeleton`)
- `src/features/` -> feature modules grouped by domain (`landing`, `auth`, `onboarding`, `customer`, `technician`, `admin`), each owning its `schemas/`, `actions/`, and `components/`
- `src/lib/` -> `auth/session.ts`, `data/portal-data.ts`, `supabase/{admin,client,proxy,server}.ts`, `avatar.ts`, `constants.ts`, `formatters.ts`, `utils.ts`
- `src/types/database.ts` -> TypeScript view/table types (`UserRow`, `TechnicianProfileRow`, `CustomerApplianceRow`, `RepairDetailView`, `AppointmentDetailView`, `PaymentDetailView`, `ActivityLogRow`, `TechnicianStatusLogRow`)
- `supabase/migrations/` -> SQL migrations `001` through `005`

## Authentication, Roles & RBAC

- **Session & Route Protection (`src/lib/supabase/proxy.ts`, `src/lib/auth/session.ts`):**
  - `updateSession()` has an unauthenticated `sb-` cookie fast-path to skip unnecessary `auth.getUser()` calls on anonymous traffic while protecting `/customer/*`, `/technician/*`, `/admin/*`, and `/onboarding`.
  - Authenticated users whose `users.is_onboarded` is `false` are redirected to `/onboarding`; deactivated accounts are signed out and returned to `/login`.
  - `requireRole(allowedRoles, adminFeature?)` and `getCurrentUserProfile()` gate layouts/pages and derive the user's landing route via `getRoleHomePath()`.
- **Admin Permissions (`ADMIN_FEATURES` in `src/lib/constants.ts`):**
  - `admin_permissions === null` denotes a **Super Admin** with full access across `dashboard`, `repairs`, `appointments`, `payments`, `technicians`, `appliances`, and `users`.
  - `Array.isArray(admin_permissions)` denotes a **Limited Admin** restricted to those specific modules; unauthorized `/admin/*` pages redirect cleanly to their first permitted module (`getRoleHomePath`).
  - Technicians (`role === 'technician'`) undergo approval & specialization proposals during onboarding (`proposed_specializations`, `nickname`, `certification_no`) and have field-level locks enforced by database triggers (`005`).

## Design & UX Contracts

1. **Aesthetic Direction (`Tactile Service Passbook`):**
   - Warm alabaster ground (`#F8F7F4`), paper-white cards (`#FFFFFF`), warm sand borders (`#E6E1D6`), ink-navy text & staff sidebars (`#141B29`), deep teal primary (`#0F766E`), warm amber highlights (`#D97706`), emerald completion stamps (`#047857`).
   - Fonts: `Bricolage Grotesque` (`--font-heading`), `Manrope` (`--font-sans`), `JetBrains Mono` (`--font-mono`) for reference codes and tabular amounts (`tabular-nums`).
   - Canonical design token & component reference: `DESIGN.md` and `src/app/globals.css`.
2. **Customer Plain-Language Rule:**
   - Customer-facing surfaces (`src/app/(public)/*`, `src/features/landing/*`, `src/app/(auth)/*`, `login-form.tsx`, `signup-form.tsx`, `src/app/onboarding/*`, `src/app/customer/*`, `src/features/customer/*`, and `StatusBadge` with `audience="customer"` / `getCustomerStatusLabel`) MUST use plain everyday homeowner wording.
   - Avoid internal or technical jargon (`ticket ID`, `dispatch`, `diagnostic`, `verification ledger`, `PCB`, `IGBT`, `thermistor`, `magnetron`, `R32/R410A`) on customer surfaces.
3. **Navigation Architecture:**
   - **`CustomerShell`:** Must NEVER render a sidebar. Uses a single desktop top bar and a fixed 5-tab mobile bottom bar with `44px` minimum touch targets and safe-area padding (`pb-safe`).
   - **`PortalShell` (Technician & Admin):** Left `#141B29` sidebar on desktop plus mobile top bar, bottom tab bar (`More` drawer on Admin), and navigation drawer on mobile. The bottom-left sidebar user card (avatar, name, email, branch) is a clickable `<Link>` routing to `/${role}/profile`.
4. **Progressive Disclosure, Forms & Media Framing:**
   - Pair desktop `<Table>` views (`hidden md:block`) with stacked mobile card lists (`md:hidden`) and touch targets `>= 44×44px` on coarse pointers.
   - Reuse `<PhilippineAddressFields />` (`src/components/shared/ph-address-fields.tsx`) for the 5-field Philippine address form across onboarding, customer profile, admin profile, and admin user management.
   - Uploaded profile photos support non-destructive focal framing (`{ x, y, zoom }`) via `ProfilePhotoField`, rendered consistently via `UserAvatar` and `getAvatarImageStyle` (`src/lib/avatar.ts`), persisted via `updateAvatarPositionAction`, and cleaned up from Supabase Storage (`avatars` bucket) in `uploadAvatarAction` / `removeAvatarAction`.

## Next.js 16 Caching & Server Actions

- With `cacheComponents: true` enabled in `next.config.ts`, any page or component reading runtime auth cookies (`requireRole()`) or awaiting `searchParams` / `params` MUST be wrapped in `<Suspense fallback={<PageSkeleton />}>`.
- Private per-user portal queries in `src/lib/data/portal-data.ts` and `getCurrentUserProfile()` in `src/lib/auth/session.ts` use `'use cache: private'` with `cacheTag(...)`.
- Mutations across `customer-actions.ts`, `technician-actions.ts`, `admin-actions.ts`, `onboarding-actions.ts`, `auth-actions.ts`, and `avatar-actions.ts` MUST invalidate every affected portal tag via `updateTag(...)` (including cross-portal tags when a customer booking/reschedule/payment affects technician/admin views or vice versa) and revalidate affected layouts where needed.
- Scheduling actions (`rescheduleAppointmentAction`, `updateTechnicianAppointmentAction`, `adminUpdateAppointmentAction`, booking/assignment flows) enforce `scheduled_date >= getManilaTodayISO()` and check for overlapping active time slots (`pending` / `confirmed` / `rescheduled`) on assigned technicians.
- Repair `completed_at` timestamps are set when entering `completed` (preserving any existing `completed_at`) and cleared to `null` when moving away from `completed`.
- Keep interactive Drawer/Dialog forms in sync when `open` or selected record props change (`useEffect` / `form.reset`), and surface Zod field errors alongside `FormBanner`.

## Supabase Database, RLS & Migrations

- Migrations in `supabase/migrations/` are additive and must be preserved cleanly:
  - `001_schema_and_alphanumeric_ids.sql`: core tables (`user_types`, `users`, `technician_profiles`, `customer_appliances`, `repair`, `appointments`, `payments`, `activity_logs`), `generate_alphanumeric_id`, views (`v_repair_details`, `v_appointment_details`, `v_payment_details`), `set_updated_at` triggers.
  - `002_rls_policies.sql`: row-level security and `private.*` helpers (`current_user_id()`, `current_user_role()`, `current_user_type_id()`, `is_admin()`, `can_view_user()`, `can_view_activity_log()`).
  - `003_transactions_and_locking_rpcs.sql`: atomic RPCs (`rpc_create_repair_with_appointment`, `rpc_assign_technician_and_confirm_slot`, `rpc_record_and_verify_payment`) and `hash_password_bcrypt`.
  - `004_user_avatar_and_storage.sql`: `users.avatar_url`, `users.avatar_position`, `avatars` storage bucket (2 MB, JPEG/PNG/WebP) + folder-scoped RLS policies.
  - `005_nickname_status_logs_and_admin_permissions.sql`: `users.nickname`, `users.admin_permissions`, `technician_profiles.proposed_specializations`, `technician_status_logs`, `enforce_technician_user_field_locks`, and `enforce_technician_profile_locks`.
- **Critical trigger order during Technician Onboarding (`005`):** `enforce_technician_profile_locks` allows specialization changes only while `users.is_onboarded` is `false`. Always persist `technician_profiles` **before** flipping `users.is_onboarded = true`.
- Preserve all database schema constraints, RLS policies, and atomic RPC signatures.

## Verification & Maintenance Rules

- Keep edits to `AGENTS.md` outside the `<!-- BEGIN:nextjs-agent-rules --> ... <!-- END:nextjs-agent-rules -->` block so `next dev` does not produce noisy diffs.
- Before completing any code changes, run and pass:
  - `npx tsc --noEmit`
  - `npm run lint`
  - `npm run build`

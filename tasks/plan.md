# Implementation Plan: Spindle UX Fixes, Role Governance, Onboarding & Navigation Optimization

## Overview
This plan covers ten targeted improvements across Spindle's public landing/auth surfaces, layout spacing consistency, technician governance and productivity tracking, technician onboarding, scoped administrator permissions, and Next.js 16 navigation/bundle optimization. All changes follow the **Tactile Service Passbook** design system (`DESIGN.md`), plain-language customer copy rules, and Next.js 16 `cacheComponents` + `partialPrefetching` architecture.

## Architecture Decisions
1. **Fix Root-Cause `CardContent` Padding (`sm:pt-0` Override Bug):**
   - `CardContent` in `src/components/ui/card.tsx` defaults to `p-5 pt-0 sm:p-6 sm:pt-0` for cards with a `CardHeader`. When standalone summary cards (`CustomerHomeView` empty banner, `ExecutiveSummaryPanel` KPI cards, `TechnicianKpiCards`, `AppliancesPanel`) pass `className="p-5"`, `tailwind-merge` leaves `sm:p-6 sm:pt-0` intact, producing `0px` top padding vs `24px` bottom/side padding at `>= 640px`.
   - Adding a `noHeader` / standalone padding pattern (or passing `p-5 sm:p-6` with explicit `pt-5 sm:pt-6` via a clean `CardContent` prop `standalone?: boolean`) eliminates the uneven spacing globally without breaking headered cards, and equalizing card flex heights keeps KPI rows aligned.
2. **Mobile-First Auth Layout Correction & Dedicated Auth Showcase Image:**
   - `src/app/(auth)/layout.tsx` uses `min-h-dvh grid grid-cols-1 lg:grid-cols-2` without `grid-rows-[auto_1fr]` on mobile, causing CSS Grid to split excess viewport height between `<header>` and `<main>` on short forms like `/login`. Switching to `flex min-h-dvh flex-col lg:grid lg:grid-cols-2` with `flex-1` on `<main>`, sticky compact header, safe-area padding, and `>= 44px` touch targets fixes mobile layout cleanly.
   - Generate/replace the auth showcase photo (`public/images/auth-left-showcase.webp` via `image-generator` or user-supplied image) rendered with `next/image` in `(auth)/layout.tsx`, keeping `(public)/page.tsx` intact.
3. **Database Schema Extension (`005_nickname_status_logs_and_admin_permissions.sql`):**
   - Add `nickname VARCHAR(60) NULL` and `admin_permissions TEXT[] NULL` to `public.users` (where `NULL` represents unrestricted full admin access for backward compatibility, and non-null arrays constrain an admin to specific feature keys).
   - Add `public.technician_status_logs` (`log_id`, `technician_id`, `previous_status`, `new_status`, `changed_by`, `changed_at`) with RLS policies so availability dropdown changes on Technician Overview become an auditable time-and-productivity tracker for Admins.
   - Enforce technician field locks in both Server Actions and PostgreSQL RLS/trigger protections so technicians cannot modify personal identity details, `certification_no`, `specializations`, or `max_daily_jobs` after onboarding—only `nickname`, `availability_status`, profile photo, and password.
4. **Technician Onboarding Flow & Admin-Exclusive Dispatch Controls:**
   - When an Admin creates a `technician` account (`adminCreateUserAction`), set `is_onboarded: false` so new technicians are routed through `/onboarding` on first login.
   - Update `uploadAvatarAction`, `updateAvatarPositionAction`, and `removeAvatarAction` to pass `{ allowUnonboarded: true }` to `requireAuthenticatedUser()`, enabling profile photo upload & framing inside `/onboarding`.
   - Technician onboarding focuses on **Credentials** (`certification_no`), **Nickname** (`nickname`), and **Profile Picture** (`ProfilePhotoField`), while confirming contact/address fields if not already supplied by Admin.
   - Admin retains exclusive assignment of `Appliance Specializations` and `Max Daily Jobs (1–15)` in both `UsersPanel` (creation) and `TechniciansPanel` (roster management).
5. **Technician Productivity Tracker (Click-to-Inspect):**
   - Clicking a technician row/card on `/admin/technicians` opens a progressive-disclosure `Sheet` (`TechnicianProductivitySheet`) displaying status duration & `technician_status_logs` timeline (`Available` / `Busy` / `Off Duty` hours), job completion rate, active vs daily capacity, average turnaround time, appointment outcomes, and PHP collections handled.
6. **Scoped Admin Feature Permissions:**
   - Define canonical `ADMIN_FEATURES` (`dashboard`, `repairs`, `appointments`, `payments`, `technicians`, `appliances`, `users`).
   - Admins creating or editing another admin in `UsersPanel` can choose **Full Access** (`null`) or **Limited Access** (checkbox selection of permitted modules).
   - Guardrails: an admin cannot edit their own `admin_permissions` or role, a limited admin cannot grant permissions they lack, `AdminLayout` filters `ADMIN_NAV`, every `/admin/*` page calls `requireAdminFeature(feature)`, and every Admin Server Action checks `requireAdminFeature(feature)`.
7. **Seamless Navigation & Bundle Optimization (Next.js 16 Cache Components):**
   - Wrap `getCurrentUserProfile()` in React `cache()` and `'use cache: private'` with `cacheLife` (`stale: 300` for session shell / `stale: 60` for portal data) and `cacheTag`, invalidating affected tags via `updateTag` in Server Actions.
   - Optimize `src/lib/supabase/proxy.ts` to avoid redundant remote `auth.getUser()` + DB round-trips where local JWT claims (`getClaims()`) suffice or streamline checks cleanly.
   - Remove the outer `<Suspense fallback={<PageSkeleton />}>` wrapping the entire `PortalShell`/`CustomerShell` in role layouts so shared navigation chrome never unmounts/flashes during sibling page navigation; add route-scoped `loading.tsx` inside `<main>` for uncached streams.
   - Enable `images: { formats: ['image/avif', 'image/webp'] }` and `experimental.optimizePackageImports` in `next.config.ts`, convert raw `<img>` tags to `next/image`, and lazy-load heavy modal/drawer components with `next/dynamic`.

## Task List

### Phase 1: Visual Spacing, Landing Header & Auth Mobile Fixes
- [x] Task 1: Fix uneven `CardContent` padding across Customer, Admin, and Technician summary boxes
- [x] Task 2: Reorder landing header (and footer) navigation links to How It Works, Appliances, Brands, Service Areas
- [x] Task 3: Replace the left-side Auth page photo with an optimized custom image
- [x] Task 4: Fix Auth page mobile layout and form touch ergonomics

### Checkpoint 1: Visual & Auth Verification
- [x] `npx tsc --noEmit`, `npm run lint`, and `npm run build` pass
- [ ] Mobile (`390px`) and desktop (`1280px`) auth layout and summary card spacing verified in browser

### Phase 2: Database Schema, Types & Permission Primitives
- [x] Task 5: Add migration `005_nickname_status_logs_and_admin_permissions.sql` for nickname, technician status logs, admin permissions, and field-lock protections
- [x] Task 6: Update database types, constants, formatters, and session permission helpers

### Checkpoint 2: Foundation Verification
- [x] Migration SQL reviewed for RLS, `(select auth.uid())`, and backward compatibility
- [x] `npx tsc --noEmit` passes cleanly

### Phase 3: Technician Profile Restrictions, Overview Availability & Admin Controls
- [x] Task 7: Restrict Technician Profile & Credentials to read-only identity/dispatch details and editable Nickname
- [x] Task 8: Move Availability Status dropdown to Technician Overview top-right with status transition logging
- [x] Task 9: Make Appliance Specializations and Max Daily Jobs exclusively Admin-assigned in Users & Technicians panels

### Checkpoint 3: Technician & Admin Governance Verification
- [x] `npx tsc --noEmit`, `npm run lint`, and `npm run build` pass
- [ ] Technicians can only edit nickname (plus photo/password) and toggle availability on Overview (verify against live DB after running migration `005`)

### Phase 4: Technician Onboarding & Admin Productivity Tracker
- [x] Task 10: Implement Technician Onboarding flow (Credentials, Nickname, Profile Picture, Proposed Specializations) and allow unonboarded avatar uploads
- [x] Task 11: Add click-to-open Technician Productivity Tracker sheet on Admin Technicians page (plus avatars in Users & Technicians tables)

### Checkpoint 4: End-to-End Technician Lifecycle Verification
- [x] `npx tsc --noEmit`, `npm run lint`, and `npm run build` pass
- [ ] Admin-created technician onboarding, avatar upload, status tracking, and productivity drawer verified in live app

### Phase 5: Limited Admin Feature Access Control
- [x] Task 12: Add Full vs. Limited Admin Feature Access controls to Admin User Create/Edit modals and lock limited admin profile details
- [x] Task 13: Enforce `requireAdminFeature` in Admin layout, session helpers, and all Admin Server Actions
- [x] Task 14: Enforce `requireAdminFeature` and graceful fallback across all `/admin/*` pages

### Checkpoint 5: RBAC Verification
- [x] `npx tsc --noEmit`, `npm run lint`, and `npm run build` pass
- [ ] Limited admins see only permitted nav items and cannot execute restricted routes or Server Actions (verify in live app)

### Phase 6: Seamless Intra-Group Navigation & Bundle Optimization
- [x] Task 15: Optimize `next.config.ts`, `proxy.ts`, and `session.ts` with `React.cache` and `'use cache: private'`
- [x] Task 16: Introduce tagged `'use cache: private'` data-access helpers and `updateTag` mutation invalidation across portals
- [x] Task 17: Decouple role layout chrome from full-page `<Suspense>`, add portal `loading.tsx`, `next/image`, and `next/dynamic` code splitting

### Checkpoint 6: Complete Verification
- [x] `npx tsc --noEmit`, `npm run lint`, and `npm run build` pass with zero errors
- [ ] Intra-portal navigation (`Customer`, `Technician`, `Admin`) verified in live app

## Risks and Mitigations
| Risk | Impact | Mitigation |
| --- | --- | --- |
| Existing admins in DB have `admin_permissions = NULL` | High | Treat `NULL` as full unrestricted access in `hasAdminPermission()` and RLS/action checks; require `>= 1` feature when `Limited Access` is selected. |
| Technician onboarding blocked by `avatar-actions.ts` redirect | High | Pass `{ allowUnonboarded: true }` in `uploadAvatarAction`, `updateAvatarPositionAction`, and `removeAvatarAction`. |
| Stale UI after mutations when `'use cache: private'` is active | Medium | Tag every cached data loader with user/portal `cacheTag`s and call `updateTag` in every mutating Server Action alongside `revalidatePath`. |
| `proxy.ts` optimization accidentally skipping inactive/unonboarded checks | High | Keep active/onboarded enforcement in `proxy.ts` and DAL; only optimize redundant `auth.getUser()` network calls if `getClaims()` is supported and verified in `@supabase/ssr`. |
| Technician bypassing UI read-only fields via crafted POST | Medium | Strip non-nickname fields from `updateTechnicianProfileAction` and enforce column immutability in PostgreSQL trigger/RLS for non-admins. |

## Open Questions
- **Auth Page Photo Subject:** Unless you provide a specific image file, we will generate a warm-lit Philippine home appliance service photograph (`public/images/auth-left-showcase.webp`) for the left panel of the auth pages while leaving the landing page hero/services backgrounds intact.
- **Technician Onboarding Fields When Created by Admin:** When an Admin creates a technician account, phone/branch/address are already entered in the Admin modal, so Technician Onboarding will pre-fill those and focus on **Credentials (TESDA / Certificate No.)**, **Nickname**, and **Profile Picture** (while showing any Admin-assigned Specializations/Capacity as read-only if already set). Confirm if self-registered or pre-created technicians also need anything else during onboarding.
- **Limited Admin Access When Missing `Executive Summary`:** If a newly created limited admin does not have access to `Executive Summary` (`/admin/dashboard`), they will automatically land on their first permitted admin module (e.g. `Repair Tickets` or `Dispatch Board`).

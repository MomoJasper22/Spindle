# Tasks: Spindle Improvements & Optimization

## Phase 1: Visual Spacing, Landing Header & Auth Mobile Fixes

### Task 1: Fix uneven CardContent padding across summary boxes
**Description:** Fix the `sm:pt-0` responsive padding override bug in `CardContent` when used without a `CardHeader`, and equalize card vertical alignment across the Customer home empty-visit box, Admin executive summary KPI cards, Technician overview KPI cards, and Customer appliance cards.

**Acceptance criteria:**
- [ ] Standalone `CardContent` boxes render symmetric padding on all viewports (`20px` mobile, `24px` `>= sm`) with zero `0px` top-padding collapse
- [ ] All 4 KPI cards in Admin `ExecutiveSummaryPanel` and Technician `TechnicianKpiCards` share equal height and consistent inner alignment
- [ ] Existing cards that pair `CardHeader` + `CardContent` keep their compact header-to-body spacing unchanged

**Verification:**
- [x] Build succeeds: `npx tsc --noEmit && npm run build`
- [ ] Manual check: Inspect Customer Home empty state, Admin Executive Summary KPI row, and Technician Overview KPI row at `390px`, `768px`, and `1280px`

**Dependencies:** None

**Files likely touched:**
- `src/components/ui/card.tsx`
- `src/features/customer/components/customer-home-view.tsx`
- `src/features/admin/components/executive-summary-panel.tsx`
- `src/features/technician/components/technician-kpi-cards.tsx`
- `src/features/customer/components/appliances-panel.tsx`

**Estimated scope:** Medium (5 files)

---

### Task 2: Reorder landing header navigation links
**Description:** Update the public landing header (and matching footer links) so navigation links appear in the exact order: `How It Works`, `Appliances`, `Brands`, `Service Areas`.

**Acceptance criteria:**
- [ ] Desktop header nav and mobile drawer nav list `How It Works`, `Appliances`, `Brands`, `Service Areas` in order
- [ ] Footer anchor links match the updated section order cleanly

**Verification:**
- [x] Lint and build succeed: `npm run lint && npm run build`
- [ ] Manual check: Verify desktop header and mobile drawer menu link order on `/`

**Dependencies:** None

**Files likely touched:**
- `src/features/landing/components/landing-header.tsx`
- `src/app/(public)/page.tsx`

**Estimated scope:** Small (2 files)

---

### Task 3: Replace the left-side Auth page photo
**Description:** Replace the photo on the left panel of the auth pages (`/login`, `/signup`) with a fresh, optimized Philippine appliance care photograph via `next/image`, leaving the landing page section background unaffected.

**Acceptance criteria:**
- [ ] Auth left panel renders a new crisp, appropriately sized image asset via `next/image` with `priority` and responsive `sizes`
- [ ] Landing page `#services` background still renders cleanly without broken paths

**Verification:**
- [x] Build succeeds: `npm run build`
- [ ] Manual check: Verify `/login` and `/signup` desktop split showcase renders the new photo with legible text contrast

**Dependencies:** None

**Files likely touched:**
- `public/images/auth-left-showcase.webp`
- `src/app/(auth)/layout.tsx`

**Estimated scope:** Small (2 files)

---

### Task 4: Fix Auth page mobile layout and form ergonomics
**Description:** Fix the CSS Grid implicit row height stretching bug on mobile in `AuthLayout`, improve mobile sticky header alignment and safe-area spacing, and ensure password toggles and auth links meet `44×44px` mobile touch targets across `LoginForm` and `SignupForm`.

**Acceptance criteria:**
- [ ] Mobile auth pages (`< lg`) use a clean flex column (`flex-1` main container) with no stretched blank header gap on `/login` or `/signup`
- [ ] Zero horizontal overflow at `360px`–`430px` viewports and proper bottom padding for mobile keyboards
- [ ] Password eye toggles and bottom navigation links meet `44×44px` touch targets on coarse pointers

**Verification:**
- [x] Lint and build succeed: `npm run lint && npm run build`
- [ ] Manual check: Inspect `/login` and `/signup` at `375×812` and `390×844` mobile viewports

**Dependencies:** Task 3

**Files likely touched:**
- `src/app/(auth)/layout.tsx`
- `src/features/auth/components/login-form.tsx`
- `src/features/auth/components/signup-form.tsx`

**Estimated scope:** Small (3 files)

---

## Checkpoint: After Tasks 1–4
- [ ] `npx tsc --noEmit`, `npm run lint`, and `npm run build` pass
- [ ] Visual check confirms even card padding, ordered landing nav, new auth photo, and proper mobile auth UI

---

## Phase 2: Database Schema, Types & Permission Primitives

### Task 5: Create database migration for nickname, technician status logs, and admin permissions
**Description:** Write `supabase/migrations/005_nickname_status_logs_and_admin_permissions.sql` adding `users.nickname`, `users.admin_permissions`, the `technician_status_logs` tracking table with RLS policies, and a database guard preventing technicians from modifying admin-managed profile/dispatch columns after onboarding.

**Acceptance criteria:**
- [ ] `public.users` has `nickname VARCHAR(60) NULL` and `admin_permissions TEXT[] NULL` with valid module check constraint
- [ ] `public.technician_status_logs` tracks `technician_id`, `previous_status`, `new_status`, `changed_by`, `changed_at` with indexes and RLS policies (`admin` read all, `technician` read/insert own)
- [ ] Trigger or RLS constraint prevents non-admin updates to `technician_profiles.specializations`, `max_daily_jobs`, and post-onboarding personal/credential fields on `users` / `technician_profiles`

**Verification:**
- [ ] Migration SQL uses `(select auth.uid())` / `private.*` helper conventions cleanly without breaking existing RPCs (`003_transactions_and_locking_rpcs.sql`)
- [ ] Apply/validate migration against local or linked Supabase schema if configured

**Dependencies:** None

**Files likely touched:**
- `supabase/migrations/005_nickname_status_logs_and_admin_permissions.sql`

**Estimated scope:** Small (1 file)

---

### Task 6: Update TypeScript types, admin feature constants, and formatters
**Description:** Update `database.ts`, `constants.ts`, `formatters.ts`, and `session.ts` with `nickname`, `admin_permissions`, `ADMIN_FEATURES` metadata, `TechnicianStatusLogRow`, and `hasAdminPermission()` / `getDefaultAdminPath()` helpers.

**Acceptance criteria:**
- [ ] `UserRow` includes `nickname` and `admin_permissions`, and `TechnicianStatusLogRow` is exported
- [ ] `ADMIN_FEATURES` defines canonical IDs, labels, and hrefs matching `ADMIN_NAV`
- [ ] `hasAdminPermission(profile, feature)` treats `null` as full access and validates array membership otherwise

**Verification:**
- [x] Typecheck passes: `npx tsc --noEmit`

**Dependencies:** Task 5

**Files likely touched:**
- `src/types/database.ts`
- `src/lib/constants.ts`
- `src/lib/formatters.ts`
- `src/lib/auth/session.ts`

**Estimated scope:** Small (4 files)

---

## Checkpoint: After Tasks 5–6
- [ ] `npx tsc --noEmit` passes
- [ ] Schema extensions and permission helpers match all existing contracts

---

## Phase 3: Technician Profile Restrictions, Overview Availability & Admin Controls

### Task 7: Restrict Technician Profile & Credentials and add editable Nickname
**Description:** Update Technician Profile & Credentials so personal details, branch, TESDA certification, appliance specializations, and max daily jobs are read-only reference fields managed by Admin, remove the availability dropdown from this page, and add an editable `Nickname` section as the only editable profile text field (alongside photo & password).

**Acceptance criteria:**
- [ ] Technician Profile UI displays personal details, branch, certification, specializations, and max daily jobs as read-only with clear Admin-managed guidance
- [ ] `Nickname` is editable and persists via a dedicated technician nickname schema & Server Action without modifying any other `users` or `technician_profiles` fields
- [ ] Availability Status dropdown is removed from `/technician/profile`

**Verification:**
- [x] Typecheck and build succeed: `npx tsc --noEmit && npm run lint && npm run build`
- [ ] Manual check: Submitting nickname updates `users.nickname` and reflects in technician overview/shell without altering personal details

**Dependencies:** Task 6

**Files likely touched:**
- `src/features/technician/schemas/technician-schemas.ts`
- `src/features/technician/actions/technician-actions.ts`
- `src/features/technician/components/technician-profile-forms.tsx`
- `src/app/technician/profile/page.tsx`

**Estimated scope:** Medium (4 files)

---

### Task 8: Move Availability Status dropdown to Technician Overview top-right with transition logging
**Description:** Replace the static `Status: Available` badge in the top-right corner of `TechnicianOverviewView` with an interactive Availability Status dropdown (`Available`, `Busy`, `Off Duty`) that persists updates and logs transitions to `technician_status_logs` and `activity_logs` for admin productivity tracking.

**Acceptance criteria:**
- [ ] Top-right corner of `/technician/dashboard` renders an interactive Availability Status `Select` control (`44px` touch-friendly)
- [ ] Changing status updates `technician_profiles.availability_status`, inserts a timestamped row into `technician_status_logs`, and writes an `activity_logs` audit entry
- [ ] Greeting uses technician `nickname` when set (falling back to `first_name`)

**Verification:**
- [x] Typecheck and build succeed: `npx tsc --noEmit && npm run lint && npm run build`
- [ ] Manual check: Switching status updates the UI badge/selector immediately and creates a new status log row

**Dependencies:** Task 5, Task 6

**Files likely touched:**
- `src/features/technician/schemas/technician-schemas.ts`
- `src/features/technician/actions/technician-actions.ts`
- `src/features/technician/components/technician-overview-view.tsx`
- `src/app/technician/dashboard/page.tsx`

**Estimated scope:** Medium (4 files)

---

### Task 9: Ensure Admin exclusively assigns Appliance Specializations and Max Daily Jobs
**Description:** Update Admin user creation and technician roster management so Administrators assign `Appliance Specializations` and `Max Daily Jobs (1–15)` when creating or editing technicians, while displaying technician nicknames where helpful.

**Acceptance criteria:**
- [ ] Creating a technician in `UsersPanel` allows Admin to assign `Appliance Specializations` and `Max Daily Jobs (1–15)`
- [ ] Editing a technician in `TechniciansPanel` remains the canonical place for Admin to adjust branch, specializations, max daily jobs (1–15), TESDA cert, and availability
- [ ] `adminCreateUserAction` and `adminUpdateTechProfileAction` persist specializations & capacity cleanly

**Verification:**
- [x] Typecheck, lint, and build succeed: `npx tsc --noEmit && npm run lint && npm run build`

**Dependencies:** Task 6, Task 7

**Files likely touched:**
- `src/features/admin/schemas/admin-schemas.ts`
- `src/features/admin/actions/admin-actions.ts`
- `src/features/admin/components/users-panel.tsx`
- `src/features/admin/components/technicians-panel.tsx`

**Estimated scope:** Medium (4 files)

---

## Checkpoint: After Tasks 7–9
- [ ] `npx tsc --noEmit`, `npm run lint`, and `npm run build` pass
- [ ] Technician profile locks personal/dispatch fields; overview status dropdown logs transitions; admin manages specializations & capacity

---

## Phase 4: Technician Onboarding & Admin Productivity Tracker

### Task 10: Build Technician Onboarding process (Credentials, Nickname, Profile Picture)
**Description:** Update technician onboarding so newly provisioned technician accounts start with `is_onboarded: false` and complete a focused onboarding wizard asking for **Credentials** (`certification_no`), **Nickname**, and **Profile Picture** (while fixing `avatar-actions.ts` to allow uploads during onboarding).

**Acceptance criteria:**
- [ ] `avatar-actions.ts` (`uploadAvatarAction`, `updateAvatarPositionAction`, `removeAvatarAction`) uses `requireAuthenticatedUser({ allowUnonboarded: true })` so onboarding photo upload & framing work
- [ ] `adminCreateUserAction` sets `is_onboarded: false` for new `technician` accounts so first sign-in routes to `/onboarding`
- [ ] Technician onboarding wizard collects `nickname`, `certification_no` credentials, and profile picture (plus contact/address if missing, with Admin-assigned specializations shown read-only if present)

**Verification:**
- [x] Typecheck, lint, and build succeed: `npx tsc --noEmit && npm run lint && npm run build`
- [ ] Manual check: Log in as a newly created technician -> complete onboarding with credentials, nickname, and profile picture -> lands on `/technician/dashboard`

**Dependencies:** Task 6, Task 9

**Files likely touched:**
- `src/features/auth/actions/avatar-actions.ts`
- `src/features/admin/actions/admin-actions.ts`
- `src/features/onboarding/schemas/onboarding-schemas.ts`
- `src/features/onboarding/actions/onboarding-actions.ts`
- `src/features/onboarding/components/onboarding-form.tsx`
- `src/app/onboarding/page.tsx`

**Estimated scope:** Large (6 files — split clean: Step 1 `avatar-actions` + `admin-actions` + schemas, Step 2 `onboarding-actions` + `onboarding-form` + `page.tsx` if executed in 2 commits)

---

### Task 11: Add click-to-open Technician Productivity Tracker on Admin Technicians page
**Description:** Make technicians clickable on `/admin/technicians` so clicking a specific technician opens a dedicated Productivity Tracker `Sheet` (hidden until clicked) displaying availability duration & status history, job completion throughput, turnaround time, appointment outcomes, daily capacity usage, and PHP collections.

**Acceptance criteria:**
- [ ] Productivity tracker is hidden by default and opens only when the admin clicks a specific technician row or mobile card
- [ ] Action buttons (`Dispatch`, `Edit`, `Activate/Deactivate`) stop event propagation and continue working independently
- [ ] Tracker calculates & displays status time breakdown (`Available` / `Busy` / `Off Duty` from `technician_status_logs`), completed & active jobs, average completion time, appointment metrics, and verified PHP collections

**Verification:**
- [x] Typecheck, lint, and build succeed: `npx tsc --noEmit && npm run lint && npm run build`
- [ ] Manual check: Click a technician on `/admin/technicians` on mobile & desktop to verify tracker drawer and metrics

**Dependencies:** Task 8

**Files likely touched:**
- `src/features/admin/components/technician-productivity-sheet.tsx`
- `src/features/admin/components/technicians-panel.tsx`
- `src/app/admin/technicians/page.tsx`

**Estimated scope:** Medium (3 files)

---

## Checkpoint: After Tasks 10–11
- [ ] `npx tsc --noEmit`, `npm run lint`, and `npm run build` pass
- [ ] Technician onboarding and Admin Productivity Tracker work end-to-end

---

## Phase 5: Limited Admin Feature Access Control

### Task 12: Add Admin feature-limitation controls to Admin User Create and Edit modals
**Description:** Update `UsersPanel` and `admin-actions.ts` so when an admin creates or edits another admin account, they can choose **Full Access** or **Limited Access** with specific permitted admin modules, and show permission badges in the directory.

**Acceptance criteria:**
- [ ] Create User and Edit User modals display an `Admin Feature Access` control (`Full Access` vs `Limited Access` module checkboxes) when `role === 'admin'`
- [ ] Validation requires at least one feature when `Limited Access` is selected, and prevents editing own `admin_permissions` or granting permissions the acting admin lacks
- [ ] Users directory indicates whether an admin has full access or scoped modules

**Verification:**
- [x] Typecheck, lint, and build succeed: `npx tsc --noEmit && npm run lint && npm run build`

**Dependencies:** Task 6

**Files likely touched:**
- `src/features/admin/schemas/admin-schemas.ts`
- `src/features/admin/actions/admin-actions.ts`
- `src/features/admin/components/users-panel.tsx`

**Estimated scope:** Small (3 files)

---

### Task 13: Enforce feature permissions in session helpers, Admin layout, and Admin Server Actions
**Description:** Add `requireAdminFeature(feature)` in `session.ts`, filter `ADMIN_NAV` in `AdminLayout` based on `profile.admin_permissions`, redirect limited admins to their first permitted route on fallback, and enforce module permission checks on every Admin Server Action.

**Acceptance criteria:**
- [ ] `AdminLayout` only renders navigation links (desktop sidebar, mobile drawer, mobile bottom bar) for modules permitted to the current admin
- [ ] Every mutation in `admin-actions.ts` enforces `requireAdminFeature(...)` and returns a clear error if unauthorized
- [ ] `getRoleHomePath` / `getDefaultAdminPath` routes limited admins to their first permitted module when `/admin/dashboard` is excluded

**Verification:**
- [x] Typecheck, lint, and build succeed: `npx tsc --noEmit && npm run lint && npm run build`

**Dependencies:** Task 12

**Files likely touched:**
- `src/lib/auth/session.ts`
- `src/lib/supabase/proxy.ts`
- `src/app/admin/layout.tsx`
- `src/features/admin/actions/admin-actions.ts`

**Estimated scope:** Medium (4 files)

---

### Task 14: Enforce feature permissions across all `/admin/*` pages
**Description:** Guard each `/admin/*` route (`dashboard`, `repairs`, `appointments`, `payments`, `technicians`, `appliances`, `users`) with `requireAdminFeature(...)` so direct URL navigation by a limited admin redirects cleanly to their allowed workspace home.

**Acceptance criteria:**
- [ ] Direct URL navigation to any restricted `/admin/<module>` route redirects to the limited admin's first permitted route (or renders a restricted state if no modules assigned)
- [ ] `/admin/profile` remains accessible to all active admins regardless of module restrictions

**Verification:**
- [x] Typecheck, lint, and build succeed: `npx tsc --noEmit && npm run lint && npm run build`
- [ ] Manual check: Sign in as a limited admin (e.g., `repairs` + `appointments` only) and verify sidebar + direct URL guard

**Dependencies:** Task 13

**Files likely touched:**
- `src/app/admin/dashboard/page.tsx`
- `src/app/admin/repairs/page.tsx`
- `src/app/admin/appointments/page.tsx`
- `src/app/admin/payments/page.tsx`
- `src/app/admin/technicians/page.tsx`
- `src/app/admin/appliances/page.tsx`
- `src/app/admin/users/page.tsx`

**Estimated scope:** Medium (7 small 1–2 line guard updates)

---

## Checkpoint: After Tasks 12–14
- [ ] `npx tsc --noEmit`, `npm run lint`, and `npm run build` pass
- [ ] Full admin and limited admin isolation verified across nav, routes, and Server Actions

---

## Phase 6: Seamless Intra-Group Navigation & Bundle Optimization

### Task 15: Optimize Next.js config, proxy session checks, and per-request auth caching
**Description:** Configure `images` formats and `experimental.optimizePackageImports` in `next.config.ts`, deduplicate `getCurrentUserProfile()` with React `cache()` and Next.js 16 `'use cache: private'` + `cacheTag` (`user-profile`), and streamline `proxy.ts` session checks to cut redundant round-trips on every navigation.

**Acceptance criteria:**
- [ ] `next.config.ts` enables AVIF/WebP image optimization and `optimizePackageImports` for Radix UI & Lucide icons
- [ ] Multiple `requireRole()` / `getCurrentUserProfile()` calls across layout + page execute at most once per request and reuse private session cache across sibling navigations
- [ ] `proxy.ts` preserves strict auth, active-user, onboarding, and role route protection with minimal latency

**Verification:**
- [x] Typecheck, lint, and build succeed: `npx tsc --noEmit && npm run lint && npm run build`

**Dependencies:** Task 13

**Files likely touched:**
- `next.config.ts`
- `src/lib/auth/session.ts`
- `src/lib/supabase/proxy.ts`

**Estimated scope:** Small (3 files)

---

### Task 16: Add tagged `'use cache: private'` portal data loaders and mutation invalidation
**Description:** Move repetitive per-page Supabase queries into narrow, column-selected data helpers tagged with `'use cache: private'` + `cacheLife` + `cacheTag` per portal (`customer`, `technician`, `admin`), and call `updateTag` alongside `revalidatePath` in Server Actions so sibling route transitions are instant without stale writes.

**Acceptance criteria:**
- [ ] Portal pages fetch via tagged `'use cache: private'` loaders with minimal column projections (avoiding redundant full-table `select('*')` payloads)
- [ ] Every mutating Server Action (`customer`, `technician`, `admin`, `avatar`, `onboarding`) calls `updateTag(...)` for affected tags so changes appear immediately
- [ ] Navigating between sibling tabs in the same portal renders cached data immediately without re-triggering full loading screens

**Verification:**
- [x] Typecheck, lint, and build succeed: `npx tsc --noEmit && npm run lint && npm run build`

**Dependencies:** Task 15

**Files likely touched:**
- `src/lib/data/portal-data.ts`
- `src/features/customer/actions/customer-actions.ts`
- `src/features/technician/actions/technician-actions.ts`
- `src/features/admin/actions/admin-actions.ts`
- `src/features/auth/actions/avatar-actions.ts`

**Estimated scope:** Medium (5 files)

---

### Task 17: Segment layouts, add portal `loading.tsx`, lazy-load modals, and optimize landing images
**Description:** Refactor role layouts so the shared navigation shell stays mounted outside `<Suspense>`, add content-scoped `loading.tsx` inside `/customer`, `/technician`, and `/admin` segments, switch heavy client drawers/dialogs to `next/dynamic`, and replace raw `<img>` on the landing page with `next/image`.

**Acceptance criteria:**
- [ ] Switching pages within `/customer/*`, `/technician/*`, or `/admin/*` keeps the header/sidebar mounted and shows no full-shell `<PageSkeleton />` flash
- [ ] Heavy drawers/modals (`DiagnosticDrawer`, `TechnicianProductivitySheet`, `ProfilePhotoField` cropper dialog) are dynamically loaded (`next/dynamic`) to reduce initial route JS
- [ ] Landing hero background uses `next/image` with responsive `sizes` and `priority`

**Verification:**
- [x] Typecheck, lint, and build succeed: `npx tsc --noEmit && npm run lint && npm run build`
- [ ] Inspect `next build` route output for reduced First Load JS sizes and verify seamless tab-to-tab transitions

**Dependencies:** Task 14, Task 16

**Files likely touched:**
- `src/app/customer/layout.tsx`
- `src/app/technician/layout.tsx`
- `src/app/admin/layout.tsx`
- `src/app/customer/loading.tsx`
- `src/app/technician/loading.tsx`
- `src/app/admin/loading.tsx`
- `src/app/(public)/page.tsx`

**Estimated scope:** Large (7 small/focused files — split cleanly into layouts/loading.tsx + dynamic imports/image optimization)

---

## Checkpoint: Final Release Verification
- [x] `npx tsc --noEmit` exits 0
- [x] `npm run lint` exits 0
- [x] `npm run build` succeeds cleanly with `cacheComponents: true` and `partialPrefetching: true`
- [ ] All 10 requirements verified end-to-end across desktop and mobile (`390px`)

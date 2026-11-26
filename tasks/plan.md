# Implementation Plan: Spindle UI/UX Overhaul, Plain-Language Customer Experience & Dedicated Mobile UI

## Overview

Spindle is a Philippine appliance repair and home-service scheduling platform built with Next.js 16 (App Router, `cacheComponents`, `src/proxy.ts`), React 19, Tailwind CSS v4, Radix UI, and Supabase (Postgres + RLS + transactional RPCs + Storage). This overhaul replaces the current dense, jargon-heavy, sidebar-everywhere SaaS interface with the **Tactile Service Passbook** design system (user-selected option `model-pick`): warm alabaster cardstock surfaces (`#F8F7F4`), crisp ink borders (`#141B29`), trusted deep teal primary actions (`#0F766E`), warm amber step accents (`#D97706` / `#B45309`), `Bricolage Grotesque` + `Manrope` typography, plain everyday customer language, focused sub-pages that eliminate information overload, a sidebar-free Customer portal with dedicated mobile bottom navigation, a clickable bottom-left profile card in Technician/Admin sidebars, non-destructive profile photo repositioning (`x`, `y`, `zoom`), removal of the landing page's "Track Existing Ticket" button, and updated `README.md` and `AGENTS.md` documentation.

## Architecture Decisions

1. **Tactile Service Passbook Visual System (`globals.css`, `layout.tsx`, `src/components/ui/*`):**
   - Replace Cobalt/Slate generic SaaS tokens with `#F8F7F4` warm alabaster cardstock ground, `#FFFFFF` paper-white elevated cards, `#E6E1D6` warm dividers, `#141B29` deep ink-navy primary text and staff sidebar, `#475569` muted slate copy, `#0F766E` deep teal primary actions (`#0B5E58` hover, `#E6F4F1` tint), `#D97706` amber numerals/pending accents, `#047857` stamped emerald verification accents, and `#BE123C` rose destructive states.
   - Adopt `Bricolage Grotesque` (headings), `Manrope` (UI/body), and `JetBrains Mono` (only for staff/receipt identifiers), with `@media (pointer: coarse)` 44×44px minimum touch targets, `viewport-fit=cover`, and safe-area padding.
2. **Dual Portal Navigation Model:**
   - **Customer Portal (`/customer/*`) — NO Sidebar:** Desktop uses a single-row sticky top bar (`Home`, `My Appliances`, `Bookings`, `Payments`, `Schedule a Visit`, plus clickable user profile pill). Mobile (`< md`) switches to a compact top header + fixed 5-tab thumb-zone bottom bar (`Home`, `Appliances`, `Bookings`, `Payments`, `Profile`).
   - **Technician (`/technician/*`) & Admin (`/admin/*`) Portals — Clickable Sidebar Footer + Dedicated Mobile Shell:** Desktop retains the deep ink-navy (`#141B29`) left sidebar, making the entire bottom-left user card (avatar, name, email, branch) a clickable `<Link>` routing directly to `/technician/profile` or `/admin/profile`. Mobile uses a compact top header, thumb-friendly bottom quick-nav bar, and slide-out sheet for secondary Admin routes.
3. **Eliminate Information Overload via Vertical Sub-Pages & Progressive Disclosure:**
   - Split the single-page tabbed `CustomerWorkspace` into focused routes: `/customer/home`, `/customer/appliances`, `/customer/bookings` (plus `/customer/bookings/[ticketId]` detail & 4-step passbook tracker page), `/customer/payments`, and `/customer/profile`.
   - Split Technician (`/technician/dashboard`, `/technician/jobs`, `/technician/schedule`, `/technician/collections`, `/technician/profile`) and Admin (`/admin/dashboard`, `/admin/repairs`, `/admin/appointments`, `/admin/technicians`, `/admin/appliances`, `/admin/users`, `/admin/payments`, `/admin/profile`) so each page owns one operational job.
   - On mobile viewports (`< md`), replace multi-column scrolling tables with scannable vertical **Mobile Cards** that open detail drawers/sheets on tap.
4. **Customer Plain-Language Glossary (Zero Technical Jargon):**
   - Replace internal CRM and repair-tech jargon across Landing, Auth, Onboarding, Customer pages, and customer-facing Server Action messages:
     - `Repair Ticket` / `Ticket ID` -> `Service Request` / `Booking`
     - `Diagnostic Inspection` -> `Check-Up & Estimate`
     - `Maintenance & Deep Cleaning` -> `Cleaning & Tune-Up`
     - `Pending Verification` -> `Checking Details`
     - `Verified Paid` -> `Confirmed Paid`
     - `Awaiting dispatch` -> `Matching you with a technician`
     - `Inverter PCB / IGBT / Thermistor / Magnetron / Peltier / R32 / Manifold` -> everyday appliance symptom descriptions (`Weak cooling`, `Gas top-up`, `Power & sensor repair`, `Drainage & spin fixes`, `Door seal repair`, `Safety check`).
5. **Non-Destructive Profile Photo Repositioning:**
   - Support `{ x: number, y: number, zoom: number }` (`x`/`y`: `0..100`, `zoom`: `1..2.5`) on every user's profile picture.
   - Persist immediately in Supabase Auth `user_metadata.avatar_position` (works immediately with zero manual DB migration) AND add `supabase/migrations/005_avatar_position.sql` (`avatar_position JSONB` on `public.users`) with safe fallback sync.
   - Build shared `UserAvatar` component + interactive drag/touch/slider `AvatarPositionDialog` (pointer drag + touch drag with `touch-action: none` + sliders + keyboard-accessible reset/nudge) inside `ProfilePhotoField`, enabled across Customer, Technician, and Admin profiles.
6. **Landing Page Conversion (`model-pick.html` + `model_pick_1795676279773.jpg`):**
   - Remove the `"Track Existing Ticket"` button from the hero section (`src/app/(public)/page.tsx`).
   - Implement the locked **Tactile Service Passbook** first-viewport layout: crisp white header, left headline (`"Keep every home appliance running smoothly."`) + single `"Schedule a Visit"` CTA, right ink-framed **Service Passbook** card (`CLEAR ESTIMATE` stamp + 4 dashed-divider step rows), and `"Brands & Appliances"` section beginning cleanly at the bottom edge, plus mobile nav menu & plain-English appliance cards/drawers.

## Task List

### Phase 1: Design Foundation, Shared Components & Avatar Repositioning
- [ ] **Task 1:** Overhaul design tokens, typography (`Bricolage Grotesque` + `Manrope`), mobile touch targets, and core UI primitives (`globals.css`, `layout.tsx`, `button`, `card`, `badge`, `dialog`, `sheet`, `table`, `spindle-logo`)
- [ ] **Task 2:** Implement shared `UserAvatar` and interactive `ProfilePhotoField` photo position/zoom editor + `updateAvatarPositionAction` + migration `005_avatar_position.sql`
- [ ] **Task 3:** Build `CustomerShell` (top nav on desktop, no sidebar, 5-tab bottom bar on mobile) and update `PortalShell` (clickable bottom-left sidebar user profile card + dedicated mobile header/bottom nav for Tech & Admin)

### Checkpoint: Foundation
- [ ] TypeScript compiles cleanly (`npx tsc --noEmit`) and ESLint passes (`npm run lint`)
- [ ] `UserAvatar` position & zoom persist and render identically across header, sidebar footer, and profile cards

### Phase 2: Public Landing, Auth & Onboarding Overhaul (Plain Language + Mobile UI)
- [ ] **Task 4:** Overhaul Public Landing Page (`(public)/page.tsx`, `appliance-repair-section.tsx`, `appliance-showcase.tsx`): remove `"Track Existing Ticket"`, match `model-pick` Service Passbook hero & warm cardstock aesthetic, remove all technical jargon, add mobile nav drawer & mobile sheet view
- [ ] **Task 5:** Overhaul Auth (`(auth)/layout.tsx`, `login-form.tsx`, `signup-form.tsx`) & Onboarding (`onboarding/page.tsx`, `onboarding-form.tsx`) for plain customer language and mobile-first ergonomics

### Checkpoint: Public & Auth Flows
- [ ] Landing page has zero "Track Existing Ticket" button and zero technical jargon
- [ ] Mobile (390px) and desktop (1440px) render cleanly with no horizontal overflow

### Phase 3: Customer Portal Overhaul (No Sidebar, Sub-Pages, Plain Language, Dedicated Mobile UI)
- [ ] **Task 6:** Update `customer/layout.tsx`, `customer-actions.ts` (plain-language messages & layout revalidation), and build Customer Home (`/customer/home`) + Book Visit modal/drawer
- [ ] **Task 7:** Create dedicated `/customer/appliances` page with clean card grid, detail drawer, and mobile-friendly add/edit/remove flows
- [ ] **Task 8:** Create dedicated `/customer/bookings` and `/customer/bookings/[ticketId]` pages with plain-English 4-step passbook progress tracker, reschedule, and cancel actions
- [ ] **Task 9:** Create dedicated `/customer/payments` and `/customer/profile` pages (with photo repositioning, plain-English labels, mobile-optimized forms)

### Checkpoint: Customer Portal
- [ ] Customer portal has zero sidebar on desktop/mobile, dedicated bottom tab bar on mobile, and clean single-purpose pages without information overload
- [ ] All CRUD, booking, reschedule, cancel, payment, and profile actions preserve Supabase RLS & RPC contracts

### Phase 4: Technician & Admin Portals Overhaul (Sub-Pages, Mobile Card Views, Reduced Overload)
- [ ] **Task 10:** Split Technician workspace into focused routes (`/technician/dashboard`, `/technician/jobs`, `/technician/schedule`, `/technician/collections`, `/technician/profile`) with mobile card views and updated `technician-actions.ts` revalidation
- [ ] **Task 11:** Split Admin workspace into focused routes (`/admin/dashboard`, `/admin/repairs`, `/admin/appointments`, `/admin/technicians`, `/admin/appliances`, `/admin/users`, `/admin/payments`, `/admin/profile`) with mobile card views, `ProfilePhotoField` on Admin Profile, and updated `admin-actions.ts` revalidation

### Checkpoint: Full App Functionality
- [ ] `npm run build`, `npx tsc --noEmit`, and `npm run lint` pass with zero errors
- [ ] Clickable bottom-left sidebar profile block in Technician & Admin routes cleanly to `/${role}/profile`

### Phase 5: Documentation, Visual Verification & Impeccable Finish Review
- [ ] **Task 12:** Update `README.md` (for GitHub) and `AGENTS.md` (preserving Next.js agent rules block)
- [ ] **Task 13:** Run browser/visual inspection at desktop (`1440px`) and mobile (`390px`), run `impeccable detect --json`, complete finish review against `model-pick` (`model-pick.html` + `model_pick_1795676279773.jpg`), and generate `DESIGN.md` & `.impeccable/design.json`

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Next.js 16 `cacheComponents` + dynamic auth cookies throwing static/Suspense errors on new routes | High | Wrap every dynamic Server Component data fetch in `<Suspense fallback={<PageSkeleton />}>` inside each new `page.tsx`, matching the existing pattern in `customer/home/page.tsx`. |
| Migration `005_avatar_position.sql` not yet applied to remote Supabase instance | Medium | Store `avatar_position` in `auth.users.user_metadata` as guaranteed primary store, plus best-effort sync to `public.users.avatar_position` ignoring `42703` missing-column errors. |
| Revalidation missing after splitting single-page tabs into dedicated routes | Medium | Use `revalidatePath('/customer', 'layout')`, `revalidatePath('/technician', 'layout')`, and `revalidatePath('/admin', 'layout')` across all mutations. |
| Touch-dragging avatar position causing page scroll on mobile Safari/Chrome | Medium | Apply `touch-action: none` on the circular interactive cropper canvas and expose accessible zoom/X/Y range sliders alongside pointer drag. |
| Scope exclusions (no warranty, inventory, or notifications tables) violated accidentally | High | Enforce strict adherence in `AGENTS.md` and keep all schemas/queries scoped strictly to existing core tables. |

## Open Questions

- None (Tactile Service Passbook visual direction, scope across all portals, sub-page splitting, avatar positioning strategy, and code-first build path are confirmed).

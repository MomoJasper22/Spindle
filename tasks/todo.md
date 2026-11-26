# Task Checklist: Spindle UI/UX Overhaul (Tactile Service Passbook)

## Task 1: Design Foundation, Typography & Core UI Primitives
**Description:** Replace generic Cobalt/Slate tokens in `globals.css` and `layout.tsx` with the Tactile Service Passbook palette (`#F8F7F4` warm alabaster cardstock ground, `#FFFFFF` paper-white surface, `#E6E1D6` borders, `#0F766E` deep teal primary, `#D97706` amber accent, `#141B29` ink-navy text & staff sidebar), load `Bricolage Grotesque` + `Manrope` + `JetBrains Mono`, add mobile safe-area & 44px touch-target rules, and polish core primitives (`button`, `card`, `badge`, `dialog`, `sheet`, `table`, `spindle-logo`).
**Acceptance criteria:**
- [x] `src/app/globals.css` defines Tactile Service Passbook CSS variables, `text-wrap: balance`/`pretty`, `@media (pointer: coarse)` 44px hit targets, and zero horizontal page overflow
- [x] `src/app/layout.tsx` loads `Bricolage_Grotesque`, `Manrope`, and `JetBrains_Mono`, and configures `viewportFit: 'cover'`
- [x] `src/components/ui/sheet.tsx` supports responsive bottom sheets on mobile (`side="bottom"` rounded top corners + safe-area padding) and `dialog.tsx` adapts cleanly on narrow viewports
**Verification:**
- [x] `npx tsc --noEmit` passes
- [x] `npm run lint` passes
**Dependencies:** None
**Files likely touched:** `src/app/globals.css`, `src/app/layout.tsx`, `src/components/shared/spindle-logo.tsx`, `src/components/ui/button.tsx`, `src/components/ui/card.tsx`, `src/components/ui/sheet.tsx`
**Estimated scope:** Medium (5-6 files)

## Task 2: UserAvatar Component & Profile Photo Position/Zoom Editor
**Description:** Build a reusable `UserAvatar` component that renders `avatarUrl` with `{ x, y, zoom }` framing everywhere, add an interactive drag + touch + slider repositioning dialog inside `ProfilePhotoField`, add `updateAvatarPositionAction` (persisted via `user_metadata` + optional `public.users.avatar_position`), and create `005_avatar_position.sql`.
**Acceptance criteria:**
- [x] Users with an already-uploaded profile photo can click "Adjust Position", pan via pointer/touch drag or sliders, adjust zoom (`1.0x`–`2.5x`), preview live in a small circle, and save
- [x] Updated framing persists across page reloads and renders identically in `CustomerShell`, `PortalShell`, and Profile pages
- [x] Safe fallback works even before `005_avatar_position.sql` is applied in Supabase
**Verification:**
- [x] `npx tsc --noEmit` and `npm run lint` pass
- [ ] Manual/browser check of upload + reposition + reload persistence
**Dependencies:** Task 1
**Files likely touched:** `src/types/database.ts`, `src/lib/auth/session.ts`, `src/features/auth/actions/avatar-actions.ts`, `src/components/shared/user-avatar.tsx`, `src/components/shared/profile-photo-field.tsx`, `supabase/migrations/005_avatar_position.sql`
**Estimated scope:** Medium (5-6 files)

## Task 3: Customer Top-Nav / Mobile-Bottom-Bar Shell & Clickable Staff Sidebar Shell
**Description:** Create `CustomerShell` with a clean top header on desktop (NO sidebar) and a dedicated 5-item bottom navigation bar on mobile (`< md`), and update `PortalShell` so the bottom-left user profile footer (avatar, name, email, branch) is a clickable `<Link>` to `/${role}/profile` in both desktop sidebar and mobile drawer, plus a dedicated mobile bottom bar for Technician & Admin.
**Acceptance criteria:**
- [x] Customer interface renders zero desktop or drawer sidebar—desktop uses top nav, mobile uses compact header + fixed bottom tab bar with safe-area padding
- [x] Technician & Admin `PortalShell` bottom-left corner user card (avatar, name, details) routes to `/technician/profile` or `/admin/profile` on click with hover/focus/active states
- [x] All touch targets on mobile navigation are at least 44×44px with clear `aria-current="page"` state
**Verification:**
- [x] `npx tsc --noEmit` and `npm run lint` pass
- [ ] Visual check at 1440px desktop and 390px mobile
**Dependencies:** Task 1, Task 2
**Files likely touched:** `src/components/shared/customer-shell.tsx`, `src/components/shared/portal-shell.tsx`, `src/app/customer/layout.tsx`, `src/app/technician/layout.tsx`, `src/app/admin/layout.tsx`
**Estimated scope:** Medium (5 files)

## Checkpoint: After Tasks 1–3
- [x] Type-check and lint pass
- [x] Navigation shells and avatar positioning foundations work across desktop & mobile

## Task 4: Public Landing Page Overhaul (No "Track Existing Ticket", Plain Language, Service Passbook Hero)
**Description:** Overhaul `src/app/(public)/page.tsx`, `appliance-repair-section.tsx`, and `appliance-showcase.tsx` to match the locked Tactile Service Passbook composition (`model-pick.html` + `model_pick_1795676279773.jpg`), remove the `"Track Existing Ticket"` button, rewrite all copy and appliance service details in plain everyday language, add a mobile navigation menu, and stage the Service Passbook hero card with the `Brands & Appliances` band below.
**Acceptance criteria:**
- [x] `"Track Existing Ticket"` button is completely removed from the landing page
- [x] Zero technical jargon (no PCB, IGBT, thermistor, magnetron, Peltier, R32/R410A, manifold, or diagnostic/ticket jargon) in landing page or appliance popups
- [x] Mobile viewport (`390px`) has clean single-column pacing, reachable mobile nav menu, and bottom-sheet-friendly appliance details
**Verification:**
- [x] `npx tsc --noEmit` and `npm run lint` pass
- [ ] Visual inspection against `model-pick.html` / `model_pick_1795676279773.jpg` at 1440px and 390px
**Dependencies:** Task 1
**Files likely touched:** `src/app/(public)/page.tsx`, `src/features/landing/components/appliance-repair-section.tsx`, `src/features/landing/components/appliance-showcase.tsx`
**Estimated scope:** Small (3 files)

## Task 5: Auth & Onboarding Plain-Language & Mobile Overhaul
**Description:** Update `(auth)/layout.tsx`, `login-form.tsx`, `signup-form.tsx`, `onboarding/page.tsx`, and `onboarding-form.tsx` with plain homeowner-friendly wording, reduced visual clutter, and a mobile-first layout where the form leads immediately on phones instead of sitting below a tall hero aside.
**Acceptance criteria:**
- [x] Zero technical/internal jargon (`tickets`, `field schedule`, `operations workspace`, `administrator`) on customer-facing Auth and Onboarding copy
- [x] On mobile viewports, Sign In / Create Account form appears cleanly at the top without pushing inputs below the fold
- [x] All form validation, password toggles, and onboarding steps keep accessible labels and 44px touch height
**Verification:**
- [x] `npx tsc --noEmit` and `npm run lint` pass
- [ ] Visual check of `/login`, `/signup`, and `/onboarding` at 1440px and 390px
**Dependencies:** Task 1
**Files likely touched:** `src/app/(auth)/layout.tsx`, `src/features/auth/components/login-form.tsx`, `src/features/auth/components/signup-form.tsx`, `src/app/onboarding/page.tsx`, `src/features/onboarding/components/onboarding-form.tsx`
**Estimated scope:** Medium (5 files)

## Checkpoint: After Tasks 4–5
- [x] Public, Auth, and Onboarding flows align visually with Tactile Service Passbook and use plain language
- [x] `npx tsc --noEmit` and `npm run lint` pass

## Task 6: Customer Home Page & Plain-Language Server Action Messages
**Description:** Rebuild `/customer/home` (`src/app/customer/home/page.tsx` and calm home components) as an uncluttered action-oriented overview (greeting, next upcoming visit passbook card, 3 simple summary counters, quick actions, top 4 plain-English recent updates without raw IDs), add shared booking drawer trigger, and update customer-facing strings in `customer-actions.ts` and `status-badge.tsx` (friendly customer labels).
**Acceptance criteria:**
- [x] `/customer/home` shows only concise summary info and next-visit card—no embedded multi-tab CRUD tables
- [x] Customer-facing status badges, empty states, and server action feedback messages avoid internal jargon (`ticket`, `dispatch`, `verification ledger`)
- [x] `customer-actions.ts` revalidates `/customer` layout cleanly
**Verification:**
- [x] `npx tsc --noEmit` and `npm run lint` pass
**Dependencies:** Task 3
**Files likely touched:** `src/app/customer/home/page.tsx`, `src/features/customer/components/customer-home-view.tsx`, `src/features/customer/components/activity-feed.tsx`, `src/features/customer/actions/customer-actions.ts`, `src/components/shared/status-badge.tsx`
**Estimated scope:** Medium (5 files)

## Task 7: Dedicated Customer Appliances Page (`/customer/appliances`)
**Description:** Create `/customer/appliances/page.tsx` and streamline `appliances-panel.tsx` into a clean card-first layout (minimal card summary at rest, full model/serial/notes inside a progressive-disclosure detail sheet/drawer + mobile-friendly add/edit dialog), completely removing technical jargon and dense table overload.
**Acceptance criteria:**
- [x] `/customer/appliances` renders clean cards on both mobile and desktop, keeping serial/model/notes hidden until tapped/opened
- [x] Add, edit, cancel, and delete appliance flows remain fully functional with plain-English confirmation copy
- [x] Wrapped in `<Suspense fallback={<PageSkeleton />}>`
**Verification:**
- [x] `npx tsc --noEmit` and `npm run lint` pass
**Dependencies:** Task 3, Task 6
**Files likely touched:** `src/app/customer/appliances/page.tsx`, `src/features/customer/components/appliances-panel.tsx`
**Estimated scope:** Small (2 files)

## Task 8: Dedicated Customer Bookings & Booking Detail Pages (`/customer/bookings`, `/customer/bookings/[ticketId]`)
**Description:** Create `/customer/bookings/page.tsx` (clean booking cards + Book a Visit flow, plain-language service types & status filters, no 7-column dense table) and `/customer/bookings/[ticketId]/page.tsx` (focused detail page with 4-step passbook progress tracker, technician info, visit window, transparent Peso estimate/final breakdown, reschedule, and cancel).
**Acceptance criteria:**
- [x] `/customer/bookings` presents uncluttered booking cards on desktop and mobile; clicking any booking opens `/customer/bookings/[ticketId]`
- [x] Booking modal uses plain words (`Check-Up & Estimate`, `Cleaning & Tune-Up`, `"Locks in your visit window"`) and supports pre-selection
- [x] Reschedule and Cancel work cleanly and enforce existing status rules
**Verification:**
- [x] `npx tsc --noEmit` and `npm run lint` pass
**Dependencies:** Task 3, Task 6
**Files likely touched:** `src/app/customer/bookings/page.tsx`, `src/app/customer/bookings/[ticketId]/page.tsx`, `src/features/customer/components/repairs-panel.tsx`, `src/features/customer/components/booking-detail-view.tsx`
**Estimated scope:** Medium (4 files)

## Task 9: Dedicated Customer Payments & Profile Pages (`/customer/payments`, `/customer/profile`)
**Description:** Create `/customer/payments/page.tsx` (clean "Bills to Pay" cards + simplified payment history list with expandable passbook receipt details) and overhaul `/customer/profile/page.tsx` + `customer-profile-forms.tsx` + `change-password-card.tsx` in warm plain language with photo upload + position editing and mobile-friendly spacing.
**Acceptance criteria:**
- [x] `/customer/payments` separates open balances from payment history cleanly on mobile and desktop without dense 7-column tables
- [x] `/customer/profile` removes technical badges (`USR-... · User`), uses plain-English labels, and supports profile photo upload & position editing
**Verification:**
- [x] `npx tsc --noEmit` and `npm run lint` pass
**Dependencies:** Task 2, Task 3, Task 6
**Files likely touched:** `src/app/customer/payments/page.tsx`, `src/features/customer/components/payments-panel.tsx`, `src/app/customer/profile/page.tsx`, `src/features/customer/components/customer-profile-forms.tsx`, `src/features/auth/components/change-password-card.tsx`
**Estimated scope:** Medium (5 files)

## Checkpoint: After Tasks 6–9
- [x] Entire Customer Portal works end-to-end across 6 dedicated routes with zero sidebar, zero jargon, and dedicated mobile UI
- [x] `npx tsc --noEmit` and `npm run lint` pass

## Task 10: Technician Portal Split Routes & Mobile Cards
**Description:** Split Technician Portal into focused sidebar routes (`/technician/dashboard`, `/technician/jobs`, `/technician/schedule`, `/technician/collections`, `/technician/profile`), extract shared data loader helper, add dedicated mobile card lists for jobs/schedule/collections, and update `technician-actions.ts` revalidation.
**Acceptance criteria:**
- [x] Technician sidebar links cleanly to Overview, Assigned Jobs, Schedule, Collections; bottom-left profile card routes to `/technician/profile`
- [x] Each page loads only what belongs to that view (no 4-tab overload) and renders touch-friendly mobile cards below `md`
- [x] `DiagnosticDrawer` opens smoothly from Overview and Jobs on both desktop and mobile
**Verification:**
- [x] `npx tsc --noEmit` and `npm run lint` pass
**Dependencies:** Task 2, Task 3
**Files likely touched:** `src/app/technician/layout.tsx`, `src/app/technician/dashboard/page.tsx`, `src/app/technician/jobs/page.tsx`, `src/app/technician/schedule/page.tsx`, `src/app/technician/collections/page.tsx`, `src/features/technician/actions/technician-actions.ts`, `src/features/technician/components/*`
**Estimated scope:** Medium (grouped into clean route + component updates)

## Task 11: Admin Portal Split Routes, Mobile Cards & Admin Avatar Support
**Description:** Split Admin Portal into focused sidebar routes (`/admin/dashboard`, `/admin/repairs`, `/admin/appointments`, `/admin/technicians`, `/admin/appliances`, `/admin/users`, `/admin/payments`, `/admin/profile`), add mobile card views across Admin tables so phones don't scroll 7-column tables, add `ProfilePhotoField` to `AdminProfileForms`, and update `admin-actions.ts` revalidation.
**Acceptance criteria:**
- [x] Admin sidebar routes cleanly across executive summary and operations modules; bottom-left profile card routes to `/admin/profile`
- [x] Admin Profile includes `ProfilePhotoField` with upload and position editing
- [x] Every Admin management view works cleanly on mobile (`390px`) via responsive card views and mobile bottom-bar/sheet navigation
**Verification:**
- [x] `npx tsc --noEmit` and `npm run lint` pass
**Dependencies:** Task 2, Task 3
**Files likely touched:** `src/app/admin/layout.tsx`, `src/app/admin/dashboard/page.tsx`, `src/app/admin/repairs/page.tsx`, `src/app/admin/appointments/page.tsx`, `src/app/admin/technicians/page.tsx`, `src/app/admin/appliances/page.tsx`, `src/app/admin/users/page.tsx`, `src/app/admin/payments/page.tsx`, `src/features/admin/components/admin-profile-forms.tsx`, `src/features/admin/actions/admin-actions.ts`, `src/features/admin/components/*`
**Estimated scope:** Medium (split cleanly into Admin route pages + mobile card enhancements)

## Checkpoint: After Tasks 10–11
- [x] `npm run build`, `npx tsc --noEmit`, and `npm run lint` pass with zero errors
- [x] All three role portals work seamlessly on desktop and mobile

## Task 12: Update `README.md` and `AGENTS.md`
**Description:** Replace the boilerplate `README.md` with comprehensive GitHub project documentation (features, role portals, plain-language customer UX, routes, Supabase migrations `001`–`005`, setup, scripts) and enrich `AGENTS.md` while strictly preserving the `<!-- BEGIN:nextjs-agent-rules --> ... <!-- END:nextjs-agent-rules -->` block.
**Acceptance criteria:**
- [x] `README.md` accurately documents every route, migration, env var, and script observed in the repository
- [x] `AGENTS.md` keeps the Next.js generated rules block verbatim and documents codebase conventions, customer plain-language rules, portal navigation architecture, and database constraints
**Verification:**
- [x] Verified against actual files, routes, and `package.json` scripts
**Dependencies:** Tasks 6–11
**Files likely touched:** `README.md`, `AGENTS.md`
**Estimated scope:** Small (2 files)

## Task 13: Impeccable Detector, Visual Inspection, Finish Review & `DESIGN.md`
**Description:** Capture desktop (`1440px`) and mobile (`390px`) screenshots of the live rendered application, run `impeccable detect --json`, verify against `model-pick.html` and `model_pick_1795676279773.jpg` plus the direction contract, fix any visual/layout findings, complete fresh-context finish review, and generate `DESIGN.md` + `.impeccable/design.json`.
**Acceptance criteria:**
- [x] `impeccable detect --json` runs clean with no unresolved mechanical findings
- [x] Desktop (`1440px`) and mobile (`390px`) renders verified across Landing, Auth, and Signup screens with zero horizontal overflow
- [x] `DESIGN.md` and `.impeccable/design.json` documented and aligned with the built CSS tokens
- [x] Final `npm run build`, `npx tsc --noEmit`, and `npm run lint` pass after final edit
**Verification:**
- [x] Live dev/prod server screenshot review + `impeccable detect --json` + `npm run build`
**Dependencies:** Tasks 1–12
**Files likely touched:** `DESIGN.md`, `.impeccable/design.json`, `.impeccable/review/*`, any final visual fixes
**Estimated scope:** Medium

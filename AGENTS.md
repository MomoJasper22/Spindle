<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Repository Overview

**Spindle** is a Philippine home appliance repair and service scheduling platform built on Next.js 16 (`App Router`, `cacheComponents: true`, `partialPrefetching: true`) + TypeScript + Tailwind CSS v4 + Supabase.

- **User Roles & Portals:**
  - **Customer (`/customer/*`):** `/customer/home`, `/customer/appliances`, `/customer/bookings`, `/customer/bookings/[ticketId]`, `/customer/payments`, `/customer/profile`
  - **Technician (`/technician/*`):** `/technician/dashboard`, `/technician/jobs`, `/technician/schedule`, `/technician/collections`, `/technician/profile`
  - **Admin (`/admin/*`):** `/admin/dashboard`, `/admin/repairs`, `/admin/appointments`, `/admin/technicians`, `/admin/appliances`, `/admin/users`, `/admin/payments`, `/admin/profile`
- **Route Protection:** Handled via `src/proxy.ts` (`updateSession` in `src/lib/supabase/proxy.ts`) and `requireRole()` in `src/lib/auth/session.ts`.

## Design & UX Contracts

1. **Aesthetic Direction (`Tactile Service Passbook`):**
   - Warm alabaster ground (`#F8F7F4`), paper-white cards (`#FFFFFF`), warm sand borders (`#E6E1D6`), ink-navy text & staff sidebars (`#141B29`), deep teal primary (`#0F766E`), warm amber highlights (`#D97706`), emerald completion stamps (`#047857`).
   - Fonts: `Bricolage Grotesque` (headings via `--font-heading`), `Manrope` (UI/body via `--font-sans`), `JetBrains Mono` (reference codes & tabular amounts via `--font-mono`).
   - Full token reference: see `DESIGN.md` and `.impeccable/design.json`.
2. **Customer Plain-Language Rule:**
   - All customer-facing surfaces (`src/app/(public)/*`, `src/features/landing/*`, `src/app/(auth)/*`, `src/features/auth/components/login-form.tsx` / `signup-form.tsx`, `src/app/onboarding/*`, `src/app/customer/*`, `src/features/customer/*`, `StatusBadge` with `audience="customer"`) MUST use plain everyday homeowner wording.
   - Avoid internal or technical jargon (`ticket ID`, `dispatch`, `diagnostic`, `verification ledger`, `PCB`, `IGBT`, `thermistor`, `magnetron`, `R32/R410A`) on customer surfaces.
3. **Navigation Architecture:**
   - **Customer Portal (`CustomerShell`):** Must NEVER render a sidebar. Uses a single desktop top bar and a fixed 5-tab mobile bottom bar with `44px` minimum touch targets and safe-area padding (`pb-safe`).
   - **Technician & Admin Portals (`PortalShell`):** Left `#141B29` sidebar on desktop + mobile top bar, bottom tab bar (`More` drawer on Admin), and drawer on mobile. The bottom-left sidebar user card (avatar, name, email, branch) is a clickable `<Link>` routing to `/${role}/profile`.
4. **Progressive Disclosure & Mobile Ergonomics:**
   - Avoid wide multi-column tables on viewports `< md`; pair desktop `<Table>` views (`hidden md:block`) with stacked mobile card lists (`md:hidden`) or use clean card grids with sheets/detail pages.
   - Touch controls must meet `44×44px` hit targets on coarse pointers.
5. **Avatar Photo Framing:**
   - Uploaded profile photos support non-destructive focal framing (`{ x, y, zoom }`) via `ProfilePhotoField` (`src/components/shared/profile-photo-field.tsx`), rendered consistently with `UserAvatar` (`src/components/shared/user-avatar.tsx`) and `getAvatarImageStyle` (`src/lib/avatar.ts`).
   - `updateAvatarPositionAction` persists framing to Supabase Auth `user_metadata` and best-effort syncs `public.users.avatar_position` (`supabase/migrations/005_avatar_position.sql`).

## Next.js 16 & Supabase Rules

- With `cacheComponents: true` enabled in `next.config.ts`, any page/component reading runtime auth cookies (`requireRole()`) or `searchParams` / `params` promises MUST be wrapped in `<Suspense fallback={<PageSkeleton />}>`.
- Preserve all database schema constraints, RLS policies, and atomic RPC signatures (`rpc_create_repair_with_appointment`, `rpc_assign_technician_and_confirm_slot`, `rpc_record_and_verify_payment`).
- Keep `AGENTS.md` changes outside the `<!-- BEGIN:nextjs-agent-rules --> ... <!-- END:nextjs-agent-rules -->` delimiters so `next dev` does not re-create noisy diffs.
- Before wrapping up code edits, verify with `npx tsc --noEmit`, `npm run lint`, and `npm run build`.

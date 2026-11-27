# Implementation Plan: Photo Simplification, Technician Lunch/Auto-Off-Duty, Emoji-Style Appliance Picker, Simplified Booking & Payment Options

## Overview

This plan covers six UX, workflow, and database updates across Spindle's public landing header, shared photo uploader, technician availability lifecycle, appliance picker, home visit scheduling modal, and PayMongo checkout options:
1. **Landing Header (`LandingHeader`):** Remove `"Book a Repair"` from desktop and mobile navigation, and style `"Sign In"` inside a pill-shaped button.
2. **Edit Photo Simplification (`ProfilePhotoField`):** Remove drag-to-pan pointer controls as well as the `Zoom`, `Left / Right`, and `Up / Down` sliders (plus `Reset Center` / `Save Position`), keeping upload/change and remove photo cleanly centered.
3. **Technician Availability (`Lunch`, Redundant Dot Removal, Auto `Off Duty`):** Remove the duplicate status circle in `TechnicianOverviewView`'s `Availability:` dropdown, add `'lunch'` (`Lunch`) across UI/badges/productivity analytics/DB constraints, allow Admin dispatch during `'lunch'` while blocking `'off_duty'`, and automatically transition technicians to `'off_duty'` (with status & activity logs) when they log out while leaving login status as `'off_duty'` until changed manually.
4. **Emoji-Style Appliance Picker (`ApplianceTypePicker`):** Default new appliance forms to empty with `"Pick Appliances"` (no preselected first item, clean spacing below `"Appliance Type"`), opening an emoji-picker-style full grid of appliance boxes only when clicked.
5. **Booking Modal Cleanup (`RepairsPanel`):** Remove the redundant `"How soon do you need us?"` (`priority`) field from `Schedule a Home Visit` (defaulting `priority` to `'normal'`).
6. **PayMongo Payment Mode Choice (No Installments):** Before redirecting to PayMongo, allow customers to choose **Down Payment (pay rest in full after repair)** or **Pay in Full** (omitting installment options per user clarification), and settle remaining balances in full on `/customer/payments`.

## Architecture Decisions

- **Edit Photo (`src/components/shared/profile-photo-field.tsx`):** Keep `uploadAvatarAction` (which resets `avatar_position` to `{ x: 50, y: 50, zoom: 1 }`) and `removeAvatarAction`, while removing pointer drag handlers (`handlePointerDown/Move/Up`) and all three range sliders (`Zoom`, `Left / Right`, `Up / Down`). Update modal helper copy to `"PNG, JPG, or WebP up to 2 MB."`
- **Technician Availability & Auto Off-Duty:**
  - Extend `TECH_AVAILABILITY_STATUSES` in `src/lib/constants.ts` to `['available', 'busy', 'lunch', 'off_duty']` and add `lunch` styling to `src/components/shared/status-badge.tsx`.
  - Remove the extra dot `<span />` outside `<SelectValue />` in `src/features/technician/components/technician-overview-view.tsx` so only a single status dot appears per item.
  - Update `src/features/auth/actions/auth-actions.ts` (`signOutAction`) to set `technician_profiles.availability_status = 'off_duty'` and insert `technician_status_logs` + `activity_logs` before calling `supabase.auth.signOut()`, invalidating `admin-tech-profiles`, `admin-status-logs`, `technician-activity`, and `user-profile`. `signInAction` leaves `availability_status` untouched (`'off_duty'` until the technician switches it).
  - Add migration `supabase/migrations/008_tech_lunch_and_payment_modes.sql` updating `CHECK` constraints on `technician_profiles.availability_status` and `technician_status_logs` (`previous_status`, `new_status`). Keep `rpc_assign_technician_and_confirm_slot` blocking `'off_duty'` while permitting `'lunch'`.
- **Emoji-Style Appliance Picker (`src/components/shared/appliance-icons.tsx`):** Build a reusable `ApplianceTypePicker` component rendered inside an inline/anchored tray (never clipped by `<DialogContent>`'s `overflow-y-auto`) with `"Pick Appliances"` placeholder when empty (`''`), crisp spacing under the `"Appliance Type"` label, and a full grid of icon + name boxes shown only when clicked. Enforce valid category via `z.enum(APPLIANCE_CATEGORIES)` on submit.
- **PayMongo Payment Options (Down Payment vs. Pay in Full — No Installments):**
  - Define `SERVICE_FULL_PRICES_PHP` alongside `SERVICE_BOOKING_FEES_PHP` (used as down-payment deposit amounts) in `src/lib/constants.ts` and add `payment_mode: 'down_payment' | 'full_payment'` to booking checkout schemas, `payment_checkout_sessions` (via migration `008`), and `rpc_finalize_paid_booking_checkout`.
  - Selecting **Down Payment** charges the upfront deposit now (`amount_php = deposit`, `estimated_cost_php = fullPrice`) so the remaining balance is paid in full after repair. Selecting **Pay in Full** charges the full service base price upfront (`amount_php = fullPrice`, `estimated_cost_php = fullPrice`, `final_cost_php = fullPrice` unless technician adjusts scope later).
  - On `/customer/payments`, paying a remaining balance settles `payableRemaining` in full with PayMongo (no partial/installment splits).

## Task List

### Phase 1: Landing Header & Photo Simplification
- [x] Task 1: Remove "Book a Repair" and add pill styling to Sign In on Landing Header
- [x] Task 2: Remove drag-to-pan and zoom/position sliders from Edit Photo dialog

### Checkpoint: Phase 1 UI Cleanup
- [x] `npx tsc --noEmit` and `npm run lint` pass cleanly

### Phase 2: Technician Availability (`Lunch`, Redundant Dot Removal, Auto `Off Duty`)
- [x] Task 3: Remove redundant availability dot and add `lunch` status in constants, badges, and Technician Overview
- [x] Task 4: Update DB migration `008` and Admin technician analytics/roster for `lunch`
- [x] Task 5: Auto-set technician availability to `off_duty` on Log Out

### Checkpoint: Phase 2 Technician Availability
- [x] `npx tsc --noEmit` and `npm run lint` pass cleanly

### Phase 3: Emoji-Style Appliance Picker & Simplified Booking Form
- [x] Task 6: Replace Appliance Type dropdown with emoji-style box picker defaulting to "Pick Appliances"
- [x] Task 7: Remove "How soon do you need us?" from Schedule a Home Visit modal

### Phase 4: Down Payment vs. Pay in Full Options (No Installments)
- [x] Task 8: Extend migration `008`, constants, types, and schemas for `down_payment` vs. `full_payment`
- [x] Task 9: Update booking checkout and balance payment UI/actions for Down Payment vs. Pay in Full

### Checkpoint: Complete Verification
- [x] `npx tsc --noEmit` passes
- [x] `npm run lint` passes
- [x] `npm run build` passes
- [ ] Manual UI and Supabase migration `008` check

## Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Migration `008_tech_lunch_and_payment_modes.sql` not yet executed in Supabase SQL Editor when switching to `lunch` or using `payment_mode` | High | Make migration `008` idempotent (`DROP CONSTRAINT IF EXISTS` + `ADD COLUMN IF NOT EXISTS`) and remind user to run `006`, `007`, `008` in Supabase SQL Editor. |
| Floating/popover picker clipped inside `<DialogContent>` `overflow-y-auto` | Med | Render the emoji-style appliance box grid as an inline/full-width collapsible tray directly beneath the `"Pick Appliances"` trigger inside the dialog flow. |
| Technician `signOutAction` failing to log `off_duty` after session invalidation | High | Perform technician status lookup, update, and log insertion via `createAdminClient()` **before** `supabase.auth.signOut()`, wrapped cleanly so sign-out never fails if DB update encounters a transient issue. |
| Pay-in-full upfront booking prematurely completing before technician visits | High | Preserve the `rpc_record_and_verify_payment` / `rpc_finalize_*` rule that bookings stay `'pending'` until dispatched and worked (`in_progress` / `awaiting_payment`), even when `verified_paid_php >= estimated_cost_php`. |

## Open Questions

- **Full Service Price Presets for "Pay in Full" at Booking:** Currently `SERVICE_BOOKING_FEES_PHP` has `diagnostic: ₱350`, `repair: ₱450`, `maintenance_cleaning: ₱650`, `installation: ₱800`. Using those as **Down Payment** deposits and setting base **Pay in Full** upfront amounts (e.g., `diagnostic: ₱350` [or ₱500], `repair: ₱1,500`, `maintenance_cleaning: ₱1,200`, `installation: ₱2,000`) — please let us know if you prefer different base PHP prices when approving!

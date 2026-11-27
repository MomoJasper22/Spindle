# Task Breakdown: Photo Simplification, Technician Lunch/Auto-Off-Duty, Emoji-Style Appliance Picker, Simplified Booking & Payment Options

## Task 1: Remove "Book a Repair" and add pill styling to Sign In on Landing Header

**Description:** Update `LandingHeader` so the `"Book a Repair"` button is removed from both the desktop top bar and mobile navigation sheet, and style `"Sign In"` as a pill-shaped button (`rounded-full`) visible across mobile and desktop.

**Acceptance criteria:**
- [x] Neither desktop header nor mobile menu in `src/features/landing/components/landing-header.tsx` renders `"Book a Repair"`.
- [x] `"Sign In"` renders with pill styling (`rounded-full`) and remains accessible on both mobile and desktop viewports.

**Verification:**
- [x] Typecheck succeeds: `npx tsc --noEmit`
- [x] Lint passes: `npm run lint`
- [ ] Manual check: Inspect `/` header on desktop and mobile widths.

**Dependencies:** None

**Files likely touched:**
- `src/features/landing/components/landing-header.tsx`

**Estimated scope:** XS (1 file)

---

## Task 2: Remove drag-to-pan and zoom/position sliders from Edit Photo dialog

**Description:** Simplify `ProfilePhotoField` by removing pointer drag-to-pan handlers on the preview circle as well as the `Zoom`, `Left / Right`, and `Up / Down` sliders, `Reset Center`, and `Save Position` controls, keeping photo upload/change and removal cleanly centered inside the `Edit Photo` modal.

**Acceptance criteria:**
- [ ] Clicking `Edit Photo` opens the modal without drag-to-pan cursor/handlers or `Zoom` / `Left / Right` / `Up / Down` sliders.
- [ ] Users can still upload a photo, replace an existing photo (`Change Photo`), and remove their photo (`Remove Photo`).
- [ ] Modal helper copy clearly states `"PNG, JPG, or WebP up to 2 MB."`.

**Verification:**
- [ ] Typecheck succeeds: `npx tsc --noEmit`
- [ ] Lint passes: `npm run lint`
- [ ] Manual check: Open `Edit Photo` on Customer/Technician/Admin profiles and confirm clean upload & remove flow.

**Dependencies:** None

**Files likely touched:**
- `src/components/shared/profile-photo-field.tsx`

**Estimated scope:** XS (1 file)

---

## Checkpoint: After Tasks 1–2
- [ ] `npx tsc --noEmit` and `npm run lint` pass cleanly
- [ ] Landing header and simplified Edit Photo modal verified

---

## Task 3: Remove redundant availability dot and add `lunch` status in constants, badges, and Technician Overview

**Description:** Update `TECH_AVAILABILITY_STATUSES` to include `'lunch'`, register `Lunch` styling in `StatusBadge`, and remove the duplicate colored circle outside `<SelectValue />` in `TechnicianOverviewView`'s `Availability:` dropdown.

**Acceptance criteria:**
- [ ] `TECH_AVAILABILITY_STATUSES` in `src/lib/constants.ts` contains `'available'`, `'busy'`, `'lunch'`, and `'off_duty'`.
- [ ] `StatusBadge` in `src/components/shared/status-badge.tsx` renders a dedicated badge for `'lunch'` (`Lunch`).
- [ ] `TechnicianOverviewView` shows only one status indicator (no duplicate outer circle next to the dropdown value) and supports switching to `Lunch`.

**Verification:**
- [ ] Typecheck succeeds: `npx tsc --noEmit`
- [ ] Lint passes: `npm run lint`
- [ ] Manual check: Inspect `/technician/dashboard` `Availability:` dropdown when closed and open.

**Dependencies:** None

**Files likely touched:**
- `src/lib/constants.ts`
- `src/components/shared/status-badge.tsx`
- `src/features/technician/components/technician-overview-view.tsx`

**Estimated scope:** S (3 files)

---

## Task 4: Update DB migration `008` and Admin technician analytics/roster for `lunch`

**Description:** Create `supabase/migrations/008_tech_lunch_and_payment_modes.sql` (part 1: technician `'lunch'` constraints) and update `TechnicianProductivitySheet` and Admin roster views so `'lunch'` is tracked cleanly alongside `available`, `busy`, and `off_duty`, while Admin dispatch remains allowed during `'lunch'` and blocked during `'off_duty'`.

**Acceptance criteria:**
- [ ] `supabase/migrations/008_tech_lunch_and_payment_modes.sql` updates `CHECK` constraints on `technician_profiles.availability_status` and `technician_status_logs` (`previous_status`, `new_status`) to permit `'lunch'`.
- [ ] `TechnicianProductivitySheet` includes `lunch` in `durationsByStatus`, `totalLoggedMs`, the stacked progress bar, and the duration summary grid.
- [ ] Admin dispatch (`rpc_assign_technician_and_confirm_slot`) allows assigning technicians with status `'lunch'` while continuing to block `'off_duty'`.

**Verification:**
- [ ] Typecheck succeeds: `npx tsc --noEmit`
- [ ] Lint passes: `npm run lint`

**Dependencies:** Task 3

**Files likely touched:**
- `supabase/migrations/008_tech_lunch_and_payment_modes.sql`
- `src/features/admin/components/technician-productivity-sheet.tsx`

**Estimated scope:** S (2 files)

---

## Task 5: Auto-set technician availability to `off_duty` on Log Out

**Description:** Update `signOutAction` so whenever a technician logs out, their `technician_profiles.availability_status` automatically updates to `'off_duty'` (recording `technician_status_logs` and `activity_logs` and invalidating cached technician/admin tags) before signing out of Supabase Auth, while leaving status as `'off_duty'` on subsequent login until changed manually.

**Acceptance criteria:**
- [ ] Logging out as a technician with status `'available'`, `'busy'`, or `'lunch'` updates `technician_profiles.availability_status` to `'off_duty'`.
- [ ] A transition record is inserted into `technician_status_logs` and `activity_logs`, and `admin-tech-profiles`, `admin-status-logs`, `technician-activity`, and `user-profile` tags are invalidated.
- [ ] Logging back in keeps the technician `'off_duty'` until they select another status; customer/admin logouts are unaffected.

**Verification:**
- [ ] Typecheck succeeds: `npx tsc --noEmit`
- [ ] Lint passes: `npm run lint`
- [ ] Manual check: Log out as a technician and verify Admin roster shows `Off Duty`.

**Dependencies:** Task 3, Task 4

**Files likely touched:**
- `src/features/auth/actions/auth-actions.ts`

**Estimated scope:** XS (1 file)

---

## Checkpoint: After Tasks 3–5
- [ ] `npx tsc --noEmit` and `npm run lint` pass cleanly
- [ ] Technician `Lunch`, single-dot dropdown, productivity bar, and auto-`off_duty` logout verified

---

## Task 6: Replace Appliance Type dropdown with emoji-style box picker defaulting to "Pick Appliances"

**Description:** Build a reusable `ApplianceTypePicker` in `src/components/shared/appliance-icons.tsx` and wire it into Customer and Admin `AppliancesPanel` + `applianceSchema` so adding a new appliance starts unselected with `"Pick Appliances"` (cleanly spaced under the `"Appliance Type"` label) and expands into an emoji-picker-style grid of icon boxes only when clicked.

**Acceptance criteria:**
- [ ] New appliance form starts with no appliance preselected and displays `"Pick Appliances"` cleanly below the `"Appliance Type"` label with zero overlap.
- [ ] Clicking `"Pick Appliances"` reveals a full grid of icon + label boxes (like an emoji picker) and closes upon selection, updating the trigger with the selected icon and appliance name.
- [ ] Attempting to submit without picking an appliance displays validation feedback (`Select an appliance type.`).
- [ ] Both Customer `/customer/appliances` and Admin `/admin/appliances` use this non-redundant picker.

**Verification:**
- [ ] Typecheck succeeds: `npx tsc --noEmit`
- [ ] Lint passes: `npm run lint`

**Dependencies:** None

**Files likely touched:**
- `src/components/shared/appliance-icons.tsx`
- `src/features/customer/schemas/customer-schemas.ts`
- `src/features/customer/components/appliances-panel.tsx`
- `src/features/admin/components/appliances-panel.tsx`

**Estimated scope:** M (4 files)

---

## Task 7: Remove "How soon do you need us?" from Schedule a Home Visit

**Description:** Remove the redundant `"How soon do you need us?"` (`priority`) select control from the customer `Schedule a Home Visit` modal in `RepairsPanel` and default `priority` to `'normal'` in `repairBookingSchema` / `createBookingCheckoutAction`.

**Acceptance criteria:**
- [ ] The `Schedule a Home Visit` modal no longer displays `"How soon do you need us?"`.
- [ ] Validations and booking checkout payloads still satisfy `priority = 'normal'` in PostgreSQL without breaking technician/admin views.

**Verification:**
- [ ] Typecheck succeeds: `npx tsc --noEmit`
- [ ] Lint passes: `npm run lint`

**Dependencies:** None

**Files likely touched:**
- `src/features/customer/components/repairs-panel.tsx`
- `src/features/customer/schemas/customer-schemas.ts`

**Estimated scope:** S (2 files)

---

## Task 8: Extend migration `008`, constants, types, and schemas for Down Payment vs. Pay in Full

**Description:** Define `SERVICE_FULL_PRICES_PHP` alongside `SERVICE_BOOKING_FEES_PHP` (down payment amounts) in `src/lib/constants.ts`, add `payment_mode: 'down_payment' | 'full_payment'` to `repairBookingSchema`, and extend `supabase/migrations/008_tech_lunch_and_payment_modes.sql` (`payment_checkout_sessions.payment_mode` and `rpc_finalize_paid_booking_checkout` handling full vs. down-payment booking totals without installment splits).

**Acceptance criteria:**
- [ ] `src/lib/constants.ts` defines `PAYMENT_MODES_CHECKOUT` (`'down_payment'`, `'full_payment'`) and `getServiceFullPricePhp(serviceType)` alongside `getServiceBookingFeePhp(serviceType)`.
- [ ] `supabase/migrations/008_tech_lunch_and_payment_modes.sql` adds `payment_mode` to `payment_checkout_sessions` and updates `rpc_finalize_paid_booking_checkout` to record `estimated_cost_php` (and `final_cost_php` when paid in full upfront, unless adjusted later by staff).
- [ ] Installment options are intentionally excluded.

**Verification:**
- [ ] Typecheck succeeds: `npx tsc --noEmit`
- [ ] Lint passes: `npm run lint`

**Dependencies:** Task 4, Task 7

**Files likely touched:**
- `supabase/migrations/008_tech_lunch_and_payment_modes.sql`
- `src/lib/constants.ts`
- `src/features/customer/schemas/customer-schemas.ts`
- `src/types/database.ts`

**Estimated scope:** M (4 files)

---

## Task 9: Update booking checkout and balance payment UI/actions for Down Payment vs. Pay in Full

**Description:** Update `createBookingCheckoutAction`, `RepairsPanel`, `PaymentsPanel`, and `createTicketPaymentCheckoutAction` so customers choose between **Down Payment (pay rest in full after repair)** or **Pay in Full** before proceeding to PayMongo checkout (with zero installment options), and settle any remaining post-repair balance in full.

**Acceptance criteria:**
- [ ] `Schedule a Home Visit` presents two clear options before PayMongo checkout: **Down Payment (Pay rest in full after repair)** and **Pay in Full**, updating the PayMongo checkout amount and button CTA dynamically.
- [ ] No installment selector or partial split input appears in Customer checkout modals.
- [ ] `createBookingCheckoutAction` checks open sessions matching `payment_mode`, `service_type`, `scheduled_date`, and `time_slot` to prevent duplicate PayMongo sessions/charges.
- [ ] `PaymentsPanel` (`My Payments`) settles remaining balance in full via PayMongo.

**Verification:**
- [ ] Typecheck succeeds: `npx tsc --noEmit`
- [ ] Lint passes: `npm run lint`
- [ ] Build succeeds: `npm run build`

**Dependencies:** Task 7, Task 8

**Files likely touched:**
- `src/features/customer/actions/customer-actions.ts`
- `src/features/customer/components/repairs-panel.tsx`
- `src/features/customer/components/payments-panel.tsx`

**Estimated scope:** M (3 files)

---

## Checkpoint: Complete Verification
- [x] `npx tsc --noEmit` passes with zero errors
- [x] `npm run lint` passes with zero errors
- [x] `npm run build` succeeds cleanly
- [ ] All acceptance criteria across Tasks 1–9 verified end-to-end (pending Supabase migration SQL run + manual browser click-through)

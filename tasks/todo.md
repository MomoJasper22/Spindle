# Task Breakdown: Customer Home CTA, Appliance Icons, Log Out Copy & Unified Profile UX

## Task 1: Update Customer Home appliance call-to-action buttons

**Description:** Update `CustomerHomeView` so the oversized header `+ Add Your First Appliance` button is removed when the customer has zero active appliances (keeping `+ Book a Home Visit` when they already have appliances), and update the `"No home visits booked right now"` card's `"Add Appliance ->"` button to `"+ Add Your First Appliance"`.

**Acceptance criteria:**
- [ ] On `/customer/home`, when `activeAppliances.length === 0`, the top-right header CTA button (`+ Add Your First Appliance`) is not rendered.
- [ ] On `/customer/home`, when `activeAppliances.length > 0`, the top-right header CTA (`+ Book a Home Visit`) still renders and links to `/customer/bookings?book=1`.
- [ ] On `/customer/home`, in the `"No home visits booked right now"` card when `activeAppliances.length === 0`, the button reads `+ Add Your First Appliance` (with `<Plus />` icon, linking to `/customer/appliances?add=1`), replacing `Add Appliance ->`.

**Verification:**
- [ ] Typecheck succeeds: `npx tsc --noEmit`
- [ ] Lint passes: `npm run lint`
- [ ] Manual check: Inspect `/customer/home` with 0 appliances and >=1 appliances.

**Dependencies:** None

**Files likely touched:**
- `src/features/customer/components/customer-home-view.tsx`

**Estimated scope:** XS (1 file)

---

## Task 2: Rename all "Sign Out" buttons to "Log Out"

**Description:** Replace every `"Sign Out"` button label across Onboarding and the Customer, Technician, and Admin profile views with `"Log Out"`, keeping the existing `signOutAction` server action and `<LogOut />` icon intact.

**Acceptance criteria:**
- [ ] `src/app/onboarding/page.tsx` renders `Log Out` instead of `Sign Out`.
- [ ] Customer, Technician, and Admin profile forms render `Log Out` instead of `Sign Out`.
- [ ] No `"Sign Out"` button labels remain anywhere in `src/`.

**Verification:**
- [ ] Typecheck succeeds: `npx tsc --noEmit`
- [ ] Lint passes: `npm run lint`
- [ ] Manual check: Grep `src/` for `Sign Out` returns zero button matches.

**Dependencies:** None

**Files likely touched:**
- `src/app/onboarding/page.tsx`
- `src/features/customer/components/customer-profile-forms.tsx`
- `src/features/technician/components/technician-profile-forms.tsx`
- `src/features/admin/components/admin-profile-forms.tsx`

**Estimated scope:** S (4 files)

---

## Checkpoint: After Tasks 1–2
- [ ] `npx tsc --noEmit` and `npm run lint` pass without errors
- [ ] Customer home CTAs and `Log Out` button labels verified

---

## Task 3: Extract landing page appliance SVG illustrations into a shared icon registry

**Description:** Move the 12 SVG appliance illustrations from the `"Appliances We Care For"` section in `src/features/landing/components/appliance-repair-section.tsx` into a shared component/registry (`src/components/shared/appliance-icons.tsx`), exposing icon keys, labels, category-to-icon default lookup (`getDefaultApplianceIcon`), and a reusable `<ApplianceIcon />` component.

**Acceptance criteria:**
- [ ] All 12 SVG illustrations (`split-aircon`, `window-aircon`, `refrigerator`, `washing-machine`, `cooking-range`, `commercial-chiller`, `microwave-oven`, `water-dispenser`, `television`, `clothes-dryer`, `electric-fan`, `water-heater`) live in `src/components/shared/appliance-icons.tsx` with no duplicated SVG paths.
- [ ] `ApplianceRepairSection` imports and renders its marquee and modal illustrations from `src/components/shared/appliance-icons.tsx` with identical visual output and `isActive` styling.
- [ ] `getDefaultApplianceIcon(category)` maps all 13 `APPLIANCE_CATEGORIES` values cleanly to one of the 12 icon keys.

**Verification:**
- [ ] Typecheck succeeds: `npx tsc --noEmit`
- [ ] Lint passes: `npm run lint`
- [ ] Manual check: Public landing page `"Appliances We Care For"` marquee and detail dialog render identically.

**Dependencies:** None

**Files likely touched:**
- `src/components/shared/appliance-icons.tsx`
- `src/features/landing/components/appliance-repair-section.tsx`

**Estimated scope:** S (2 files)

---

## Task 4: Add database migration, types, and customer appliance schema/actions for `icon`

**Description:** Add an additive migration `supabase/migrations/006_appliance_icon.sql` adding `icon VARCHAR(50) NULL` to `public.customer_appliances` (and appending `a.icon AS appliance_icon` to `v_repair_details`), update TypeScript contracts in `src/types/database.ts`, and update `applianceSchema` plus `createApplianceAction` / `updateApplianceAction` to validate and persist `icon` (with graceful handling if migration `006` is not yet applied).

**Acceptance criteria:**
- [ ] `supabase/migrations/006_appliance_icon.sql` adds `icon` with a `CHECK` constraint for the 12 valid `ApplianceIconKey` values and preserves existing view column order when updating `v_repair_details`.
- [ ] `CustomerApplianceRow` and `RepairDetailView` in `src/types/database.ts` include optional `icon` / `appliance_icon`.
- [ ] `applianceSchema` validates `icon` against `APPLIANCE_ICON_KEYS` (optional/defaulting cleanly), and `createApplianceAction` / `updateApplianceAction` persist `icon` and revalidate portal caches.

**Verification:**
- [ ] Typecheck succeeds: `npx tsc --noEmit`
- [ ] Lint passes: `npm run lint`
- [ ] SQL review: Confirm migration is additive, idempotent (`IF NOT EXISTS`), and preserves RLS & existing RPC signatures.

**Dependencies:** Task 3

**Files likely touched:**
- `supabase/migrations/006_appliance_icon.sql`
- `src/types/database.ts`
- `src/features/customer/schemas/customer-schemas.ts`
- `src/features/customer/actions/customer-actions.ts`

**Estimated scope:** M (4 files)

---

## Task 5: Add appliance icon picker and display to Customer Appliances UI

**Description:** Update the Customer `Add / Edit Appliance` modal in `src/features/customer/components/appliances-panel.tsx` to include a visual icon selector reusing the 12 `"Appliances We Care For"` icons (auto-syncing default icon when choosing a category unless manually overridden), and display each appliance's selected icon on its card and detail sheet (plus optional passbook/booking cards where helpful).

**Acceptance criteria:**
- [ ] The Add / Edit Appliance dialog displays a tactile, keyboard-accessible grid of all 12 landing-page appliance icons with clear selection state.
- [ ] Selecting an `Appliance Type` updates the suggested icon for new appliances until the user explicitly picks a different icon; editing an existing appliance pre-selects its saved `icon` (or category fallback).
- [ ] Saved appliance cards and the appliance detail sheet in `/customer/appliances` display the selected `<ApplianceIcon />`.

**Verification:**
- [ ] Typecheck succeeds: `npx tsc --noEmit`
- [ ] Lint passes: `npm run lint`
- [ ] Manual check: Add a new appliance with a custom icon, edit it, and confirm the icon renders in the card list and detail sheet.

**Dependencies:** Task 3, Task 4

**Files likely touched:**
- `src/features/customer/components/appliances-panel.tsx`
- `src/features/customer/components/customer-home-view.tsx` (optional card icon accent if appropriate)
- `src/features/customer/components/repairs-panel.tsx` (optional card icon accent if appropriate)

**Estimated scope:** S–M (1–3 files)

---

## Task 6: Add appliance icon support to Admin Appliances Registry

**Description:** Extend `adminApplianceSchema`, `adminUpsertApplianceAction`, and `AdminAppliancesPanel` so administrators can also view, set, and edit an appliance's `icon` consistently with customer-created appliances.

**Acceptance criteria:**
- [ ] `adminApplianceSchema` and `adminUpsertApplianceAction` support `icon` cleanly with category fallback.
- [ ] `AdminAppliancesPanel` displays the appliance icon in mobile cards / desktop table and includes the icon picker in the Add / Edit Master Appliance Record modal.

**Verification:**
- [ ] Typecheck succeeds: `npx tsc --noEmit`
- [ ] Lint passes: `npm run lint`
- [ ] Build succeeds: `npm run build`

**Dependencies:** Task 3, Task 4

**Files likely touched:**
- `src/features/admin/schemas/admin-schemas.ts`
- `src/features/admin/actions/admin-actions.ts`
- `src/features/admin/components/appliances-panel.tsx`

**Estimated scope:** M (3 files)

---

## Checkpoint: After Tasks 3–6
- [ ] `npx tsc --noEmit`, `npm run lint`, and `npm run build` pass cleanly
- [ ] Landing page icons, customer icon picker/display, and admin registry parity verified

---

## Task 7: Enlarge and center profile avatar with unified "Edit Photo" dialog

**Description:** Update `UserAvatar` to support a larger `'2xl'` size (`h-24 w-24 sm:h-28 sm:w-28`) and refactor `ProfilePhotoField` so the profile picture sits centered and larger on profile pages, replacing `"Change Photo"` / `"Add Photo"`, `"Adjust Position"`, and `"Remove"` with a single **`Edit Photo`** button that opens a unified **Edit Photo** dialog containing photo upload/change, interactive drag-pan & zoom framing, photo removal, and the guidance text `"PNG, JPG, or WebP up to 2 MB. You can adjust how your photo is framed anytime."`.

**Acceptance criteria:**
- [ ] Profile pages render the avatar centered horizontally and noticeably larger (`size="2xl"`), with a single **`Edit Photo`** button below it.
- [ ] The `"PNG, JPG, or WebP up to 2 MB. You can adjust how your photo is framed anytime."` helper copy is removed from the profile page outside the modal and placed inside the **`Edit Photo`** dialog.
- [ ] Inside the **`Edit Photo`** dialog, users can upload/change a photo, adjust framing (drag + zoom/X/Y sliders + Reset Center + Save Position) when a photo is present, and remove the photo cleanly.
- [ ] `OnboardingForm` Step 3 continues to render `ProfilePhotoField` cleanly without layout breakage.

**Verification:**
- [ ] Typecheck succeeds: `npx tsc --noEmit`
- [ ] Lint passes: `npm run lint`
- [ ] Manual check: Test upload, reposition/zoom save, and removal inside the unified `Edit Photo` dialog on profile pages.

**Dependencies:** None (safe to run alongside or after Phase 2)

**Files likely touched:**
- `src/components/shared/user-avatar.tsx`
- `src/components/shared/profile-photo-field.tsx`
- `src/features/onboarding/components/onboarding-form.tsx` (only if passing a `layout` prop)

**Estimated scope:** S (2–3 files)

---

## Task 8: Add read-only default view and "Edit Profile" mode to Customer Profile

**Description:** Update `CustomerProfileForms` so customer details render in a read-only view by default with an **`Edit Profile`** button instead of `"Save Changes"`. Clicking **`Edit Profile`** switches editable fields (name, phone, branch, 5-part Philippine address; `email` remains permanently read-only) into edit mode with **`Save Changes`** and **`Cancel`** buttons.

**Acceptance criteria:**
- [ ] On `/customer/profile`, customer contact & address details are not editable on initial load.
- [ ] The primary profile action button initially reads **`Edit Profile`** (instead of `"Save Changes"`).
- [ ] Clicking **`Edit Profile`** unlocks editable customer fields while keeping `email` read-only, and provides **`Save Changes`** and **`Cancel`**.
- [ ] Saving updates returns to read-only mode with a success banner; clicking **`Cancel`** discards unsaved edits and returns to read-only mode.

**Verification:**
- [ ] Typecheck succeeds: `npx tsc --noEmit`
- [ ] Lint passes: `npm run lint`
- [ ] Manual check: Verify read-only default, edit toggle, cancel reset, and save persistence on `/customer/profile`.

**Dependencies:** Task 2, Task 7

**Files likely touched:**
- `src/features/customer/components/customer-profile-forms.tsx`

**Estimated scope:** XS (1 file)

---

## Task 9: Add read-only default view and "Edit Profile" mode to Technician Profile

**Description:** Update `TechnicianProfileForms` so all profile information (including `Display Nickname` and Admin-Managed Personal & Dispatch Details) is read-only by default behind an **`Edit Profile`** button. Clicking **`Edit Profile`** unlocks **only** `Display Nickname` (respecting DB trigger `005` locks on Full Name, Email, Phone, Branch, Certification, Max Daily Jobs, Base Address, and Specializations) and provides **`Save Changes`** and **`Cancel`**.

**Acceptance criteria:**
- [ ] On `/technician/profile`, `Display Nickname` and all Admin-Managed details are read-only on initial load.
- [ ] The standalone `"Save Nickname"` button is replaced by **`Edit Profile`** in view mode.
- [ ] Clicking **`Edit Profile`** unlocks only `Display Nickname` with **`Save Changes`** and **`Cancel`**, keeping all Admin-Managed fields locked/read-only.
- [ ] Saving nickname updates returns to read-only mode with a success banner; **`Cancel`** discards changes.

**Verification:**
- [ ] Typecheck succeeds: `npx tsc --noEmit`
- [ ] Lint passes: `npm run lint`
- [ ] Manual check: Verify technician can edit only `nickname` after clicking `Edit Profile` and all admin-managed fields remain locked.

**Dependencies:** Task 2, Task 7

**Files likely touched:**
- `src/features/technician/components/technician-profile-forms.tsx`

**Estimated scope:** XS (1 file)

---

## Task 10: Add read-only default view and "Edit Profile" mode to Admin Profile

**Description:** Update `AdminProfileForms` so Super Admins (`canEditProfileDetails === true`) see their Administrator Profile & Managed Branch details in a read-only view by default with an **`Edit Profile`** button (replacing `"Save Administrator Profile"`), while Limited Admins (`canEditProfileDetails === false`) remain strictly read-only with no **`Edit Profile`** button (respecting DB trigger `005`).

**Acceptance criteria:**
- [ ] For Super Admins on `/admin/profile`, personal and managed branch fields are read-only by default with an **`Edit Profile`** button.
- [ ] Clicking **`Edit Profile`** as a Super Admin unlocks editable fields (keeping `email` read-only) with **`Save Changes`** and **`Cancel`**.
- [ ] For Limited Admins (`canEditProfileDetails === false`), profile details stay permanently read-only with no **`Edit Profile`** button, while **`Edit Photo`** and **`Change password`** remain functional.

**Verification:**
- [ ] Typecheck succeeds: `npx tsc --noEmit`
- [ ] Lint passes: `npm run lint`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: Verify both Super Admin and Limited Admin profile states on `/admin/profile`.

**Dependencies:** Task 2, Task 7

**Files likely touched:**
- `src/features/admin/components/admin-profile-forms.tsx`

**Estimated scope:** XS (1 file)

---

## Checkpoint: Complete Verification
- [x] `npx tsc --noEmit` passes with zero errors
- [x] `npm run lint` passes with zero errors
- [x] `npm run build` succeeds cleanly
- [ ] All acceptance criteria across Tasks 1–10 verified end-to-end (manual UI + Supabase migration `006_appliance_icon.sql`)

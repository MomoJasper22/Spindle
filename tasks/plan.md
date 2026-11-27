# Implementation Plan: Customer Home CTA, Appliance Icons, Log Out Copy & Unified Profile UX

## Overview

This plan covers nine cohesive UX and feature updates across Spindle's Customer, Technician, Admin, and Onboarding surfaces:
1. Streamlining the `/customer/home` empty-appliance CTA by removing the oversized header `+ Add Your First Appliance` button and converting the passbook card's `Add Appliance ->` CTA to `+ Add Your First Appliance`.
2. Extracting the 12 custom SVG illustrations from the landing page's **"Appliances We Care For"** marquee into a shared icon registry so customers (and admins) can pick and display an appliance icon when registering or editing an appliance.
3. Renaming every `"Sign Out"` button label to `"Log Out"` across Onboarding and all three portal profile views.
4. Reworking profile media and profile editing across the profile pages: centering and enlarging the avatar, consolidating `"Change Photo"` / `"Adjust Position"` / `"Remove"` into a single **`Edit Photo`** button & modal (housing the 2 MB PNG/JPG/WebP guidance), and switching all profile pages to a read-only-by-default view gated behind **`Edit Profile`** while preserving role- and permission-based field locks.

## Architecture Decisions

- **Shared Appliance SVG Registry (`src/components/shared/appliance-icons.tsx`):** Rather than duplicating SVG markup from `src/features/landing/components/appliance-repair-section.tsx`, extract the 12 SVG illustrations (`split-aircon`, `window-aircon`, `refrigerator`, `washing-machine`, `cooking-range`, `commercial-chiller`, `microwave-oven`, `water-dispenser`, `television`, `clothes-dryer`, `electric-fan`, `water-heater`) into a single shared module. Provide a category-to-icon default mapping (`getDefaultApplianceIcon(category)`) for existing records and sensible auto-selection when choosing an appliance category.
- **Additive Appliance Icon Migration (`supabase/migrations/006_appliance_icon.sql`):** Add a nullable `icon VARCHAR(50) NULL` column (with a `CHECK` constraint matching the 12 valid icon keys) on `public.customer_appliances`, and append `a.icon AS appliance_icon` to the **end** of `v_repair_details` (preserving existing column ordering required by PostgreSQL `CREATE OR REPLACE VIEW`). In server actions, detect `42703` / `PGRST204` if migration `006` has not yet been applied in Supabase so the app degrades gracefully rather than breaking appliance saves.
- **Unified `ProfilePhotoField` (`src/components/shared/profile-photo-field.tsx`):** Center and enlarge the avatar (`UserAvatar` new `'2xl'` size, e.g., `h-24 w-24 sm:h-28 sm:w-28`), replace the three inline photo buttons with one **`Edit Photo`** button, and move `"PNG, JPG, or WebP up to 2 MB. You can adjust how your photo is framed anytime."` inside the unified **Edit Photo** dialog (handling upload/replace, interactive drag-pan & zoom framing, and removal in one place). Support a `layout="centered" | "compact"` prop if Onboarding Step 3 prefers compact alignment, defaulting to `"centered"` on profile pages.
- **Read-Only-by-Default Profile Pattern with Role/Permission Locks:**
  - **Default state (`isEditing = false`):** Render profile details as structured read-only `<dl>` fields (matching the existing pattern in `TechnicianProfileForms` and Limited Admin `AdminProfileForms`), with **`Edit Profile`** replacing `"Save Changes"` / `"Save Nickname"` / `"Save Administrator Profile"`.
  - **Edit state (`isEditing = true`):** Reveal editable form inputs only for fields that the current role/tier is permitted to change (`Customer`: name, mobile, branch, 5-part PH address, while `email` stays read-only; `Technician`: `nickname` only, while all admin-managed personal/dispatch/certification/specialization fields stay visibly locked per DB trigger `005`; `Super Admin`: name, phone, branch, office address, while `email` stays read-only; `Limited Admin`: permanently read-only with no **`Edit Profile`** button per DB trigger `005`). Provide **`Save Changes`** and **`Cancel`** (which resets RHF state and exits edit mode).
  - **`Edit Photo` & `Change password` remain independently accessible** even when profile text fields are read-only or when a Limited Admin / Technician is viewing their profile.

## Task List

### Phase 1: Customer Home CTA & Copy Standardization
- [x] Task 1: Update Customer Home appliance call-to-action buttons
- [x] Task 2: Rename all "Sign Out" buttons to "Log Out"

### Checkpoint: Phase 1 Copy & Home View
- [x] Verify TypeScript (`npx tsc --noEmit`) and lint (`npm run lint`) pass cleanly after Tasks 1–2

### Phase 2: Shared Appliance Icons & Persistence
- [x] Task 3: Extract landing page appliance SVG illustrations into a shared icon registry
- [x] Task 4: Add database migration, TypeScript types, and customer appliance schema/actions for `icon`
- [x] Task 5: Add appliance icon picker and display to Customer Appliances UI
- [x] Task 6: Add appliance icon support to Admin Appliances Registry

### Checkpoint: Phase 2 Appliance Icons End-to-End
- [x] Verify `npx tsc --noEmit`, `npm run lint`, and `npm run build` pass
- [ ] Verify Landing marquee icons match Customer Appliances picker and cards

### Phase 3: Unified Profile Photo Experience
- [x] Task 7: Enlarge and center profile avatar with unified "Edit Photo" dialog

### Phase 4: Read-Only-by-Default Profile Pages ("Edit Profile")
- [x] Task 8: Add read-only default view and "Edit Profile" mode to Customer Profile
- [x] Task 9: Add read-only default view and "Edit Profile" mode to Technician Profile
- [x] Task 10: Add read-only default view and "Edit Profile" mode to Admin Profile

### Checkpoint: Complete Verification
- [x] `npx tsc --noEmit` passes
- [x] `npm run lint` passes
- [x] `npm run build` passes
- [ ] Manual end-to-end check across Customer, Technician, Admin (Super & Limited), and Onboarding flows

## Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Supabase migration `006_appliance_icon.sql` not yet executed in remote SQL Editor (`supabase` CLI is not installed locally) | High | Provide clean additive migration `006_appliance_icon.sql`, append view columns strictly at the end of `v_repair_details`, and add defensive column-missing fallback in actions + UI category fallback via `getDefaultApplianceIcon()`. |
| Technicians or Limited Admins hitting Postgres trigger `005` (`enforce_technician_user_field_locks`) | High | Enforce identical field locks in UI (`Technician` only unlocks `nickname`; `Limited Admin` hides `Edit Profile` completely) and preserve read-only email across Customer and Super Admin forms. |
| Onboarding Step 3 (`onboarding-form.tsx`) shares `ProfilePhotoField` | Med | Keep `ProfilePhotoField` backward-compatible with `OnboardingForm` (or pass `layout="compact"` if preferred) and test onboarding rendering after edits. |
| Large SVG marquee refactor introducing visual regressions on landing page | Med | Preserve exact SVG viewBox, paths, and `isActive` color palette in `appliance-icons.tsx`, and verify landing section visually and via build. |
| Next.js 16 `cacheComponents: true` stale profile/appliance tags after mutations | Med | Keep existing `updateTag(...)` and `revalidatePath(...)` invalidations in `customer-actions.ts`, `admin-actions.ts`, `technician-actions.ts`, and `avatar-actions.ts` intact. |

## Open Questions

1. **Applying `006_appliance_icon.sql`:** Since the Supabase CLI is not installed in this environment, will you execute the new `supabase/migrations/006_appliance_icon.sql` script in your Supabase Dashboard SQL Editor once generated?
2. **Centered Avatar + `"Edit Photo"` Scope:** Should the centered bigger avatar and single **`Edit Photo`** button apply to **all three profile pages** (Customer, Technician, Admin) for consistency, or only the Customer profile page? (The plan currently applies it across all profile pages via `ProfilePhotoField`, with an optional `compact` mode if Onboarding Step 3 should remain compact.)
3. **Read-Only Default Rendering Style:** In default view mode (before clicking **`Edit Profile`**), do you prefer a clean read-only text summary grid (`<dl>`, matching the current Technician/Limited Admin read-only layout) or disabled form input boxes? (Plan defaults to the clean `<dl>` summary grid.)

# Spindle — Landing, Auth, Sidebar & Profile Refinement Task List

## Phase 1: Public Landing & Auth Showcase

### Task 1: Auth split-screen background picture & concise customer marketing copy

**Description:** Add an editorial appliance-service background image for the left panel of `(auth)/layout.tsx` with a Midnight Slate contrast scrim, remove the `Service Lifecycle` 4-step card, and replace it with concise customer-focused marketing highlights without information overload.

**Acceptance criteria:**
- [x] Left panel of `/login` and `/signup` renders a background photograph (`public/images/auth-showcase.jpg`) with a dark gradient scrim ensuring readable text contrast
- [x] `Service Lifecycle` card is removed
- [x] Concise customer marketing headline + 3 short value points appear without clutter
- [x] Responsive layout classes present across mobile, tablet, and desktop

**Verification:**
- [x] Lint & build succeed: `npm run lint` and `npm run build`
- [ ] Manual check: inspect `/login` and `/signup` text legibility over the background image in browser

**Dependencies:** None

**Files likely touched:**
- `public/images/auth-showcase.jpg` (new)
- `src/app/(auth)/layout.tsx`

**Estimated scope:** Small (2 files)

---

### Task 2: Separate landing Repair & Brands sections, header links, and dedicated brand SVGs

**Description:** Update `appliance-showcase.tsx` so every one of the 12 supported brands has its own dedicated inline SVG logo mark instead of a uniform placeholder icon. Refactor `src/app/(public)/page.tsx` so **Appliances We Repair** (`#repair`) and **Brands We Work With** (`#brands`) are separate, dedicated sections on the page, and add `Repair` and `Brands` navigation links in the sticky header.

**Acceptance criteria:**
- [x] Each of the 12 brands (`Carrier`, `Condura`, `Panasonic`, `LG`, `Samsung`, `Daikin`, `Koppel`, `Whirlpool`, `Fujidenzo`, `Sharp`, `Midea`, `Haier`) has a distinct dedicated `<svg>` logo
- [x] Landing page separates Appliances We Repair (`#repair`) and Brands We Work With (`#brands`) into distinct page sections outside the hero CTA block
- [x] Sticky header navigation includes `Repair` (`#repair`) and `Brands` (`#brands`) alongside existing section links

**Verification:**
- [x] Lint & build succeed: `npm run lint` and `npm run build`
- [ ] Manual check: verify header anchor scrolling and SVG rendering visually in browser

**Dependencies:** None

**Files likely touched:**
- `src/features/landing/components/appliance-showcase.tsx`
- `src/app/(public)/page.tsx`

**Estimated scope:** Medium (2 files)

---

## Checkpoint: After Tasks 1–2
- [x] `npm run lint` and `npm run build` pass clean
- [ ] Landing page and `/login` + `/signup` visuals verified in browser

---

## Phase 2: Profile Photos, Sidebars & Settings Polish

### Task 3: Profile photo schema, Storage migration, upload action & shared component

**Description:** Create `supabase/migrations/004_user_avatar_and_storage.sql` to add `avatar_url TEXT` to `public.users` and configure the `avatars` Storage bucket with user-scoped RLS policies. Update `UserRow` type in `src/types/database.ts`, add shared upload/remove server actions (`src/features/auth/actions/avatar-actions.ts`), and create reusable `ProfilePhotoField` UI (`src/components/shared/profile-photo-field.tsx`).

**Acceptance criteria:**
- [x] `004_user_avatar_and_storage.sql` adds `avatar_url` column and `avatars` Storage bucket + policies cleanly
- [x] `UserRow` includes `avatar_url?: string | null`
- [x] Server action validates file type (JPEG/PNG/WebP) and size (<= 2 MB), uploads to Supabase Storage, and updates `public.users.avatar_url`
- [x] Reusable `ProfilePhotoField` supports preview, upload, and photo removal with accessible labels

**Verification:**
- [x] TypeScript & ESLint pass: `npm run lint` and `npm run build`
- [ ] Remote Supabase SQL migration `004_user_avatar_and_storage.sql` executed in Supabase SQL Editor

**Dependencies:** None

**Files likely touched:**
- `supabase/migrations/004_user_avatar_and_storage.sql`
- `src/types/database.ts`
- `src/features/auth/actions/avatar-actions.ts`
- `src/components/shared/profile-photo-field.tsx`

**Estimated scope:** Medium (4 files)

---

### Task 4: Overhaul sidebars in PortalShell and role layouts

**Description:** Update `PortalShell` (`src/components/shared/portal-shell.tsx`) and the 3 role layouts (`customer`, `technician`, `admin`) to: remove the Sign Out button from all sidebars (desktop & mobile drawer), hide the `"Customer Portal"` role badge on the customer sidebar, and render a circular profile photo or fallback `User` icon beside the user's name in every role's sidebar.

**Acceptance criteria:**
- [x] No Sign Out button exists inside desktop or mobile sidebars for Customer, Technician, or Admin
- [x] `"Customer Portal"` label/badge is removed from the Customer sidebar and mobile drawer
- [x] User profile icon (or uploaded `avatar_url` thumbnail) appears beside `userName` in Customer, Technician, and Admin sidebars

**Verification:**
- [x] Lint & build succeed: `npm run lint` and `npm run build`
- [ ] Manual check: verify sidebar footer and header across all 3 portals in browser

**Dependencies:** Task 3

**Files likely touched:**
- `src/components/shared/portal-shell.tsx`
- `src/app/customer/layout.tsx`
- `src/app/technician/layout.tsx`
- `src/app/admin/layout.tsx`

**Estimated scope:** Medium (4 files)

---

### Task 5: Refine Customer, Technician & Admin Profile & Settings pages

**Description:** Update profile/settings pages across all three roles:
- Make `ChangePasswordCard` subtle (compact collapsible disclosure instead of an always-open prominent card) for Customer, Technician, and Admin.
- Customer (`/customer/profile`): change top-right tag from `Customer` to `User`, add `ProfilePhotoField`, add a clean `Sign Out` button in Settings, and make `Deactivate Account` subtle (quiet muted trigger + `ConfirmationDialog`).
- Technician (`/technician/profile`): add `ProfilePhotoField` and keep subtle `ChangePasswordCard` + Sign Out.
- Admin (`/admin/profile`): keep subtle `ChangePasswordCard` + Sign Out.

**Acceptance criteria:**
- [x] Customer settings top-right badge displays `{user_id} · User` instead of `Customer`
- [x] Customer and Technician settings pages include `ProfilePhotoField` for uploading/removing a profile photo
- [x] Customer settings page includes a `Sign Out` button (`signOutAction`)
- [x] `Change Password` (Customer, Tech, Admin) and `Deactivate Account` (Customer) are visually subtle and understated until interacted with

**Verification:**
- [x] `npm run lint` passes with 0 errors and 0 warnings
- [x] `npm run build` passes cleanly across all routes
- [ ] Manual check: test photo upload, subtle toggles, and sign out in live browser

**Dependencies:** Tasks 3, 4

**Files likely touched:**
- `src/features/auth/components/change-password-card.tsx`
- `src/app/customer/profile/page.tsx`
- `src/features/customer/components/customer-profile-forms.tsx`
- `src/features/technician/components/technician-profile-forms.tsx`
- `src/features/admin/components/admin-profile-forms.tsx`

**Estimated scope:** Medium (5 files)

---

## Checkpoint: Complete
- [x] `npm run lint` and `npm run build` pass with zero TypeScript or ESLint errors
- [ ] Live browser & Supabase migration `004` verification completed

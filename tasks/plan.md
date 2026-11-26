# Implementation Plan: Landing Sections, Auth Showcase, Sidebar & Profile Refinements

## Overview

Refine the public landing page, authentication split-screen showcase, role sidebars, and profile/settings pages across Customer, Technician, and Admin portals:
1. **Sidebars & Navigation**: Remove the Sign Out button from all sidebars (`PortalShell`), remove the `"Customer Portal"` badge on the customer sidebar, and display a user profile icon/avatar beside the user's name across Customer, Technician, and Admin sidebars.
2. **Landing Page**: Separate **Appliances We Repair** (`#repair`) and **Brands We Work With** (`#brands`) into dedicated page sections, add `Repair` and `Brands` links to the sticky header navigation, and give each of the 12 supported brands a dedicated SVG logo.
3. **Authentication Pages (`/login`, `/signup`)**: Add a photographic background on the left Midnight Slate panel with high-contrast scrim overlay, remove the `Service Lifecycle` card, and replace it with concise, customer-focused marketing highlights (avoiding clutter).
4. **Profile & Settings Pages**:
   - Customer (`/customer/profile`): Rename top-right role tag from `Customer` to `User`, add profile photo upload/management, add a `Sign Out` button, and make `Change Password` and `Deactivate Account` visually subtle.
   - Technician (`/technician/profile`): Add profile photo upload/management and make `Change Password` visually subtle.
   - Admin (`/admin/profile`): Make `Change Password` visually subtle.

## Architecture Decisions

- **Profile Photo Persistence (`avatar_url` + Supabase Storage)**:
  - Add additive migration `supabase/migrations/004_user_avatar_and_storage.sql` adding `avatar_url TEXT NULL` to `public.users` and provisioning a public `avatars` Supabase Storage bucket with RLS policies restricting uploads/deletes to the authenticated user's folder (`auth.uid()`).
  - Build one shared `ProfilePhotoField` component (`src/components/shared/profile-photo-field.tsx`) and shared server action (`src/features/auth/actions/avatar-actions.ts`) reused by both Customer and Technician profile pages (avoiding duplicate upload logic).
  - Update `PortalShell` (`src/components/shared/portal-shell.tsx`) to accept optional `avatarUrl` and render either the user's uploaded photo or a clean circular `User` icon beside `userName`.
- **Subtle Security & Deactivation Controls**:
  - Convert `ChangePasswordCard` (`src/features/auth/components/change-password-card.tsx`) into a compact, collapsible disclosure (`subtle` muted outline trigger / row that expands the password form inline when clicked) rather than a large always-open card, preserving accessibility (`aria-expanded`, inline Zod validation) while keeping primary profile fields in focus.
  - Convert Customer `Deactivate Account` from a heavy red-bordered card into a subtle muted footer action link/button that opens the existing `ConfirmationDialog`.
- **Auth Left Panel Background Image**:
  - Generate/save a clean editorial home-appliance care image to `public/images/auth-showcase.png` and render it behind a dark Midnight Slate gradient overlay (`bg-slate-950/80` scrim) so white typography maintains >= 7:1 contrast.
- **Dedicated Brand SVG Logos**:
  - Author 12 distinct, crisp geometric brand SVG marks/wordmarks in `src/features/landing/components/appliance-showcase.tsx` (replacing the uniform placeholder icon) so each brand card renders a recognizable bespoke SVG mark alongside the brand name.

## Dependency Graph

```text
Task 1: Auth Left-Panel Visual & Customer Marketing Copy
  ├── Generate/add public/images/auth-showcase.png
  └── Update src/app/(auth)/layout.tsx (overlay scrim + concise marketing copy)

Task 2: Landing Page Sections, Header Links & Dedicated Brand SVGs
  ├── Upgrade src/features/landing/components/appliance-showcase.tsx (12 dedicated brand SVGs)
  └── Update src/app/(public)/page.tsx (separate #repair & #brands sections + header links)

Task 3: Profile Photo Schema, Storage & Uploader
  ├── Add supabase/migrations/004_user_avatar_and_storage.sql
  ├── Update src/types/database.ts (avatar_url on UserRow)
  ├── Add src/features/auth/actions/avatar-actions.ts
  └── Add src/components/shared/profile-photo-field.tsx
        │
        ├── Task 4: Sidebar Overhaul (PortalShell & Layouts)
        │     ├── Remove Sign Out button from PortalShell
        │     ├── Hide "Customer Portal" label on customer sidebar
        │     └── Add profile avatar/icon beside userName in Customer, Tech, Admin sidebars
        │
        └── Task 5: Settings & Profile Refinements (Customer, Tech, Admin)
              ├── Make ChangePasswordCard subtle (collapsible disclosure)
              ├── Customer settings: "User" badge, photo uploader, subtle deactivate, Sign Out button
              ├── Technician settings: photo uploader, subtle ChangePassword
              └── Admin settings: subtle ChangePassword
```

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| `004_user_avatar_and_storage.sql` not yet executed on remote Supabase DB | Medium | Ensure `getCurrentUserProfile()` selects `*` cleanly and gracefully handles `avatar_url?: string \| null`; clearly flag `004` to run in Supabase SQL Editor alongside `001`–`003`. |
| Background image contrast failure on `/login` & `/signup` | High | Layer a `bg-gradient-to-br from-slate-950/90 via-slate-950/80 to-slate-900/75` scrim over the background image so text always sits on dark slate. |
| Header nav crowding on Landing Page at `768px` tablet width | Low | Keep header links concise (`Repair`, `Brands`, `Services`, `Service Areas`) with balanced spacing (`gap-5 lg:gap-7`). |
| Copyright / trademark concerns with third-party brand logos | Medium | Author clean, lightweight stylized geometric SVG monogram/emblem marks for each brand rather than scraping external raster files. |

## Open Questions

1. **Auth Background Photo**: Should I generate a custom editorial appliance-care background image (`public/images/auth-showcase.png`) using the `image-generator` tool, or do you have a specific photo you want placed in `public/images/`? *(Recommended: generate a clean bespoke editorial photo via `image-generator`.)*
2. **Profile Photo Storage**: Confirm you're okay adding migration `004_user_avatar_and_storage.sql` (adding `avatar_url` column + `avatars` Storage bucket in Supabase) to persist uploaded photos cleanly across sessions? *(Alternative if you want zero extra SQL setup: store a compressed client-resized data URL directly in Supabase Auth `user_metadata.avatar_url`—though `avatar_url` + Storage is cleaner for production.)*

## Task List

Tracked in [todo.md](file:///d:/Documents/Spindle/tasks/todo.md).

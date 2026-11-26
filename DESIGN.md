---
name: Spindle — Tactile Service Passbook
description: Warm cardstock passbooks, ink-navy staff chrome, and trusted deep teal actions for Philippine appliance care.
colors:
  primary: "#0F766E"
  primary-hover: "#0B5E58"
  primary-tint: "#E6F4F1"
  alabaster-ground: "#F8F7F4"
  paper-surface: "#FFFFFF"
  muted-paper: "#F1EFE9"
  ink-navy: "#141B29"
  slate-muted: "#475569"
  warm-border: "#E6E1D6"
  input-border: "#D1C9BA"
  amber-ink: "#B45309"
  destructive-rose: "#BE123C"
  selection-teal: "#CCFBF1"
typography:
  display:
    fontFamily: "Bricolage Grotesque, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.875rem, 4vw, 3.35rem)"
    fontWeight: 700
    lineHeight: 1.06
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Bricolage Grotesque, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.25rem, 2.5vw, 1.875rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Bricolage Grotesque, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  label:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
  caption:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "0.02em"
  micro:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "10px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "normal"
rounded:
  sm: "0.5rem"
  md: "0.625rem"
  lg: "0.75rem"
  xl: "1rem"
  2xl: "1rem"
  full: "9999px"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.paper-surface}"
    rounded: "{rounded.sm}"
    height: "40px"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-outline:
    backgroundColor: "{colors.paper-surface}"
    textColor: "{colors.ink-navy}"
    rounded: "{rounded.sm}"
    height: "40px"
    padding: "8px 16px"
  card-default:
    backgroundColor: "{colors.paper-surface}"
    textColor: "{colors.ink-navy}"
    rounded: "{rounded.2xl}"
    padding: "20px"
---

# Spindle Design System — Tactile Service Passbook

## Overview

**Tactile Service Passbook** models Spindle on physical Philippine service booklets and neighborhood repair receipts rather than cold dark-card SaaS dashboards. Every customer-facing page stays uncluttered, jargon-free, and comfortable to scan on a phone, while Technician and Admin workspaces carry dense operational controls in calm, segmented pages.

## Colors

| Role | Hex | CSS Variable | Usage |
| --- | --- | --- | --- |
| Primary | `#0F766E` | `--primary` | Primary CTAs (`Schedule a Visit`, `Book a Home Visit`), active links, caret accent |
| Primary Hover | `#0B5E58` | `--primary-hover` | Hover fill for primary buttons |
| Primary Tint | `#E6F4F1` | `--primary-tint` | Active nav pills, icon wells, subtle focus washes |
| Alabaster Ground | `#F8F7F4` | `--background` | Page canvas across public, customer, technician, and admin shells |
| Paper Surface | `#FFFFFF` | `--card` | Elevated cardstock panels, modals, passbook slips, header chrome |
| Muted Paper | `#F1EFE9` | `--muted` | Subtle recessed containers, filter pills, skeleton placeholders |
| Ink Navy | `#141B29` | `--foreground`, `--sidebar` | Headings, body ink, Service Passbook header strip, staff desktop sidebar |
| Warm Border | `#E6E1D6` | `--border` | Card hairlines, dashed receipt dividers, bottom-nav borders |
| Input Border | `#D1C9BA` | `--input` | Form controls (`Input`, `Select`, `Textarea`) |
| Muted Ink | `#475569` | `--muted-foreground` | Secondary copy and captions (>= 4.5:1 contrast on `#F8F7F4` and `#FFFFFF`) |
| Amber Ink | `#B45309` | `--amber-ink` | Step numbers, pending verification status badges |
| Destructive Rose | `#BE123C` | `--destructive` | Validation errors, cancellation confirmations |

## Typography

- **Display & Headings (`--font-heading`):** `Bricolage Grotesque` (weights `500`, `600`, `700`), `letter-spacing: -0.02em` on `h1–h3`, `text-wrap: balance`.
- **Body & Controls (`--font-sans`):** `Manrope` (weights `400`, `500`, `600`, `700`), `line-height: 1.55`, `text-wrap: pretty` on `p, li`.
- **Tabular Data & Staff Reference IDs (`--font-mono`):** `JetBrains Mono` (`400`, `500`, `600`) paired with `.tabular-nums` for PHP amounts, staff reference codes (`RPR-...`, `PAY-...`), and receipt confirmation numbers.

## Layout

- **Customer Surface (Sidebar-Free):**
  - Desktop (`>= md`): Sticky white top header (`h-16`) with 5 top links (`Home`, `Appliances`, `Bookings`, `Payments`, `Profile`) and `UserAvatar` indicator. Never renders a sidebar.
  - Mobile (`< md`): Compact top header (`h-14`) + fixed 5-tab bottom navigation bar (`pb-safe`) with >= `44×44px` hit targets.
- **Technician & Admin Portals (`PortalShell`):**
  - Desktop (`>= md`): Fixed `16rem` `#141B29` sidebar with role navigation and a **clickable bottom-left user profile footer** (`<Link href="/${role}/profile">`) showing `UserAvatar`, full name, email, and branch.
  - Mobile (`< md`): Top bar + slide-in navigation drawer (with clickable bottom profile footer) + fixed mobile bottom bar (`More` drawer overflow on Admin).
- **Responsive Data Display:** Wide multi-column tables (`hidden md:block`) are paired with stacked card lists (`md:hidden`) on mobile (`390px` safe, zero horizontal overflow).

## Elevation & Depth

- **Standard Card:** `1px` `#E6E1D6` border + soft bottom elevation (`shadow-[0_8px_24px_-12px_rgba(20,27,41,0.08)]`).
- **Signature Passbook Card:** `2px` `#141B29` border, `#141B29` top header strip, dashed dividers between rows (`divide-dashed`), and soft blurred elevation (`shadow-[0_18px_36px_-14px_rgba(20,27,41,0.18),0_4px_12px_rgba(20,27,41,0.06)]`).
- **Mobile Modals & Drawers:** Bottom-anchored sheets on phones (`rounded-t-2xl pb-safe`), centered dialogs on desktop (`sm:rounded-2xl`).

## Shapes

- Outer cards and modals use `rounded-2xl` (`1rem`); buttons and inputs use `rounded-lg` (`0.75rem`) / `rounded-xl`; status pills use `rounded-full`.
- `UserAvatar` crops circularly (`rounded-full overflow-hidden`) while applying non-destructive CSS transforms (`scale(zoom)`, `translate(x%, y%)`) from `{ x, y, zoom }`.

## Components

- **`StatusBadge` (`src/components/shared/status-badge.tsx`):** Supports `audience="customer"` (maps `pending` -> `Requested`, `assigned` -> `Technician Assigned`, `awaiting_payment` -> `Ready for Payment`, `completed` -> `Done`, `pending_verification` -> `Checking Details`) and `audience="staff"`.
- **`ProfilePhotoField` (`src/components/shared/profile-photo-field.tsx`):** Upload image to Supabase `avatars` bucket and open the interactive **Adjust Position** editor (pointer & touch drag pan + `1.0x–2.5x` zoom + live circular preview).
- **`ApplianceRepairSection` & `BookingDetailView`:** Progressive disclosure via detail `Sheet` and dedicated `[ticketId]` route with a 4-step passbook tracker.

## Do's and Don'ts

- **Do** write all Landing, Auth, Onboarding, and Customer copy in plain everyday language (Philippine Peso quotes, 2-hour arrival windows, GCash/Maya/QR Ph).
- **Do** keep `44px` minimum touch targets on mobile (`@media (pointer: coarse)` rule in `src/app/globals.css`) and verify zero horizontal scroll on `390px` viewports.
- **Don't** add a sidebar to Customer pages or expose internal IDs/jargon (`diagnostic_notes`, `ticket_id`, `verification ledger`) as primary customer labels.
- **Don't** render `"Track Existing Ticket"` on the landing page or use hard zero-blur offset box shadows (`4px 4px 0`).

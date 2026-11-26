# Implementation Plan: Spindle Branding, Browser Tab Icon & Customer-Focused Landing Page

## Overview

Address six targeted UX and branding refinements to make Spindle's public landing page, browser tab identity, and authentication shell cleanly customer-facing:
1. Replace the starter `create-next-app` favicon with Spindle's geometric cobalt brand mark so the logo appears in browser tabs.
2. Remove the `"Field Service CRM"` tagline and `"CRM"` page title suffix.
3. Remove the pill eyebrow badges from both the landing page hero and the `/login` / `/signup` split-screen layout.
4. Add custom SVG icons for repaired appliance categories and a placeholder logo strip for serviced appliance brands directly below the hero CTA buttons on `/`.
5. Rewrite the landing page copy to speak directly to homeowners and business customers, and replace the internal `"Spindle Dispatch Workflow"` preview card with a customer-centered repair experience preview.

## Diagnosis (Observed in Codebase)

- **Missing browser tab logo**: `src/app/favicon.ico` is currently the default 15,086-byte `create-next-app` starter icon, and no `src/app/icon.svg` exists.
- **`"Field Service CRM"` occurrences**: Found in `src/components/shared/spindle-logo.tsx` (line 57, rendered whenever `showTagline` is true across `(auth)/layout.tsx`, `onboarding/page.tsx`, and `portal-shell.tsx`) and `"Field Service Operations CRM"` in `src/app/layout.tsx` (line 28 metadata title).
- **Eyebrow badges**: Located at `src/app/(public)/page.tsx` (lines 109–112) and `src/app/(auth)/layout.tsx` (lines 25–28).
- **Landing page focus**: `src/app/(public)/page.tsx` currently features a `"Spindle Dispatch Workflow"` card (lines 136–173) and dispatch/operations-centric terminology (`"Branch coordinator"`, `"Regional dispatch teams"`, `"Customer & Staff Portal"`).

## Architecture Decisions

- **Next.js 16 App Icon Convention**: Remove the stale `src/app/favicon.ico` and add `src/app/icon.svg` (matching the `#1D4ED8` rounded square + white geometric spindle mark) plus `src/app/icon.tsx` (32x32 PNG via `ImageResponse`) or SVG icon alone—per Next.js 16 `app-icons.md`, `src/app/icon.svg` sets `sizes="any"` cleanly across modern browsers. Adding both `icon.svg` and replacing `favicon.ico` guarantees broad browser/tab compatibility.
- **Custom Appliance SVGs**: Create dedicated, crisp 24x24 geometric SVG icons (using `currentColor`, `aria-hidden="true"`) in `src/features/landing/components/appliance-showcase.tsx` rather than generic laptop/wrench fallbacks or emojis, covering Split-Type Aircon, Window-Type Aircon, Refrigerator, Washing Machine, Gas/Induction Range, Commercial Chiller, Microwave Oven, and Water Dispenser.
- **Brand Logo Placeholders**: Render clean grayscale/muted placeholder tiles for the 12 supported brands (`APPLIANCE_BRAND_SUGGESTIONS`) with a uniform placeholder geometric monogram mark + brand name so real partner SVGs can drop in easily later.
- **Zero-regression across portals**: Removing `"Field Service CRM"` from `SpindleLogo` keeps portal sidebars clean (`Appliance Care` or clean wordmark without subtitle) while role badges remain intact in `PortalShell`.

## Dependency Graph

```text
Task 1: Browser Tab Icon & Brand Copy Cleanup
  ├── Remove starter src/app/favicon.ico, add src/app/icon.svg (+ icon.tsx)
  └── Remove "Field Service CRM" from SpindleLogo & metadata title
        │
Task 2: Remove Eyebrow Badges (Landing & Auth)
  ├── Remove hero eyebrow badge in src/app/(public)/page.tsx
  └── Remove network eyebrow badge in src/app/(auth)/layout.tsx
        │
Task 3: Appliance SVG Icons & Brand Logo Placeholders Component
  └── Create src/features/landing/components/appliance-showcase.tsx
        │
Task 4: Customer-Focused Landing Page Redesign
  ├── Replace "Spindle Dispatch Workflow" card with Customer Booking & Care preview
  ├── Embed Appliance & Brand showcase directly beneath hero CTA buttons
  └── Rewrite all landing copy & footer links for customers
```

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Next.js proxy intercepting `/icon.svg` or `/icon` | Medium | Ensure `src/proxy.ts` matcher excludes `icon.svg` / `favicon.ico` / static assets (already skips `*.svg`; exclude `icon` explicitly if `icon.tsx` is added) |
| Hero vertical height growing too tall with appliance icons + brand placeholders | Low | Use compact pill/tile grid below the CTA row and keep brand placeholders in a clean compact strip immediately beneath |
| `cacheComponents: true` build constraints | Low | Keep all landing components pure Server/static JSX with no `new Date()` or dynamic request APIs |

## Task List

Tasks are tracked in [todo.md](file:///d:/Documents/Spindle/tasks/todo.md).

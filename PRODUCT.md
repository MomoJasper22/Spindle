# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Homeowners & small business owners (Customers):** People across the Philippines whose aircon, refrigerator, washing machine, cooking range, microwave, water dispenser, or commercial chiller needs cleaning, check-up, installation, or repair. They book service visits from desktop or mobile phones, track visit status and costs in Philippine Pesos (PHP), and pay via cash, GCash, Maya, QR Ph, bank transfer, or card. They need plain, everyday language without technical or internal system jargon.
- **Field Technicians:** Certified appliance repair specialists assigned to branches who review assigned jobs, update visit status and findings, adjust estimated/final PHP costs, manage their daily time-slot agenda, and log on-site payments.
- **Operations Administrators:** Branch and dispatch managers overseeing users, technician schedules and daily capacity, appliance verification, repair assignment (with double-booking locks), and payment verification/CSV export.

## Product Purpose

Spindle is a Philippine appliance repair and home-service scheduling platform that connects appliance owners with certified local technicians across regional hubs, keeping appointment windows, upfront PHP estimates, repair progress, and payment records clear and trustworthy from booking to completion.

## Positioning

Unlike ad-hoc repair hotlines or opaque chat bookings, Spindle gives Philippine households and storefronts a structured 2-hour arrival window (Philippine Standard Time), upfront PHP quotes before repair work begins, verified technician identity/credentials, and atomic slot-locked dispatch across regional service hubs.

## Operating Context

- **Public & Auth Surfaces:** Unauthenticated visitors browse supported appliances and brands on the landing page, sign up as customers, sign in, and complete a short onboarding flow (Philippine phone number, nearest branch, Philippine street/barangay/city/province/4-digit ZIP).
- **Customer Portal (`/customer/*`):** Uses a clean top navigation bar on desktop (no sidebar) and a dedicated mobile-first bottom-tab/navigation UI on phones, split into focused pages (`Home`, `Appliances`, `Bookings`, `Payments`, `Profile & Settings`) so no page is overloaded with details.
- **Internal Portals (`/technician/*` & `/admin/*`):** Retain the left sidebar navigation on desktop with a clickable bottom-left user profile card routing directly to the user's profile & settings page, paired with streamlined mobile card/sheet layouts and reduced visual density.
- **Regional Scope:** Philippines (`Asia/Manila`, PHP currency `₱`, `+63` / `09XX` phone numbers, 2-hour slots from `08:00 AM` to `05:00 PM`, 6 service hubs across Metro Manila, Laguna, Cebu, and Davao).

## Capabilities and Constraints

- **Stack:** Next.js 16.4.6 App Router (`cacheComponents: true`, `partialPrefetching: true`, `src/proxy.ts`), React 19, Tailwind CSS v4, Radix UI, React Hook Form + Zod, Supabase Auth/Postgres/Storage with RLS and atomic transactional RPCs (`rpc_create_repair_with_appointment`, `rpc_assign_technician_and_confirm_slot`, `rpc_record_and_verify_payment`).
- **Scope Exclusions (Hard Constraints):** Strictly NO warranty tracking, parts inventory, or notification system tables/features. Existing database contracts and RBAC isolation must remain intact.
- **Landing Page Constraint:** Remove the "Track Existing Ticket" button from the landing page hero; keep primary conversion focused on booking a service or signing in.
- **Plain-Language Customer Copy:** Customer-facing surfaces (landing page, login/signup, onboarding, customer portal pages, and profile/settings) must avoid technical and internal jargon (e.g., no PCB/IGBT/Peltier/thermistor jargon, no "ticket", "dispatch", "atomic", or "verification ledger" phrasing).
- **Avatar Repositioning:** Users across all portals can upload, remove, and adjust the position/zoom of an already-uploaded profile picture non-destructively (persisted in Supabase auth user metadata with optional SQL migration `005`).
- **Mobile-First Dedication:** Dedicated mobile UI layouts (bottom navigation, touch-sized controls ≥44×44px, mobile card views replacing wide horizontal tables, safe-area padding) across Customer, Technician, Admin, and public views.
- **Documentation:** Maintain accurate `README.md` (for GitHub) and `AGENTS.md` (preserving the Next.js generated rules block).

## Brand Commitments

- **Name & Mark:** Spindle (`Spindle Appliance Care Inc.`) with existing geometric spindle icon (`src/app/icon.svg` and `SpindleLogo`).
- **Visual Direction:** Open to a full UI/UX visual overhaul across all surfaces while preserving clarity, trust, and daylight readability.

## Evidence on Hand

- **Local Brand Assets:** 12 appliance brand logos in `public/images/brands/` (Carrier, Condura, Daikin, Fujidenzo, Haier, Koppel, LG, Midea, Panasonic, Samsung, Sharp, Whirlpool) and editorial photo `public/images/auth-showcase.jpg`.
- **No Fabricated Proof:** Do not invent customer reviews, star ratings, testimonials, pricing tables, or SLA guarantees not present in the codebase.

## Product Principles

1. **Clarity before density:** Show only what the user needs for the current step; move secondary details to focused sub-pages or expandable detail sheets.
2. **Everyday language for customers:** Speak like a helpful local service coordinator, never like an internal CRM or repair manual.
3. **One-thumb mobile parity:** Every mobile flow uses native-feeling navigation, readable cards, and full-width touch targets rather than shrunken desktop tables.
4. **Trustworthy operational precision:** Internal staff (technicians and admins) get fast scanning, predictable state colors, and clear slot/payment safeguards.
5. **Preserve transactional integrity:** UI simplification never bypasses RLS, validation schemas, or Supabase locking RPCs.

---
version: 1
slug: "src-app-public-page-tsx"
primary_target: "src/app/(public)/page.tsx"
related_targets: ["src/app/(auth)/login/page.tsx","src/app/(auth)/signup/page.tsx","src/app/onboarding/page.tsx","src/app/customer/home/page.tsx","src/app/customer/profile/page.tsx","src/app/technician/dashboard/page.tsx","src/app/admin/dashboard/page.tsx"]
---

# Surface Brief: Spindle Web Application Overhaul

- **Mode:** Persuade (Public Landing, Auth, Onboarding) & Operate (Customer, Technician, Admin Portals)
- **Primary Targets:** `src/app/(public)/page.tsx`, `src/app/(auth)/login/page.tsx`, `src/app/(auth)/signup/page.tsx`, `src/app/onboarding/page.tsx`, `src/app/customer/*`, `src/app/technician/*`, `src/app/admin/*`
- **Audience & Job:** Philippine homeowners and small business owners booking appliance repairs in plain language across desktop and mobile; field technicians and branch administrators managing repair queues, slots, and payments.
- **Constraints:** Remove "Track Existing Ticket" button on landing page; zero technical jargon on customer-facing surfaces; no sidebar for customer home/portal; dedicated mobile UI; clickable bottom-left sidebar user card for technician/admin routing to profile; editable pan/zoom position for already-uploaded profile pictures; reduce information overload via focused sub-pages and progressive disclosure; preserve Supabase schema/RLS/RPC contracts and no warranty/inventory/notifications features.

## Direction contract

THESIS: Warm cardstock passbooks, crisp ink borders, and stamped 2-hour appointment slips replace the generic dark-card SaaS template and dense CRM tabs so Philippine home care feels calm, personal, and immediately understandable.

OWN-WORLD: Tactile Service Passbook — `#F8F7F4` warm alabaster cardstock ground, `#FFFFFF` pure paper-white cards, `#E6E1D6` warm hairline borders, `#141B29` deep ink-navy headings/staff sidebar, `#0F766E` deep trusted teal primary actions, `#D97706` / `#B45309` amber step numerals and pending badges, `#059669` / `#047857` stamped clear-estimate emerald accents, `Bricolage Grotesque` display headings, `Manrope` UI body text, dashed passbook dividers for estimates/receipts, progressive disclosure into focused sub-pages and drawers, and unmistakable focal framing on small screens.

STORY: Visitors immediately see what Spindle repairs and how a visit unfolds inside a tactile Service Passbook card in the first viewport, then book and manage visits in plain everyday language without repair-shop jargon or confusing ticket buttons.

FIRST VIEWPORT: Single-row white header (`2px` `#E6E1D6` bottom rule) with teal Spindle mark, 4 plain links (`Appliances`, `Brands`, `How It Works`, `Service Areas`), `Sign In`, and solid teal `Book a Repair` button over a warm `#F8F7F4` 2-column hero (`1fr / 1fr`) pairing `"Keep every home appliance running smoothly."`, plain copy, and a single `"Schedule a Visit"` CTA on the left with the ink-framed `Service Passbook` card (dark `#141B29` top bar, angled `"CLEAR ESTIMATE"` stamp, and 4 dashed-divider step rows) on the right, with the `"Brands & Appliances"` band peeking at the bottom edge.

FORM: Candidate 1 (`model-pick`, Tactile Service Passbook — user-selected via decision board over `model-pick.html` and `model_pick_1795676279773.jpg`), built code-first (`seed:264187bf6004e038`).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

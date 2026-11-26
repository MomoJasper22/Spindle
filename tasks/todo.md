# Spindle — Landing Page, Branding & Browser Icon Task List

## Phase 1: Brand Identity & Cleanup

### Task 1: Add Spindle browser tab icon and remove `"Field Service CRM"` copy

**Description:** Replace the starter Next.js `favicon.ico` with Spindle's geometric cobalt brand icon (`src/app/icon.svg`), verify `src/proxy.ts` does not interfere, and remove `"Field Service CRM"` from `SpindleLogo` and `"CRM"` from root metadata in `src/app/layout.tsx`.

**Acceptance criteria:**
- [x] Starter `src/app/favicon.ico` is removed and `src/app/icon.svg` renders the cobalt (`#1D4ED8`) Spindle mark cleanly
- [x] `"Field Service CRM"` no longer appears anywhere in `src/`
- [x] Root `<title>` metadata reads cleanly for customers without `"CRM"`

**Verification:**
- [x] Build succeeds: `npm run build`
- [x] Grep check: `Select-String -Pattern "Field Service CRM|\bCRM\b|Spindle Dispatch Workflow" src/` returns 0 matches
- [ ] Manual check: browser tab shows the Spindle cobalt icon and updated title

**Dependencies:** None

**Files likely touched:**
- `src/app/favicon.ico` (deleted)
- `src/app/icon.svg` (new)
- `src/components/shared/spindle-logo.tsx`
- `src/app/layout.tsx`

**Estimated scope:** Small (3–4 files)

---

### Task 2: Remove eyebrow badges from landing page and sign-in/sign-up layout

**Description:** Remove the rounded pill eyebrow badge above the hero headline on `/` and the `"Philippines Service Network"` eyebrow pill in the `(auth)` split-screen brand panel.

**Acceptance criteria:**
- [x] No eyebrow pill badge above the `<h1>` on `/`
- [x] No eyebrow pill badge next to the logo in `/login` and `/signup` left panel
- [x] Header and spacing remain balanced in layout markup

**Verification:**
- [x] Lint & build pass: `npm run lint` and `npm run build`
- [ ] Manual check: inspect `/`, `/login`, and `/signup` layouts at desktop and mobile widths

**Dependencies:** None

**Files likely touched:**
- `src/app/(public)/page.tsx`
- `src/app/(auth)/layout.tsx`

**Estimated scope:** Small (2 files)

---

## Checkpoint: After Tasks 1–2
- [x] `npm run lint` and `npm run build` pass with zero errors
- [ ] Browser tab displays Spindle icon and clean title; eyebrow badges are gone (verify visually in browser)

---

## Phase 2: Customer-Focused Landing Page & Visuals

### Task 3: Create appliance SVG icon grid and brand logo placeholder strip

**Description:** Build a dedicated landing component (`src/features/landing/components/appliance-showcase.tsx`) containing custom geometric SVG icons for the appliance types Spindle repairs (Split-Type Aircon, Window-Type Aircon, Refrigerator, Washing Machine, Cooking Range, Commercial Chiller, Microwave Oven, Water Dispenser) and a clean placeholder logo strip for supported brands (`APPLIANCE_BRAND_SUGGESTIONS`).

**Acceptance criteria:**
- [x] Each appliance category has an actual inline SVG icon (`aria-hidden="true"`) paired with a clear label (zero emojis)
- [x] Brand strip renders all supported brands from `APPLIANCE_BRAND_SUGGESTIONS` with consistent geometric placeholder logo marks
- [x] Responsive grid classes across mobile (`<768px`), tablet (`768px–1023px`), and desktop (`>=1024px`)

**Verification:**
- [x] TypeScript & ESLint pass: `npm run lint` and Next.js build typecheck
- [x] Build succeeds: `npm run build`

**Dependencies:** Task 1

**Files likely touched:**
- `src/features/landing/components/appliance-showcase.tsx`

**Estimated scope:** Small (1 file)

---

### Task 4: Refocus landing page copy and replace dispatch workflow card

**Description:** Update `src/app/(public)/page.tsx` so all copy focuses on homeowners and business customers booking appliance repairs. Place the SVG appliance category icons and supported brand placeholder strip below the `Schedule Service` / `Track Existing Ticket` CTA buttons. Replace the `"Spindle Dispatch Workflow"` card with a customer-centered service experience card (`"Your Repair Visit, Step by Step"`).

**Acceptance criteria:**
- [x] Appliance SVG icons appear directly below `Schedule Service` and `Track Existing Ticket`, followed by the brands placeholder strip
- [x] `"Spindle Dispatch Workflow"` card is removed and replaced with a customer-oriented booking & care card
- [x] All landing page headings, capability cards, service hub descriptions, and footer links speak directly to customers (no internal dispatch/CRM jargon)
- [x] Zero demo data, zero notifications, zero warranty, zero inventory, and zero academic traces

**Verification:**
- [x] Lint & build pass: `npm run lint` and `npm run build`
- [ ] Manual check: open `/` in browser at desktop and mobile sizes to confirm visual hierarchy, SVG crispness, and browser tab icon

**Dependencies:** Tasks 1, 2, 3

**Files likely touched:**
- `src/app/(public)/page.tsx`

**Estimated scope:** Small (1 file)

---

## Checkpoint: Complete
- [x] `npm run lint` and `npm run build` pass with zero TypeScript or ESLint errors
- [ ] All 6 user requests verified visually in browser on `/`, `/login`, `/signup`, and browser tab

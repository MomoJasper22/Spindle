import * as React from 'react'

interface ApplianceSvgItem {
  label: string
  description: string
  renderSvg: () => React.ReactNode
}

const APPLIANCE_SVG_ITEMS: ApplianceSvgItem[] = [
  {
    label: 'Split-Type Aircon',
    description: 'General cleaning, freon top-up, and inverter board diagnostics',
    renderSvg: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
        <rect x="2" y="4" width="20" height="9" rx="2" />
        <path d="M5 10h14" />
        <path d="M7 16c-.5 1.2-1 2.2-1 3" />
        <path d="M12 16v3.5" />
        <path d="M17 16c.5 1.2 1 2.2 1 3" />
      </svg>
    ),
  },
  {
    label: 'Window Aircon',
    description: 'Coil flushing, fan motor repair, and thermostat calibration',
    renderSvg: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
        <rect x="2.5" y="5" width="19" height="14" rx="2" />
        <path d="M15.5 5v14" />
        <path d="M5.5 9h7" />
        <path d="M5.5 12h7" />
        <path d="M5.5 15h7" />
        <circle cx="18.5" cy="9.5" r="1" />
        <circle cx="18.5" cy="14" r="1" />
      </svg>
    ),
  },
  {
    label: 'Inverter Refrigerator',
    description: 'Cooling recovery, compressor checks, and door seal repair',
    renderSvg: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
        <rect x="5" y="2.5" width="14" height="19" rx="2" />
        <path d="M5 10h14" />
        <path d="M8.5 5.5v2" />
        <path d="M8.5 13v3.5" />
      </svg>
    ),
  },
  {
    label: 'Washing Machine',
    description: 'Front-load & top-load drum, drain pump, and spin motor service',
    renderSvg: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
        <rect x="4" y="2.5" width="16" height="19" rx="2" />
        <path d="M4 7.5h16" />
        <circle cx="7.5" cy="5" r="0.75" />
        <circle cx="10.5" cy="5" r="0.75" />
        <circle cx="12" cy="14.5" r="4.25" />
        <path d="M9.5 14.5a2.5 2.5 0 0 1 5 0" />
      </svg>
    ),
  },
  {
    label: 'Gas & Induction Range',
    description: 'Burner ignition, induction coil repair, and oven heating fixes',
    renderSvg: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
        <rect x="3.5" y="4" width="17" height="16.5" rx="2" />
        <path d="M3.5 9h17" />
        <circle cx="7" cy="6.5" r="0.75" />
        <circle cx="10" cy="6.5" r="0.75" />
        <circle cx="17" cy="6.5" r="0.75" />
        <rect x="7" y="12" width="10" height="5.5" rx="1" />
      </svg>
    ),
  },
  {
    label: 'Commercial Chiller',
    description: 'Storefront beverage coolers, chest freezers, and temperature control',
    renderSvg: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
        <rect x="4.5" y="2.5" width="15" height="19" rx="2" />
        <rect x="7.5" y="5.5" width="9" height="11" rx="1" />
        <path d="M7.5 19h9" />
        <path d="M12 8.5v5" />
        <path d="M9.8 9.8l4.4 2.4" />
        <path d="M14.2 9.8l-4.4 2.4" />
      </svg>
    ),
  },
  {
    label: 'Microwave Oven',
    description: 'Magnetron testing, door interlock, and control panel repair',
    renderSvg: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
        <rect x="2.5" y="5.5" width="19" height="13" rx="2" />
        <rect x="5" y="8" width="10.5" height="8" rx="1" />
        <path d="M18 9v.01" />
        <path d="M18 12v.01" />
        <path d="M18 15v.01" />
      </svg>
    ),
  },
  {
    label: 'Water Dispenser',
    description: 'Hot/cold tank sanitization, thermostat, and leak sealing',
    renderSvg: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
        <path d="M8.5 2.5h7l1 5h-9l1-5Z" />
        <rect x="6" y="7.5" width="12" height="14" rx="1.5" />
        <path d="M9.5 12v2" />
        <path d="M14.5 12v2" />
        <path d="M8.5 16.5h7" />
      </svg>
    ),
  },
]

interface BrandLogoItem {
  name: string
  renderLogo: () => React.ReactNode
}

const BRAND_SVG_LOGOS: BrandLogoItem[] = [
  {
    name: 'Carrier',
    renderLogo: () => (
      <svg viewBox="0 0 40 24" fill="none" className="h-6 w-10 text-[#1E3A8A]" aria-hidden="true">
        <ellipse cx="20" cy="12" rx="18" ry="9.5" stroke="currentColor" strokeWidth="2" />
        <path d="M9 12c2.5-3.5 6.5-4.5 11-4.5 3.2 0 6 .8 8.5 2.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M11.5 15.2c2.2 1.1 5.2 1.6 8.5 1.6 4 0 7.5-1.1 10-3.3" stroke="#0284C7" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: 'Condura',
    renderLogo: () => (
      <svg viewBox="0 0 32 24" fill="none" className="h-6 w-8 text-[#0F172A]" aria-hidden="true">
        <path d="M16 2.5L27 6.5v6c0 5.2-4.6 8.4-11 9.8C9.6 20.9 5 17.7 5 12.5v-6L16 2.5Z" stroke="currentColor" strokeWidth="1.8" />
        <path d="M16 7v10M11.7 9.5l8.6 5M20.3 9.5l-8.6 5" stroke="#1D4ED8" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: 'Panasonic',
    renderLogo: () => (
      <svg viewBox="0 0 36 24" fill="none" className="h-6 w-9 text-[#1D4ED8]" aria-hidden="true">
        <rect x="3" y="4" width="30" height="16" rx="3" stroke="currentColor" strokeWidth="1.8" />
        <path d="M10 16V8h4.5a2.5 2.5 0 0 1 0 5H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20 15.5h7M20 12h7M20 8.5h7" stroke="#0F172A" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: 'LG',
    renderLogo: () => (
      <svg viewBox="0 0 28 24" fill="none" className="h-6 w-7 text-[#BE123C]" aria-hidden="true">
        <circle cx="14" cy="12" r="9.5" stroke="currentColor" strokeWidth="2" />
        <path d="M14 7.5v6.5h4.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="10.5" cy="9.5" r="1.1" fill="currentColor" />
      </svg>
    ),
  },
  {
    name: 'Samsung',
    renderLogo: () => (
      <svg viewBox="0 0 40 24" fill="none" className="h-6 w-10 text-[#1E40AF]" aria-hidden="true">
        <ellipse cx="20" cy="12" rx="17" ry="8.5" transform="rotate(-8 20 12)" fill="currentColor" />
        <path d="M11 13.8c0 1.2 1.2 1.8 2.8 1.8 1.5 0 2.5-.6 2.5-1.6 0-2-5.1-1-5.1-3.3 0-1 1-1.7 2.5-1.7 1.3 0 2.3.5 2.5 1.3M20 9l-2 6.5M20 9l2 6.5M25 15.5V9l3.8 6.5V9" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    name: 'Daikin',
    renderLogo: () => (
      <svg viewBox="0 0 32 24" fill="none" className="h-6 w-8 text-[#0284C7]" aria-hidden="true">
        <path d="M5 19L15.5 4.5 21 12.5 10.5 19H5Z" fill="#0284C7" fillOpacity="0.16" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M16 19l5.5-7.5L27 19H16Z" stroke="#0F172A" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    name: 'Koppel',
    renderLogo: () => (
      <svg viewBox="0 0 30 24" fill="none" className="h-6 w-8 text-[#0F172A]" aria-hidden="true">
        <polygon points="15,2.5 25,7.2 25,16.8 15,21.5 5,16.8 5,7.2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M11.5 7.5v9M18.5 7.5L12.5 12l6 4.5" stroke="#1D4ED8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    name: 'Whirlpool',
    renderLogo: () => (
      <svg viewBox="0 0 30 24" fill="none" className="h-6 w-8 text-[#B45309]" aria-hidden="true">
        <circle cx="15" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
        <path d="M9.5 10.5c1.5-2.6 4.8-3.6 7.5-2.3 2.5 1.2 3.3 4.3 1.7 6.5-1.5 2-4.6 2.3-6.5.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="15" cy="12" r="1.6" fill="currentColor" />
      </svg>
    ),
  },
  {
    name: 'Fujidenzo',
    renderLogo: () => (
      <svg viewBox="0 0 32 24" fill="none" className="h-6 w-8 text-[#1E293B]" aria-hidden="true">
        <path d="M4 18.5L13.5 5l4.5 6.5L22.5 7l5.5 11.5H4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M10.5 11.5h6" stroke="#0284C7" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: 'Sharp',
    renderLogo: () => (
      <svg viewBox="0 0 34 24" fill="none" className="h-6 w-9 text-[#DC2626]" aria-hidden="true">
        <path d="M6 17L12 7h6l-6 10H6Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M16 17l6-10h6l-6 10h-6Z" fill="currentColor" fillOpacity="0.16" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    name: 'Midea',
    renderLogo: () => (
      <svg viewBox="0 0 32 24" fill="none" className="h-6 w-8 text-[#0284C7]" aria-hidden="true">
        <path d="M5 17V9.5c0-1.4 1.8-2 2.7-.9L11.5 13l3.8-4.4c.9-1.1 2.7-.5 2.7.9V17" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M22.5 10.5c2.2 0 4 1.6 4 3.5s-1.8 3.5-4 3.5-3.5-1.5-3.5-3.5" stroke="#0D9488" strokeWidth="1.9" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: 'Haier',
    renderLogo: () => (
      <svg viewBox="0 0 32 24" fill="none" className="h-6 w-8 text-[#1D4ED8]" aria-hidden="true">
        <rect x="4" y="4.5" width="24" height="15" rx="4" stroke="currentColor" strokeWidth="1.8" />
        <path d="M10.5 8v8M16.5 8v8M10.5 12h6M21.5 11v5M21.5 8.3v.2" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      </svg>
    ),
  },
]

export function ApplianceRepairSection() {
  return (
    <section id="repair" className="border-t border-border bg-card py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-8">
        <div className="max-w-2xl space-y-2">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Appliances We Repair
          </h2>
          <p className="text-sm text-muted-foreground sm:text-base">
            Expert home and light-commercial diagnostics, preventive cleaning, and component repairs.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {APPLIANCE_SVG_ITEMS.map((item) => (
            <div
              key={item.label}
              className="flex items-start gap-3.5 rounded-xl border border-border bg-background/60 p-4 shadow-2xs"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-tint text-primary">
                {item.renderSvg()}
              </span>
              <div className="space-y-1 min-w-0">
                <h3 className="font-heading text-sm font-semibold text-foreground">
                  {item.label}
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function SupportedBrandsSection() {
  return (
    <section id="brands" className="border-t border-border bg-background py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1.5">
            <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Brands We Work With
            </h2>
            <p className="text-sm text-muted-foreground sm:text-base">
              Trusted repair expertise across leading residential and commercial appliance makers.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {BRAND_SVG_LOGOS.map((brand) => (
            <div
              key={brand.name}
              className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-4 shadow-2xs transition-colors hover:border-slate-300"
            >
              {brand.renderLogo()}
              <span className="font-heading text-xs font-semibold tracking-wide text-slate-800">
                {brand.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

import * as React from 'react'
import { APPLIANCE_BRAND_SUGGESTIONS } from '@/lib/constants'

interface ApplianceSvgItem {
  label: string
  renderSvg: () => React.ReactNode
}

const APPLIANCE_SVG_ITEMS: ApplianceSvgItem[] = [
  {
    label: 'Split-Type Aircon',
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
    label: 'Refrigerator',
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
    label: 'Cooking Range',
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

export function ApplianceRepairIcons() {
  return (
    <div className="pt-2 space-y-2.5">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Appliances We Repair
      </p>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {APPLIANCE_SVG_ITEMS.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2.5 text-foreground shadow-2xs"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-tint text-primary">
              {item.renderSvg()}
            </span>
            <span className="text-xs font-medium leading-tight">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SupportedBrandsStrip() {
  return (
    <div className="mt-10 border-t border-border pt-8 space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Brands We Work With
        </p>
        <p className="text-xs text-muted-foreground">
          Experienced across major residential &amp; commercial inverter models
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {APPLIANCE_BRAND_SUGGESTIONS.map((brand) => (
          <div
            key={brand}
            className="flex h-12 items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-card px-3 text-slate-600"
            title={`${brand} logo placeholder`}
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
              className="h-4 w-4 shrink-0 text-slate-400"
              aria-hidden="true"
            >
              <rect x="2.5" y="2.5" width="15" height="15" rx="3.5" />
              <circle cx="10" cy="10" r="2.75" />
            </svg>
            <span className="font-heading text-xs font-semibold tracking-wide text-slate-700 truncate">
              {brand}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

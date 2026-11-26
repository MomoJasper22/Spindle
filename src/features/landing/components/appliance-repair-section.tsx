'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, ChevronDown, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ApplianceCategory {
  id: string
  label: string
  shortLabel: string
  headline: string
  description: string
  services: string[]
  turnaround: string
  renderIllustration: (isActive: boolean) => React.ReactNode
}

const APPLIANCE_CATEGORIES: ApplianceCategory[] = [
  {
    id: 'split-aircon',
    label: 'Split-Type Aircon',
    shortLabel: 'Split Aircon',
    headline: 'Split-Type Aircon Cleaning & Inverter Repair',
    description:
      'Complete indoor and outdoor unit care—from deep chemical/pressure coil washing to inverter PCB fault diagnostics and refrigerant recharging.',
    services: [
      'Deep blower, evaporator & condenser coil cleaning',
      'Freon (R32 / R410A) leak detection & recharge',
      'Inverter board, thermistor & capacitor diagnostics',
      'Drain line unclogging & water-leak prevention',
    ],
    turnaround: 'Same-week on-site visit · 60–90 mins per unit',
    renderIllustration: (isActive) => (
      <svg viewBox="0 0 120 120" fill="none" className="h-24 w-24 sm:h-28 sm:w-28" aria-hidden="true">
        {/* Main indoor casing */}
        <rect x="12" y="26" width="96" height="44" rx="8" fill="#FFFFFF" />
        {/* Top intake accent */}
        <path
          d="M19 32h82a2 2 0 0 1 2 2v5H17v-5a2 2 0 0 1 2-2Z"
          fill={isActive ? '#DBEAFE' : '#CBD5E1'}
        />
        {/* Digital status window */}
        <rect x="81" y="42" width="16" height="6" rx="2" fill={isActive ? '#1E3A8A' : '#334155'} />
        <circle cx="74" cy="45" r="2" fill="#0D9488" />
        {/* Bottom vent recess & louver */}
        <rect x="18" y="55" width="84" height="10" rx="3" fill={isActive ? '#1E40AF' : '#334155'} />
        <rect x="22" y="59" width="76" height="3.5" rx="1.75" fill="#E2E8F0" />
        {/* Crisp cool airflow waves */}
        <path
          d="M32 76c-2 6-6 11-9 15M46 76c-1 7-3 13-5 18M60 76v19M74 76c1 7 3 13 5 18M88 76c2 6 6 11 9 15"
          stroke="#FFFFFF"
          strokeOpacity="0.9"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: 'window-aircon',
    label: 'Window Aircon',
    shortLabel: 'Window Aircon',
    headline: 'Window Aircon Servicing & Motor Repair',
    description:
      'Pull-out pressure washing, fan motor and compressor recovery, and thermostat calibration for manual and inverter window units.',
    services: [
      'Pull-out high-pressure coil & chassis cleaning',
      'Fan motor, bearing & capacitor replacement',
      'Digital/rotary thermostat & sensor calibration',
      'Compressor amp-draw & cooling recovery checks',
    ],
    turnaround: 'Same-week on-site visit · 60–90 mins',
    renderIllustration: (isActive) => (
      <svg viewBox="0 0 120 120" fill="none" className="h-24 w-24 sm:h-28 sm:w-28" aria-hidden="true">
        <rect x="13" y="25" width="94" height="66" rx="7" fill="#FFFFFF" />
        {/* Vent grill frame */}
        <rect x="19" y="32" width="56" height="52" rx="4" fill={isActive ? '#1E3A8A' : '#334155'} />
        <rect x="23" y="37" width="48" height="4.5" rx="2" fill="#E2E8F0" />
        <rect x="23" y="45" width="48" height="4.5" rx="2" fill="#E2E8F0" />
        <rect x="23" y="53" width="48" height="4.5" rx="2" fill="#E2E8F0" />
        <rect x="23" y="61" width="48" height="4.5" rx="2" fill="#E2E8F0" />
        <rect x="23" y="69" width="48" height="4.5" rx="2" fill="#E2E8F0" />
        {/* Right control panel */}
        <rect x="80" y="32" width="21" height="52" rx="4" fill={isActive ? '#DBEAFE' : '#CBD5E1'} />
        <circle cx="90.5" cy="46" r="5.5" fill={isActive ? '#1E40AF' : '#334155'} />
        <circle cx="90.5" cy="63" r="5.5" fill={isActive ? '#1E40AF' : '#334155'} />
        <rect x="85" y="75" width="11" height="3.5" rx="1.75" fill="#0D9488" />
        {/* Subtle base trim */}
        <path d="M26 96h68" stroke="#FFFFFF" strokeOpacity="0.6" strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'refrigerator',
    label: 'Inverter Refrigerator',
    shortLabel: 'Refrigerator',
    headline: 'Inverter & No-Frost Refrigerator Repair',
    description:
      'Diagnosing weak cooling, defrost heater failures, noisy fans, and worn door gaskets for single-door, two-door, and side-by-side fridges.',
    services: [
      'No-frost defrost heater, bimetal & timer repair',
      'Inverter compressor & PCB control diagnostics',
      'Evaporator fan & damper airflow troubleshooting',
      'Magnetic door gasket replacement & sealing',
    ],
    turnaround: 'Upfront diagnostic quote before parts replacement',
    renderIllustration: (isActive) => (
      <svg viewBox="0 0 120 120" fill="none" className="h-24 w-24 sm:h-28 sm:w-28" aria-hidden="true">
        {/* Feet */}
        <rect x="40" y="102" width="8" height="5" rx="2" fill="#E2E8F0" />
        <rect x="72" y="102" width="8" height="5" rx="2" fill="#E2E8F0" />
        {/* Freezer upper door */}
        <rect x="33" y="14" width="54" height="31" rx="6" fill="#FFFFFF" />
        {/* Lower fridge door */}
        <rect x="33" y="48" width="54" height="55" rx="6" fill="#FFFFFF" />
        {/* Recessed divider shading */}
        <rect x="33" y="45" width="54" height="3.5" fill={isActive ? '#1E3A8A' : '#334155'} />
        {/* Door handles */}
        <rect x="39" y="23" width="4.5" height="15" rx="2.25" fill={isActive ? '#1E40AF' : '#475569'} />
        <rect x="39" y="56" width="4.5" height="24" rx="2.25" fill={isActive ? '#1E40AF' : '#475569'} />
        {/* Digital panel / snowflake detail */}
        <rect x="65" y="24" width="14" height="10" rx="2.5" fill={isActive ? '#DBEAFE' : '#CBD5E1'} />
        <circle cx="72" cy="29" r="2.2" fill="#0D9488" />
      </svg>
    ),
  },
  {
    id: 'washing-machine',
    label: 'Washing Machine',
    shortLabel: 'Washing Machine',
    headline: 'Front-Load & Top-Load Washer Repair',
    description:
      'Resolving drainage faults, spin vibration, door-lock errors, and inverter drive motor issues across automatic washers and washer-dryers.',
    services: [
      'Drain pump clearing & inlet valve replacement',
      'Spin motor, belt, clutch & shock absorber repair',
      'Door lock, water-level sensor & error-code fixes',
      'Drum bearing servicing & tub deep descaling',
    ],
    turnaround: 'On-site fault test & spin verification',
    renderIllustration: (isActive) => (
      <svg viewBox="0 0 120 120" fill="none" className="h-24 w-24 sm:h-28 sm:w-28" aria-hidden="true">
        {/* Cabinet body */}
        <rect x="23" y="16" width="74" height="88" rx="7" fill="#FFFFFF" />
        {/* Control top fascia */}
        <path
          d="M23 23a7 7 0 0 1 7-7h60a7 7 0 0 1 7 7v14H23V23Z"
          fill={isActive ? '#DBEAFE' : '#CBD5E1'}
        />
        <rect x="31" y="22" width="18" height="8" rx="2" fill="#FFFFFF" />
        <circle cx="60" cy="26" r="5" fill={isActive ? '#1E40AF' : '#334155'} />
        <circle cx="77" cy="26" r="2.5" fill="#0D9488" />
        <circle cx="85" cy="26" r="2.5" fill={isActive ? '#1E40AF' : '#475569'} />
        {/* Outer drum bezel */}
        <circle cx="60" cy="69" r="24" fill={isActive ? '#DBEAFE' : '#CBD5E1'} />
        {/* Dark glass porthole */}
        <circle cx="60" cy="69" r="17" fill={isActive ? '#1E3A8A' : '#334155'} />
        {/* Water wave inside drum */}
        <path
          d="M44 70c4-4 10-4 16 0s12 4 16 0a16.5 16.5 0 0 1-32 0Z"
          fill="#38BDF8"
          fillOpacity="0.85"
        />
      </svg>
    ),
  },
  {
    id: 'cooking-range',
    label: 'Gas & Induction Range',
    shortLabel: 'Cooking Range',
    headline: 'Gas Stove, Oven & Induction Cooker Repair',
    description:
      'Safe diagnostics for auto-ignition switches, gas valve leaks, induction IGBT modules, and electric oven heating elements.',
    services: [
      'Burner ignition switch & thermocouple replacement',
      'Induction coil, IGBT & touch-panel board repair',
      'Oven heating element & thermostat calibration',
      'Gas manifold tightness & safety leak inspection',
    ],
    turnaround: 'Certified thermal & gas safety check',
    renderIllustration: (isActive) => (
      <svg viewBox="0 0 120 120" fill="none" className="h-24 w-24 sm:h-28 sm:w-28" aria-hidden="true">
        {/* Backsplash */}
        <rect x="26" y="14" width="68" height="10" rx="3" fill="#E2E8F0" />
        {/* Stove grates */}
        <rect x="32" y="21" width="16" height="4" rx="1.5" fill={isActive ? '#1E3A8A' : '#334155'} />
        <rect x="72" y="21" width="16" height="4" rx="1.5" fill={isActive ? '#1E3A8A' : '#334155'} />
        {/* Main oven range body */}
        <rect x="22" y="25" width="76" height="80" rx="6" fill="#FFFFFF" />
        {/* Control knob fascia */}
        <rect x="22" y="25" width="76" height="17" rx="4" fill={isActive ? '#DBEAFE' : '#CBD5E1'} />
        <circle cx="35" cy="33.5" r="3.8" fill={isActive ? '#1E40AF' : '#334155'} />
        <circle cx="51" cy="33.5" r="3.8" fill={isActive ? '#1E40AF' : '#334155'} />
        <circle cx="69" cy="33.5" r="3.8" fill={isActive ? '#1E40AF' : '#334155'} />
        <circle cx="85" cy="33.5" r="3.8" fill={isActive ? '#1E40AF' : '#334155'} />
        {/* Oven door window */}
        <rect x="32" y="48" width="56" height="4.5" rx="2" fill={isActive ? '#1E40AF' : '#475569'} />
        <rect x="32" y="56" width="56" height="38" rx="4" fill={isActive ? '#1E3A8A' : '#334155'} />
        {/* Oven rack glow */}
        <path d="M40 76h40" stroke="#F59E0B" strokeOpacity="0.85" strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'commercial-chiller',
    label: 'Commercial Chiller',
    shortLabel: 'Commercial Chiller',
    headline: 'Display Chillers & Chest Freezer Service',
    description:
      'Minimizing downtime for sari-sari stores, cafes, and kitchens with showcase coolers, upright chillers, and chest freezers.',
    services: [
      'Digital temperature controller & relay replacement',
      'Condenser coil descaling & fan motor servicing',
      'Refrigerant recovery, vacuuming & recharge',
      'Glass-door heater & magnetic gasket sealing',
    ],
    turnaround: 'Priority scheduling for storefront units',
    renderIllustration: (isActive) => (
      <svg viewBox="0 0 120 120" fill="none" className="h-24 w-24 sm:h-28 sm:w-28" aria-hidden="true">
        <rect x="29" y="13" width="62" height="94" rx="6" fill="#FFFFFF" />
        {/* Illuminated signboard canopy */}
        <rect x="35" y="18" width="50" height="11" rx="2.5" fill={isActive ? '#DBEAFE' : '#CBD5E1'} />
        {/* Glass showcase recess */}
        <rect x="35" y="33" width="44" height="58" rx="3.5" fill={isActive ? '#1E3A8A' : '#334155'} />
        {/* Shelves */}
        <rect x="38" y="49" width="38" height="2.8" rx="1" fill="#E2E8F0" />
        <rect x="38" y="66" width="38" height="2.8" rx="1" fill="#E2E8F0" />
        <rect x="38" y="83" width="38" height="2.8" rx="1" fill="#E2E8F0" />
        {/* Chilled bottles silhouettes */}
        <rect x="43" y="38" width="6" height="11" rx="2" fill="#38BDF8" />
        <rect x="53" y="38" width="6" height="11" rx="2" fill="#93C5FD" />
        <rect x="63" y="38" width="6" height="11" rx="2" fill="#38BDF8" />
        <rect x="43" y="55" width="7" height="11" rx="2" fill="#93C5FD" />
        <rect x="55" y="55" width="7" height="11" rx="2" fill="#38BDF8" />
        {/* Side door handle */}
        <rect x="82" y="46" width="4" height="28" rx="2" fill={isActive ? '#1E40AF' : '#475569'} />
        {/* Lower louver base */}
        <rect x="35" y="95" width="50" height="6" rx="2" fill={isActive ? '#DBEAFE' : '#CBD5E1'} />
      </svg>
    ),
  },
  {
    id: 'microwave-oven',
    label: 'Microwave Oven',
    shortLabel: 'Microwave',
    headline: 'Microwave Oven & Inverter Magnetron Repair',
    description:
      'Fixing no-heat faults, turntable motor jams, sparking waveguides, door interlock switches, and unresponsive keypads.',
    services: [
      'Magnetron, high-voltage diode & capacitor testing',
      'Mica waveguide plate & door interlock repair',
      'Membrane keypad & rotary control recovery',
      'Turntable synchronous motor & fuse replacement',
    ],
    turnaround: 'Fast diagnostic bench or on-site repair',
    renderIllustration: (isActive) => (
      <svg viewBox="0 0 120 120" fill="none" className="h-24 w-24 sm:h-28 sm:w-28" aria-hidden="true">
        <rect x="20" y="90" width="12" height="5" rx="2" fill="#E2E8F0" />
        <rect x="88" y="90" width="12" height="5" rx="2" fill="#E2E8F0" />
        {/* Chassis */}
        <rect x="13" y="31" width="94" height="59" rx="7" fill="#FFFFFF" />
        {/* Door window */}
        <rect x="20" y="39" width="56" height="43" rx="4" fill={isActive ? '#1E3A8A' : '#334155'} />
        {/* Turntable line */}
        <rect x="28" y="72" width="40" height="3.5" rx="1.75" fill="#93C5FD" fillOpacity="0.8" />
        {/* Door handle */}
        <rect x="70" y="47" width="3.5" height="27" rx="1.75" fill="#E2E8F0" />
        {/* Right control panel */}
        <rect x="81" y="39" width="19" height="43" rx="3.5" fill={isActive ? '#DBEAFE' : '#CBD5E1'} />
        <rect x="84" y="43" width="13" height="7" rx="1.5" fill={isActive ? '#1E3A8A' : '#334155'} />
        <circle cx="87.5" cy="56" r="2" fill={isActive ? '#1E40AF' : '#475569'} />
        <circle cx="93.5" cy="56" r="2" fill={isActive ? '#1E40AF' : '#475569'} />
        <circle cx="87.5" cy="63" r="2" fill={isActive ? '#1E40AF' : '#475569'} />
        <circle cx="93.5" cy="63" r="2" fill={isActive ? '#1E40AF' : '#475569'} />
        <rect x="84" y="71" width="13" height="6.5" rx="2" fill="#0D9488" />
      </svg>
    ),
  },
  {
    id: 'water-dispenser',
    label: 'Water Dispenser',
    shortLabel: 'Water Dispenser',
    headline: 'Hot & Cold Water Dispenser Servicing',
    description:
      'Sanitizing mineral buildup, restoring cold compressor or Peltier cooling, repairing hot heating tanks, and sealing valve drips.',
    services: [
      'Hot/cold tank flushing, descaling & sanitizing',
      'Heating element, bimetal & cooling Peltier repair',
      'Spigot tap valve replacement & leak sealing',
      'Compressor & cold thermostat troubleshooting',
    ],
    turnaround: 'Complete flow, temperature & leak test',
    renderIllustration: (isActive) => (
      <svg viewBox="0 0 120 120" fill="none" className="h-24 w-24 sm:h-28 sm:w-28" aria-hidden="true">
        {/* Water jug */}
        <rect x="41" y="10" width="38" height="32" rx="7" fill="#BAE6FD" />
        <path d="M41 24h38" stroke="#FFFFFF" strokeOpacity="0.65" strokeWidth="2.5" />
        <rect x="51" y="40" width="18" height="5" rx="1.5" fill="#E2E8F0" />
        {/* Main dispenser tower */}
        <rect x="33" y="44" width="54" height="63" rx="6" fill="#FFFFFF" />
        {/* Tap alcove */}
        <rect x="39" y="51" width="42" height="27" rx="3.5" fill={isActive ? '#1E3A8A' : '#334155'} />
        {/* Hot & cold taps */}
        <rect x="47" y="51" width="7" height="10" rx="2" fill="#F43F5E" />
        <rect x="66" y="51" width="7" height="10" rx="2" fill="#38BDF8" />
        {/* Drip grille */}
        <rect x="42" y="73" width="36" height="4" rx="1.5" fill="#CBD5E1" />
        {/* Lower cabinet compartment */}
        <rect x="39" y="83" width="42" height="18" rx="3" fill={isActive ? '#DBEAFE' : '#CBD5E1'} />
      </svg>
    ),
  },
]

export function ApplianceRepairSection() {
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const panelRefs = React.useRef<Record<string, HTMLDivElement | null>>({})

  React.useEffect(() => {
    const supportsUntilFound =
      typeof HTMLElement !== 'undefined' && 'onbeforematch' in HTMLElement.prototype
    const cleanups: Array<() => void> = []

    APPLIANCE_CATEGORIES.forEach((item) => {
      const node = panelRefs.current[item.id]
      if (!node) return

      if (selectedId === item.id) {
        node.removeAttribute('hidden')
      } else {
        node.setAttribute('hidden', supportsUntilFound ? 'until-found' : '')
      }

      const handleBeforeMatch = () => {
        setSelectedId(item.id)
      }

      node.addEventListener('beforematch', handleBeforeMatch)
      cleanups.push(() => node.removeEventListener('beforematch', handleBeforeMatch))
    })

    return () => {
      cleanups.forEach((fn) => fn())
    }
  }, [selectedId])

  const handleToggle = (id: string) => {
    setSelectedId((prev) => {
      const next = prev === id ? null : id
      if (next) {
        requestAnimationFrame(() => {
          panelRefs.current[next]?.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
          })
        })
      }
      return next
    })
  }

  return (
    <section id="repair" className="border-t border-border bg-card py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-8">
        <div className="mx-auto max-w-2xl space-y-2 text-center">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Appliances We Repair
          </h2>
          <p className="text-sm text-muted-foreground sm:text-base">
            Click an appliance below to inspect covered repair services and diagnostic details.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-5">
          {APPLIANCE_CATEGORIES.map((item) => {
            const isSelected = selectedId === item.id
            return (
              <button
                key={item.id}
                type="button"
                aria-expanded={isSelected}
                aria-controls={`appliance-panel-${item.id}`}
                onClick={() => handleToggle(item.id)}
                className={cn(
                  'group relative flex aspect-square flex-col items-center justify-between rounded-xl px-3 py-5 sm:px-4 sm:py-6 text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  isSelected
                    ? 'bg-primary text-white shadow-lg ring-2 ring-primary/30 -translate-y-0.5'
                    : 'bg-[#567486] text-white shadow-xs hover:bg-[#496576] hover:-translate-y-0.5',
                )}
              >
                <span className="flex flex-1 items-center justify-center transition-transform duration-200 group-hover:scale-105">
                  {item.renderIllustration(isSelected)}
                </span>
                <span className="mt-2 inline-flex items-center gap-1 font-heading text-xs font-semibold uppercase tracking-wider sm:text-sm">
                  <span>{item.shortLabel}</span>
                  <ChevronDown
                    className={cn(
                      'h-3.5 w-3.5 shrink-0 opacity-80 transition-transform duration-200',
                      isSelected && 'rotate-180 opacity-100',
                    )}
                    aria-hidden="true"
                  />
                </span>
              </button>
            )
          })}
        </div>

        {/* Hidden on initial SSR render and upgraded to hidden="until-found" on client so Find-in-page still works */}
        <div aria-live="polite" className="space-y-4">
          {APPLIANCE_CATEGORIES.map((item) => {
            const isOpen = selectedId === item.id
            return (
              <div
                key={item.id}
                id={`appliance-panel-${item.id}`}
                hidden={!isOpen}
                ref={(el) => {
                  panelRefs.current[item.id] = el
                }}
              >
                <div className="rounded-xl border border-primary/25 bg-primary-tint/50 p-5 sm:p-6 shadow-xs transition-all">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="hidden sm:flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-primary p-2.5 shadow-xs">
                        <div className="scale-[0.65] origin-center">
                          {item.renderIllustration(true)}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <p className="font-heading text-xs font-semibold uppercase tracking-wider text-primary">
                          {item.label}
                        </p>
                        <h3 className="font-heading text-lg font-bold text-foreground sm:text-xl">
                          {item.headline}
                        </h3>
                        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedId(null)}
                      aria-label={`Close ${item.label} details`}
                      className="self-end sm:self-start text-muted-foreground hover:text-foreground shrink-0"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>

                  <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                    {item.services.map((service) => (
                      <div
                        key={service}
                        className="flex items-start gap-2.5 rounded-lg border border-border/80 bg-card px-3.5 py-2.5 text-sm text-foreground"
                      >
                        <CheckCircle2
                          className="mt-0.5 h-4 w-4 shrink-0 text-secondary"
                          aria-hidden="true"
                        />
                        <span>{service}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 flex flex-col gap-3 border-t border-border/80 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs font-medium text-muted-foreground">
                      {item.turnaround}
                    </p>
                    <Button asChild size="sm">
                      <Link href="/signup">
                        <span>Book {item.shortLabel} Repair</span>
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

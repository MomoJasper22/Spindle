'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
    headline: 'Split-Type Aircon Cleaning & Repair',
    description:
      'Complete indoor and outdoor care—from deep coil washing and cooling top-ups to stopping water drips and power issues.',
    services: [
      'Deep indoor and outdoor unit cleaning',
      'Cooling check and refrigerant top-up',
      'Power, temperature sensor & remote fixes',
      'Drain hose clearing to stop water leaks',
    ],
    turnaround: 'Same-week home visit · 60–90 mins per unit',
    renderIllustration: (isActive) => (
      <svg viewBox="0 0 120 120" fill="none" className="h-20 w-20 sm:h-24 sm:w-24" aria-hidden="true">
        <rect x="12" y="26" width="96" height="44" rx="8" fill="#FFFFFF" />
        <path
          d="M19 32h82a2 2 0 0 1 2 2v5H17v-5a2 2 0 0 1 2-2Z"
          fill={isActive ? '#CCFBF1' : '#E6E1D6'}
        />
        <rect x="81" y="42" width="16" height="6" rx="2" fill={isActive ? '#0F766E' : '#141B29'} />
        <circle cx="74" cy="45" r="2" fill="#0F766E" />
        <rect x="18" y="55" width="84" height="10" rx="3" fill={isActive ? '#0F766E' : '#334155'} />
        <rect x="22" y="59" width="76" height="3.5" rx="1.75" fill="#E2E8F0" />
        <path
          d="M32 76c-2 6-6 11-9 15M46 76c-1 7-3 13-5 18M60 76v19M74 76c1 7 3 13 5 18M88 76c2 6 6 11 9 15"
          stroke={isActive ? '#FFFFFF' : '#0F766E'}
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
    headline: 'Window Aircon Wash & Cooling Care',
    description:
      'Full pull-out pressure wash, noisy fan repairs, and cooling checks for standard and inverter window units.',
    services: [
      'Full pull-out pressure washing',
      'Fan motor & noisy blade fixes',
      'Temperature dial & sensor calibration',
      'Cooling performance check-up',
    ],
    turnaround: 'Same-week home visit · 60–90 mins',
    renderIllustration: (isActive) => (
      <svg viewBox="0 0 120 120" fill="none" className="h-20 w-20 sm:h-24 sm:w-24" aria-hidden="true">
        <rect x="13" y="25" width="94" height="66" rx="7" fill="#FFFFFF" />
        <rect x="19" y="32" width="56" height="52" rx="4" fill={isActive ? '#0F766E' : '#141B29'} />
        <rect x="23" y="37" width="48" height="4.5" rx="2" fill="#E2E8F0" />
        <rect x="23" y="45" width="48" height="4.5" rx="2" fill="#E2E8F0" />
        <rect x="23" y="53" width="48" height="4.5" rx="2" fill="#E2E8F0" />
        <rect x="23" y="61" width="48" height="4.5" rx="2" fill="#E2E8F0" />
        <rect x="23" y="69" width="48" height="4.5" rx="2" fill="#E2E8F0" />
        <rect x="80" y="32" width="21" height="52" rx="4" fill={isActive ? '#CCFBF1' : '#E6E1D6'} />
        <circle cx="90.5" cy="46" r="5.5" fill={isActive ? '#0F766E' : '#141B29'} />
        <circle cx="90.5" cy="63" r="5.5" fill={isActive ? '#0F766E' : '#141B29'} />
        <rect x="85" y="75" width="11" height="3.5" rx="1.75" fill="#D97706" />
      </svg>
    ),
  },
  {
    id: 'refrigerator',
    label: 'Refrigerator',
    shortLabel: 'Refrigerator',
    headline: 'Refrigerator & Freezer Repair',
    description:
      'Fixing weak cooling, freezer ice build-up, noisy fans, and worn door seals for single-door, two-door, and side-by-side fridges.',
    services: [
      'Frost build-up & cooling recovery',
      'Power & compressor check-up',
      'Airflow & noisy fan repair',
      'Magnetic door rubber seal replacement',
    ],
    turnaround: 'Upfront Peso estimate before parts replacement',
    renderIllustration: (isActive) => (
      <svg viewBox="0 0 120 120" fill="none" className="h-20 w-20 sm:h-24 sm:w-24" aria-hidden="true">
        <rect x="40" y="102" width="8" height="5" rx="2" fill="#CBD5E1" />
        <rect x="72" y="102" width="8" height="5" rx="2" fill="#CBD5E1" />
        <rect x="33" y="14" width="54" height="31" rx="6" fill="#FFFFFF" />
        <rect x="33" y="48" width="54" height="55" rx="6" fill="#FFFFFF" />
        <rect x="33" y="45" width="54" height="3.5" fill={isActive ? '#0F766E' : '#141B29'} />
        <rect x="39" y="23" width="4.5" height="15" rx="2.25" fill={isActive ? '#0F766E' : '#475569'} />
        <rect x="39" y="56" width="4.5" height="24" rx="2.25" fill={isActive ? '#0F766E' : '#475569'} />
        <rect x="65" y="24" width="14" height="10" rx="2.5" fill={isActive ? '#CCFBF1' : '#E6E1D6'} />
        <circle cx="72" cy="29" r="2.2" fill="#0F766E" />
      </svg>
    ),
  },
  {
    id: 'washing-machine',
    label: 'Washing Machine',
    shortLabel: 'Washing Machine',
    headline: 'Front-Load & Top-Load Washer Repair',
    description:
      'Fixing water drainage problems, loud spinning, stuck door locks, and drum cleaning for automatic washers and washer-dryers.',
    services: [
      'Drain clearing & water inlet fixes',
      'Spin motor & vibration repair',
      'Door lock & error-code troubleshooting',
      'Deep tub cleaning & odor removal',
    ],
    turnaround: 'On-site test & spin check included',
    renderIllustration: (isActive) => (
      <svg viewBox="0 0 120 120" fill="none" className="h-20 w-20 sm:h-24 sm:w-24" aria-hidden="true">
        <rect x="23" y="16" width="74" height="88" rx="7" fill="#FFFFFF" />
        <path
          d="M23 23a7 7 0 0 1 7-7h60a7 7 0 0 1 7 7v14H23V23Z"
          fill={isActive ? '#CCFBF1' : '#E6E1D6'}
        />
        <rect x="31" y="22" width="18" height="8" rx="2" fill="#FFFFFF" />
        <circle cx="60" cy="26" r="5" fill={isActive ? '#0F766E' : '#141B29'} />
        <circle cx="77" cy="26" r="2.5" fill="#D97706" />
        <circle cx="85" cy="26" r="2.5" fill={isActive ? '#0F766E' : '#475569'} />
        <circle cx="60" cy="69" r="24" fill={isActive ? '#CCFBF1' : '#E6E1D6'} />
        <circle cx="60" cy="69" r="17" fill={isActive ? '#0F766E' : '#141B29'} />
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
    headline: 'Gas Stove, Oven & Induction Repair',
    description:
      'Safe check-ups for stove lighters, gas valve leaks, induction cooktops, and uneven oven heating.',
    services: [
      'Burner lighter & switch replacement',
      'Induction cooktop & touch-panel repair',
      'Oven heating & temperature check',
      'Gas line leak & safety inspection',
    ],
    turnaround: 'Includes thermal & gas safety check',
    renderIllustration: (isActive) => (
      <svg viewBox="0 0 120 120" fill="none" className="h-20 w-20 sm:h-24 sm:w-24" aria-hidden="true">
        <rect x="26" y="14" width="68" height="10" rx="3" fill="#E6E1D6" />
        <rect x="32" y="21" width="16" height="4" rx="1.5" fill={isActive ? '#0F766E' : '#141B29'} />
        <rect x="72" y="21" width="16" height="4" rx="1.5" fill={isActive ? '#0F766E' : '#141B29'} />
        <rect x="22" y="25" width="76" height="80" rx="6" fill="#FFFFFF" />
        <rect x="22" y="25" width="76" height="17" rx="4" fill={isActive ? '#CCFBF1' : '#E6E1D6'} />
        <circle cx="35" cy="33.5" r="3.8" fill={isActive ? '#0F766E' : '#141B29'} />
        <circle cx="51" cy="33.5" r="3.8" fill={isActive ? '#0F766E' : '#141B29'} />
        <circle cx="69" cy="33.5" r="3.8" fill={isActive ? '#0F766E' : '#141B29'} />
        <circle cx="85" cy="33.5" r="3.8" fill={isActive ? '#0F766E' : '#141B29'} />
        <rect x="32" y="48" width="56" height="4.5" rx="2" fill={isActive ? '#0F766E' : '#475569'} />
        <rect x="32" y="56" width="56" height="38" rx="4" fill={isActive ? '#0F766E' : '#141B29'} />
        <path d="M40 76h40" stroke="#F59E0B" strokeOpacity="0.9" strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'commercial-chiller',
    label: 'Commercial Chiller',
    shortLabel: 'Commercial Chiller',
    headline: 'Store Chillers & Chest Freezers',
    description:
      'Keeping sari-sari stores, cafes, and kitchens running by restoring cold temperatures on upright chillers and freezers.',
    services: [
      'Temperature control & display fixes',
      'Cooling coil cleaning & fan care',
      'Refrigerant top-up & cooling check',
      'Glass door seal & warm-air fixes',
    ],
    turnaround: 'Priority scheduling for store units',
    renderIllustration: (isActive) => (
      <svg viewBox="0 0 120 120" fill="none" className="h-20 w-20 sm:h-24 sm:w-24" aria-hidden="true">
        <rect x="29" y="13" width="62" height="94" rx="6" fill="#FFFFFF" />
        <rect x="35" y="18" width="50" height="11" rx="2.5" fill={isActive ? '#CCFBF1' : '#E6E1D6'} />
        <rect x="35" y="33" width="44" height="58" rx="3.5" fill={isActive ? '#0F766E' : '#141B29'} />
        <rect x="38" y="49" width="38" height="2.8" rx="1" fill="#E2E8F0" />
        <rect x="38" y="66" width="38" height="2.8" rx="1" fill="#E2E8F0" />
        <rect x="38" y="83" width="38" height="2.8" rx="1" fill="#E2E8F0" />
        <rect x="43" y="38" width="6" height="11" rx="2" fill="#38BDF8" />
        <rect x="53" y="38" width="6" height="11" rx="2" fill="#99F6E4" />
        <rect x="63" y="38" width="6" height="11" rx="2" fill="#38BDF8" />
        <rect x="43" y="55" width="7" height="11" rx="2" fill="#99F6E4" />
        <rect x="55" y="55" width="7" height="11" rx="2" fill="#38BDF8" />
        <rect x="82" y="46" width="4" height="28" rx="2" fill={isActive ? '#0F766E' : '#475569'} />
        <rect x="35" y="95" width="50" height="6" rx="2" fill={isActive ? '#CCFBF1' : '#E6E1D6'} />
      </svg>
    ),
  },
  {
    id: 'microwave-oven',
    label: 'Microwave Oven',
    shortLabel: 'Microwave',
    headline: 'Microwave Oven Repair',
    description:
      'Fixing microwaves that will not heat, jammed rotating plates, sparks inside, door latches, and unresponsive buttons.',
    services: [
      'No-heat & power repair',
      'Interior sparking & door latch safety fixes',
      'Keypad & timer dial repair',
      'Turntable plate motor replacement',
    ],
    turnaround: 'Fast check-up & repair turnaround',
    renderIllustration: (isActive) => (
      <svg viewBox="0 0 120 120" fill="none" className="h-20 w-20 sm:h-24 sm:w-24" aria-hidden="true">
        <rect x="20" y="90" width="12" height="5" rx="2" fill="#CBD5E1" />
        <rect x="88" y="90" width="12" height="5" rx="2" fill="#CBD5E1" />
        <rect x="13" y="31" width="94" height="59" rx="7" fill="#FFFFFF" />
        <rect x="20" y="39" width="56" height="43" rx="4" fill={isActive ? '#0F766E' : '#141B29'} />
        <rect x="28" y="72" width="40" height="3.5" rx="1.75" fill="#99F6E4" fillOpacity="0.85" />
        <rect x="70" y="47" width="3.5" height="27" rx="1.75" fill="#E2E8F0" />
        <rect x="81" y="39" width="19" height="43" rx="3.5" fill={isActive ? '#CCFBF1' : '#E6E1D6'} />
        <rect x="84" y="43" width="13" height="7" rx="1.5" fill={isActive ? '#0F766E' : '#141B29'} />
        <circle cx="87.5" cy="56" r="2" fill={isActive ? '#0F766E' : '#475569'} />
        <circle cx="93.5" cy="56" r="2" fill={isActive ? '#0F766E' : '#475569'} />
        <circle cx="87.5" cy="63" r="2" fill={isActive ? '#0F766E' : '#475569'} />
        <circle cx="93.5" cy="63" r="2" fill={isActive ? '#0F766E' : '#475569'} />
        <rect x="84" y="71" width="13" height="6.5" rx="2" fill="#D97706" />
      </svg>
    ),
  },
  {
    id: 'water-dispenser',
    label: 'Water Dispenser',
    shortLabel: 'Water Dispenser',
    headline: 'Hot & Cold Water Dispenser Care',
    description:
      'Deep tank cleaning to clear mineral build-up, restoring cold or hot water temperatures, and sealing dripping spouts.',
    services: [
      'Hot & cold tank flushing & sanitizing',
      'Hot heater & cold cooling recovery',
      'Spout tap replacement & drip sealing',
      'Temperature & water flow check',
    ],
    turnaround: 'Complete flow, temperature & leak check',
    renderIllustration: (isActive) => (
      <svg viewBox="0 0 120 120" fill="none" className="h-20 w-20 sm:h-24 sm:w-24" aria-hidden="true">
        <rect x="41" y="10" width="38" height="32" rx="7" fill="#BAE6FD" />
        <path d="M41 24h38" stroke="#FFFFFF" strokeOpacity="0.65" strokeWidth="2.5" />
        <rect x="51" y="40" width="18" height="5" rx="1.5" fill="#E2E8F0" />
        <rect x="33" y="44" width="54" height="63" rx="6" fill="#FFFFFF" />
        <rect x="39" y="51" width="42" height="27" rx="3.5" fill={isActive ? '#0F766E' : '#141B29'} />
        <rect x="47" y="51" width="7" height="10" rx="2" fill="#F43F5E" />
        <rect x="66" y="51" width="7" height="10" rx="2" fill="#38BDF8" />
        <rect x="42" y="73" width="36" height="4" rx="1.5" fill="#CBD5E1" />
        <rect x="39" y="83" width="42" height="18" rx="3" fill={isActive ? '#CCFBF1' : '#E6E1D6'} />
      </svg>
    ),
  },
]

export function ApplianceRepairSection() {
  const [selectedId, setSelectedId] = React.useState<string | null>(null)

  const selectedItem = React.useMemo(
    () => APPLIANCE_CATEGORIES.find((item) => item.id === selectedId) ?? null,
    [selectedId],
  )

  return (
    <section id="repair" className="border-t border-border bg-card py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-8">
        <div className="mx-auto max-w-2xl space-y-2 text-center">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Appliances We Care For
          </h2>
          <p className="text-sm text-muted-foreground sm:text-base">
            Tap any appliance to see how we can help get it working smoothly again.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4 sm:gap-5">
          {APPLIANCE_CATEGORIES.map((item) => {
            const isSelected = selectedId === item.id
            return (
              <button
                key={item.id}
                type="button"
                aria-haspopup="dialog"
                onClick={() => setSelectedId(item.id)}
                className={cn(
                  'group relative flex aspect-square flex-col items-center justify-between rounded-2xl border px-3 py-5 sm:px-4 sm:py-6 text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  isSelected
                    ? 'border-primary bg-primary text-white shadow-md -translate-y-0.5'
                    : 'border-border bg-background text-foreground shadow-2xs hover:border-primary/40 hover:bg-primary-tint/40 hover:-translate-y-0.5',
                )}
              >
                <span className="flex flex-1 items-center justify-center transition-transform duration-200 group-hover:scale-105">
                  {item.renderIllustration(isSelected)}
                </span>
                <span className="mt-2 font-heading text-xs font-semibold sm:text-sm">
                  {item.shortLabel}
                </span>
              </button>
            )
          })}
        </div>

        <Dialog
          open={selectedItem !== null}
          onOpenChange={(open) => {
            if (!open) setSelectedId(null)
          }}
        >
          <DialogContent className="max-w-xl">
            {selectedItem && (
              <>
                <div className="flex items-start gap-4 pr-4">
                  <div className="hidden sm:flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-primary p-2.5 shadow-xs">
                    <div className="scale-[0.7] origin-center">
                      {selectedItem.renderIllustration(true)}
                    </div>
                  </div>
                  <DialogHeader className="pr-0">
                    <DialogTitle className="text-xl leading-snug">
                      {selectedItem.headline}
                    </DialogTitle>
                    <DialogDescription className="pt-1 leading-relaxed">
                      {selectedItem.description}
                    </DialogDescription>
                  </DialogHeader>
                </div>

                <div className="space-y-2.5 pt-1">
                  <p className="font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    What We Help With
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {selectedItem.services.map((service) => (
                      <div
                        key={service}
                        className="flex items-start gap-2.5 rounded-xl border border-border bg-background/70 px-3.5 py-2.5 text-sm text-foreground"
                      >
                        <CheckCircle2
                          className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                          aria-hidden="true"
                        />
                        <span>{service}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <DialogFooter className="border-t border-border pt-4 sm:items-center sm:justify-between">
                  <p className="text-xs font-medium text-muted-foreground">
                    {selectedItem.turnaround}
                  </p>
                  <div className="flex items-center justify-end gap-2">
                    <DialogClose asChild>
                      <Button type="button" variant="outline" size="sm">
                        Close
                      </Button>
                    </DialogClose>
                    <Button asChild size="sm">
                      <Link href="/signup">
                        <span>Book {selectedItem.shortLabel} Visit</span>
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </Button>
                  </div>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  )
}

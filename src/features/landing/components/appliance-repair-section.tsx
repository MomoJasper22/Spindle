'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react'
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
import { ApplianceIllustration } from '@/components/shared/appliance-icons'
import type { ApplianceIconKey } from '@/lib/constants'
import { MarqueeTrack, type MarqueeTrackHandle } from './marquee-track'

interface ApplianceCategory {
  id: ApplianceIconKey
  label: string
  shortLabel: string
  headline: string
  description: string
  services: string[]
  turnaround: string
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
    turnaround: 'Includes temperature & gas safety check',
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
  },
  {
    id: 'television',
    label: 'Television',
    shortLabel: 'Smart TV',
    headline: 'Smart TV & LED Screen Care',
    description:
      'Fixing dark screens with sound, power blinking issues, broken HDMI ports, and neat wall-mount setup at home.',
    services: [
      'No-picture & dim screen repair',
      'Power supply & startup troubleshooting',
      'Speaker distortion & sound check',
      'HDMI port & wall-mount inspection',
    ],
    turnaround: 'Clean indoor workbench check & repair',
  },
  {
    id: 'clothes-dryer',
    label: 'Clothes Dryer',
    shortLabel: 'Clothes Dryer',
    headline: 'Clothes Dryer & Vent Care',
    description:
      'Restoring steady drying heat, fixing thumping drums or broken belts, and clearing trapped lint for safe laundry days.',
    services: [
      'No-heat & slow drying recovery',
      'Thumping drum & belt replacement',
      'Deep lint path & vent cleaning',
      'Door switch & timer check-up',
    ],
    turnaround: 'Heat, airflow & spin safety test included',
  },
  {
    id: 'electric-fan',
    label: 'Electric Fan',
    shortLabel: 'Electric Fan',
    headline: 'Stand, Wall & Desk Fan Repair',
    description:
      'Fixing slow or stuck fan blades, humming motors, worn oscillation gears, and loose speed switches for steady airflow.',
    services: [
      'Slow blade & motor lubrication',
      'Side-to-side swing gear repair',
      'Speed button & power cord fixes',
      'Quiet balance & safety grill check',
    ],
    turnaround: 'Quick repair & airflow test',
  },
  {
    id: 'water-heater',
    label: 'Water Heater',
    shortLabel: 'Shower Heater',
    headline: 'Shower & Multipoint Water Heater Care',
    description:
      'Safe repair for shower heaters that stay cold, trip bathroom switches, trickle slowly, or drip around valves.',
    services: [
      'No-heat & temperature dial fixes',
      'Safety switch & breaker trip inspection',
      'Water pressure & flow valve repair',
      'Hose & seal leak tightening',
    ],
    turnaround: 'Includes electrical grounding & heat test',
  },
]

export function ApplianceRepairSection() {
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const marqueeRef = React.useRef<MarqueeTrackHandle>(null)

  const selectedItem = React.useMemo(
    () => APPLIANCE_CATEGORIES.find((item) => item.id === selectedId) ?? null,
    [selectedId],
  )

  return (
    <section id="repair" className="border-t border-border bg-card py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl space-y-2 text-center">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Appliances We Care For
          </h2>
          <p className="text-sm text-muted-foreground sm:text-base">
            Drag to browse or tap any appliance to see how we can help get it working smoothly again.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <MarqueeTrack
          ref={marqueeRef}
          items={APPLIANCE_CATEGORIES}
          getItemKey={(item) => item.id}
          speedPxPerSec={22}
          ariaLabel="Appliances we care for"
          setSpacingClassName="gap-3.5 pr-3.5 sm:gap-5 sm:pr-5"
          renderItem={(item, { isClone }) => {
            const isSelected = selectedId === item.id
            return (
              <button
                type="button"
                tabIndex={isClone ? -1 : undefined}
                aria-haspopup="dialog"
                onClick={() => setSelectedId(item.id)}
                className={cn(
                  'group relative flex aspect-square w-44 shrink-0 flex-col items-center justify-between rounded-2xl border px-3 py-5 text-center transition-[transform,border-color,background-color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-52 sm:px-4 sm:py-6',
                  isSelected
                    ? 'border-primary bg-primary text-white shadow-md -translate-y-0.5'
                    : 'border-border bg-background text-foreground shadow-2xs hover:border-primary/50 hover:bg-primary-tint/45 hover:-translate-y-0.5',
                )}
              >
                <span className="flex flex-1 items-center justify-center transition-transform duration-200 group-hover:scale-105">
                  <ApplianceIllustration iconKey={item.id} isActive={isSelected} />
                </span>
                <span className="mt-2 font-heading text-xs font-semibold sm:text-sm">
                  {item.shortLabel}
                </span>
              </button>
            )
          }}
        />

        <div className="mt-5 flex items-center justify-center gap-3 px-4">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Previous appliance"
            onClick={() => marqueeRef.current?.step('prev')}
            className="h-11 w-11 rounded-full border-border bg-background shadow-2xs transition-[transform,border-color,background-color,color] active:scale-95 hover:border-primary/50 hover:bg-primary-tint/50 hover:text-primary"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Next appliance"
            onClick={() => marqueeRef.current?.step('next')}
            className="h-11 w-11 rounded-full border-border bg-background shadow-2xs transition-[transform,border-color,background-color,color] active:scale-95 hover:border-primary/50 hover:bg-primary-tint/50 hover:text-primary"
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>
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
                      <ApplianceIllustration iconKey={selectedItem.id} isActive />
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
                      <Link href="/login">
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
    </section>
  )
}

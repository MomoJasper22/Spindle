'use client'

import * as React from 'react'
import Image from 'next/image'
import { Pause, Play } from 'lucide-react'
import { cn } from '@/lib/utils'

export { ApplianceRepairSection } from './appliance-repair-section'

interface BrandLogoItem {
  name: string
  logoSrc: string
  width: number
  height: number
  sizeClass: string
}

const BRAND_LOGOS: BrandLogoItem[] = [
  {
    name: 'Carrier',
    logoSrc: '/images/brands/carrier.svg',
    width: 709,
    height: 285,
    sizeClass: 'h-11 max-w-[130px]',
  },
  {
    name: 'Condura',
    logoSrc: '/images/brands/condura.svg',
    width: 301,
    height: 34,
    sizeClass: 'h-6 max-w-[140px]',
  },
  {
    name: 'Panasonic',
    logoSrc: '/images/brands/panasonic.svg',
    width: 504,
    height: 80,
    sizeClass: 'h-6 max-w-[140px]',
  },
  {
    name: 'LG',
    logoSrc: '/images/brands/lg.svg',
    width: 600,
    height: 275,
    sizeClass: 'h-10 max-w-[120px]',
  },
  {
    name: 'Samsung',
    logoSrc: '/images/brands/samsung.svg',
    width: 7051,
    height: 1080,
    sizeClass: 'h-6 max-w-[140px]',
  },
  {
    name: 'Daikin',
    logoSrc: '/images/brands/daikin.svg',
    width: 300,
    height: 65,
    sizeClass: 'h-7 max-w-[140px]',
  },
  {
    name: 'Koppel',
    logoSrc: '/images/brands/koppel.png',
    width: 1124,
    height: 348,
    sizeClass: 'h-10 max-w-[130px]',
  },
  {
    name: 'Whirlpool',
    logoSrc: '/images/brands/whirlpool.svg',
    width: 1680,
    height: 560,
    sizeClass: 'h-10 max-w-[135px]',
  },
  {
    name: 'Fujidenzo',
    logoSrc: '/images/brands/fujidenzo.png',
    width: 1366,
    height: 398,
    sizeClass: 'h-9 max-w-[140px]',
  },
  {
    name: 'Sharp',
    logoSrc: '/images/brands/sharp.svg',
    width: 1024,
    height: 146,
    sizeClass: 'h-5 max-w-[140px]',
  },
  {
    name: 'Midea',
    logoSrc: '/images/brands/midea.svg',
    width: 3228,
    height: 1242,
    sizeClass: 'h-10 max-w-[130px]',
  },
  {
    name: 'Haier',
    logoSrc: '/images/brands/haier.svg',
    width: 824,
    height: 256,
    sizeClass: 'h-8 max-w-[128px]',
  },
]

function BrandLogoCards({
  className,
  ariaHidden = false,
}: {
  className?: string
  ariaHidden?: boolean
}) {
  return (
    <div className={className} aria-hidden={ariaHidden || undefined}>
      {BRAND_LOGOS.map((brand) => (
        <div
          key={brand.name}
          className="flex h-22 sm:h-24 items-center justify-center rounded-2xl border border-border bg-card px-5 py-4 shadow-2xs transition-colors hover:border-primary/40 motion-safe:w-40 motion-safe:shrink-0 sm:motion-safe:w-44"
        >
          <Image
            src={brand.logoSrc}
            alt={ariaHidden ? '' : `${brand.name} logo`}
            width={brand.width}
            height={brand.height}
            unoptimized
            className={cn('w-full object-contain', brand.sizeClass)}
          />
        </div>
      ))}
    </div>
  )
}

export function SupportedBrandsSection() {
  const [isPaused, setIsPaused] = React.useState(false)

  return (
    <section id="brands" className="border-t border-border bg-background py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1.5">
            <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Brands We Work With
            </h2>
            <p className="text-sm text-muted-foreground sm:text-base">
              Experienced repair care across trusted home and business appliance brands.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsPaused((prev) => !prev)}
            className="hidden motion-safe:inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-muted-foreground shadow-2xs transition-colors hover:border-primary/40 hover:text-foreground"
            aria-label={isPaused ? 'Play scrolling brand logos' : 'Pause scrolling brand logos'}
          >
            {isPaused ? (
              <>
                <Play className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                <span>Play</span>
              </>
            ) : (
              <>
                <Pause className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                <span>Pause</span>
              </>
            )}
          </button>
        </div>

        <div className="spindle-marquee-viewport motion-safe:overflow-hidden motion-safe:[mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
          <div className="spindle-marquee-track py-1" data-paused={isPaused}>
            <BrandLogoCards className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 motion-safe:flex motion-safe:shrink-0 motion-safe:items-center motion-safe:gap-4 motion-safe:pr-4" />
            <BrandLogoCards
              ariaHidden
              className="hidden motion-safe:flex motion-safe:shrink-0 motion-safe:items-center motion-safe:gap-4 motion-safe:pr-4"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

import Image from 'next/image'
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

export function SupportedBrandsSection() {
  return (
    <section id="brands" className="border-t border-border bg-background py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-8">
        <div className="space-y-1.5">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Brands We Work With
          </h2>
          <p className="text-sm text-muted-foreground sm:text-base">
            Experienced repair care across trusted home and business appliance brands.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {BRAND_LOGOS.map((brand) => (
            <div
              key={brand.name}
              className="flex h-22 sm:h-24 items-center justify-center rounded-2xl border border-border bg-card px-5 py-4 shadow-2xs transition-colors hover:border-primary/40"
            >
              <Image
                src={brand.logoSrc}
                alt={`${brand.name} logo`}
                width={brand.width}
                height={brand.height}
                unoptimized
                className={cn('w-full object-contain', brand.sizeClass)}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

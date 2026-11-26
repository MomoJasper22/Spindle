import Link from 'next/link'
import {
  ArrowRight,
  CalendarClock,
  CreditCard,
  MapPin,
  ShieldCheck,
} from 'lucide-react'
import { SpindleLogo } from '@/components/shared/spindle-logo'
import { Button } from '@/components/ui/button'
import {
  ApplianceRepairSection,
  SupportedBrandsSection,
} from '@/features/landing/components/appliance-showcase'
import { LandingHeader } from '@/features/landing/components/landing-header'
import { SERVICE_BRANCHES } from '@/lib/constants'

const PASSBOOK_STEPS = [
  {
    step: '01',
    title: 'Pick a Unit',
    detail: 'Aircon, Fridge, Washer & More',
  },
  {
    step: '02',
    title: 'Arrival Window',
    detail: '2-Hour Slot (8 AM – 5 PM)',
  },
  {
    step: '03',
    title: 'Upfront Quote',
    detail: 'Approve Cost Before Repair',
  },
  {
    step: '04',
    title: 'Easy Payment',
    detail: 'GCash, Maya, Bank, or Cash',
  },
] as const

const CUSTOMER_PROMISES = [
  {
    title: 'Trained, Checked Technicians',
    description:
      'Every visiting specialist is verified and experienced in caring for popular home and shop appliance brands.',
    icon: ShieldCheck,
  },
  {
    title: 'Clear Peso Pricing First',
    description:
      'See and approve your repair estimate in Philippine Pesos before work starts—then pay via GCash, Maya, QR Ph, bank transfer, or cash.',
    icon: CreditCard,
  },
  {
    title: '2-Hour Arrival Windows',
    description:
      'Choose a morning or afternoon slot that works around your day, and reschedule online anytime your plans change.',
    icon: CalendarClock,
  },
] as const

export default function LandingPage() {
  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground">
      <LandingHeader />

      <main id="main-content" tabIndex={-1} className="flex-1">
        {/* Tactile Service Passbook Hero (Single Primary CTA, Zero Track Ticket Button) */}
        <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-12">
            <div className="space-y-6 lg:col-span-6">
              <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-[3.35rem] lg:leading-[1.06]">
                Keep every home appliance running smoothly.
              </h1>

              <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Book trusted repair and cleaning visits across the Philippines. Clear Peso pricing before work starts, flexible 2-hour windows, and simple online updates.
              </p>

              <div className="pt-1">
                <Button asChild size="lg" className="w-full sm:w-auto px-7">
                  <Link href="/signup">
                    <span>Schedule a Visit</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Signature Service Passbook Card */}
            <div className="lg:col-span-6">
              <div className="overflow-hidden rounded-2xl border-2 border-[#141B29] bg-card shadow-[0_18px_36px_-14px_rgba(20,27,41,0.18),0_4px_12px_rgba(20,27,41,0.06)]">
                <div className="flex items-center justify-between gap-3 bg-[#141B29] px-5 py-4 sm:px-7">
                  <h2 className="font-heading text-lg font-bold text-[#F8F7F4] sm:text-xl">
                    Service Passbook
                  </h2>
                  <span className="-rotate-2 rounded-md border-2 border-emerald-400 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-emerald-300 uppercase">
                    Clear Estimate
                  </span>
                </div>

                <ol className="divide-y divide-dashed divide-slate-300 px-5 py-2 sm:px-7">
                  {PASSBOOK_STEPS.map((item) => (
                    <li
                      key={item.step}
                      className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-heading text-sm font-bold text-[#D97706] tabular-nums">
                          {item.step}
                        </span>
                        <span className="text-sm font-semibold text-muted-foreground">
                          {item.title}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-foreground sm:text-right">
                        {item.detail}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* Appliances We Care For */}
        <ApplianceRepairSection />

        {/* Brands We Work With */}
        <SupportedBrandsSection />

        {/* Plain-Language Care Promises */}
        <section id="services" className="border-t border-border bg-card py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-8">
            <div className="max-w-2xl space-y-2">
              <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Care you can count on for every home and shop appliance
              </h2>
              <p className="text-sm text-muted-foreground sm:text-base">
                From routine aircon cleaning to urgent fridge and washer repairs, everything stays straightforward from booking to payment.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {CUSTOMER_PROMISES.map((cap) => {
                const Icon = cap.icon
                return (
                  <div
                    key={cap.title}
                    className="rounded-2xl border border-border bg-background/60 p-6 space-y-3"
                  >
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-tint text-primary">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <h3 className="font-heading text-lg font-semibold text-foreground">
                      {cap.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {cap.description}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Supported Service Hubs */}
        <section id="service-areas" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1.5">
              <h2 className="font-heading text-xl font-bold text-foreground sm:text-2xl">
                Where We Come to You
              </h2>
              <p className="text-sm text-muted-foreground">
                Book home and storefront visits across Metro Manila, Laguna, Cebu, and Davao.
              </p>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {SERVICE_BRANCHES.map((branch) => (
                <div
                  key={branch}
                  className="flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs font-medium text-foreground shadow-2xs"
                >
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                  <span>{branch}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Clean Minimal Footer */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <SpindleLogo variant="dark" size="sm" />
            <span className="text-xs text-muted-foreground">
              &copy; 2026 Spindle Appliance Care Inc. Philippines.
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-5 text-xs font-semibold text-muted-foreground">
            <a href="#repair" className="hover:text-foreground">
              Appliances
            </a>
            <a href="#brands" className="hover:text-foreground">
              Brands
            </a>
            <a href="#service-areas" className="hover:text-foreground">
              Service Areas
            </a>
            <Link href="/login" className="hover:text-foreground">
              Sign In
            </Link>
            <Link href="/signup" className="text-primary hover:underline">
              Schedule a Visit
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

import Link from 'next/link'
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  MapPin,
  ShieldCheck,
  Wrench,
} from 'lucide-react'
import { SpindleLogo } from '@/components/shared/spindle-logo'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { APPLIANCE_CATEGORIES, SERVICE_BRANCHES } from '@/lib/constants'

const CAPABILITIES = [
  {
    title: 'Certified Local Technicians',
    description:
      'TESDA-aligned field engineers vetted for residential and commercial inverter systems across major Philippine hubs.',
    icon: ShieldCheck,
    accent: 'text-teal-700 bg-teal-50',
  },
  {
    title: 'Transparent PHP Estimates & Digital Payments',
    description:
      'Upfront Philippine Peso diagnostics and verified settlement via GCash, Maya, QR Ph, bank transfer, or cash.',
    icon: CreditCard,
    accent: 'text-primary bg-primary-tint',
  },
  {
    title: 'Real-Time Appointment Scheduling',
    description:
      'Lock 2-hour Philippine Standard Time arrival windows with conflict-free technician dispatch and live stage tracking.',
    icon: CalendarClock,
    accent: 'text-sky-700 bg-sky-50',
  },
] as const

const WORKFLOW_STAGES = [
  {
    step: '01',
    title: 'Request',
    detail: 'Register your unit and pick a PHT service slot.',
    badge: 'Pending',
    badgeStyle: 'bg-[#FEF3C7] text-[#B45309]',
  },
  {
    step: '02',
    title: 'Dispatch',
    detail: 'Branch coordinator locks an available specialist.',
    badge: 'Assigned',
    badgeStyle: 'bg-[#EEF2FF] text-[#4338CA]',
  },
  {
    step: '03',
    title: 'Repair',
    detail: 'On-site inspection, diagnostic notes & PHP quote.',
    badge: 'In Progress',
    badgeStyle: 'bg-[#E0F2FE] text-[#0369A1]',
  },
  {
    step: '04',
    title: 'Pay',
    detail: 'Settle via GCash, Maya, QR Ph, or cash receipt.',
    badge: 'Completed',
    badgeStyle: 'bg-[#D1FAE5] text-[#047857]',
  },
] as const

export default function LandingPage() {
  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground">
      {/* Minimal Sticky Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-xs">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <Link href="/" aria-label="Spindle Home">
            <SpindleLogo variant="dark" />
          </Link>

          <nav aria-label="Primary" className="hidden md:flex items-center gap-7 text-sm font-medium text-muted-foreground">
            <a href="#services" className="hover:text-foreground transition-colors">
              Services
            </a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">
              How It Works
            </a>
            <a href="#service-areas" className="hover:text-foreground transition-colors">
              Service Areas
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">Book a Repair</Link>
            </Button>
          </div>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="flex-1">
        {/* Crisp Hero Section */}
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            <div className="space-y-6 lg:col-span-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-primary-tint px-3.5 py-1 text-xs font-semibold text-primary">
                <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Philippine Appliance Repair &amp; Field Dispatch</span>
              </div>

              <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                Reliable Appliance Repair, Scheduled Around Your Day
              </h1>

              <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Book certified technicians for split-type aircons, inverter refrigerators, washers, and commercial chillers—with transparent PHP quotes and real-time job tracking.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Button asChild size="lg">
                  <Link href="/signup">
                    <span>Schedule Service</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/login">Track Existing Ticket</Link>
                </Button>
              </div>
            </div>

            {/* Clean Visual Preview Card (Live Workflow Stages) */}
            <div id="how-it-works" className="lg:col-span-6">
              <Card className="overflow-hidden border-slate-200 bg-sidebar text-sidebar-foreground shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Spindle Dispatch Workflow
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-300">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Asia/Manila (UTC+8)
                  </span>
                </div>
                <CardContent className="p-5 sm:p-6">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {WORKFLOW_STAGES.map((stage) => (
                      <div
                        key={stage.step}
                        className="rounded-lg border border-slate-800 bg-slate-900/90 p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-semibold text-blue-400">
                            STEP {stage.step}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${stage.badgeStyle}`}
                          >
                            {stage.badge}
                          </span>
                        </div>
                        <p className="font-heading text-base font-semibold text-white">
                          {stage.title}
                        </p>
                        <p className="text-xs leading-relaxed text-slate-300">{stage.detail}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Compact 3-Card Capability Strip */}
        <section id="services" className="border-y border-border bg-card py-14">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-8">
            <div className="max-w-2xl space-y-2">
              <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Built for dependable residential and commercial service
              </h2>
              <p className="text-sm text-muted-foreground sm:text-base">
                Supporting {APPLIANCE_CATEGORIES.slice(0, 6).join(', ')}, and commercial refrigeration units.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {CAPABILITIES.map((cap) => {
                const Icon = cap.icon
                return (
                  <Card key={cap.title} className="border-border bg-background/50">
                    <CardContent className="p-6 space-y-3">
                      <div
                        className={`inline-flex h-11 w-11 items-center justify-center rounded-lg ${cap.accent}`}
                      >
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <h3 className="font-heading text-lg font-semibold text-foreground">
                        {cap.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {cap.description}
                      </p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* Supported Service Hubs Strip */}
        <section id="service-areas" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1.5">
              <h2 className="font-heading text-xl font-bold text-foreground sm:text-2xl">
                Active Philippine Service Hubs
              </h2>
              <p className="text-sm text-muted-foreground">
                Regional dispatch teams covering Metro Manila, Laguna, Cebu, and Davao.
              </p>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {SERVICE_BRANCHES.map((branch) => (
                <div
                  key={branch}
                  className="flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2.5 text-xs font-medium text-foreground shadow-2xs"
                >
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-secondary" aria-hidden="true" />
                  <span>{branch}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Clean Minimal Commercial Footer */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <SpindleLogo variant="dark" size="sm" />
            <span className="text-xs text-muted-foreground">
              &copy; 2026 Spindle Field Operations Inc. Philippines.
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-5 text-xs font-medium text-muted-foreground">
            <a href="#services" className="hover:text-foreground">
              Services
            </a>
            <a href="#service-areas" className="hover:text-foreground">
              Branches
            </a>
            <Link href="/login" className="hover:text-foreground">
              Customer &amp; Staff Portal
            </Link>
            <Link href="/signup" className="text-primary hover:underline">
              Schedule Repair
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

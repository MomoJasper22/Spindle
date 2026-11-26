import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, ShieldCheck, Wrench } from 'lucide-react'
import { SpindleLogo } from '@/components/shared/spindle-logo'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background lg:grid lg:grid-cols-2">
      {/* Mobile Compact Header so the Form Leads Immediately */}
      <header className="sticky top-0 z-20 flex shrink-0 items-center justify-between border-b border-border bg-card/95 px-4 py-2.5 backdrop-blur-xs lg:hidden">
        <Link href="/" aria-label="Back to Spindle home" className="inline-flex min-h-[44px] items-center">
          <SpindleLogo variant="dark" size="sm" />
        </Link>
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center gap-1.5 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Home</span>
        </Link>
      </header>

      {/* Desktop Left Showcase Panel */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-[#141B29] px-12 py-12 text-[#F8F7F4]">
        <Image
          src="/images/auth-left-showcase.jpg"
          alt=""
          aria-hidden="true"
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="pointer-events-none object-cover object-center"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#141B29]/95 via-[#141B29]/82 to-[#141B29]/70"
        />

        <div className="relative z-10 flex items-center">
          <Link href="/" aria-label="Back to Spindle landing page">
            <SpindleLogo variant="light" size="lg" showTagline />
          </Link>
        </div>

        <div className="relative z-10 max-w-md space-y-6">
          <div className="space-y-3">
            <h1 className="font-heading text-3xl font-bold tracking-tight text-white xl:text-4xl">
              Dependable care for the appliances your home runs on.
            </h1>
            <p className="text-base leading-relaxed text-slate-200">
              Book trusted local technicians at your convenience, review upfront Peso quotes, and pay comfortably after the visit.
            </p>
          </div>

          <ul className="space-y-3 text-sm text-slate-100">
            <li className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 shrink-0 text-teal-300" aria-hidden="true" />
              <span>Trained technicians for major home &amp; shop brands</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Wrench className="h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
              <span>2-hour arrival windows across Metro Manila, Laguna, Cebu &amp; Davao</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />
              <span>Pay via GCash, Maya, QR Ph, bank transfer, or cash</span>
            </li>
          </ul>
        </div>

        <p className="relative z-10 text-xs text-slate-300">
          &copy; 2026 Spindle Appliance Care Inc. All rights reserved.
        </p>
      </aside>

      {/* Right Clean Auth Form Canvas */}
      <main
        id="main-content"
        tabIndex={-1}
        className="flex flex-1 flex-col justify-start bg-card px-4 py-6 pb-safe sm:justify-center sm:px-12 sm:py-10 lg:px-16"
      >
        <div className="mx-auto w-full max-w-md">{children}</div>
      </main>
    </div>
  )
}

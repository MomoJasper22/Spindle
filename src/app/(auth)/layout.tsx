import * as React from 'react'
import Link from 'next/link'
import { CheckCircle2, ShieldCheck, Wrench } from 'lucide-react'
import { SpindleLogo } from '@/components/shared/spindle-logo'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh grid grid-cols-1 lg:grid-cols-2">
      {/* Left Brand & Customer Marketing Showcase with Editorial Background Photo */}
      <aside className="relative flex flex-col justify-between overflow-hidden bg-slate-950 px-6 py-8 text-white sm:px-10 lg:px-12 lg:py-12">
        {/* Background Picture */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/auth-showcase.jpg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
        />

        {/* High-Contrast Dark Gradient Scrim */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/80 to-slate-950/65"
        />

        <div className="relative z-10 flex items-center">
          <Link href="/" aria-label="Back to Spindle landing page">
            <SpindleLogo variant="light" size="lg" showTagline />
          </Link>
        </div>

        <div className="relative z-10 my-10 max-w-md space-y-6 lg:my-0">
          <div className="space-y-3">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl drop-shadow-xs">
              Dependable care for the appliances your home runs on.
            </h1>
            <p className="text-sm leading-relaxed text-slate-200 sm:text-base">
              Book verified local technicians at your convenience, review upfront Philippine Peso quotes, and pay securely after the job is done.
            </p>
          </div>

          <ul className="space-y-3 text-sm text-slate-100">
            <li className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 shrink-0 text-teal-300" aria-hidden="true" />
              <span>Certified specialists for major home &amp; inverter brands</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Wrench className="h-4 w-4 shrink-0 text-blue-300" aria-hidden="true" />
              <span>Flexible 2-hour arrival windows across Metro Manila, Laguna, Cebu &amp; Davao</span>
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
        className="flex flex-col justify-center bg-card px-6 py-10 sm:px-12 lg:px-16"
      >
        <div className="mx-auto w-full max-w-md">{children}</div>
      </main>
    </div>
  )
}

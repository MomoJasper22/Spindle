import * as React from 'react'
import Link from 'next/link'
import { CheckCircle2, MapPin, ShieldCheck, Wrench } from 'lucide-react'
import { SpindleLogo } from '@/components/shared/spindle-logo'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh grid grid-cols-1 lg:grid-cols-2">
      {/* Left Brand & Operational Showcase Panel */}
      <aside className="relative flex flex-col justify-between overflow-hidden bg-sidebar px-6 py-8 text-sidebar-foreground sm:px-10 lg:px-12 lg:py-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(#3B82F6 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" aria-label="Back to Spindle landing page">
            <SpindleLogo variant="light" size="lg" showTagline />
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1 text-xs font-medium text-teal-300">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            Philippines Service Network
          </span>
        </div>

        <div className="relative z-10 my-10 space-y-6 lg:my-0">
          <div className="space-y-3">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
              Precision appliance care, from booking to resolution.
            </h1>
            <p className="max-w-lg text-sm leading-relaxed text-slate-300 sm:text-base">
              Coordinated scheduling, verified technicians, and transparent Philippine Peso billing across Metro Manila, CALABARZON, Cebu, and Davao.
            </p>
          </div>

          {/* Workflow Stage Preview Card */}
          <div className="rounded-xl border border-slate-700/80 bg-slate-900/90 p-5 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Service Lifecycle
              </span>
              <span className="text-xs font-medium text-teal-300">Live Dispatch Sync</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { step: '01', title: 'Request', sub: 'Pick PH slot' },
                { step: '02', title: 'Dispatch', sub: 'Lock & assign' },
                { step: '03', title: 'Repair', sub: 'Field notes' },
                { step: '04', title: 'Settle', sub: 'PHP ledger' },
              ].map((item) => (
                <div
                  key={item.step}
                  className="rounded-lg border border-slate-800 bg-slate-950/60 p-3"
                >
                  <span className="font-mono text-[11px] font-semibold text-blue-400">
                    {item.step}
                  </span>
                  <p className="mt-1 text-sm font-semibold text-white">{item.title}</p>
                  <p className="text-xs text-slate-400">{item.sub}</p>
                </div>
              ))}
            </div>
          </div>

          <ul className="grid gap-3 sm:grid-cols-3 text-xs text-slate-300">
            <li className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-teal-400" aria-hidden="true" />
              <span>Verified Technicians</span>
            </li>
            <li className="flex items-center gap-2">
              <Wrench className="h-4 w-4 shrink-0 text-blue-400" aria-hidden="true" />
              <span>Multi-Brand Support</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
              <span>GCash, Maya &amp; QR Ph</span>
            </li>
          </ul>
        </div>

        <p className="relative z-10 text-xs text-slate-400">
          &copy; 2026 Spindle Field Operations Inc. All rights reserved.
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

'use client'

import * as React from 'react'
import Link from 'next/link'
import { Menu } from 'lucide-react'
import { SpindleLogo } from '@/components/shared/spindle-logo'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

const LANDING_LINKS = [
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Appliances', href: '#repair' },
  { label: 'Service Areas', href: '#service-areas' },
] as const

export function LandingHeader() {
  const [open, setOpen] = React.useState(false)

  return (
    <header className="sticky top-0 z-30 border-b-2 border-border bg-card/95 backdrop-blur-xs">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="Spindle Home" className="shrink-0">
          <SpindleLogo variant="dark" size="sm" />
        </Link>

        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-7 text-sm font-semibold text-muted-foreground"
        >
          {LANDING_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="hover:text-foreground transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-full bg-white px-5 text-foreground hover:bg-muted"
          >
            <Link href="/login">Sign In</Link>
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Open menu"
                className="h-9 w-9 md:hidden"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(20rem,88dvw)]">
              <SheetHeader>
                <SheetTitle>
                  <SpindleLogo variant="dark" size="sm" />
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Browse sections or sign in to Spindle
                </SheetDescription>
              </SheetHeader>

              <nav aria-label="Mobile navigation" className="flex flex-col gap-1 pt-2">
                {LANDING_LINKS.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex min-h-[44px] items-center rounded-xl px-3.5 text-base font-semibold text-foreground hover:bg-muted"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>

              <div className="mt-auto flex flex-col gap-2.5 border-t border-border pt-4">
                <Button
                  asChild
                  variant="outline"
                  className="w-full rounded-full bg-white text-foreground hover:bg-muted"
                  size="lg"
                >
                  <Link href="/login" onClick={() => setOpen(false)}>
                    Sign In
                  </Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

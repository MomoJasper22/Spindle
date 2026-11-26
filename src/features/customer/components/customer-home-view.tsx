import Link from 'next/link'
import {
  ArrowRight,
  CalendarCheck,
  CreditCard,
  Laptop,
  MapPin,
  Plus,
  UserCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/status-badge'
import { ActivityFeed } from '@/features/customer/components/activity-feed'
import { formatManilaDate, formatPHP } from '@/lib/formatters'
import type {
  ActivityLogRow,
  AppointmentDetailView,
  CustomerApplianceRow,
  PaymentDetailView,
  RepairDetailView,
} from '@/types/database'

interface CustomerHomeViewProps {
  firstName: string
  appliances: CustomerApplianceRow[]
  repairs: RepairDetailView[]
  appointments: AppointmentDetailView[]
  payments: PaymentDetailView[]
  activityLogs: ActivityLogRow[]
}

export function CustomerHomeView({
  firstName,
  appliances,
  repairs,
  appointments,
  payments,
  activityLogs,
}: CustomerHomeViewProps) {
  const activeAppliances = appliances.filter((a) => a.registration_status !== 'cancelled')
  const activeBookings = repairs.filter((r) => !['completed', 'cancelled'].includes(r.status))
  const nextBooking = activeBookings[0] ?? null
  const nextAppointment = nextBooking
    ? appointments.find((a) => a.ticket_id === nextBooking.ticket_id) ?? null
    : null

  const openBalancePhp = activeBookings.reduce((sum, r) => {
    const target = Number(r.final_cost_php ?? r.estimated_cost_php ?? 0)
    const paid = Number(r.verified_paid_php ?? 0)
    return sum + Math.max(0, target - paid)
  }, 0)

  const totalPaidPhp = payments
    .filter((p) => p.payment_status === 'verified')
    .reduce((sum, p) => sum + Number(p.amount_php), 0)

  return (
    <div className="space-y-6">
      {/* Greeting & Single Primary Action */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Magandang araw, {firstName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here is a quick look at your home visits, appliances, and payments.
          </p>
        </div>

        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link href={activeAppliances.length > 0 ? '/customer/bookings?book=1' : '/customer/appliances?add=1'}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>{activeAppliances.length > 0 ? 'Book a Home Visit' : 'Add Your First Appliance'}</span>
          </Link>
        </Button>
      </div>

      {/* Next Upcoming Visit Highlight (Passbook Card) */}
      {nextBooking ? (
        <div className="overflow-hidden rounded-2xl border-2 border-[#141B29] bg-card shadow-[0_14px_30px_-12px_rgba(20,27,41,0.16),0_4px_10px_rgba(20,27,41,0.05)]">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-[#141B29] px-5 py-3.5 text-[#F8F7F4]">
            <span className="font-heading text-sm font-semibold">Next Scheduled Visit</span>
            <StatusBadge status={nextBooking.status} audience="customer" />
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-3 sm:items-center">
            <div className="space-y-1">
              <p className="font-heading text-lg font-bold text-foreground">
                {nextBooking.appliance_brand} {nextBooking.appliance_category}
              </p>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {nextBooking.issue_description}
              </p>
            </div>

            <div className="space-y-1.5 text-sm">
              <p className="flex items-center gap-2 font-semibold text-foreground">
                <CalendarCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span>
                  {formatManilaDate(nextBooking.scheduled_date)}
                  {nextAppointment ? ` · ${nextAppointment.time_slot}` : ''}
                </span>
              </p>
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <UserCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span>
                  {nextBooking.technician_first_name
                    ? `Technician: ${nextBooking.technician_first_name} ${nextBooking.technician_last_name}`
                    : 'Matching you with a technician'}
                </span>
              </p>
              {nextAppointment?.service_address && (
                <p className="flex items-start gap-2 text-xs text-muted-foreground">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="line-clamp-1">{nextAppointment.service_address}</span>
                </p>
              )}
            </div>

            <div className="flex sm:justify-end">
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link href={`/customer/bookings/${nextBooking.ticket_id}`}>
                  <span>View Details</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Card className="bg-primary-tint/40 border-teal-200">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h2 className="font-heading text-lg font-bold text-foreground">
                No home visits booked right now
              </h2>
              <p className="text-sm text-muted-foreground">
                {activeAppliances.length > 0
                  ? 'Pick an appliance and a 2-hour window whenever you need cleaning or repair.'
                  : 'Start by saving an appliance (like your aircon or fridge), then pick a 2-hour visit window.'}
              </p>
            </div>
            <Button asChild className="w-full sm:w-auto shrink-0">
              <Link href={activeAppliances.length > 0 ? '/customer/bookings?book=1' : '/customer/appliances?add=1'}>
                <span>{activeAppliances.length > 0 ? 'Schedule a Visit' : 'Add Appliance'}</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 3 Simple Navigation Summary Cards */}
      <div className="grid gap-3.5 sm:grid-cols-3">
        <Link
          href="/customer/appliances"
          className="group rounded-2xl border border-border bg-card p-5 shadow-2xs transition-colors hover:border-primary/50"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-muted-foreground">My Appliances</span>
            <Laptop className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <p className="mt-2 font-heading text-2xl font-bold text-foreground tabular-nums">
            {activeAppliances.length}
          </p>
          <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:underline">
            <span>Manage appliances</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </p>
        </Link>

        <Link
          href="/customer/bookings"
          className="group rounded-2xl border border-border bg-card p-5 shadow-2xs transition-colors hover:border-primary/50"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-muted-foreground">Active Bookings</span>
            <CalendarCheck className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <p className="mt-2 font-heading text-2xl font-bold text-foreground tabular-nums">
            {activeBookings.length}
          </p>
          <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:underline">
            <span>See all visits</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </p>
        </Link>

        <Link
          href="/customer/payments"
          className="group rounded-2xl border border-border bg-card p-5 shadow-2xs transition-colors hover:border-primary/50"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-muted-foreground">
              {openBalancePhp > 0 ? 'Balance Due' : 'Total Paid'}
            </span>
            <CreditCard className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <p className="mt-2 font-heading text-2xl font-bold text-foreground tabular-nums">
            {formatPHP(openBalancePhp > 0 ? openBalancePhp : totalPaidPhp)}
          </p>
          <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:underline">
            <span>{openBalancePhp > 0 ? 'Pay balance' : 'View payments'}</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </p>
        </Link>
      </div>

      {/* Concise Recent Updates (Top 4 Only, Zero Overload) */}
      <ActivityFeed
        logs={activityLogs.slice(0, 4)}
        title="Recent Updates"
        description="Your latest appliance, booking, and payment updates."
        audience="customer"
      />
    </div>
  )
}

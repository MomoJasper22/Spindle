import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type {
  ActivityLogRow,
  AppointmentDetailView,
  CustomerApplianceRow,
  PaymentDetailView,
  RepairDetailView,
  TechnicianProfileRow,
  TechnicianStatusLogRow,
  UserWithRole,
} from '@/types/database'

const USER_PUBLIC_COLUMNS =
  'user_id, auth_user_id, first_name, last_name, middle_name, nickname, email, phone, user_type_id, branch_location, avatar_url, avatar_position, admin_permissions, address_street, address_barangay, address_city, address_province, address_zip_code, is_onboarded, is_active, created_at, updated_at, user_types(type_name, description)'

const PORTAL_CACHE = { stale: 120, revalidate: 30, expire: 300 } as const

// ---------------------------------------------------------------------------
// Customer Portal Queries
// ---------------------------------------------------------------------------

export async function getCustomerAppliances(customerId: string): Promise<CustomerApplianceRow[]> {
  'use cache: private'
  cacheTag('customer-appliances')
  cacheLife(PORTAL_CACHE)

  const supabase = await createClient()
  const { data } = await supabase
    .from('customer_appliances')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })

  return (data ?? []) as CustomerApplianceRow[]
}

export async function getCustomerRepairs(customerId: string): Promise<RepairDetailView[]> {
  'use cache: private'
  cacheTag('customer-repairs')
  cacheLife(PORTAL_CACHE)

  const supabase = await createClient()
  const { data } = await supabase
    .from('v_repair_details')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })

  return (data ?? []) as RepairDetailView[]
}

export async function getCustomerAppointments(customerId: string): Promise<AppointmentDetailView[]> {
  'use cache: private'
  cacheTag('customer-appointments')
  cacheLife(PORTAL_CACHE)

  const supabase = await createClient()
  const { data } = await supabase
    .from('v_appointment_details')
    .select('*')
    .eq('customer_id', customerId)
    .order('scheduled_date', { ascending: true })

  return (data ?? []) as AppointmentDetailView[]
}

export async function getCustomerPayments(customerId: string): Promise<PaymentDetailView[]> {
  'use cache: private'
  cacheTag('customer-payments')
  cacheLife(PORTAL_CACHE)

  const supabase = await createClient()
  const { data } = await supabase
    .from('v_payment_details')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })

  return (data ?? []) as PaymentDetailView[]
}

export async function getCustomerActivityLogs(limit = 5): Promise<ActivityLogRow[]> {
  'use cache: private'
  cacheTag('customer-activity')
  cacheLife(PORTAL_CACHE)

  const supabase = await createClient()
  const { data } = await supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data ?? []) as ActivityLogRow[]
}

// ---------------------------------------------------------------------------
// Technician Portal Queries
// ---------------------------------------------------------------------------

export async function getTechnicianRepairs(techId: string): Promise<RepairDetailView[]> {
  'use cache: private'
  cacheTag('technician-repairs')
  cacheLife(PORTAL_CACHE)

  const supabase = await createClient()
  const { data } = await supabase
    .from('v_repair_details')
    .select('*')
    .eq('technician_id', techId)
    .order('scheduled_date', { ascending: true })

  return (data ?? []) as RepairDetailView[]
}

export async function getTechnicianAppointments(techId: string): Promise<AppointmentDetailView[]> {
  'use cache: private'
  cacheTag('technician-appointments')
  cacheLife(PORTAL_CACHE)

  const supabase = await createClient()
  const { data } = await supabase
    .from('v_appointment_details')
    .select('*')
    .eq('technician_id', techId)
    .order('scheduled_date', { ascending: true })

  return (data ?? []) as AppointmentDetailView[]
}

export async function getTechnicianPayments(): Promise<PaymentDetailView[]> {
  'use cache: private'
  cacheTag('technician-payments')
  cacheLife(PORTAL_CACHE)

  const supabase = await createClient()
  const { data } = await supabase
    .from('v_payment_details')
    .select('*')
    .order('created_at', { ascending: false })

  return (data ?? []) as PaymentDetailView[]
}

export async function getTechnicianActivityLogs(limit = 10): Promise<ActivityLogRow[]> {
  'use cache: private'
  cacheTag('technician-activity')
  cacheLife(PORTAL_CACHE)

  const supabase = await createClient()
  const { data } = await supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data ?? []) as ActivityLogRow[]
}

// ---------------------------------------------------------------------------
// Admin Portal Queries
// ---------------------------------------------------------------------------

export async function getAdminUsers(): Promise<UserWithRole[]> {
  'use cache: private'
  cacheTag('admin-users')
  cacheLife(PORTAL_CACHE)

  const supabase = await createClient()
  const { data } = await supabase
    .from('users')
    .select(USER_PUBLIC_COLUMNS)
    .order('created_at', { ascending: false })

  return (data ?? []).map((row) => ({
    ...row,
    user_types: Array.isArray(row.user_types) ? row.user_types[0] ?? null : row.user_types ?? null,
  })) as unknown as UserWithRole[]
}

export async function getAdminTechProfiles(): Promise<TechnicianProfileRow[]> {
  'use cache: private'
  cacheTag('admin-tech-profiles')
  cacheLife(PORTAL_CACHE)

  const supabase = await createClient()
  const { data } = await supabase.from('technician_profiles').select('*')

  return (data ?? []) as TechnicianProfileRow[]
}

export async function getAdminRepairs(): Promise<RepairDetailView[]> {
  'use cache: private'
  cacheTag('admin-repairs')
  cacheLife(PORTAL_CACHE)

  const supabase = await createClient()
  const { data } = await supabase
    .from('v_repair_details')
    .select('*')
    .order('created_at', { ascending: false })

  return (data ?? []) as RepairDetailView[]
}

export async function getAdminAppointments(): Promise<AppointmentDetailView[]> {
  'use cache: private'
  cacheTag('admin-appointments')
  cacheLife(PORTAL_CACHE)

  const supabase = await createClient()
  const { data } = await supabase
    .from('v_appointment_details')
    .select('*')
    .order('scheduled_date', { ascending: true })

  return (data ?? []) as AppointmentDetailView[]
}

export async function getAdminPayments(): Promise<PaymentDetailView[]> {
  'use cache: private'
  cacheTag('admin-payments')
  cacheLife(PORTAL_CACHE)

  const supabase = await createClient()
  const { data } = await supabase
    .from('v_payment_details')
    .select('*')
    .order('created_at', { ascending: false })

  return (data ?? []) as PaymentDetailView[]
}

export async function getAdminAppliances(): Promise<CustomerApplianceRow[]> {
  'use cache: private'
  cacheTag('admin-appliances')
  cacheLife(PORTAL_CACHE)

  const supabase = await createClient()
  const { data } = await supabase
    .from('customer_appliances')
    .select('*')
    .order('created_at', { ascending: false })

  return (data ?? []) as CustomerApplianceRow[]
}

export async function getAdminStatusLogs(limit = 500): Promise<TechnicianStatusLogRow[]> {
  'use cache: private'
  cacheTag('admin-status-logs')
  cacheLife(PORTAL_CACHE)

  const supabase = await createClient()
  const { data } = await supabase
    .from('technician_status_logs')
    .select('*')
    .order('changed_at', { ascending: false })
    .limit(limit)

  return (data ?? []) as TechnicianStatusLogRow[]
}

export async function getAdminActivityLogs(limit = 20): Promise<ActivityLogRow[]> {
  'use cache: private'
  cacheTag('admin-activity')
  cacheLife(PORTAL_CACHE)

  const supabase = await createClient()
  const { data } = await supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data ?? []) as ActivityLogRow[]
}

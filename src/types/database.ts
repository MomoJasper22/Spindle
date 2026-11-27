import type { AvatarPosition } from '@/lib/avatar'
import type {
  AdminFeatureKey,
  ApplianceIconKey,
  AppointmentStatus,
  PaymentMethod,
  PaymentStatus,
  RegistrationStatus,
  RepairPriority,
  RepairStatus,
  ServiceType,
  TechAvailabilityStatus,
  TimeSlot,
  UserRole,
} from '@/lib/constants'

export interface UserRow {
  user_id: string
  auth_user_id: string | null
  first_name: string
  last_name: string
  middle_name: string | null
  nickname?: string | null
  email: string
  phone: string | null
  user_type_id: string
  branch_location: string | null
  avatar_url?: string | null
  avatar_position?: AvatarPosition | null
  admin_permissions?: AdminFeatureKey[] | null
  address_street: string | null
  address_barangay: string | null
  address_city: string | null
  address_province: string | null
  address_zip_code: string | null
  is_onboarded: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserWithRole extends UserRow {
  user_types: {
    type_name: UserRole
    description: string | null
  } | null
}

export interface TechnicianProfileRow {
  tech_profile_id: string
  technician_id: string
  specializations: string[]
  proposed_specializations?: string[]
  certification_no: string | null
  availability_status: TechAvailabilityStatus
  max_daily_jobs: number
  created_at: string
  updated_at: string
}

export interface TechnicianStatusLogRow {
  log_id: string
  technician_id: string
  previous_status: TechAvailabilityStatus | null
  new_status: TechAvailabilityStatus
  changed_by: string | null
  changed_at: string
}

export interface CustomerApplianceRow {
  appliance_id: string
  customer_id: string
  brand: string
  category: string
  icon?: ApplianceIconKey | null
  model_number: string
  serial_number: string
  purchase_date: string | null
  registration_status: RegistrationStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ActivityLogRow {
  log_id: string
  actor_id: string | null
  entity_type: 'user' | 'appliance' | 'repair' | 'appointment' | 'payment' | 'technician'
  entity_id: string
  action: string
  description: string
  created_at: string
}

export interface RepairDetailView {
  ticket_id: string
  customer_id: string
  technician_id: string | null
  appliance_id: string
  service_type: ServiceType
  issue_description: string
  diagnostic_notes: string | null
  status: RepairStatus
  priority: RepairPriority
  estimated_cost_php: number
  final_cost_php: number | null
  scheduled_date: string
  completed_at: string | null
  created_at: string
  updated_at: string
  customer_first_name: string
  customer_last_name: string
  customer_email: string
  customer_phone: string | null
  customer_branch: string | null
  customer_address_street: string | null
  customer_address_barangay: string | null
  customer_address_city: string | null
  customer_address_province: string | null
  customer_address_zip_code: string | null
  technician_first_name: string | null
  technician_last_name: string | null
  technician_phone: string | null
  technician_branch: string | null
  appliance_brand: string
  appliance_category: string
  appliance_model_number: string
  appliance_serial_number: string
  appliance_registration_status: RegistrationStatus
  verified_paid_php: number
  pending_paid_php: number
  payment_count: number
  appliance_icon?: ApplianceIconKey | null
}

export interface AppointmentDetailView {
  appointment_id: string
  ticket_id: string
  customer_id: string
  technician_id: string | null
  scheduled_date: string
  time_slot: TimeSlot
  service_address: string
  appointment_status: AppointmentStatus
  remarks: string | null
  created_at: string
  updated_at: string
  service_type: ServiceType
  repair_status: RepairStatus
  repair_priority: RepairPriority
  issue_description: string
  customer_first_name: string
  customer_last_name: string
  customer_phone: string | null
  customer_branch: string | null
  technician_first_name: string | null
  technician_last_name: string | null
  appliance_brand: string
  appliance_category: string
  appliance_model_number: string
  appliance_serial_number: string
}

export interface PaymentDetailView {
  payment_id: string
  ticket_id: string
  received_by: string | null
  payment_method: PaymentMethod
  amount_php: number
  installment_no: number | null
  payment_date: string
  reference_no: string | null
  payment_status: PaymentStatus
  remarks: string | null
  created_at: string
  customer_id: string
  repair_status: RepairStatus
  estimated_cost_php: number
  final_cost_php: number | null
  customer_first_name: string
  customer_last_name: string
  customer_branch: string | null
  received_by_first_name: string | null
  received_by_last_name: string | null
  appliance_brand: string
  appliance_category: string
  appliance_model_number: string
  paymongo_checkout_id?: string | null
  paymongo_payment_id?: string | null
}

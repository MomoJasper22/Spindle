export const SERVICE_BRANCHES = [
  'Metro Manila - North (Quezon City)',
  'Metro Manila - Central (Makati / Pasig)',
  'Metro Manila - South (Alabang / Paranaque)',
  'CALABARZON Hub (Sta. Rosa, Laguna)',
  'Central Visayas Hub (Cebu City)',
  'Southern Mindanao Hub (Davao City)',
] as const

export const APPLIANCE_CATEGORIES = [
  'Split-Type Aircon',
  'Window-Type Aircon',
  'Inverter Refrigerator',
  'Front-Load Washing Machine',
  'Top-Load Washing Machine',
  'Gas / Induction Range',
  'Commercial Chiller / Freezer',
  'Microwave Oven',
  'Water Dispenser',
  'Television',
  'Clothes Dryer',
  'Electric Fan',
  'Water Heater',
] as const

export const APPLIANCE_ICON_KEYS = [
  'split-aircon',
  'window-aircon',
  'refrigerator',
  'washing-machine',
  'top-load-washer',
  'cooking-range',
  'commercial-chiller',
  'microwave-oven',
  'water-dispenser',
  'television',
  'clothes-dryer',
  'electric-fan',
  'water-heater',
] as const

export type ApplianceIconKey = (typeof APPLIANCE_ICON_KEYS)[number]

export const APPLIANCE_ICON_LABELS: Record<ApplianceIconKey, string> = {
  'split-aircon': 'Split Aircon',
  'window-aircon': 'Window Aircon',
  refrigerator: 'Refrigerator',
  'washing-machine': 'Front-Load Washer',
  'top-load-washer': 'Top-Load Washer',
  'cooking-range': 'Cooking Range',
  'commercial-chiller': 'Commercial Chiller',
  'microwave-oven': 'Microwave',
  'water-dispenser': 'Water Dispenser',
  television: 'Smart TV',
  'clothes-dryer': 'Clothes Dryer',
  'electric-fan': 'Electric Fan',
  'water-heater': 'Shower Heater',
}

const CATEGORY_TO_ICON_MAP: Record<string, ApplianceIconKey> = {
  'Split-Type Aircon': 'split-aircon',
  'Window-Type Aircon': 'window-aircon',
  'Inverter Refrigerator': 'refrigerator',
  'Front-Load Washing Machine': 'washing-machine',
  'Top-Load Washing Machine': 'top-load-washer',
  'Gas / Induction Range': 'cooking-range',
  'Commercial Chiller / Freezer': 'commercial-chiller',
  'Microwave Oven': 'microwave-oven',
  'Water Dispenser': 'water-dispenser',
  Television: 'television',
  'Clothes Dryer': 'clothes-dryer',
  'Electric Fan': 'electric-fan',
  'Water Heater': 'water-heater',
}

export function isValidApplianceIconKey(value: unknown): value is ApplianceIconKey {
  return typeof value === 'string' && (APPLIANCE_ICON_KEYS as readonly string[]).includes(value)
}

export function getDefaultApplianceIcon(category?: string | null): ApplianceIconKey {
  if (category && category in CATEGORY_TO_ICON_MAP) {
    return CATEGORY_TO_ICON_MAP[category]
  }
  return 'split-aircon'
}

export function resolveApplianceIconKey(
  icon?: string | null,
  category?: string | null
): ApplianceIconKey {
  return isValidApplianceIconKey(icon) ? icon : getDefaultApplianceIcon(category)
}

export const APPLIANCE_BRAND_SUGGESTIONS = [
  'Carrier',
  'Condura',
  'Panasonic',
  'LG',
  'Samsung',
  'Daikin',
  'Koppel',
  'Whirlpool',
  'Fujidenzo',
  'Sharp',
  'Midea',
  'Haier',
] as const

export const PAYMENT_METHODS = [
  'Cash',
  'GCash',
  'Maya',
  'QR Ph',
  'Bank Transfer (BPI / BDO / UnionBank)',
  'Credit / Debit Card',
] as const

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export const TIME_SLOTS = [
  '08:00 AM - 10:00 AM',
  '10:00 AM - 12:00 PM',
  '01:00 PM - 03:00 PM',
  '03:00 PM - 05:00 PM',
] as const

export type TimeSlot = (typeof TIME_SLOTS)[number]

export const SERVICE_TYPES = [
  { value: 'diagnostic', label: 'Diagnostic Inspection' },
  { value: 'repair', label: 'Appliance Repair' },
  { value: 'maintenance_cleaning', label: 'Maintenance & Deep Cleaning' },
  { value: 'installation', label: 'Unit Installation' },
] as const

export type ServiceType = (typeof SERVICE_TYPES)[number]['value']

export const SERVICE_BOOKING_FEES_PHP: Record<ServiceType, number> = {
  diagnostic: 200,
  repair: 450,
  maintenance_cleaning: 650,
  installation: 800,
}

export const SERVICE_FULL_PRICES_PHP: Record<ServiceType, number> = {
  diagnostic: 350,
  repair: 1500,
  maintenance_cleaning: 1200,
  installation: 2000,
}

export const CHECKOUT_PAYMENT_MODES = ['down_payment', 'full_payment'] as const

export type CheckoutPaymentMode = (typeof CHECKOUT_PAYMENT_MODES)[number]

export function getServiceBookingFeePhp(serviceType: ServiceType): number {
  return SERVICE_BOOKING_FEES_PHP[serviceType] ?? 450
}

export function getServiceFullPricePhp(serviceType: ServiceType): number {
  return SERVICE_FULL_PRICES_PHP[serviceType] ?? 1500
}

export const REPAIR_STATUSES = [
  'pending',
  'confirmed',
  'assigned',
  'in_progress',
  'awaiting_payment',
  'completed',
  'cancelled',
] as const

export type RepairStatus = (typeof REPAIR_STATUSES)[number]

export const REPAIR_PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const

export type RepairPriority = (typeof REPAIR_PRIORITIES)[number]

export const APPOINTMENT_STATUSES = [
  'requested',
  'confirmed',
  'rescheduled',
  'completed',
  'cancelled',
] as const

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number]

export const REGISTRATION_STATUSES = [
  'pending_verification',
  'verified',
  'cancelled',
] as const

export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number]

export const PAYMENT_STATUSES = [
  'pending_verification',
  'verified',
  'cancelled',
] as const

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

export const TECH_AVAILABILITY_STATUSES = [
  'available',
  'busy',
  'lunch',
  'off_duty',
] as const

export type TechAvailabilityStatus = (typeof TECH_AVAILABILITY_STATUSES)[number]

export const USER_TYPE_IDS = {
  customer: 'UTP-CUST',
  technician: 'UTP-TECH',
  admin: 'UTP-ADMIN',
} as const

export type UserRole = keyof typeof USER_TYPE_IDS

export const ADMIN_FEATURES = [
  {
    key: 'dashboard',
    label: 'Executive Summary',
    description: 'Operations KPIs, lifecycle distribution, and system activity log',
    href: '/admin/dashboard',
  },
  {
    key: 'repairs',
    label: 'Repair Tickets',
    description: 'Create walk-in tickets, update costs, and manage repair progress',
    href: '/admin/repairs',
  },
  {
    key: 'appointments',
    label: 'Dispatch Board',
    description: 'Schedule home visits, assign technicians, and lock time slots',
    href: '/admin/appointments',
  },
  {
    key: 'payments',
    label: 'Payments Ledger',
    description: 'Verify payments, record collections, and export payment CSVs',
    href: '/admin/payments',
  },
  {
    key: 'technicians',
    label: 'Technicians Roster',
    description: 'Assign specializations, daily job capacity, and review productivity',
    href: '/admin/technicians',
  },
  {
    key: 'appliances',
    label: 'Appliances Registry',
    description: 'Verify customer-registered units and serial numbers',
    href: '/admin/appliances',
  },
  {
    key: 'users',
    label: 'Users & Roles',
    description: 'Create accounts, configure roles, and manage admin access',
    href: '/admin/users',
  },
] as const

export type AdminFeatureKey = (typeof ADMIN_FEATURES)[number]['key']

export const ADMIN_FEATURE_KEYS = ADMIN_FEATURES.map((f) => f.key) as readonly AdminFeatureKey[]

export const PH_PROVINCES = [
  'Metro Manila',
  'Cavite',
  'Laguna',
  'Batangas',
  'Rizal',
  'Bulacan',
  'Pampanga',
  'Cebu',
  'Davao del Sur',
  'Iloilo',
  'Negros Occidental',
] as const

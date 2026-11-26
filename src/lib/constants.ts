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

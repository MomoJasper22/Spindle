-- ============================================================================
-- Migration 001: Schema, Alphanumeric Primary Keys, Indexes, Views & Seed Data
-- Project: Spindle (Philippine Appliance Repair & Field Service CRM)
-- ============================================================================

-- Ensure pgcrypto is available for cryptographic random IDs & bcrypt hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ----------------------------------------------------------------------------
-- 1. Alphanumeric Primary Key Generator
-- Generates IDs like USR-8K4M2P9X, TKT-5R9W3L7Q (guaranteed letters + digits)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_alphanumeric_id(prefix TEXT)
RETURNS VARCHAR(20)
LANGUAGE plpgsql
VOLATILE
SET search_path = public, extensions
AS $$
DECLARE
  chars CONSTANT TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  digits CONSTANT TEXT := '0123456789';
  letters CONSTANT TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  clean_prefix TEXT;
  rand_bytes BYTEA;
  suffix TEXT := '';
  i INT;
  idx INT;
  has_digit BOOLEAN := FALSE;
  has_letter BOOLEAN := FALSE;
  ch TEXT;
BEGIN
  clean_prefix := UPPER(REGEXP_REPLACE(COALESCE(prefix, 'ID'), '[^A-Za-z0-9]', '', 'g'));
  IF LENGTH(clean_prefix) = 0 THEN
    clean_prefix := 'ID';
  END IF;
  clean_prefix := LEFT(clean_prefix, 6);

  rand_bytes := gen_random_bytes(10);

  FOR i IN 0..7 LOOP
    idx := (get_byte(rand_bytes, i) % 36) + 1;
    ch := SUBSTR(chars, idx, 1);
    IF ch ~ '[0-9]' THEN
      has_digit := TRUE;
    ELSE
      has_letter := TRUE;
    END IF;
    suffix := suffix || ch;
  END LOOP;

  -- Guarantee suffix always contains both a digit and a letter
  IF NOT has_digit THEN
    idx := (get_byte(rand_bytes, 8) % 10) + 1;
    suffix := OVERLAY(suffix PLACING SUBSTR(digits, idx, 1) FROM ((get_byte(rand_bytes, 9) % 8) + 1) FOR 1);
  END IF;

  IF NOT has_letter THEN
    idx := (get_byte(rand_bytes, 8) % 26) + 1;
    suffix := OVERLAY(suffix PLACING SUBSTR(letters, idx, 1) FROM ((get_byte(rand_bytes, 9) % 8) + 1) FOR 1);
  END IF;

  RETURN (clean_prefix || '-' || suffix)::VARCHAR(20);
END;
$$;

-- ----------------------------------------------------------------------------
-- 2. Auto-updated timestamp trigger
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. Password Hashing Helper (Service-role only via explicit GRANT/REVOKE)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.hash_password_bcrypt(raw_password TEXT)
RETURNS VARCHAR(255)
LANGUAGE sql
VOLATILE
SET search_path = public, extensions
AS $$
  SELECT crypt(raw_password, gen_salt('bf', 10))::VARCHAR(255);
$$;

REVOKE ALL ON FUNCTION public.hash_password_bcrypt(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.hash_password_bcrypt(TEXT) TO service_role;

-- ----------------------------------------------------------------------------
-- 4. Core Tables (Strictly NO warranty, inventory, or notifications tables)
-- ----------------------------------------------------------------------------

-- 4.1 user_types
CREATE TABLE public.user_types (
  user_type_id VARCHAR(20) PRIMARY KEY,
  type_name VARCHAR(30) UNIQUE NOT NULL CHECK (type_name IN ('customer', 'technician', 'admin')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed ONLY the 3 mandatory system roles
INSERT INTO public.user_types (user_type_id, type_name, description)
VALUES
  ('UTP-CUST', 'customer', 'Appliance owner and service customer'),
  ('UTP-TECH', 'technician', 'Certified field service repair technician'),
  ('UTP-ADMIN', 'admin', 'Operations administrator and dispatch manager')
ON CONFLICT (user_type_id) DO NOTHING;

-- 4.2 users
CREATE TABLE public.users (
  user_id VARCHAR(20) PRIMARY KEY DEFAULT public.generate_alphanumeric_id('USR'),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100) NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(25),
  user_type_id VARCHAR(20) NOT NULL REFERENCES public.user_types(user_type_id),
  branch_location VARCHAR(100),
  address_street VARCHAR(150),
  address_barangay VARCHAR(100),
  address_city VARCHAR(100),
  address_province VARCHAR(100),
  address_zip_code VARCHAR(10),
  is_onboarded BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 4.3 technician_profiles
CREATE TABLE public.technician_profiles (
  tech_profile_id VARCHAR(20) PRIMARY KEY DEFAULT public.generate_alphanumeric_id('TCP'),
  technician_id VARCHAR(20) UNIQUE NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  specializations TEXT[] NOT NULL DEFAULT '{}',
  certification_no VARCHAR(100),
  availability_status VARCHAR(30) NOT NULL DEFAULT 'available'
    CHECK (availability_status IN ('available', 'busy', 'off_duty')),
  max_daily_jobs INT NOT NULL DEFAULT 4 CHECK (max_daily_jobs BETWEEN 1 AND 15),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_technician_profiles_updated_at
  BEFORE UPDATE ON public.technician_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 4.4 customer_appliances (Warranty columns intentionally omitted)
CREATE TABLE public.customer_appliances (
  appliance_id VARCHAR(20) PRIMARY KEY DEFAULT public.generate_alphanumeric_id('APL'),
  customer_id VARCHAR(20) NOT NULL REFERENCES public.users(user_id) ON DELETE RESTRICT,
  brand VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL,
  model_number VARCHAR(100) NOT NULL,
  serial_number VARCHAR(100) UNIQUE NOT NULL,
  purchase_date DATE,
  registration_status VARCHAR(30) NOT NULL DEFAULT 'pending_verification'
    CHECK (registration_status IN ('pending_verification', 'verified', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_customer_appliances_updated_at
  BEFORE UPDATE ON public.customer_appliances
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 4.5 repair (Warranty columns intentionally omitted)
CREATE TABLE public.repair (
  ticket_id VARCHAR(20) PRIMARY KEY DEFAULT public.generate_alphanumeric_id('TKT'),
  customer_id VARCHAR(20) NOT NULL REFERENCES public.users(user_id) ON DELETE RESTRICT,
  technician_id VARCHAR(20) NULL REFERENCES public.users(user_id) ON DELETE SET NULL,
  appliance_id VARCHAR(20) NOT NULL REFERENCES public.customer_appliances(appliance_id) ON DELETE RESTRICT,
  service_type VARCHAR(30) NOT NULL
    CHECK (service_type IN ('diagnostic', 'repair', 'maintenance_cleaning', 'installation')),
  issue_description TEXT NOT NULL,
  diagnostic_notes TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'assigned', 'in_progress', 'awaiting_payment', 'completed', 'cancelled')),
  priority VARCHAR(20) NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  estimated_cost_php NUMERIC(10,2) DEFAULT 0.00 CHECK (estimated_cost_php >= 0),
  final_cost_php NUMERIC(10,2) NULL CHECK (final_cost_php IS NULL OR final_cost_php >= 0),
  scheduled_date DATE NOT NULL,
  completed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_repair_updated_at
  BEFORE UPDATE ON public.repair
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 4.6 appointments
CREATE TABLE public.appointments (
  appointment_id VARCHAR(20) PRIMARY KEY DEFAULT public.generate_alphanumeric_id('APT'),
  ticket_id VARCHAR(20) NOT NULL REFERENCES public.repair(ticket_id) ON DELETE CASCADE,
  customer_id VARCHAR(20) NOT NULL REFERENCES public.users(user_id) ON DELETE RESTRICT,
  technician_id VARCHAR(20) NULL REFERENCES public.users(user_id) ON DELETE SET NULL,
  scheduled_date DATE NOT NULL,
  time_slot VARCHAR(30) NOT NULL
    CHECK (time_slot IN ('08:00 AM - 10:00 AM', '10:00 AM - 12:00 PM', '01:00 PM - 03:00 PM', '03:00 PM - 05:00 PM')),
  service_address TEXT NOT NULL,
  appointment_status VARCHAR(30) NOT NULL DEFAULT 'requested'
    CHECK (appointment_status IN ('requested', 'confirmed', 'rescheduled', 'completed', 'cancelled')),
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 4.7 payments
CREATE TABLE public.payments (
  payment_id VARCHAR(20) PRIMARY KEY DEFAULT public.generate_alphanumeric_id('PAY'),
  ticket_id VARCHAR(20) NOT NULL REFERENCES public.repair(ticket_id) ON DELETE RESTRICT,
  received_by VARCHAR(20) NULL REFERENCES public.users(user_id) ON DELETE SET NULL,
  payment_method VARCHAR(60) NOT NULL
    CHECK (payment_method IN ('Cash', 'GCash', 'Maya', 'QR Ph', 'Bank Transfer (BPI / BDO / UnionBank)', 'Credit / Debit Card')),
  amount_php NUMERIC(10,2) NOT NULL CHECK (amount_php > 0),
  installment_no INT NULL CHECK (installment_no IS NULL OR installment_no >= 1),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reference_no VARCHAR(100),
  payment_status VARCHAR(30) NOT NULL DEFAULT 'pending_verification'
    CHECK (payment_status IN ('pending_verification', 'verified', 'cancelled')),
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.8 activity_logs
CREATE TABLE public.activity_logs (
  log_id VARCHAR(20) PRIMARY KEY DEFAULT public.generate_alphanumeric_id('LOG'),
  actor_id VARCHAR(20) NULL REFERENCES public.users(user_id) ON DELETE SET NULL,
  entity_type VARCHAR(30) NOT NULL
    CHECK (entity_type IN ('user', 'appliance', 'repair', 'appointment', 'payment', 'technician')),
  entity_id VARCHAR(20) NOT NULL,
  action VARCHAR(60) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 5. Indexes on Foreign Keys, Filter Columns & Composite Query Paths
-- ----------------------------------------------------------------------------

-- users
CREATE INDEX idx_users_auth_user_id ON public.users (auth_user_id);
CREATE INDEX idx_users_user_type_active ON public.users (user_type_id, is_active);
CREATE INDEX idx_users_branch_location ON public.users (branch_location);

-- technician_profiles
CREATE INDEX idx_technician_profiles_technician_id ON public.technician_profiles (technician_id);
CREATE INDEX idx_technician_profiles_availability ON public.technician_profiles (availability_status);

-- customer_appliances
CREATE INDEX idx_customer_appliances_customer_id ON public.customer_appliances (customer_id);
CREATE INDEX idx_customer_appliances_status ON public.customer_appliances (registration_status);

-- repair
CREATE INDEX idx_repair_customer_id ON public.repair (customer_id, created_at DESC);
CREATE INDEX idx_repair_technician_status ON public.repair (technician_id, status);
CREATE INDEX idx_repair_appliance_id ON public.repair (appliance_id);
CREATE INDEX idx_repair_status_scheduled ON public.repair (status, scheduled_date);

-- appointments
CREATE INDEX idx_appointments_ticket_id ON public.appointments (ticket_id);
CREATE INDEX idx_appointments_customer_id ON public.appointments (customer_id, scheduled_date DESC);
CREATE INDEX idx_appointments_tech_slot ON public.appointments (technician_id, scheduled_date, time_slot);
CREATE INDEX idx_appointments_date_status ON public.appointments (scheduled_date, appointment_status);

-- payments
CREATE INDEX idx_payments_ticket_status ON public.payments (ticket_id, payment_status);
CREATE INDEX idx_payments_received_by ON public.payments (received_by);
CREATE INDEX idx_payments_date ON public.payments (payment_date DESC);

-- activity_logs
CREATE INDEX idx_activity_logs_actor_created ON public.activity_logs (actor_id, created_at DESC);
CREATE INDEX idx_activity_logs_entity ON public.activity_logs (entity_type, entity_id, created_at DESC);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs (created_at DESC);

-- ----------------------------------------------------------------------------
-- 6. Relational SQL JOIN Views (Respecting Caller RLS via security_invoker)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.v_repair_details
WITH (security_invoker = true) AS
SELECT
  r.ticket_id,
  r.customer_id,
  r.technician_id,
  r.appliance_id,
  r.service_type,
  r.issue_description,
  r.diagnostic_notes,
  r.status,
  r.priority,
  r.estimated_cost_php,
  r.final_cost_php,
  r.scheduled_date,
  r.completed_at,
  r.created_at,
  r.updated_at,
  c.first_name AS customer_first_name,
  c.last_name AS customer_last_name,
  c.email AS customer_email,
  c.phone AS customer_phone,
  c.branch_location AS customer_branch,
  c.address_street AS customer_address_street,
  c.address_barangay AS customer_address_barangay,
  c.address_city AS customer_address_city,
  c.address_province AS customer_address_province,
  c.address_zip_code AS customer_address_zip_code,
  t.first_name AS technician_first_name,
  t.last_name AS technician_last_name,
  t.phone AS technician_phone,
  t.branch_location AS technician_branch,
  a.brand AS appliance_brand,
  a.category AS appliance_category,
  a.model_number AS appliance_model_number,
  a.serial_number AS appliance_serial_number,
  a.registration_status AS appliance_registration_status,
  COALESCE(pay_agg.verified_paid_php, 0.00) AS verified_paid_php,
  COALESCE(pay_agg.pending_paid_php, 0.00) AS pending_paid_php,
  COALESCE(pay_agg.payment_count, 0) AS payment_count
FROM public.repair r
JOIN public.users c ON c.user_id = r.customer_id
LEFT JOIN public.users t ON t.user_id = r.technician_id
JOIN public.customer_appliances a ON a.appliance_id = r.appliance_id
LEFT JOIN LATERAL (
  SELECT
    SUM(CASE WHEN p.payment_status = 'verified' THEN p.amount_php ELSE 0 END) AS verified_paid_php,
    SUM(CASE WHEN p.payment_status = 'pending_verification' THEN p.amount_php ELSE 0 END) AS pending_paid_php,
    COUNT(p.payment_id)::INT AS payment_count
  FROM public.payments p
  WHERE p.ticket_id = r.ticket_id AND p.payment_status <> 'cancelled'
) pay_agg ON TRUE;

CREATE OR REPLACE VIEW public.v_appointment_details
WITH (security_invoker = true) AS
SELECT
  ap.appointment_id,
  ap.ticket_id,
  ap.customer_id,
  ap.technician_id,
  ap.scheduled_date,
  ap.time_slot,
  ap.service_address,
  ap.appointment_status,
  ap.remarks,
  ap.created_at,
  ap.updated_at,
  r.service_type,
  r.status AS repair_status,
  r.priority AS repair_priority,
  r.issue_description,
  c.first_name AS customer_first_name,
  c.last_name AS customer_last_name,
  c.phone AS customer_phone,
  c.branch_location AS customer_branch,
  t.first_name AS technician_first_name,
  t.last_name AS technician_last_name,
  a.brand AS appliance_brand,
  a.category AS appliance_category,
  a.model_number AS appliance_model_number,
  a.serial_number AS appliance_serial_number
FROM public.appointments ap
JOIN public.repair r ON r.ticket_id = ap.ticket_id
JOIN public.users c ON c.user_id = ap.customer_id
LEFT JOIN public.users t ON t.user_id = ap.technician_id
JOIN public.customer_appliances a ON a.appliance_id = r.appliance_id;

CREATE OR REPLACE VIEW public.v_payment_details
WITH (security_invoker = true) AS
SELECT
  p.payment_id,
  p.ticket_id,
  p.received_by,
  p.payment_method,
  p.amount_php,
  p.installment_no,
  p.payment_date,
  p.reference_no,
  p.payment_status,
  p.remarks,
  p.created_at,
  r.customer_id,
  r.status AS repair_status,
  r.estimated_cost_php,
  r.final_cost_php,
  c.first_name AS customer_first_name,
  c.last_name AS customer_last_name,
  c.branch_location AS customer_branch,
  rb.first_name AS received_by_first_name,
  rb.last_name AS received_by_last_name,
  a.brand AS appliance_brand,
  a.category AS appliance_category,
  a.model_number AS appliance_model_number
FROM public.payments p
JOIN public.repair r ON r.ticket_id = p.ticket_id
JOIN public.users c ON c.user_id = r.customer_id
LEFT JOIN public.users rb ON rb.user_id = p.received_by
JOIN public.customer_appliances a ON a.appliance_id = r.appliance_id;

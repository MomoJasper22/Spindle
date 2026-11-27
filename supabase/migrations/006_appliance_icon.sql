-- ============================================================================
-- Migration 006: Customer Appliance Icon Column & Updated Repair View
-- Project: Spindle
-- ============================================================================

ALTER TABLE public.customer_appliances
  ADD COLUMN IF NOT EXISTS icon VARCHAR(50) NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_customer_appliances_icon_valid'
  ) THEN
    ALTER TABLE public.customer_appliances
      ADD CONSTRAINT chk_customer_appliances_icon_valid
      CHECK (
        icon IS NULL
        OR icon IN (
          'split-aircon',
          'window-aircon',
          'refrigerator',
          'washing-machine',
          'cooking-range',
          'commercial-chiller',
          'microwave-oven',
          'water-dispenser',
          'television',
          'clothes-dryer',
          'electric-fan',
          'water-heater'
        )
      );
  END IF;
END $$;

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
  COALESCE(pay_agg.payment_count, 0) AS payment_count,
  a.icon AS appliance_icon
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

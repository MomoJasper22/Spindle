-- ============================================================================
-- Migration 008: Technician 'lunch' Availability Status &
--                PayMongo Down Payment vs. Pay in Full Booking Modes
-- Project: Spindle
-- ============================================================================

-- 1. Update technician_profiles.availability_status CHECK constraint to allow 'lunch'
DO $$
DECLARE
  c_name TEXT;
BEGIN
  FOR c_name IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'technician_profiles'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%availability_status%'
  LOOP
    EXECUTE FORMAT('ALTER TABLE public.technician_profiles DROP CONSTRAINT IF EXISTS %I', c_name);
  END LOOP;
END $$;

ALTER TABLE public.technician_profiles
  ADD CONSTRAINT chk_technician_profiles_availability_status
  CHECK (availability_status IN ('available', 'busy', 'lunch', 'off_duty'));

-- 2. Update technician_status_logs CHECK constraints to allow 'lunch'
DO $$
DECLARE
  c_name TEXT;
BEGIN
  FOR c_name IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'technician_status_logs'
      AND con.contype = 'c'
      AND (
        pg_get_constraintdef(con.oid) ILIKE '%previous_status%'
        OR pg_get_constraintdef(con.oid) ILIKE '%new_status%'
      )
  LOOP
    EXECUTE FORMAT('ALTER TABLE public.technician_status_logs DROP CONSTRAINT IF EXISTS %I', c_name);
  END LOOP;
END $$;

ALTER TABLE public.technician_status_logs
  ADD CONSTRAINT chk_tech_status_logs_previous_status
  CHECK (previous_status IS NULL OR previous_status IN ('available', 'busy', 'lunch', 'off_duty'));

ALTER TABLE public.technician_status_logs
  ADD CONSTRAINT chk_tech_status_logs_new_status
  CHECK (new_status IN ('available', 'busy', 'lunch', 'off_duty'));

-- 3. Add payment_mode & estimated_service_cost_php to payment_checkout_sessions
ALTER TABLE public.payment_checkout_sessions
  ADD COLUMN IF NOT EXISTS payment_mode VARCHAR(30) NOT NULL DEFAULT 'down_payment';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_payment_checkout_sessions_payment_mode'
  ) THEN
    ALTER TABLE public.payment_checkout_sessions
      ADD CONSTRAINT chk_payment_checkout_sessions_payment_mode
      CHECK (payment_mode IN ('down_payment', 'full_payment'));
  END IF;
END $$;

ALTER TABLE public.payment_checkout_sessions
  ADD COLUMN IF NOT EXISTS estimated_service_cost_php NUMERIC(10,2) NULL
  CHECK (estimated_service_cost_php IS NULL OR estimated_service_cost_php >= 0);

-- 4. Update rpc_finalize_paid_booking_checkout to respect down_payment vs full_payment
CREATE OR REPLACE FUNCTION public.rpc_finalize_paid_booking_checkout(
  p_session_id VARCHAR(20),
  p_paymongo_payment_id VARCHAR(100),
  p_payment_method VARCHAR(60)
)
RETURNS TABLE (
  ticket_id VARCHAR(20),
  appointment_id VARCHAR(20),
  payment_id VARCHAR(20),
  already_finalized BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_session RECORD;
  v_appliance RECORD;
  v_existing_payment_id VARCHAR(20);
  v_existing_ticket_id VARCHAR(20);
  v_existing_appointment_id VARCHAR(20);
  v_ticket_id VARCHAR(20);
  v_appointment_id VARCHAR(20);
  v_payment_id VARCHAR(20);
  v_is_full_payment BOOLEAN;
  v_estimated_cost NUMERIC(10,2);
  v_final_cost NUMERIC(10,2);
  v_payment_remarks TEXT;
BEGIN
  SELECT *
  INTO v_session
  FROM public.payment_checkout_sessions s
  WHERE s.session_id = p_session_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Checkout session % not found.', p_session_id;
  END IF;

  IF v_session.session_kind <> 'booking_deposit' THEN
    RAISE EXCEPTION 'Checkout session % is not a booking deposit session.', p_session_id;
  END IF;

  IF v_session.status = 'completed' AND v_session.ticket_id IS NOT NULL THEN
    SELECT ap.appointment_id INTO v_existing_appointment_id
    FROM public.appointments ap
    WHERE ap.ticket_id = v_session.ticket_id
    ORDER BY ap.created_at DESC
    LIMIT 1;

    SELECT p.payment_id INTO v_existing_payment_id
    FROM public.payments p
    WHERE p.ticket_id = v_session.ticket_id
      AND (p.paymongo_checkout_id = v_session.paymongo_checkout_id OR p.paymongo_payment_id = p_paymongo_payment_id)
    LIMIT 1;

    RETURN QUERY SELECT
      v_session.ticket_id,
      v_existing_appointment_id,
      v_existing_payment_id,
      TRUE;
    RETURN;
  END IF;

  SELECT p.payment_id, p.ticket_id INTO v_existing_payment_id, v_existing_ticket_id
  FROM public.payments p
  WHERE p.paymongo_checkout_id = v_session.paymongo_checkout_id
     OR (p_paymongo_payment_id IS NOT NULL AND p.paymongo_payment_id = p_paymongo_payment_id)
  LIMIT 1;

  IF FOUND THEN
    SELECT ap.appointment_id INTO v_existing_appointment_id
    FROM public.appointments ap
    WHERE ap.ticket_id = v_existing_ticket_id
    ORDER BY ap.created_at DESC
    LIMIT 1;

    UPDATE public.payment_checkout_sessions
    SET status = 'completed',
        ticket_id = v_existing_ticket_id,
        paymongo_payment_id = COALESCE(paymongo_payment_id, p_paymongo_payment_id)
    WHERE session_id = p_session_id;

    RETURN QUERY SELECT
      v_existing_ticket_id,
      v_existing_appointment_id,
      v_existing_payment_id,
      TRUE;
    RETURN;
  END IF;

  SELECT appliance_id, customer_id, registration_status, brand, model_number
  INTO v_appliance
  FROM public.customer_appliances
  WHERE appliance_id = v_session.appliance_id
  FOR UPDATE;

  IF NOT FOUND OR v_appliance.customer_id <> v_session.customer_id THEN
    RAISE EXCEPTION 'Appliance % does not belong to customer %.', v_session.appliance_id, v_session.customer_id;
  END IF;

  IF v_appliance.registration_status = 'cancelled' THEN
    RAISE EXCEPTION 'Cannot place booking for an inactive appliance.';
  END IF;

  v_is_full_payment := (COALESCE(v_session.payment_mode, 'down_payment') = 'full_payment');
  v_estimated_cost := COALESCE(v_session.estimated_service_cost_php, v_session.amount_php);
  v_final_cost := CASE WHEN v_is_full_payment THEN v_session.amount_php ELSE NULL END;
  v_payment_remarks := CASE
    WHEN v_is_full_payment THEN 'Paid in full upfront via PayMongo'
    ELSE 'Down payment via PayMongo (remaining balance due in full after repair)'
  END;

  INSERT INTO public.repair (
    customer_id,
    appliance_id,
    service_type,
    issue_description,
    status,
    priority,
    estimated_cost_php,
    final_cost_php,
    scheduled_date
  ) VALUES (
    v_session.customer_id,
    v_session.appliance_id,
    v_session.service_type,
    TRIM(v_session.issue_description),
    'pending',
    COALESCE(v_session.priority, 'normal'),
    v_estimated_cost,
    v_final_cost,
    v_session.scheduled_date
  )
  RETURNING public.repair.ticket_id INTO v_ticket_id;

  INSERT INTO public.appointments (
    ticket_id,
    customer_id,
    scheduled_date,
    time_slot,
    service_address,
    appointment_status,
    remarks
  ) VALUES (
    v_ticket_id,
    v_session.customer_id,
    v_session.scheduled_date,
    v_session.time_slot,
    TRIM(v_session.service_address),
    'requested',
    NULLIF(TRIM(COALESCE(v_session.remarks, '')), '')
  )
  RETURNING public.appointments.appointment_id INTO v_appointment_id;

  INSERT INTO public.payments (
    ticket_id,
    received_by,
    payment_method,
    amount_php,
    installment_no,
    reference_no,
    payment_status,
    remarks,
    paymongo_checkout_id,
    paymongo_payment_id
  ) VALUES (
    v_ticket_id,
    NULL,
    p_payment_method,
    v_session.amount_php,
    NULL,
    COALESCE(NULLIF(TRIM(COALESCE(p_paymongo_payment_id, '')), ''), v_session.paymongo_checkout_id),
    'verified',
    v_payment_remarks,
    v_session.paymongo_checkout_id,
    p_paymongo_payment_id
  )
  RETURNING public.payments.payment_id INTO v_payment_id;

  UPDATE public.payment_checkout_sessions
  SET status = 'completed',
      ticket_id = v_ticket_id,
      paymongo_payment_id = p_paymongo_payment_id
  WHERE session_id = p_session_id;

  INSERT INTO public.activity_logs (
    actor_id,
    entity_type,
    entity_id,
    action,
    description
  ) VALUES (
    v_session.customer_id,
    'repair',
    v_ticket_id,
    'repair_booked_and_paid',
    FORMAT(
      'Paid PHP %s (%s) via PayMongo and booked %s for %s %s on %s (%s).',
      TO_CHAR(v_session.amount_php, 'FM999,999,990.00'),
      CASE WHEN v_is_full_payment THEN 'full payment' ELSE 'down payment' END,
      REPLACE(v_session.service_type, '_', ' '),
      v_appliance.brand,
      v_appliance.model_number,
      TO_CHAR(v_session.scheduled_date, 'Mon DD, YYYY'),
      v_session.time_slot
    )
  );

  RETURN QUERY SELECT v_ticket_id, v_appointment_id, v_payment_id, FALSE;
END;
$$;

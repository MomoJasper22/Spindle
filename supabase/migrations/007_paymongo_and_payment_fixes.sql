-- ============================================================================
-- Migration 007: PayMongo Pay-First Booking Checkouts, Double-Payment
--                Prevention & Payment Ledger Logic Hardening
-- Project: Spindle
-- ============================================================================

-- 1. Extend public.payments with PayMongo gateway tracking & uniqueness guards
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS paymongo_checkout_id VARCHAR(100) NULL;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS paymongo_payment_id VARCHAR(100) NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_paymongo_checkout_unique
  ON public.payments (paymongo_checkout_id)
  WHERE paymongo_checkout_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_paymongo_payment_unique
  ON public.payments (paymongo_payment_id)
  WHERE paymongo_payment_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_ticket_ref_active_unique
  ON public.payments (ticket_id, LOWER(TRIM(reference_no)))
  WHERE payment_status <> 'cancelled'
    AND reference_no IS NOT NULL
    AND BTRIM(reference_no) <> '';

-- Expose PayMongo IDs at the end of v_payment_details (preserving existing column order)
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
  a.model_number AS appliance_model_number,
  p.paymongo_checkout_id,
  p.paymongo_payment_id
FROM public.payments p
JOIN public.repair r ON r.ticket_id = p.ticket_id
JOIN public.users c ON c.user_id = r.customer_id
LEFT JOIN public.users rb ON rb.user_id = p.received_by
JOIN public.customer_appliances a ON a.appliance_id = r.appliance_id;

-- 2. Create payment_checkout_sessions table for Pay-First Booking & Balance PayMongo Checkouts
CREATE TABLE IF NOT EXISTS public.payment_checkout_sessions (
  session_id VARCHAR(20) PRIMARY KEY DEFAULT public.generate_alphanumeric_id('CHK'),
  session_kind VARCHAR(30) NOT NULL CHECK (session_kind IN ('booking_deposit', 'ticket_balance')),
  customer_id VARCHAR(20) NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  ticket_id VARCHAR(20) NULL REFERENCES public.repair(ticket_id) ON DELETE CASCADE,
  appliance_id VARCHAR(20) NULL REFERENCES public.customer_appliances(appliance_id) ON DELETE RESTRICT,
  service_type VARCHAR(30) NULL
    CHECK (service_type IS NULL OR service_type IN ('diagnostic', 'repair', 'maintenance_cleaning', 'installation')),
  priority VARCHAR(20) NULL
    CHECK (priority IS NULL OR priority IN ('low', 'normal', 'high', 'urgent')),
  issue_description TEXT NULL,
  scheduled_date DATE NULL,
  time_slot VARCHAR(30) NULL
    CHECK (time_slot IS NULL OR time_slot IN ('08:00 AM - 10:00 AM', '10:00 AM - 12:00 PM', '01:00 PM - 03:00 PM', '03:00 PM - 05:00 PM')),
  service_address TEXT NULL,
  remarks TEXT NULL,
  amount_php NUMERIC(10,2) NOT NULL CHECK (amount_php > 0),
  paymongo_checkout_id VARCHAR(100) UNIQUE NOT NULL,
  paymongo_payment_id VARCHAR(100) NULL,
  checkout_url TEXT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'awaiting_payment'
    CHECK (status IN ('awaiting_payment', 'completed', 'cancelled', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_checkout_sessions_customer
  ON public.payment_checkout_sessions (customer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_checkout_sessions_ticket_status
  ON public.payment_checkout_sessions (ticket_id, status)
  WHERE ticket_id IS NOT NULL;

DROP TRIGGER IF EXISTS trg_payment_checkout_sessions_updated_at ON public.payment_checkout_sessions;
CREATE TRIGGER trg_payment_checkout_sessions_updated_at
  BEFORE UPDATE ON public.payment_checkout_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.payment_checkout_sessions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'payment_checkout_sessions'
      AND policyname = 'checkout_sessions_select_authorized'
  ) THEN
    CREATE POLICY checkout_sessions_select_authorized
      ON public.payment_checkout_sessions
      FOR SELECT
      TO authenticated
      USING (
        (select private.is_admin())
        OR customer_id = (select private.current_user_id())
      );
  END IF;
END $$;

-- 3. Harden rpc_record_and_verify_payment against double payments & premature completion
CREATE OR REPLACE FUNCTION public.rpc_record_and_verify_payment(
  p_ticket_id VARCHAR(20),
  p_payment_id VARCHAR(20) DEFAULT NULL,
  p_payment_method VARCHAR(60) DEFAULT NULL,
  p_amount_php NUMERIC(10,2) DEFAULT NULL,
  p_installment_no INT DEFAULT NULL,
  p_reference_no VARCHAR(100) DEFAULT NULL,
  p_remarks TEXT DEFAULT NULL,
  p_verify_immediately BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  payment_id VARCHAR(20),
  ticket_id VARCHAR(20),
  payment_status VARCHAR(30),
  verified_total_php NUMERIC(10,2),
  repair_status VARCHAR(30)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_caller_id VARCHAR(20);
  v_caller_role VARCHAR(30);
  v_repair RECORD;
  v_payment RECORD;
  v_result_payment_id VARCHAR(20);
  v_result_payment_status VARCHAR(30);
  v_verified_total NUMERIC(10,2);
  v_pending_total NUMERIC(10,2);
  v_new_repair_status VARCHAR(30);
  v_clean_ref VARCHAR(100);
BEGIN
  v_caller_id := private.current_user_id();
  v_caller_role := private.current_user_role();

  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: inactive or unauthenticated user.';
  END IF;

  -- Lock repair row first
  SELECT r.ticket_id, r.customer_id, r.technician_id, r.status, r.final_cost_php, r.estimated_cost_php
  INTO v_repair
  FROM public.repair r
  WHERE r.ticket_id = p_ticket_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Repair ticket % not found.', p_ticket_id;
  END IF;

  IF v_repair.status = 'cancelled' THEN
    RAISE EXCEPTION 'Cannot record or verify payments for a cancelled ticket.';
  END IF;

  -- Mode A: Verify an existing pending_verification payment (Admin only)
  IF p_payment_id IS NOT NULL THEN
    IF v_caller_role <> 'admin' THEN
      RAISE EXCEPTION 'Forbidden: only administrators can verify submitted payments.';
    END IF;

    SELECT p.payment_id, p.ticket_id, p.payment_status, p.amount_php, p.payment_method
    INTO v_payment
    FROM public.payments p
    WHERE p.payment_id = p_payment_id
    FOR UPDATE;

    IF NOT FOUND OR v_payment.ticket_id <> p_ticket_id THEN
      RAISE EXCEPTION 'Payment % not found for ticket %.', p_payment_id, p_ticket_id;
    END IF;

    IF v_payment.payment_status = 'cancelled' THEN
      RAISE EXCEPTION 'Cannot verify a cancelled payment.';
    END IF;

    IF v_payment.payment_status = 'verified' THEN
      RAISE EXCEPTION 'Payment % is already verified.', p_payment_id;
    END IF;

    UPDATE public.payments
    SET payment_status = 'verified',
        remarks = COALESCE(NULLIF(TRIM(COALESCE(p_remarks, '')), ''), remarks)
    WHERE public.payments.payment_id = p_payment_id;

    v_result_payment_id := p_payment_id;
    v_result_payment_status := 'verified';

  -- Mode B: Insert a new payment (Customer, assigned Technician, or Admin)
  ELSE
    IF v_repair.status = 'completed' THEN
      RAISE EXCEPTION 'This repair ticket is already completed and settled.';
    END IF;

    IF p_payment_method IS NULL OR p_amount_php IS NULL OR p_amount_php <= 0 THEN
      RAISE EXCEPTION 'Validation error: payment method and positive amount are required.';
    END IF;

    IF v_caller_role = 'customer' AND v_repair.customer_id <> v_caller_id THEN
      RAISE EXCEPTION 'Forbidden: you can only submit payments for your own repair tickets.';
    ELSIF v_caller_role = 'technician' AND v_repair.technician_id <> v_caller_id THEN
      RAISE EXCEPTION 'Forbidden: technicians can only record payments for assigned repair tickets.';
    ELSIF v_caller_role NOT IN ('customer', 'technician', 'admin') THEN
      RAISE EXCEPTION 'Forbidden: invalid role.';
    END IF;

    SELECT
      COALESCE(SUM(CASE WHEN p.payment_status = 'verified' THEN p.amount_php ELSE 0 END), 0.00),
      COALESCE(SUM(CASE WHEN p.payment_status = 'pending_verification' THEN p.amount_php ELSE 0 END), 0.00)
    INTO v_verified_total, v_pending_total
    FROM public.payments p
    WHERE p.ticket_id = p_ticket_id
      AND p.payment_status <> 'cancelled';

    IF v_repair.final_cost_php IS NOT NULL AND v_repair.final_cost_php > 0 THEN
      IF (v_verified_total + v_pending_total) >= v_repair.final_cost_php THEN
        RAISE EXCEPTION 'Double-payment blocked: verified and pending payments already cover the full bill for %.', p_ticket_id;
      END IF;
      IF (v_verified_total + v_pending_total + p_amount_php) > v_repair.final_cost_php THEN
        RAISE EXCEPTION 'Overpayment blocked: amount exceeds remaining unpaid balance of PHP %.',
          TO_CHAR(v_repair.final_cost_php - (v_verified_total + v_pending_total), 'FM999,999,990.00');
      END IF;
    END IF;

    v_clean_ref := NULLIF(TRIM(COALESCE(p_reference_no, '')), '');
    IF v_clean_ref IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.payments p
      WHERE p.ticket_id = p_ticket_id
        AND p.payment_status <> 'cancelled'
        AND p.reference_no IS NOT NULL
        AND LOWER(TRIM(p.reference_no)) = LOWER(v_clean_ref)
    ) THEN
      RAISE EXCEPTION 'Duplicate reference number: % has already been recorded for this ticket.', v_clean_ref;
    END IF;

    IF p_verify_immediately AND v_caller_role = 'admin' THEN
      v_result_payment_status := 'verified';
    ELSE
      v_result_payment_status := 'pending_verification';
    END IF;

    INSERT INTO public.payments (
      ticket_id,
      received_by,
      payment_method,
      amount_php,
      installment_no,
      reference_no,
      payment_status,
      remarks
    ) VALUES (
      p_ticket_id,
      CASE WHEN v_caller_role IN ('technician', 'admin') THEN v_caller_id ELSE NULL END,
      p_payment_method,
      p_amount_php,
      p_installment_no,
      v_clean_ref,
      v_result_payment_status,
      NULLIF(TRIM(COALESCE(p_remarks, '')), '')
    )
    RETURNING public.payments.payment_id INTO v_result_payment_id;
  END IF;

  -- Calculate cumulative verified payments
  SELECT COALESCE(SUM(p.amount_php), 0.00)
  INTO v_verified_total
  FROM public.payments p
  WHERE p.ticket_id = p_ticket_id
    AND p.payment_status = 'verified';

  v_new_repair_status := v_repair.status;

  -- Transition repair to completed once settled in full against final_cost_php
  -- (Only when repair has already started or is awaiting_payment, never before visit)
  IF v_repair.final_cost_php IS NOT NULL
     AND v_repair.final_cost_php > 0
     AND v_verified_total >= v_repair.final_cost_php
     AND v_repair.status IN ('in_progress', 'awaiting_payment') THEN
    UPDATE public.repair
    SET status = 'completed',
        completed_at = COALESCE(completed_at, NOW())
    WHERE public.repair.ticket_id = p_ticket_id;

    UPDATE public.appointments
    SET appointment_status = 'completed'
    WHERE public.appointments.ticket_id = p_ticket_id
      AND public.appointments.appointment_status IN ('requested', 'confirmed', 'rescheduled');

    v_new_repair_status := 'completed';
  END IF;

  INSERT INTO public.activity_logs (
    actor_id,
    entity_type,
    entity_id,
    action,
    description
  ) VALUES (
    v_caller_id,
    'payment',
    v_result_payment_id,
    CASE WHEN v_result_payment_status = 'verified' THEN 'payment_verified' ELSE 'payment_recorded' END,
    FORMAT(
      'Payment %s for ticket %s marked %s (Verified total: PHP %s).',
      v_result_payment_id,
      p_ticket_id,
      v_result_payment_status,
      TO_CHAR(v_verified_total, 'FM999,999,990.00')
    )
  );

  RETURN QUERY SELECT
    v_result_payment_id,
    p_ticket_id,
    v_result_payment_status,
    v_verified_total,
    v_new_repair_status;
END;
$$;

-- 4. Atomic Idempotent PayMongo Pay-First Booking Finalizer (service_role only)
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

  -- Idempotency: already finalized (e.g., webhook + return URL race or page reload)
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

  -- Prevent duplicate payment insertion if paymongo_checkout_id or paymongo_payment_id already exists
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

  INSERT INTO public.repair (
    customer_id,
    appliance_id,
    service_type,
    issue_description,
    status,
    priority,
    estimated_cost_php,
    scheduled_date
  ) VALUES (
    v_session.customer_id,
    v_session.appliance_id,
    v_session.service_type,
    TRIM(v_session.issue_description),
    'pending',
    COALESCE(v_session.priority, 'normal'),
    v_session.amount_php,
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
    1,
    COALESCE(NULLIF(TRIM(COALESCE(p_paymongo_payment_id, '')), ''), v_session.paymongo_checkout_id),
    'verified',
    'Upfront booking fee paid via PayMongo',
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
      'Paid PHP %s via PayMongo and booked %s for %s %s on %s (%s).',
      TO_CHAR(v_session.amount_php, 'FM999,999,990.00'),
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

-- 5. Atomic Idempotent PayMongo Balance Payment Finalizer (service_role only)
CREATE OR REPLACE FUNCTION public.rpc_finalize_ticket_payment_checkout(
  p_session_id VARCHAR(20),
  p_paymongo_payment_id VARCHAR(100),
  p_payment_method VARCHAR(60),
  p_paid_amount_php NUMERIC(10,2) DEFAULT NULL
)
RETURNS TABLE (
  payment_id VARCHAR(20),
  ticket_id VARCHAR(20),
  verified_total_php NUMERIC(10,2),
  repair_status VARCHAR(30),
  already_finalized BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_session RECORD;
  v_repair RECORD;
  v_existing_payment_id VARCHAR(20);
  v_payment_id VARCHAR(20);
  v_amount NUMERIC(10,2);
  v_verified_total NUMERIC(10,2);
  v_new_status VARCHAR(30);
BEGIN
  SELECT *
  INTO v_session
  FROM public.payment_checkout_sessions s
  WHERE s.session_id = p_session_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Checkout session % not found.', p_session_id;
  END IF;

  IF v_session.session_kind <> 'ticket_balance' OR v_session.ticket_id IS NULL THEN
    RAISE EXCEPTION 'Checkout session % is not a ticket balance payment session.', p_session_id;
  END IF;

  SELECT r.ticket_id, r.status, r.final_cost_php
  INTO v_repair
  FROM public.repair r
  WHERE r.ticket_id = v_session.ticket_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket % not found.', v_session.ticket_id;
  END IF;

  -- Check if payment already recorded for this PayMongo checkout or payment ID
  SELECT p.payment_id
  INTO v_existing_payment_id
  FROM public.payments p
  WHERE p.paymongo_checkout_id = v_session.paymongo_checkout_id
     OR (p_paymongo_payment_id IS NOT NULL AND p.paymongo_payment_id = p_paymongo_payment_id)
  LIMIT 1;

  IF v_session.status = 'completed' OR v_existing_payment_id IS NOT NULL THEN
    SELECT COALESCE(SUM(p.amount_php), 0.00) INTO v_verified_total
    FROM public.payments p
    WHERE p.ticket_id = v_session.ticket_id AND p.payment_status = 'verified';

    IF v_session.status <> 'completed' THEN
      UPDATE public.payment_checkout_sessions
      SET status = 'completed',
          paymongo_payment_id = COALESCE(paymongo_payment_id, p_paymongo_payment_id)
      WHERE session_id = p_session_id;
    END IF;

    RETURN QUERY SELECT
      v_existing_payment_id,
      v_session.ticket_id,
      v_verified_total,
      v_repair.status,
      TRUE;
    RETURN;
  END IF;

  v_amount := COALESCE(p_paid_amount_php, v_session.amount_php);

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
    v_session.ticket_id,
    NULL,
    p_payment_method,
    v_amount,
    NULL,
    COALESCE(NULLIF(TRIM(COALESCE(p_paymongo_payment_id, '')), ''), v_session.paymongo_checkout_id),
    'verified',
    COALESCE(NULLIF(TRIM(COALESCE(v_session.remarks, '')), ''), 'Online payment via PayMongo'),
    v_session.paymongo_checkout_id,
    p_paymongo_payment_id
  )
  RETURNING public.payments.payment_id INTO v_payment_id;

  UPDATE public.payment_checkout_sessions
  SET status = 'completed',
      paymongo_payment_id = p_paymongo_payment_id
  WHERE session_id = p_session_id;

  SELECT COALESCE(SUM(p.amount_php), 0.00) INTO v_verified_total
  FROM public.payments p
  WHERE p.ticket_id = v_session.ticket_id
    AND p.payment_status = 'verified';

  v_new_status := v_repair.status;

  IF v_repair.final_cost_php IS NOT NULL
     AND v_repair.final_cost_php > 0
     AND v_verified_total >= v_repair.final_cost_php
     AND v_repair.status IN ('in_progress', 'awaiting_payment') THEN
    UPDATE public.repair
    SET status = 'completed',
        completed_at = COALESCE(completed_at, NOW())
    WHERE public.repair.ticket_id = v_session.ticket_id;

    UPDATE public.appointments
    SET appointment_status = 'completed'
    WHERE public.appointments.ticket_id = v_session.ticket_id
      AND public.appointments.appointment_status IN ('requested', 'confirmed', 'rescheduled');

    v_new_status := 'completed';
  END IF;

  INSERT INTO public.activity_logs (
    actor_id,
    entity_type,
    entity_id,
    action,
    description
  ) VALUES (
    v_session.customer_id,
    'payment',
    v_payment_id,
    'payment_verified',
    FORMAT(
      'Verified PayMongo payment %s (PHP %s) for ticket %s.',
      v_payment_id,
      TO_CHAR(v_amount, 'FM999,999,990.00'),
      v_session.ticket_id
    )
  );

  RETURN QUERY SELECT v_payment_id, v_session.ticket_id, v_verified_total, v_new_status, FALSE;
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_finalize_paid_booking_checkout(VARCHAR, VARCHAR, VARCHAR) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rpc_finalize_ticket_payment_checkout(VARCHAR, VARCHAR, VARCHAR, NUMERIC) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_finalize_paid_booking_checkout(VARCHAR, VARCHAR, VARCHAR) TO service_role;
GRANT EXECUTE ON FUNCTION public.rpc_finalize_ticket_payment_checkout(VARCHAR, VARCHAR, VARCHAR, NUMERIC) TO service_role;

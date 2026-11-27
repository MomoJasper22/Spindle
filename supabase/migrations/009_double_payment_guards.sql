-- ============================================================================
-- Migration 009: Double-Payment & Overpayment Guards Across PayMongo & Field Collections
-- Project: Spindle
-- ============================================================================

-- 1. Harden rpc_record_and_verify_payment:
--    - Require final_cost_php > 0 when technicians record field collections
--    - Strictly block duplicate/over-balance payments against final_cost_php
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

    IF v_caller_role IN ('customer', 'technician')
       AND (v_repair.final_cost_php IS NULL OR v_repair.final_cost_php <= 0) THEN
      RAISE EXCEPTION 'Final service price must be set before collecting or paying a remaining balance.';
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
    ELSIF v_repair.estimated_cost_php IS NOT NULL AND v_repair.estimated_cost_php > 0 THEN
      IF (v_verified_total + v_pending_total) >= v_repair.estimated_cost_php THEN
        RAISE EXCEPTION 'Double-payment blocked: existing payments already cover the estimated service cost for %.', p_ticket_id;
      END IF;
      IF (v_verified_total + v_pending_total + p_amount_php) > v_repair.estimated_cost_php THEN
        RAISE EXCEPTION 'Overpayment blocked: amount exceeds remaining estimated balance of PHP %.',
          TO_CHAR(v_repair.estimated_cost_php - (v_verified_total + v_pending_total), 'FM999,999,990.00');
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

-- 2. Harden rpc_finalize_ticket_payment_checkout against already-settled / over-balance races
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
  v_pending_total NUMERIC(10,2);
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

  SELECT
    COALESCE(SUM(CASE WHEN p.payment_status = 'verified' THEN p.amount_php ELSE 0 END), 0.00),
    COALESCE(SUM(CASE WHEN p.payment_status = 'pending_verification' THEN p.amount_php ELSE 0 END), 0.00)
  INTO v_verified_total, v_pending_total
  FROM public.payments p
  WHERE p.ticket_id = v_session.ticket_id
    AND p.payment_status <> 'cancelled';

  IF v_repair.status = 'completed'
     OR v_repair.status = 'cancelled'
     OR (v_repair.final_cost_php IS NOT NULL AND v_repair.final_cost_php > 0 AND (v_verified_total + v_pending_total) >= v_repair.final_cost_php)
     OR (v_repair.final_cost_php IS NOT NULL AND v_repair.final_cost_php > 0 AND (v_verified_total + v_pending_total + v_amount) > v_repair.final_cost_php) THEN
    UPDATE public.payment_checkout_sessions
    SET status = 'cancelled'
    WHERE session_id = p_session_id;

    RAISE EXCEPTION 'Double-payment blocked: ticket % is already settled or covered by existing payments.', v_session.ticket_id;
  END IF;

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

-- ============================================================================
-- Migration 003: Atomic Transactional RPCs & Row-Level Locking (FOR UPDATE)
-- Project: Spindle (Philippine Appliance Repair & Field Service CRM)
--
-- Explicit Transaction Semantics:
-- PostgreSQL executes every PL/pgSQL RPC function inside an ACID transaction.
-- Any exception inside BEGIN ... EXCEPTION triggers an automatic ROLLBACK of
-- all statements in the call, while normal return executes COMMIT.
--
-- Reference Standalone SQL Transaction Block:
--   START TRANSACTION;
--     SELECT * FROM public.customer_appliances WHERE appliance_id = 'APL-...' FOR UPDATE;
--     INSERT INTO public.repair (...) VALUES (...);
--     INSERT INTO public.appointments (...) VALUES (...);
--     INSERT INTO public.activity_logs (...) VALUES (...);
--   COMMIT; -- or ROLLBACK on constraint/validation error
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. rpc_create_repair_with_appointment
-- Locks target customer_appliances row (FOR UPDATE), validates ownership & active
-- registration, inserts repair + initial appointment + activity_log atomically.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_create_repair_with_appointment(
  p_customer_id VARCHAR(20),
  p_appliance_id VARCHAR(20),
  p_service_type VARCHAR(30),
  p_priority VARCHAR(20),
  p_issue_description TEXT,
  p_scheduled_date DATE,
  p_time_slot VARCHAR(30),
  p_service_address TEXT,
  p_remarks TEXT DEFAULT NULL
)
RETURNS TABLE (
  ticket_id VARCHAR(20),
  appointment_id VARCHAR(20)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_caller_id VARCHAR(20);
  v_caller_role VARCHAR(30);
  v_appliance RECORD;
  v_customer RECORD;
  v_ticket_id VARCHAR(20);
  v_appointment_id VARCHAR(20);
BEGIN
  v_caller_id := private.current_user_id();
  v_caller_role := private.current_user_role();

  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: inactive or unauthenticated user.';
  END IF;

  IF v_caller_role <> 'admin' AND v_caller_id <> p_customer_id THEN
    RAISE EXCEPTION 'Forbidden: customers can only create repair requests for their own account.';
  END IF;

  IF p_scheduled_date < (NOW() AT TIME ZONE 'Asia/Manila')::DATE THEN
    RAISE EXCEPTION 'Validation error: scheduled date cannot be in the past.';
  END IF;

  -- Lock customer row then appliance row in canonical order
  SELECT user_id, is_active INTO v_customer
  FROM public.users
  WHERE user_id = p_customer_id
  FOR UPDATE;

  IF NOT FOUND OR v_customer.is_active = FALSE THEN
    RAISE EXCEPTION 'Customer account is not active or does not exist.';
  END IF;

  SELECT appliance_id, customer_id, registration_status, brand, model_number
  INTO v_appliance
  FROM public.customer_appliances
  WHERE appliance_id = p_appliance_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Appliance % not found.', p_appliance_id;
  END IF;

  IF v_appliance.customer_id <> p_customer_id THEN
    RAISE EXCEPTION 'Appliance % does not belong to customer %.', p_appliance_id, p_customer_id;
  END IF;

  IF v_appliance.registration_status = 'cancelled' THEN
    RAISE EXCEPTION 'Cannot book repair for a cancelled appliance registration.';
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
    p_customer_id,
    p_appliance_id,
    p_service_type,
    TRIM(p_issue_description),
    'pending',
    COALESCE(p_priority, 'normal'),
    0.00,
    p_scheduled_date
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
    p_customer_id,
    p_scheduled_date,
    p_time_slot,
    TRIM(p_service_address),
    'requested',
    NULLIF(TRIM(COALESCE(p_remarks, '')), '')
  )
  RETURNING public.appointments.appointment_id INTO v_appointment_id;

  INSERT INTO public.activity_logs (
    actor_id,
    entity_type,
    entity_id,
    action,
    description
  ) VALUES (
    v_caller_id,
    'repair',
    v_ticket_id,
    'repair_requested',
    FORMAT(
      'Booked %s for %s %s (%s) on %s (%s).',
      REPLACE(p_service_type, '_', ' '),
      v_appliance.brand,
      v_appliance.model_number,
      v_ticket_id,
      TO_CHAR(p_scheduled_date, 'Mon DD, YYYY'),
      p_time_slot
    )
  );

  RETURN QUERY SELECT v_ticket_id, v_appointment_id;
END;
$$;

-- ----------------------------------------------------------------------------
-- 2. rpc_assign_technician_and_confirm_slot
-- Locks repair, technician_profiles, and existing technician appointments
-- (SELECT ... FOR UPDATE) to prevent slot double-booking or exceeding max_daily_jobs.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_assign_technician_and_confirm_slot(
  p_ticket_id VARCHAR(20),
  p_technician_id VARCHAR(20),
  p_scheduled_date DATE DEFAULT NULL,
  p_time_slot VARCHAR(30) DEFAULT NULL
)
RETURNS TABLE (
  ticket_id VARCHAR(20),
  appointment_id VARCHAR(20),
  technician_id VARCHAR(20),
  scheduled_date DATE,
  time_slot VARCHAR(30)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_caller_id VARCHAR(20);
  v_caller_role VARCHAR(30);
  v_repair RECORD;
  v_tech_user RECORD;
  v_tech_profile RECORD;
  v_appointment RECORD;
  v_target_date DATE;
  v_target_slot VARCHAR(30);
  v_slot_conflict_count INT;
  v_daily_job_count INT;
BEGIN
  v_caller_id := private.current_user_id();
  v_caller_role := private.current_user_role();

  IF v_caller_id IS NULL OR v_caller_role <> 'admin' THEN
    RAISE EXCEPTION 'Forbidden: only active administrators can assign technicians.';
  END IF;

  -- Lock in consistent order: repair -> technician user & profile -> appointments
  SELECT r.ticket_id, r.status, r.scheduled_date
  INTO v_repair
  FROM public.repair r
  WHERE r.ticket_id = p_ticket_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Repair ticket % not found.', p_ticket_id;
  END IF;

  IF v_repair.status IN ('completed', 'cancelled') THEN
    RAISE EXCEPTION 'Cannot assign technician to a % repair ticket.', v_repair.status;
  END IF;

  SELECT u.user_id, u.first_name, u.last_name, u.is_active, ut.type_name
  INTO v_tech_user
  FROM public.users u
  JOIN public.user_types ut ON ut.user_type_id = u.user_type_id
  WHERE u.user_id = p_technician_id
  FOR UPDATE OF u;

  IF NOT FOUND OR v_tech_user.is_active = FALSE OR v_tech_user.type_name <> 'technician' THEN
    RAISE EXCEPTION 'Selected user % is not an active technician.', p_technician_id;
  END IF;

  SELECT tp.tech_profile_id, tp.availability_status, tp.max_daily_jobs
  INTO v_tech_profile
  FROM public.technician_profiles tp
  WHERE tp.technician_id = p_technician_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Technician profile for % not found.', p_technician_id;
  END IF;

  IF v_tech_profile.availability_status = 'off_duty' THEN
    RAISE EXCEPTION 'Technician % % is currently off duty.', v_tech_user.first_name, v_tech_user.last_name;
  END IF;

  -- Lock the latest active appointment for this ticket
  SELECT ap.appointment_id, ap.scheduled_date, ap.time_slot, ap.appointment_status
  INTO v_appointment
  FROM public.appointments ap
  WHERE ap.ticket_id = p_ticket_id
    AND ap.appointment_status <> 'cancelled'
  ORDER BY ap.created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active appointment found for ticket %.', p_ticket_id;
  END IF;

  v_target_date := COALESCE(p_scheduled_date, v_appointment.scheduled_date);
  v_target_slot := COALESCE(p_time_slot, v_appointment.time_slot);

  -- Lock all active appointments for the technician on the target date in deterministic order
  PERFORM 1
  FROM public.appointments ap
  WHERE ap.technician_id = p_technician_id
    AND ap.scheduled_date = v_target_date
    AND ap.appointment_status NOT IN ('cancelled', 'completed')
  ORDER BY ap.appointment_id
  FOR UPDATE;

  -- Check double-booking for same date + time_slot (excluding current appointment)
  SELECT COUNT(*)::INT
  INTO v_slot_conflict_count
  FROM public.appointments ap
  WHERE ap.technician_id = p_technician_id
    AND ap.scheduled_date = v_target_date
    AND ap.time_slot = v_target_slot
    AND ap.appointment_status NOT IN ('cancelled', 'completed')
    AND ap.appointment_id <> v_appointment.appointment_id;

  IF v_slot_conflict_count > 0 THEN
    RAISE EXCEPTION 'Double-booking conflict: technician already has an appointment on % (%).',
      TO_CHAR(v_target_date, 'Mon DD, YYYY'), v_target_slot;
  END IF;

  -- Check daily capacity limit
  SELECT COUNT(*)::INT
  INTO v_daily_job_count
  FROM public.appointments ap
  WHERE ap.technician_id = p_technician_id
    AND ap.scheduled_date = v_target_date
    AND ap.appointment_status NOT IN ('cancelled')
    AND ap.appointment_id <> v_appointment.appointment_id;

  IF v_daily_job_count >= v_tech_profile.max_daily_jobs THEN
    RAISE EXCEPTION 'Capacity reached: technician already has % of % daily jobs on %.',
      v_daily_job_count, v_tech_profile.max_daily_jobs, TO_CHAR(v_target_date, 'Mon DD, YYYY');
  END IF;

  UPDATE public.repair
  SET technician_id = p_technician_id,
      scheduled_date = v_target_date,
      status = CASE
        WHEN status IN ('pending', 'confirmed') THEN 'assigned'
        ELSE status
      END
  WHERE public.repair.ticket_id = p_ticket_id;

  UPDATE public.appointments
  SET technician_id = p_technician_id,
      scheduled_date = v_target_date,
      time_slot = v_target_slot,
      appointment_status = CASE
        WHEN appointment_status IN ('requested', 'rescheduled') THEN 'confirmed'
        ELSE appointment_status
      END
  WHERE public.appointments.appointment_id = v_appointment.appointment_id;

  INSERT INTO public.activity_logs (
    actor_id,
    entity_type,
    entity_id,
    action,
    description
  ) VALUES (
    v_caller_id,
    'repair',
    p_ticket_id,
    'technician_assigned',
    FORMAT(
      'Assigned %s %s to %s for %s (%s).',
      v_tech_user.first_name,
      v_tech_user.last_name,
      p_ticket_id,
      TO_CHAR(v_target_date, 'Mon DD, YYYY'),
      v_target_slot
    )
  );

  RETURN QUERY SELECT
    p_ticket_id,
    v_appointment.appointment_id,
    p_technician_id,
    v_target_date,
    v_target_slot;
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. rpc_record_and_verify_payment
-- Locks repair row (FOR UPDATE), inserts or verifies a payment, calculates
-- cumulative verified payments against final_cost_php, and completes the
-- repair ticket (setting completed_at = NOW()) once settled in full.
-- ----------------------------------------------------------------------------
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
  v_new_repair_status VARCHAR(30);
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

    UPDATE public.payments
    SET payment_status = 'verified',
        remarks = COALESCE(NULLIF(TRIM(COALESCE(p_remarks, '')), ''), remarks)
    WHERE public.payments.payment_id = p_payment_id;

    v_result_payment_id := p_payment_id;
    v_result_payment_status := 'verified';

  -- Mode B: Insert a new payment (Customer, assigned Technician, or Admin)
  ELSE
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
      NULLIF(TRIM(COALESCE(p_reference_no, '')), ''),
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
  IF v_repair.final_cost_php IS NOT NULL
     AND v_repair.final_cost_php > 0
     AND v_verified_total >= v_repair.final_cost_php
     AND v_repair.status <> 'completed' THEN
    UPDATE public.repair
    SET status = 'completed',
        completed_at = NOW()
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

REVOKE EXECUTE ON FUNCTION public.rpc_create_repair_with_appointment(VARCHAR, VARCHAR, VARCHAR, VARCHAR, TEXT, DATE, VARCHAR, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.rpc_assign_technician_and_confirm_slot(VARCHAR, VARCHAR, DATE, VARCHAR) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.rpc_record_and_verify_payment(VARCHAR, VARCHAR, VARCHAR, NUMERIC, INT, VARCHAR, TEXT, BOOLEAN) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.rpc_create_repair_with_appointment(VARCHAR, VARCHAR, VARCHAR, VARCHAR, TEXT, DATE, VARCHAR, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_assign_technician_and_confirm_slot(VARCHAR, VARCHAR, DATE, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_record_and_verify_payment(VARCHAR, VARCHAR, VARCHAR, NUMERIC, INT, VARCHAR, TEXT, BOOLEAN) TO authenticated;

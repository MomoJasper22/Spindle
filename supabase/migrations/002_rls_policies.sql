-- ============================================================================
-- Migration 002: Row-Level Security (RLS) Policies & RBAC Helpers
-- Project: Spindle (Philippine Appliance Repair & Field Service CRM)
-- Follows supabase-postgres-best-practices:
--   - Private schema SECURITY DEFINER helpers with SET search_path = ''
--   - (select auth.uid()) caching in all RLS predicates
--   - Strict blocking of inactive users (is_active = FALSE)
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated;

-- ----------------------------------------------------------------------------
-- 1. Private RBAC & Ownership Helpers
-- ----------------------------------------------------------------------------

-- Returns active public.users.user_id for the current auth session (NULL if inactive)
CREATE OR REPLACE FUNCTION private.current_user_id()
RETURNS VARCHAR(20)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT u.user_id
  FROM public.users u
  WHERE u.auth_user_id = (select auth.uid())
    AND u.is_active = TRUE
  LIMIT 1;
$$;

-- Returns active user's role type_name ('customer', 'technician', 'admin') or NULL
CREATE OR REPLACE FUNCTION private.current_user_role()
RETURNS VARCHAR(30)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT ut.type_name
  FROM public.users u
  JOIN public.user_types ut ON ut.user_type_id = u.user_type_id
  WHERE u.auth_user_id = (select auth.uid())
    AND u.is_active = TRUE
  LIMIT 1;
$$;

-- Returns active user's user_type_id ('UTP-CUST', 'UTP-TECH', 'UTP-ADMIN') or NULL
CREATE OR REPLACE FUNCTION private.current_user_type_id()
RETURNS VARCHAR(20)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT u.user_type_id
  FROM public.users u
  WHERE u.auth_user_id = (select auth.uid())
    AND u.is_active = TRUE
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(private.current_user_role() = 'admin', FALSE);
$$;

-- Checks whether caller may view a target user row (for JOIN views across tickets)
CREATE OR REPLACE FUNCTION private.can_view_user(p_target_user_id VARCHAR)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT CASE
    WHEN private.current_user_id() IS NULL THEN FALSE
    WHEN private.is_admin() THEN TRUE
    WHEN p_target_user_id = private.current_user_id() THEN TRUE
    -- Technician can view customer details for their assigned repairs/appointments
    WHEN private.current_user_role() = 'technician' THEN EXISTS (
      SELECT 1
      FROM public.repair r
      WHERE r.customer_id = p_target_user_id
        AND r.technician_id = private.current_user_id()
    )
    -- Customer can view technician/collector details for their own repairs/payments
    WHEN private.current_user_role() = 'customer' THEN EXISTS (
      SELECT 1
      FROM public.repair r
      WHERE r.technician_id = p_target_user_id
        AND r.customer_id = private.current_user_id()
    ) OR EXISTS (
      SELECT 1
      FROM public.payments p
      JOIN public.repair r ON r.ticket_id = p.ticket_id
      WHERE p.received_by = p_target_user_id
        AND r.customer_id = private.current_user_id()
    )
    ELSE FALSE
  END;
$$;

-- Checks whether caller may view an activity_logs entry
CREATE OR REPLACE FUNCTION private.can_view_activity_log(
  p_entity_type VARCHAR,
  p_entity_id VARCHAR,
  p_actor_id VARCHAR
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT CASE
    WHEN private.current_user_id() IS NULL THEN FALSE
    WHEN private.is_admin() THEN TRUE
    WHEN p_actor_id = private.current_user_id() THEN TRUE
    WHEN p_entity_type = 'appliance' THEN EXISTS (
      SELECT 1 FROM public.customer_appliances a
      WHERE a.appliance_id = p_entity_id
        AND a.customer_id = private.current_user_id()
    )
    WHEN p_entity_type = 'repair' THEN EXISTS (
      SELECT 1 FROM public.repair r
      WHERE r.ticket_id = p_entity_id
        AND (r.customer_id = private.current_user_id() OR r.technician_id = private.current_user_id())
    )
    WHEN p_entity_type = 'appointment' THEN EXISTS (
      SELECT 1 FROM public.appointments ap
      WHERE ap.appointment_id = p_entity_id
        AND (ap.customer_id = private.current_user_id() OR ap.technician_id = private.current_user_id())
    )
    WHEN p_entity_type = 'payment' THEN EXISTS (
      SELECT 1
      FROM public.payments p
      JOIN public.repair r ON r.ticket_id = p.ticket_id
      WHERE p.payment_id = p_entity_id
        AND (r.customer_id = private.current_user_id() OR r.technician_id = private.current_user_id() OR p.received_by = private.current_user_id())
    )
    WHEN p_entity_type = 'technician' THEN p_entity_id = private.current_user_id()
    ELSE FALSE
  END;
$$;

REVOKE EXECUTE ON FUNCTION private.current_user_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION private.current_user_role() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION private.current_user_type_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION private.is_admin() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION private.can_view_user(VARCHAR) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION private.can_view_activity_log(VARCHAR, VARCHAR, VARCHAR) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION private.current_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION private.current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION private.current_user_type_id() TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION private.can_view_user(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION private.can_view_activity_log(VARCHAR, VARCHAR, VARCHAR) TO authenticated;

-- ----------------------------------------------------------------------------
-- 2. Enable RLS on Every Table in public
-- ----------------------------------------------------------------------------

ALTER TABLE public.user_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technician_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_appliances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 3. Policies per Table
-- ----------------------------------------------------------------------------

-- 3.1 user_types (Read-only lookup for authenticated users)
CREATE POLICY user_types_select_authenticated
  ON public.user_types
  FOR SELECT
  TO authenticated
  USING (TRUE);

-- 3.2 users
CREATE POLICY users_select_authorized
  ON public.users
  FOR SELECT
  TO authenticated
  USING ((select private.can_view_user(user_id)));

CREATE POLICY users_insert_admin
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK ((select private.is_admin()));

CREATE POLICY users_update_self_or_admin
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    (select private.is_admin())
    OR (auth_user_id = (select auth.uid()) AND is_active = TRUE)
  )
  WITH CHECK (
    (select private.is_admin())
    OR (
      auth_user_id = (select auth.uid())
      AND user_type_id = (select private.current_user_type_id())
    )
  );

CREATE POLICY users_delete_admin
  ON public.users
  FOR DELETE
  TO authenticated
  USING ((select private.is_admin()));

-- 3.3 technician_profiles
CREATE POLICY tech_profiles_select_authorized
  ON public.technician_profiles
  FOR SELECT
  TO authenticated
  USING (
    (select private.is_admin())
    OR technician_id = (select private.current_user_id())
    OR (
      (select private.current_user_role()) = 'customer'
      AND EXISTS (
        SELECT 1 FROM public.repair r
        WHERE r.technician_id = technician_profiles.technician_id
          AND r.customer_id = (select private.current_user_id())
      )
    )
  );

CREATE POLICY tech_profiles_insert_self_or_admin
  ON public.technician_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (select private.is_admin())
    OR (
      technician_id = (select private.current_user_id())
      AND (select private.current_user_role()) = 'technician'
    )
  );

CREATE POLICY tech_profiles_update_self_or_admin
  ON public.technician_profiles
  FOR UPDATE
  TO authenticated
  USING (
    (select private.is_admin())
    OR (
      technician_id = (select private.current_user_id())
      AND (select private.current_user_role()) = 'technician'
    )
  )
  WITH CHECK (
    (select private.is_admin())
    OR (
      technician_id = (select private.current_user_id())
      AND (select private.current_user_role()) = 'technician'
    )
  );

CREATE POLICY tech_profiles_delete_admin
  ON public.technician_profiles
  FOR DELETE
  TO authenticated
  USING ((select private.is_admin()));

-- 3.4 customer_appliances
CREATE POLICY appliances_select_authorized
  ON public.customer_appliances
  FOR SELECT
  TO authenticated
  USING (
    (select private.is_admin())
    OR customer_id = (select private.current_user_id())
    OR (
      (select private.current_user_role()) = 'technician'
      AND EXISTS (
        SELECT 1 FROM public.repair r
        WHERE r.appliance_id = customer_appliances.appliance_id
          AND r.technician_id = (select private.current_user_id())
      )
    )
  );

CREATE POLICY appliances_insert_customer_or_admin
  ON public.customer_appliances
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (select private.is_admin())
    OR (
      customer_id = (select private.current_user_id())
      AND (select private.current_user_role()) = 'customer'
      AND registration_status = 'pending_verification'
    )
  );

CREATE POLICY appliances_update_customer_or_admin
  ON public.customer_appliances
  FOR UPDATE
  TO authenticated
  USING (
    (select private.is_admin())
    OR (
      customer_id = (select private.current_user_id())
      AND (select private.current_user_role()) = 'customer'
    )
  )
  WITH CHECK (
    (select private.is_admin())
    OR (
      customer_id = (select private.current_user_id())
      AND (select private.current_user_role()) = 'customer'
      AND registration_status IN ('pending_verification', 'cancelled')
    )
  );

CREATE POLICY appliances_delete_customer_or_admin
  ON public.customer_appliances
  FOR DELETE
  TO authenticated
  USING (
    (select private.is_admin())
    OR (
      customer_id = (select private.current_user_id())
      AND (select private.current_user_role()) = 'customer'
    )
  );

-- 3.5 repair
CREATE POLICY repair_select_authorized
  ON public.repair
  FOR SELECT
  TO authenticated
  USING (
    (select private.is_admin())
    OR customer_id = (select private.current_user_id())
    OR technician_id = (select private.current_user_id())
  );

CREATE POLICY repair_insert_customer_or_admin
  ON public.repair
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (select private.is_admin())
    OR (
      customer_id = (select private.current_user_id())
      AND (select private.current_user_role()) = 'customer'
    )
  );

CREATE POLICY repair_update_authorized
  ON public.repair
  FOR UPDATE
  TO authenticated
  USING (
    (select private.is_admin())
    OR (
      customer_id = (select private.current_user_id())
      AND status IN ('pending', 'confirmed')
    )
    OR technician_id = (select private.current_user_id())
  )
  WITH CHECK (
    (select private.is_admin())
    OR (
      customer_id = (select private.current_user_id())
      AND status IN ('pending', 'confirmed', 'cancelled')
    )
    OR technician_id = (select private.current_user_id())
  );

CREATE POLICY repair_delete_admin
  ON public.repair
  FOR DELETE
  TO authenticated
  USING ((select private.is_admin()));

-- 3.6 appointments
CREATE POLICY appointments_select_authorized
  ON public.appointments
  FOR SELECT
  TO authenticated
  USING (
    (select private.is_admin())
    OR customer_id = (select private.current_user_id())
    OR technician_id = (select private.current_user_id())
  );

CREATE POLICY appointments_insert_customer_or_admin
  ON public.appointments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (select private.is_admin())
    OR (
      customer_id = (select private.current_user_id())
      AND (select private.current_user_role()) = 'customer'
    )
  );

CREATE POLICY appointments_update_authorized
  ON public.appointments
  FOR UPDATE
  TO authenticated
  USING (
    (select private.is_admin())
    OR customer_id = (select private.current_user_id())
    OR technician_id = (select private.current_user_id())
  )
  WITH CHECK (
    (select private.is_admin())
    OR (
      customer_id = (select private.current_user_id())
      AND appointment_status IN ('requested', 'rescheduled', 'cancelled')
    )
    OR technician_id = (select private.current_user_id())
  );

CREATE POLICY appointments_delete_admin
  ON public.appointments
  FOR DELETE
  TO authenticated
  USING ((select private.is_admin()));

-- 3.7 payments
CREATE POLICY payments_select_authorized
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (
    (select private.is_admin())
    OR received_by = (select private.current_user_id())
    OR EXISTS (
      SELECT 1 FROM public.repair r
      WHERE r.ticket_id = payments.ticket_id
        AND (r.customer_id = (select private.current_user_id()) OR r.technician_id = (select private.current_user_id()))
    )
  );

CREATE POLICY payments_insert_authorized
  ON public.payments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (select private.is_admin())
    OR (
      (select private.current_user_role()) = 'customer'
      AND payment_status = 'pending_verification'
      AND EXISTS (
        SELECT 1 FROM public.repair r
        WHERE r.ticket_id = payments.ticket_id
          AND r.customer_id = (select private.current_user_id())
      )
    )
    OR (
      (select private.current_user_role()) = 'technician'
      AND received_by = (select private.current_user_id())
      AND EXISTS (
        SELECT 1 FROM public.repair r
        WHERE r.ticket_id = payments.ticket_id
          AND r.technician_id = (select private.current_user_id())
      )
    )
  );

CREATE POLICY payments_update_admin
  ON public.payments
  FOR UPDATE
  TO authenticated
  USING ((select private.is_admin()))
  WITH CHECK ((select private.is_admin()));

CREATE POLICY payments_delete_admin
  ON public.payments
  FOR DELETE
  TO authenticated
  USING ((select private.is_admin()));

-- 3.8 activity_logs
CREATE POLICY activity_logs_select_authorized
  ON public.activity_logs
  FOR SELECT
  TO authenticated
  USING ((select private.can_view_activity_log(entity_type, entity_id, actor_id)));

CREATE POLICY activity_logs_insert_authenticated
  ON public.activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (select private.is_admin())
    OR actor_id = (select private.current_user_id())
  );

CREATE POLICY activity_logs_update_admin
  ON public.activity_logs
  FOR UPDATE
  TO authenticated
  USING ((select private.is_admin()));

CREATE POLICY activity_logs_delete_admin
  ON public.activity_logs
  FOR DELETE
  TO authenticated
  USING ((select private.is_admin()));

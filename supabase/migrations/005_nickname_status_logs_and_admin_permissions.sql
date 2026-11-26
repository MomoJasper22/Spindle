-- ============================================================================
-- Migration 005: Technician Nickname, Proposed Specializations,
--                Technician Status Logs & Scoped Admin Permissions
-- Project: Spindle
-- ============================================================================

-- 1. Extend public.users with technician nickname and scoped admin_permissions
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS nickname VARCHAR(60) NULL;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS admin_permissions TEXT[] NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_users_admin_permissions_valid'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT chk_users_admin_permissions_valid
      CHECK (
        admin_permissions IS NULL
        OR (
          cardinality(admin_permissions) >= 1
          AND admin_permissions <@ ARRAY[
            'dashboard',
            'repairs',
            'appointments',
            'payments',
            'technicians',
            'appliances',
            'users'
          ]::TEXT[]
        )
      );
  END IF;
END $$;

-- 2. Extend technician_profiles with proposed_specializations (for admin review)
ALTER TABLE public.technician_profiles
  ADD COLUMN IF NOT EXISTS proposed_specializations TEXT[] NOT NULL DEFAULT '{}'::TEXT[];

-- 3. Create technician_status_logs for availability & productivity tracking
CREATE TABLE IF NOT EXISTS public.technician_status_logs (
  log_id VARCHAR(20) PRIMARY KEY DEFAULT public.generate_alphanumeric_id('TSL'),
  technician_id VARCHAR(20) NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  previous_status VARCHAR(30) NULL
    CHECK (previous_status IS NULL OR previous_status IN ('available', 'busy', 'off_duty')),
  new_status VARCHAR(30) NOT NULL
    CHECK (new_status IN ('available', 'busy', 'off_duty')),
  changed_by VARCHAR(20) NULL REFERENCES public.users(user_id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tech_status_logs_tech_changed
  ON public.technician_status_logs (technician_id, changed_at DESC);

ALTER TABLE public.technician_status_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'technician_status_logs'
      AND policyname = 'tech_status_logs_select_authorized'
  ) THEN
    CREATE POLICY tech_status_logs_select_authorized
      ON public.technician_status_logs
      FOR SELECT
      TO authenticated
      USING (
        (select private.is_admin())
        OR technician_id = (select private.current_user_id())
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'technician_status_logs'
      AND policyname = 'tech_status_logs_insert_authorized'
  ) THEN
    CREATE POLICY tech_status_logs_insert_authorized
      ON public.technician_status_logs
      FOR INSERT
      TO authenticated
      WITH CHECK (
        (select private.is_admin())
        OR (
          technician_id = (select private.current_user_id())
          AND (select private.current_user_role()) = 'technician'
        )
      );
  END IF;
END $$;

-- 4. Guardrail triggers so technicians cannot overwrite admin-managed fields
CREATE OR REPLACE FUNCTION public.enforce_technician_user_field_locks()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_role VARCHAR(30);
BEGIN
  -- Allow service_role / migrations (no JWT auth.uid()) and admins
  IF (select auth.uid()) IS NULL THEN
    RETURN NEW;
  END IF;

  v_role := private.current_user_role();

  IF v_role = 'technician' AND OLD.is_onboarded = TRUE THEN
    IF NEW.first_name IS DISTINCT FROM OLD.first_name
       OR NEW.middle_name IS DISTINCT FROM OLD.middle_name
       OR NEW.last_name IS DISTINCT FROM OLD.last_name
       OR NEW.email IS DISTINCT FROM OLD.email
       OR NEW.phone IS DISTINCT FROM OLD.phone
       OR NEW.branch_location IS DISTINCT FROM OLD.branch_location
       OR NEW.address_street IS DISTINCT FROM OLD.address_street
       OR NEW.address_barangay IS DISTINCT FROM OLD.address_barangay
       OR NEW.address_city IS DISTINCT FROM OLD.address_city
       OR NEW.address_province IS DISTINCT FROM OLD.address_province
       OR NEW.address_zip_code IS DISTINCT FROM OLD.address_zip_code
       OR NEW.user_type_id IS DISTINCT FROM OLD.user_type_id
       OR NEW.is_active IS DISTINCT FROM OLD.is_active
       OR NEW.admin_permissions IS DISTINCT FROM OLD.admin_permissions THEN
      RAISE EXCEPTION 'Forbidden: technicians may only edit their nickname and profile photo.';
    END IF;
  END IF;

  IF v_role = 'admin' AND OLD.user_id = private.current_user_id() THEN
    IF OLD.admin_permissions IS NOT NULL AND (
       NEW.first_name IS DISTINCT FROM OLD.first_name
       OR NEW.middle_name IS DISTINCT FROM OLD.middle_name
       OR NEW.last_name IS DISTINCT FROM OLD.last_name
       OR NEW.phone IS DISTINCT FROM OLD.phone
       OR NEW.branch_location IS DISTINCT FROM OLD.branch_location
       OR NEW.address_street IS DISTINCT FROM OLD.address_street
       OR NEW.address_barangay IS DISTINCT FROM OLD.address_barangay
       OR NEW.address_city IS DISTINCT FROM OLD.address_city
       OR NEW.address_province IS DISTINCT FROM OLD.address_province
       OR NEW.address_zip_code IS DISTINCT FROM OLD.address_zip_code
       OR NEW.admin_permissions IS DISTINCT FROM OLD.admin_permissions
    ) THEN
      RAISE EXCEPTION 'Forbidden: limited administrators may only update their profile photo.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_users_field_locks ON public.users;
CREATE TRIGGER trg_users_field_locks
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_technician_user_field_locks();

CREATE OR REPLACE FUNCTION public.enforce_technician_profile_locks()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_role VARCHAR(30);
  v_onboarded BOOLEAN;
BEGIN
  IF (select auth.uid()) IS NULL THEN
    RETURN NEW;
  END IF;

  v_role := private.current_user_role();
  IF v_role <> 'technician' THEN
    RETURN NEW;
  END IF;

  SELECT u.is_onboarded INTO v_onboarded
  FROM public.users u
  WHERE u.user_id = NEW.technician_id;

  IF TG_OP = 'INSERT' THEN
    -- Technicians cannot self-assign specializations or max_daily_jobs
    IF cardinality(NEW.specializations) > 0 THEN
      RAISE EXCEPTION 'Forbidden: appliance specializations are assigned by an administrator.';
    END IF;
    NEW.max_daily_jobs := 4;
    RETURN NEW;
  END IF;

  IF NEW.specializations IS DISTINCT FROM OLD.specializations
     OR NEW.max_daily_jobs IS DISTINCT FROM OLD.max_daily_jobs THEN
    RAISE EXCEPTION 'Forbidden: appliance specializations and max daily jobs are managed by an administrator.';
  END IF;

  IF COALESCE(v_onboarded, FALSE) = TRUE AND (
     NEW.certification_no IS DISTINCT FROM OLD.certification_no
     OR NEW.proposed_specializations IS DISTINCT FROM OLD.proposed_specializations
  ) THEN
    RAISE EXCEPTION 'Forbidden: technician credentials are locked after onboarding. Contact an administrator.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_technician_profiles_locks ON public.technician_profiles;
CREATE TRIGGER trg_technician_profiles_locks
  BEFORE INSERT OR UPDATE ON public.technician_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_technician_profile_locks();

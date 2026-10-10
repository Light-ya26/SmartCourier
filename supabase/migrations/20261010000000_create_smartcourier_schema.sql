-- =============================================================================
-- SMARTCOURIER SUPABASE SCHEMA MIGRATION
-- Project: https://kgolwuqrydjykmyytqqhq.supabase.co
-- Region: South Asia (Mumbai)
-- Description: Core schema, constraints, triggers, indexes, and RLS policies
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Helper Functions & Extensions
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Generic updated_at timestamp trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- 2. Core Tables
-- -----------------------------------------------------------------------------

-- User Profiles (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'driver' CHECK (role IN ('admin', 'driver')),
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Driver Fleet Registry
CREATE TABLE IF NOT EXISTS public.drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE SET NULL,
  driver_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  license_number TEXT NOT NULL,
  vehicle_number TEXT NOT NULL,
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('Bike', 'Van', 'Tempo', 'Truck')),
  status TEXT NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'On Delivery', 'Offline', 'Busy')),
  zone TEXT NOT NULL,
  assigned_deliveries_count INTEGER NOT NULL DEFAULT 0 CHECK (assigned_deliveries_count >= 0),
  completed_deliveries_count INTEGER NOT NULL DEFAULT 0 CHECK (completed_deliveries_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Deliveries
CREATE TABLE IF NOT EXISTS public.deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  delivery_address TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Pune',
  postal_code TEXT NOT NULL,
  latitude NUMERIC(10, 7) CHECK (latitude BETWEEN -90 AND 90),
  longitude NUMERIC(10, 7) CHECK (longitude BETWEEN -180 AND 180),
  package_description TEXT NOT NULL,
  weight_kg NUMERIC(6, 2) NOT NULL CHECK (weight_kg > 0),
  priority TEXT NOT NULL DEFAULT 'Normal' CHECK (priority IN ('High', 'Normal', 'Low')),
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Assigned', 'In Transit', 'Delivered', 'Failed')),
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  delivery_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Routes
CREATE TABLE IF NOT EXISTS public.routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_code TEXT NOT NULL UNIQUE,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  route_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'Optimized' CHECK (status IN ('Planned', 'Optimized', 'Dispatched', 'Completed', 'Cancelled')),
  total_stops INTEGER NOT NULL DEFAULT 0 CHECK (total_stops >= 0),
  total_distance_km NUMERIC(6, 2) NOT NULL DEFAULT 0.0 CHECK (total_distance_km >= 0),
  estimated_duration_minutes INTEGER NOT NULL DEFAULT 0 CHECK (estimated_duration_minutes >= 0),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Route Stops (Ordered Sequential Delivery Waypoints)
CREATE TABLE IF NOT EXISTS public.route_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  delivery_id UUID NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
  stop_sequence INTEGER NOT NULL CHECK (stop_sequence >= 1),
  estimated_arrival TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Delivered', 'Failed', 'Skipped')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_route_delivery UNIQUE (route_id, delivery_id),
  CONSTRAINT uq_route_sequence UNIQUE (route_id, stop_sequence)
);

-- Delivery Status History (Audit Log)
CREATE TABLE IF NOT EXISTS public.delivery_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('Pending', 'Assigned', 'In Transit', 'Delivered', 'Failed')),
  notes TEXT,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Delivery Assignments (Audit Log)
CREATE TABLE IF NOT EXISTS public.delivery_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 3. Performance Indexes
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_deliveries_driver_status ON public.deliveries(driver_id, status);
CREATE INDEX IF NOT EXISTS idx_deliveries_tracking ON public.deliveries(tracking_number);
CREATE INDEX IF NOT EXISTS idx_deliveries_date ON public.deliveries(delivery_date);
CREATE INDEX IF NOT EXISTS idx_drivers_profile_id ON public.drivers(profile_id);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON public.drivers(status);
CREATE INDEX IF NOT EXISTS idx_routes_driver_date ON public.routes(driver_id, route_date);
CREATE INDEX IF NOT EXISTS idx_route_stops_lookup ON public.route_stops(route_id, stop_sequence);
CREATE INDEX IF NOT EXISTS idx_status_history_delivery ON public.delivery_status_history(delivery_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assignments_delivery ON public.delivery_assignments(delivery_id, assigned_at DESC);

-- -----------------------------------------------------------------------------
-- 4. Secure Helper Functions & Business Logic Triggers
-- -----------------------------------------------------------------------------

-- Secure role retrieval with locked search path to prevent search_path injection
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_role TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN 'unauthenticated';
  END IF;

  SELECT role INTO v_role
  FROM public.profiles
  WHERE id = auth.uid();

  RETURN COALESCE(v_role, 'unauthenticated');
END;
$$;

-- Secure driver ID retrieval for active user
CREATE OR REPLACE FUNCTION public.get_auth_driver_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_driver_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT id INTO v_driver_id
  FROM public.drivers
  WHERE profile_id = auth.uid();

  RETURN v_driver_id;
END;
$$;

-- Trigger Function: Prevent non-admin users from escalating their own role
CREATE OR REPLACE FUNCTION public.prevent_profile_role_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF (OLD.role IS DISTINCT FROM NEW.role) AND (public.get_auth_role() <> 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Users cannot modify their own security role.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_role_tampering ON public.profiles;
CREATE TRIGGER trg_prevent_profile_role_tampering
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_role_tampering();

-- Trigger Function: Enforce delivery column immutability and valid status transitions for drivers
CREATE OR REPLACE FUNCTION public.enforce_delivery_update_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Administrators can update any field
  IF public.get_auth_role() = 'admin' THEN
    RETURN NEW;
  END IF;

  -- Driver security rules
  IF public.get_auth_role() = 'driver' THEN
    -- Verify driver is assigned to this row
    IF OLD.driver_id IS DISTINCT FROM public.get_auth_driver_id() THEN
      RAISE EXCEPTION 'Unauthorized: You can only update deliveries assigned to you.';
    END IF;

    -- Enforce immutability of protected fields
    IF (OLD.id IS DISTINCT FROM NEW.id) OR
       (OLD.tracking_number IS DISTINCT FROM NEW.tracking_number) OR
       (OLD.customer_name IS DISTINCT FROM NEW.customer_name) OR
       (OLD.customer_phone IS DISTINCT FROM NEW.customer_phone) OR
       (OLD.customer_email IS DISTINCT FROM NEW.customer_email) OR
       (OLD.delivery_address IS DISTINCT FROM NEW.delivery_address) OR
       (OLD.city IS DISTINCT FROM NEW.city) OR
       (OLD.postal_code IS DISTINCT FROM NEW.postal_code) OR
       (OLD.latitude IS DISTINCT FROM NEW.latitude) OR
       (OLD.longitude IS DISTINCT FROM NEW.longitude) OR
       (OLD.package_description IS DISTINCT FROM NEW.package_description) OR
       (OLD.weight_kg IS DISTINCT FROM NEW.weight_kg) OR
       (OLD.priority IS DISTINCT FROM NEW.priority) OR
       (OLD.driver_id IS DISTINCT FROM NEW.driver_id) OR
       (OLD.delivery_date IS DISTINCT FROM NEW.delivery_date) OR
       (OLD.created_by IS DISTINCT FROM NEW.created_by) THEN
      RAISE EXCEPTION 'Unauthorized: Drivers may only modify delivery status and notes.';
    END IF;

    -- Enforce status transition state machine
    IF OLD.status = NEW.status THEN
      RETURN NEW;
    END IF;

    IF OLD.status = 'Pending' THEN
      RAISE EXCEPTION 'Invalid transition: Parcel must be assigned before transit.';
    ELSIF OLD.status = 'Assigned' AND NEW.status NOT IN ('In Transit') THEN
      RAISE EXCEPTION 'Invalid transition: Assigned parcels can only be moved to In Transit.';
    ELSIF OLD.status = 'In Transit' AND NEW.status NOT IN ('Delivered', 'Failed') THEN
      RAISE EXCEPTION 'Invalid transition: In Transit parcels can only transition to Delivered or Failed.';
    ELSIF OLD.status IN ('Delivered', 'Failed') THEN
      RAISE EXCEPTION 'Terminal state reached: Delivery is already finalized.';
    END IF;

    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Unauthorized operation on deliveries.';
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_delivery_update_rules ON public.deliveries;
CREATE TRIGGER trg_enforce_delivery_update_rules
BEFORE UPDATE ON public.deliveries
FOR EACH ROW EXECUTE FUNCTION public.enforce_delivery_update_rules();

-- Trigger Function: Automatically write to delivery_status_history on status change
CREATE OR REPLACE FUNCTION public.log_delivery_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF (TG_OP = 'INSERT') OR (OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.delivery_status_history (
      delivery_id,
      status,
      notes,
      updated_by
    ) VALUES (
      NEW.id,
      NEW.status,
      NEW.notes,
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_delivery_status_change ON public.deliveries;
CREATE TRIGGER trg_log_delivery_status_change
AFTER INSERT OR UPDATE ON public.deliveries
FOR EACH ROW EXECUTE FUNCTION public.log_delivery_status_change();

-- Trigger Function: Automatically log delivery assignment changes
CREATE OR REPLACE FUNCTION public.log_delivery_assignment_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF (NEW.driver_id IS NOT NULL) AND ((TG_OP = 'INSERT') OR (OLD.driver_id IS DISTINCT FROM NEW.driver_id)) THEN
    INSERT INTO public.delivery_assignments (
      delivery_id,
      driver_id,
      assigned_by
    ) VALUES (
      NEW.id,
      NEW.driver_id,
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_delivery_assignment_change ON public.deliveries;
CREATE TRIGGER trg_log_delivery_assignment_change
AFTER INSERT OR UPDATE ON public.deliveries
FOR EACH ROW EXECUTE FUNCTION public.log_delivery_assignment_change();

-- Attach updated_at triggers
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_drivers_updated_at ON public.drivers;
CREATE TRIGGER trg_drivers_updated_at BEFORE UPDATE ON public.drivers FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_deliveries_updated_at ON public.deliveries;
CREATE TRIGGER trg_deliveries_updated_at BEFORE UPDATE ON public.deliveries FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_routes_updated_at ON public.routes;
CREATE TRIGGER trg_routes_updated_at BEFORE UPDATE ON public.routes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- -----------------------------------------------------------------------------
-- 5. Row Level Security (RLS) Policies
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_assignments ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
CREATE POLICY "profiles_admin_all" ON public.profiles
  FOR ALL TO authenticated
  USING (public.get_auth_role() = 'admin')
  WITH CHECK (public.get_auth_role() = 'admin');

DROP POLICY IF EXISTS "profiles_user_select_own" ON public.profiles;
CREATE POLICY "profiles_user_select_own" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "profiles_user_update_own" ON public.profiles;
CREATE POLICY "profiles_user_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Drivers Policies
DROP POLICY IF EXISTS "drivers_admin_all" ON public.drivers;
CREATE POLICY "drivers_admin_all" ON public.drivers
  FOR ALL TO authenticated
  USING (public.get_auth_role() = 'admin')
  WITH CHECK (public.get_auth_role() = 'admin');

DROP POLICY IF EXISTS "drivers_driver_select_own" ON public.drivers;
CREATE POLICY "drivers_driver_select_own" ON public.drivers
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "drivers_driver_update_own_status" ON public.drivers;
CREATE POLICY "drivers_driver_update_own_status" ON public.drivers
  FOR UPDATE TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- Deliveries Policies
DROP POLICY IF EXISTS "deliveries_admin_all" ON public.deliveries;
CREATE POLICY "deliveries_admin_all" ON public.deliveries
  FOR ALL TO authenticated
  USING (public.get_auth_role() = 'admin')
  WITH CHECK (public.get_auth_role() = 'admin');

DROP POLICY IF EXISTS "deliveries_driver_select_assigned" ON public.deliveries;
CREATE POLICY "deliveries_driver_select_assigned" ON public.deliveries
  FOR SELECT TO authenticated
  USING (driver_id = public.get_auth_driver_id());

DROP POLICY IF EXISTS "deliveries_driver_update_assigned" ON public.deliveries;
CREATE POLICY "deliveries_driver_update_assigned" ON public.deliveries
  FOR UPDATE TO authenticated
  USING (driver_id = public.get_auth_driver_id())
  WITH CHECK (driver_id = public.get_auth_driver_id());

-- Routes Policies
DROP POLICY IF EXISTS "routes_admin_all" ON public.routes;
CREATE POLICY "routes_admin_all" ON public.routes
  FOR ALL TO authenticated
  USING (public.get_auth_role() = 'admin')
  WITH CHECK (public.get_auth_role() = 'admin');

DROP POLICY IF EXISTS "routes_driver_select_assigned" ON public.routes;
CREATE POLICY "routes_driver_select_assigned" ON public.routes
  FOR SELECT TO authenticated
  USING (driver_id = public.get_auth_driver_id());

-- Route Stops Policies
DROP POLICY IF EXISTS "route_stops_admin_all" ON public.route_stops;
CREATE POLICY "route_stops_admin_all" ON public.route_stops
  FOR ALL TO authenticated
  USING (public.get_auth_role() = 'admin')
  WITH CHECK (public.get_auth_role() = 'admin');

DROP POLICY IF EXISTS "route_stops_driver_select_assigned" ON public.route_stops;
CREATE POLICY "route_stops_driver_select_assigned" ON public.route_stops
  FOR SELECT TO authenticated
  USING (route_id IN (SELECT id FROM public.routes WHERE driver_id = public.get_auth_driver_id()));

DROP POLICY IF EXISTS "route_stops_driver_update_assigned" ON public.route_stops;
CREATE POLICY "route_stops_driver_update_assigned" ON public.route_stops
  FOR UPDATE TO authenticated
  USING (route_id IN (SELECT id FROM public.routes WHERE driver_id = public.get_auth_driver_id()))
  WITH CHECK (route_id IN (SELECT id FROM public.routes WHERE driver_id = public.get_auth_driver_id()));

-- Delivery Status History Policies
DROP POLICY IF EXISTS "history_admin_select" ON public.delivery_status_history;
CREATE POLICY "history_admin_select" ON public.delivery_status_history
  FOR SELECT TO authenticated
  USING (public.get_auth_role() = 'admin');

DROP POLICY IF EXISTS "history_driver_select_assigned" ON public.delivery_status_history;
CREATE POLICY "history_driver_select_assigned" ON public.delivery_status_history
  FOR SELECT TO authenticated
  USING (delivery_id IN (SELECT id FROM public.deliveries WHERE driver_id = public.get_auth_driver_id()));

-- Delivery Assignments Policies
DROP POLICY IF EXISTS "assignments_admin_select" ON public.delivery_assignments;
CREATE POLICY "assignments_admin_select" ON public.delivery_assignments
  FOR SELECT TO authenticated
  USING (public.get_auth_role() = 'admin');

DROP POLICY IF EXISTS "assignments_driver_select_assigned" ON public.delivery_assignments;
CREATE POLICY "assignments_driver_select_assigned" ON public.delivery_assignments
  FOR SELECT TO authenticated
  USING (driver_id = public.get_auth_driver_id());

COMMIT;

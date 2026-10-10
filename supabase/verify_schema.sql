-- =============================================================================
-- SMARTCOURIER SCHEMA & RLS VERIFICATION SCRIPT
-- Execute in Supabase SQL Editor to verify Phase 2 schema deployment.
-- =============================================================================

SELECT 
  'Tables & RLS Check' AS verification_category,
  table_name,
  CASE WHEN rowsecurity = true THEN 'PASS: RLS Enabled' ELSE 'FAIL: RLS Disabled' END AS rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND table_name IN (
    'profiles',
    'drivers',
    'deliveries',
    'routes',
    'route_stops',
    'delivery_status_history',
    'delivery_assignments'
  )
ORDER BY table_name;

-- Verify Functions
SELECT 
  'Security Functions Check' AS verification_category,
  routine_name AS function_name,
  'PASS: Function Exists' AS status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_auth_role',
    'get_auth_driver_id',
    'prevent_profile_role_tampering',
    'enforce_delivery_update_rules',
    'log_delivery_status_change',
    'log_delivery_assignment_change',
    'handle_updated_at'
  )
ORDER BY routine_name;

-- Verify RLS Policies Count
SELECT 
  'RLS Policy Count per Table' AS verification_category,
  tablename AS table_name,
  COUNT(*) AS active_policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

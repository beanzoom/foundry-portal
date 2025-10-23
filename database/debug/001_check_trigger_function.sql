-- Debug Query: Check if trigger_email_notification function exists
-- Run this in Supabase SQL Editor
-- Date: 2025-10-22

-- =====================================================
-- PART 1: Check if the trigger function exists
-- =====================================================

SELECT
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'trigger_email_notification';

-- If this returns NO ROWS, the function doesn't exist (problem!)

-- =====================================================
-- PART 2: Check if trigger is attached to portal_referrals
-- =====================================================

SELECT
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'portal_referrals'
  AND event_object_schema = 'public';

-- Should show: trigger_name like '%email%' or '%notification%'

-- =====================================================
-- PART 3: Check ALL triggers on portal tables
-- =====================================================

SELECT
    event_object_table as table_name,
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table LIKE 'portal_%'
ORDER BY event_object_table, trigger_name;

-- =====================================================
-- EXPECTED RESULTS
-- =====================================================

/*
If working correctly, you should see:

PART 1: Full function definition of trigger_email_notification()
PART 2: A trigger on portal_referrals table that calls the function
PART 3: Similar triggers on portal_events, portal_surveys, portal_updates

If PART 1 is empty, the function was never created on this database.
If PART 2 is empty, the trigger was never attached to portal_referrals.

This would explain why emails are queued but wrong template is used.
*/

-- =====================================================
-- EXPORT TRIGGERS FOR PORTAL MIGRATION
-- =====================================================
-- Run this in the OLD/SHARED Supabase database SQL Editor
-- Copy the output and save to: exports/triggers_export.txt
-- =====================================================

-- Get all triggers on portal-related tables
SELECT
  'CREATE TRIGGER ' || t.trigger_name ||
  ' ' || CASE t.action_timing
    WHEN 'BEFORE' THEN 'BEFORE'
    WHEN 'AFTER' THEN 'AFTER'
    WHEN 'INSTEAD OF' THEN 'INSTEAD OF'
  END ||
  ' ' || string_agg(DISTINCT t.event_manipulation, ' OR ') ||
  ' ON ' || t.event_object_schema || '.' || t.event_object_table ||
  ' FOR EACH ' || CASE t.action_orientation
    WHEN 'ROW' THEN 'ROW'
    WHEN 'STATEMENT' THEN 'STATEMENT'
  END ||
  CASE
    WHEN t.action_condition IS NOT NULL
    THEN ' WHEN (' || t.action_condition || ')'
    ELSE ''
  END ||
  ' EXECUTE FUNCTION ' || t.action_statement || ';' as trigger_definition,
  t.event_object_table,
  t.trigger_name,
  t.action_timing,
  string_agg(DISTINCT t.event_manipulation, ', ') as events
FROM information_schema.triggers t
WHERE t.event_object_schema = 'public'
  AND t.trigger_schema = 'public'
  -- Portal tables only
  AND (
    t.event_object_table LIKE 'portal_%'
    OR t.event_object_table IN (
      'calculator_submissions',
      'contact_submissions',
      'contacts',
      'email_logs',
      'email_notifications',
      'email_notification_batches',
      'email_queue',
      'notification_rules',
      'notification_events',
      'notification_logs',
      'recipient_lists',
      'interactions',
      'businesses',
      'profiles',
      'impersonation_sessions',
      'login_history'
    )
  )
  -- Exclude RLS triggers (we handle those separately)
  AND t.trigger_name NOT LIKE '%rls%'
GROUP BY
  t.trigger_name,
  t.event_object_schema,
  t.event_object_table,
  t.action_timing,
  t.action_orientation,
  t.action_condition,
  t.action_statement
ORDER BY
  t.event_object_table,
  t.action_timing,
  t.trigger_name;

-- Also get trigger function source code
SELECT
  '-- Function: ' || p.proname || E'\n' ||
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND EXISTS (
    SELECT 1
    FROM information_schema.triggers t
    WHERE t.event_object_schema = 'public'
      AND t.action_statement LIKE '%' || p.proname || '%'
      AND (
        t.event_object_table LIKE 'portal_%'
        OR t.event_object_table IN (
          'calculator_submissions',
          'contact_submissions',
          'contacts',
          'email_logs',
          'email_notifications',
          'email_notification_batches',
          'email_queue',
          'notification_rules',
          'notification_events',
          'notification_logs',
          'recipient_lists',
          'interactions',
          'businesses',
          'profiles',
          'impersonation_sessions',
          'login_history'
        )
      )
  )
ORDER BY p.proname;

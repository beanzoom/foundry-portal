-- Debug: Check What Email Was Actually Sent
-- Run this to see exactly what happened with your referral email

-- Check the most recent emails in the queue
SELECT
    eq.id,
    eq.to_email,
    eq.subject,
    eq.template_id,
    et.template_name,
    et.subject as template_subject,
    eq.template_data,
    eq.status,
    eq.created_at
FROM email_queue eq
LEFT JOIN email_templates et ON et.id = eq.template_id
ORDER BY eq.created_at DESC
LIMIT 5;

-- Check if template_id is stored correctly in email_templates
SELECT id, template_name, subject
FROM email_templates
WHERE id = 'test_template'
   OR id = 'referral_invitation'
   OR template_name LIKE '%test%'
   OR template_name LIKE '%referral%';

-- Check notification_events table (might be logging what triggered)
SELECT *
FROM notification_events
ORDER BY created_at DESC
LIMIT 10;

-- Check if there's a trigger or function automatically queuing emails
SELECT
    routine_name,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
  AND (
    routine_name LIKE '%email%'
    OR routine_name LIKE '%notification%'
    OR routine_name LIKE '%referral%'
  )
ORDER BY routine_name;

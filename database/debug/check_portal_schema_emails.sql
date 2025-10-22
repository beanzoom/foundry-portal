-- Check if emails are being sent through the portal schema instead

-- Check portal.email_logs for recently sent emails
SELECT *
FROM portal.email_logs
ORDER BY created_at DESC
LIMIT 10;

-- Check portal.email_notifications
SELECT *
FROM portal.email_notifications
ORDER BY created_at DESC
LIMIT 10;

-- Check portal.email_notification_batches
SELECT *
FROM portal.email_notification_batches
ORDER BY created_at DESC
LIMIT 10;

-- Check if there's a DIFFERENT email queue in portal schema
SELECT
    schemaname,
    tablename
FROM pg_tables
WHERE schemaname = 'portal'
  AND (tablename LIKE '%email%' OR tablename LIKE '%queue%')
ORDER BY tablename;

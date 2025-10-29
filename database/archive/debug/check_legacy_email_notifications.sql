-- Check the legacy email_notifications table (NOT email_queue)

-- Get structure first
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'email_notifications'
ORDER BY ordinal_position;

-- Then get recent notifications
SELECT *
FROM email_notifications
ORDER BY created_at DESC
LIMIT 10;

-- Also check email_logs to see what was actually sent
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'email_logs'
ORDER BY ordinal_position;

SELECT *
FROM email_logs
ORDER BY created_at DESC
LIMIT 10;

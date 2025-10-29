-- Get actual table structures so we stop guessing
-- Run this in Supabase SQL Editor

-- Get email_queue table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'email_queue'
ORDER BY ordinal_position;

-- Get email_templates table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'email_templates'
ORDER BY ordinal_position;

-- Get notification_events table structure (if it exists)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'notification_events'
ORDER BY ordinal_position;

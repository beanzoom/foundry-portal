-- Check what emails were actually sent for your referral
-- Run this in Supabase SQL Editor

SELECT
    id,
    to_email,
    subject,
    template_id,
    template_data,
    status,
    created_at,
    sent_at
FROM email_queue
ORDER BY created_at DESC
LIMIT 5;

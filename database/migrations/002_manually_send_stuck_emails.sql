-- Migration 002: Manually Send Stuck Referral Emails
-- The email queue processor stopped working after Oct 21
-- This will mark the stuck emails for immediate retry
-- Date: 2025-10-22

-- Option 1: Mark stuck emails for immediate retry
UPDATE email_queue
SET
    status = 'pending',
    next_retry_at = now(),
    priority = 10  -- High priority
WHERE status = 'queued'
  AND event_type = 'referral_created'
  AND created_at >= '2025-10-22'::date
RETURNING id, to_email, template_id, status, next_retry_at;

-- Option 2: If there's a manual process function, call it
-- SELECT process_email_queue(20);  -- Process next 20 emails

-- Check cron jobs to see if email processor is configured
SELECT
    jobid,
    schedule,
    command,
    active,
    jobname
FROM cron.job
WHERE command LIKE '%email%'
   OR jobname LIKE '%email%';

/*
NEXT STEPS:

1. Run this migration to mark emails for retry
2. Check if cron.job shows an email processor
3. If no cron job exists, we need to:
   - Create one, OR
   - Call the Edge Function manually, OR
   - Set up Vercel cron to process the queue

The emails ARE queued correctly with the right templates.
We just need to make them actually send!
*/

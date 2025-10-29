-- Check if emails are actually being sent from the queue

-- Check for any emails that have been processed
SELECT
    eq.id,
    eq.to_email,
    eq.event_type,
    eq.template_id,
    et.subject as template_subject,
    eq.status,
    eq.attempts,
    eq.last_error,
    eq.created_at,
    eq.processed_at
FROM email_queue eq
LEFT JOIN email_templates et ON et.id = eq.template_id
WHERE eq.status IN ('sent', 'failed', 'processing')
   OR eq.processed_at IS NOT NULL
ORDER BY eq.created_at DESC
LIMIT 10;

-- Check for stuck/pending emails
SELECT
    status,
    COUNT(*) as count,
    MIN(created_at) as oldest,
    MAX(created_at) as newest
FROM email_queue
GROUP BY status;

-- Check if there's a pg_cron job for email processing
SELECT
    jobid,
    schedule,
    command,
    active
FROM cron.job
WHERE command LIKE '%email%';

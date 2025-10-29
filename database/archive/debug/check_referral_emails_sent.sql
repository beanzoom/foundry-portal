-- Check what emails were actually queued for your referral
-- Using CORRECT column names from schema

SELECT
    id,
    to_email,
    event_type,
    template_id,
    status,
    event_payload,
    created_at,
    processed_at
FROM email_queue
ORDER BY created_at DESC
LIMIT 5;

-- Also check which template that template_id points to
SELECT
    eq.id as queue_id,
    eq.to_email,
    eq.event_type,
    eq.template_id,
    et.name as template_name,
    et.subject as template_subject,
    eq.status,
    eq.created_at
FROM email_queue eq
LEFT JOIN email_templates et ON et.id = eq.template_id
ORDER BY eq.created_at DESC
LIMIT 5;

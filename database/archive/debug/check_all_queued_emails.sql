-- Find ALL queued emails that are waiting to be sent
-- These might get sent next time email processor runs

SELECT
    eq.id,
    eq.to_email,
    eq.event_type,
    eq.template_id,
    et.name as template_name,
    et.subject,
    eq.status,
    eq.created_at,
    age(now(), eq.created_at) as how_old,
    eq.event_payload->>'title' as event_title,
    eq.attempts,
    eq.last_error
FROM email_queue eq
LEFT JOIN email_templates et ON et.id = eq.template_id
WHERE eq.status IN ('queued', 'failed')
ORDER BY eq.created_at DESC
LIMIT 50;

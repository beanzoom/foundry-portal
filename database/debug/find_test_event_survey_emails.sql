-- Find the "Publish Test Event" and "Publish Test" survey emails that were sent

SELECT
    eq.id,
    eq.to_email,
    eq.event_type,
    eq.template_id,
    et.name as template_name,
    et.subject,
    eq.status,
    eq.created_at,
    eq.processed_at,
    eq.event_payload->>'title' as title,
    eq.event_payload->>'description' as description,
    eq.event_payload->>'location' as location
FROM email_queue eq
LEFT JOIN email_templates et ON et.id = eq.template_id
WHERE (
    -- Event emails
    (eq.event_type = 'event_published' AND eq.event_payload->>'title' = 'Publish Test Event')
    OR
    -- Survey emails
    (eq.event_type = 'survey_published' AND eq.event_payload->>'title' = 'Publish Test')
)
ORDER BY eq.created_at DESC
LIMIT 20;

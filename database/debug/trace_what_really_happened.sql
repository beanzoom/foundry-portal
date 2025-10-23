-- Trace what REALLY happened when you published survey/update
-- There's a bug somewhere that caused wrong emails to be sent

-- =====================================================
-- 1. What did you ACTUALLY publish on Oct 21?
-- =====================================================

-- Check portal_updates
SELECT
    '=== UPDATES PUBLISHED OCT 21 ===' as section,
    id::text,
    title,
    content,
    status,
    created_at,
    published_at
FROM portal_updates
WHERE DATE(created_at) = '2025-10-21'
   OR DATE(published_at) = '2025-10-21'
ORDER BY created_at DESC;

-- Check portal_surveys
SELECT
    '=== SURVEYS PUBLISHED OCT 21 ===' as section,
    id::text,
    title,
    description,
    status,
    created_at,
    published_at
FROM portal_surveys
WHERE DATE(created_at) = '2025-10-21'
   OR DATE(published_at) = '2025-10-21'
ORDER BY created_at DESC;

-- Check portal_events
SELECT
    '=== EVENTS PUBLISHED OCT 21 ===' as section,
    id::text,
    title,
    description,
    location,
    status,
    created_at,
    published_at
FROM portal_events
WHERE DATE(created_at) = '2025-10-21'
   OR DATE(published_at) = '2025-10-21'
ORDER BY created_at DESC;

-- =====================================================
-- 2. What emails were QUEUED at that time?
-- =====================================================

SELECT
    '=== EMAILS QUEUED OCT 21 9:11-9:13pm ===' as section,
    eq.id::text,
    eq.event_type,
    eq.template_id,
    eq.to_email,
    eq.status,
    eq.created_at,
    eq.event_payload->>'title' as title,
    eq.event_payload->>'id' as source_id
FROM email_queue eq
WHERE eq.created_at >= '2025-10-21 21:11:00'
  AND eq.created_at <= '2025-10-21 21:13:00'
ORDER BY eq.created_at;

-- =====================================================
-- 3. What notification rules were ENABLED at that time?
-- =====================================================

SELECT
    '=== ENABLED NOTIFICATION RULES ===' as section,
    nr.event_id,
    nr.name,
    nr.template_id,
    et.subject,
    nr.enabled,
    nr.priority,
    rl.name as recipient_list_name,
    rl.type as recipient_list_type
FROM notification_rules nr
LEFT JOIN email_templates et ON et.id = nr.template_id
LEFT JOIN recipient_lists rl ON rl.id = nr.recipient_list_id
WHERE nr.enabled = true
  AND nr.event_id IN ('update_published', 'survey_published', 'event_published')
ORDER BY nr.event_id, nr.priority DESC;

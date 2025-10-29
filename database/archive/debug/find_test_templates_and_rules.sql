-- Find ALL test-related templates, rules, and configuration
-- We need to DELETE these completely

-- =====================================================
-- 1. Find test email templates
-- =====================================================

SELECT
    '=== TEST EMAIL TEMPLATES ===' as section,
    id,
    name,
    subject,
    is_active,
    created_at
FROM email_templates
WHERE name ILIKE '%test%'
   OR subject ILIKE '%test%'
   OR id ILIKE '%test%'
ORDER BY created_at DESC;

-- =====================================================
-- 2. Find notification rules using test templates
-- =====================================================

SELECT
    '=== NOTIFICATION RULES USING TEST TEMPLATES ===' as section,
    nr.id::text,
    nr.event_id,
    nr.name,
    nr.template_id,
    nr.enabled,
    nr.created_at
FROM notification_rules nr
WHERE nr.template_id ILIKE '%test%'
   OR nr.name ILIKE '%test%'
   OR nr.event_id ILIKE '%test%'
ORDER BY nr.enabled DESC, nr.created_at DESC;

-- =====================================================
-- 3. Find notification events for testing
-- =====================================================

SELECT
    '=== TEST NOTIFICATION EVENTS ===' as section,
    id,
    name,
    description,
    category,
    created_at
FROM notification_events
WHERE id ILIKE '%test%'
   OR name ILIKE '%test%'
   OR category ILIKE '%test%'
ORDER BY created_at DESC;

-- =====================================================
-- 4. Check for emails in queue using test templates
-- =====================================================

SELECT
    '=== QUEUED EMAILS USING TEST TEMPLATES ===' as section,
    eq.id::text,
    eq.to_email,
    eq.template_id,
    eq.event_type,
    eq.status,
    eq.created_at
FROM email_queue eq
WHERE eq.template_id ILIKE '%test%'
   OR eq.event_type ILIKE '%test%'
ORDER BY eq.created_at DESC
LIMIT 20;

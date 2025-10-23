-- Find the actual test events and surveys that were published

-- =====================================================
-- 1. Find "Publish Test Event" in portal_events
-- =====================================================

SELECT
    '=== TEST EVENT IN DATABASE ===' as section,
    id::text,
    title,
    description,
    location,
    status,
    created_at,
    published_at
FROM portal_events
WHERE title ILIKE '%test%'
   OR description ILIKE '%test%'
ORDER BY created_at DESC;

-- =====================================================
-- 2. Find "Publish Test" survey in portal_surveys
-- =====================================================

SELECT
    '=== TEST SURVEY IN DATABASE ===' as section,
    id::text,
    title,
    description,
    status,
    created_at,
    published_at
FROM portal_surveys
WHERE title ILIKE '%test%'
   OR description ILIKE '%test%'
ORDER BY created_at DESC;

-- =====================================================
-- 3. Find "test_template" (if it exists)
-- =====================================================

SELECT
    '=== ACTUAL TEST TEMPLATES ===' as section,
    id,
    name,
    subject,
    is_active
FROM email_templates
WHERE id = 'test_template'
   OR name ILIKE '%test%';

-- =====================================================
-- 4. Find test notification rules
-- =====================================================

SELECT
    '=== TEST NOTIFICATION RULES ===' as section,
    nr.id::text,
    nr.name,
    nr.event_id,
    nr.template_id,
    nr.enabled
FROM notification_rules nr
WHERE nr.name ILIKE '%test%'
   OR nr.template_id = 'test_template';

-- Find who/what created the test surveys and events
-- These IDs came from email_queue but don't exist in portal tables anymore

-- =====================================================
-- 1. Look for survey 48f4b39b-2805-4183-b50d-c5502adace05
-- =====================================================

-- This survey "Publish Test" was queued at 21:12:11
-- Check if it exists or was deleted
SELECT
    '=== SURVEY 48f4b39b (Publish Test) ===' as check,
    *
FROM portal_surveys
WHERE id = '48f4b39b-2805-4183-b50d-c5502adace05';

-- If empty, it was deleted

-- =====================================================
-- 2. Look for survey 7182b282-7a71-425c-ac48-903fce4517dc
-- =====================================================

SELECT
    '=== SURVEY 7182b282 (Publish Test) ===' as check,
    *
FROM portal_surveys
WHERE id = '7182b282-7a71-425c-ac48-903fce4517dc';

-- =====================================================
-- 3. Look for event f14c0acf-d226-43db-ace7-2d440f04f3f8
-- =====================================================

SELECT
    '=== EVENT f14c0acf (Publish Test Event) ===' as check,
    *
FROM portal_events
WHERE id = 'f14c0acf-d226-43db-ace7-2d440f04f3f8';

-- =====================================================
-- 4. Look for event b1b80085-b510-4703-a378-88215b95dd1d
-- =====================================================

SELECT
    '=== EVENT b1b80085 (Publish Test Event) ===' as check,
    *
FROM portal_events
WHERE id = 'b1b80085-b510-4703-a378-88215b95dd1d';

-- =====================================================
-- 5. Check audit logs or created_by for these IDs
-- =====================================================

-- See if there's any record of who created these
SELECT
    '=== WHO QUEUED THESE EMAILS ===' as check,
    eq.id::text as email_queue_id,
    eq.event_type,
    eq.event_payload->>'title' as title,
    eq.event_payload->>'id' as source_id,
    eq.created_by,
    eq.created_at,
    p.email as created_by_email,
    p.first_name,
    p.last_name
FROM email_queue eq
LEFT JOIN profiles p ON p.id = eq.created_by::uuid
WHERE (
    eq.event_payload->>'id' IN (
        '48f4b39b-2805-4183-b50d-c5502adace05',
        '7182b282-7a71-425c-ac48-903fce4517dc',
        'f14c0acf-d226-43db-ace7-2d440f04f3f8',
        'b1b80085-b510-4703-a378-88215b95dd1d'
    )
)
ORDER BY eq.created_at
LIMIT 10;

-- =====================================================
-- 6. Check if there's admin activity logs
-- =====================================================

SELECT
    '=== ADMIN ACTIVITY AROUND THAT TIME ===' as check,
    *
FROM portal_admin_activity
WHERE created_at >= '2025-10-21 21:10:00'
  AND created_at <= '2025-10-21 21:15:00'
ORDER BY created_at;

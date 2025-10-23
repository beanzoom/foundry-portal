-- Migration 004: Final test infrastructure cleanup
-- Date: 2025-10-22
-- Purpose: Remove all test notification rules and prevent future test emails
-- Issue: Test notification rule exists that could accidentally send test emails

-- =====================================================
-- STEP 1: Delete test notification rules
-- =====================================================

DELETE FROM notification_rules
WHERE name ILIKE '%test%'
   OR template_id = 'test_template'
   OR template_id ILIKE '%test%';

-- =====================================================
-- STEP 2: Delete test email templates (if any exist)
-- =====================================================

DELETE FROM email_templates
WHERE id = 'test_template'
   OR name ILIKE '%test%';

-- =====================================================
-- STEP 3: Delete all failed test emails from queue
-- =====================================================

DELETE FROM email_queue
WHERE status = 'failed'
  AND (
    event_type = 'test'
    OR template_id = 'test_template'
    OR template_id ILIKE '%test%'
    OR to_email LIKE '%example.com'
  );

-- =====================================================
-- STEP 4: Mark old queued emails as expired
-- =====================================================

-- Any email queued more than 24 hours ago should expire
UPDATE email_queue
SET
  status = 'expired',
  last_error = 'Email expired - queued for more than 24 hours'
WHERE status = 'queued'
  AND created_at < now() - interval '24 hours';

-- =====================================================
-- STEP 5: Set expiration for all remaining queued emails
-- =====================================================

UPDATE email_queue
SET expires_at = created_at + interval '24 hours'
WHERE status = 'queued'
  AND expires_at IS NULL;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify no test infrastructure remains
SELECT
  '=== VERIFICATION: No test rules should remain ===' as check,
  COUNT(*) as test_rules_remaining
FROM notification_rules
WHERE name ILIKE '%test%'
   OR template_id ILIKE '%test%';

SELECT
  '=== VERIFICATION: No test templates should remain ===' as check,
  COUNT(*) as test_templates_remaining
FROM email_templates
WHERE id ILIKE '%test%'
   OR name ILIKE '%test%';

SELECT
  '=== VERIFICATION: Email queue status ===' as check,
  status,
  COUNT(*) as count
FROM email_queue
WHERE status IN ('queued', 'failed')
GROUP BY status;

-- =====================================================
-- SUMMARY
-- =====================================================

/*
This migration removes:
1. Test notification rule "Test Column Check" (disabled, but now deleted)
2. Any test email templates
3. All failed test emails from queue
4. Expired old emails (> 24 hours)

After this migration:
✅ No test notification rules exist
✅ No test templates exist
✅ No test emails can be triggered
✅ Old queued emails expire after 24 hours

Going forward:
- ONLY way to test emails: Change recipient list to "super-admin-only"
- Never publish events/surveys with "test" in the title to production
- Always use status='draft' for test content
*/

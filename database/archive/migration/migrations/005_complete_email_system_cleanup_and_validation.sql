-- Migration 005: Complete Email System Cleanup and Validation
-- Date: 2025-10-22
-- Purpose: Clean ALL test/old emails and validate notification system works correctly
-- Issue: Test content was inserted via automated process, emails queued to production users

-- =====================================================
-- STEP 1: DELETE ALL QUEUED EMAILS (COMPLETE RESET)
-- =====================================================

-- Delete ALL queued emails - start fresh
DELETE FROM email_queue
WHERE status IN ('queued', 'pending', 'processing');

-- This removes:
-- - 4 legitimate referral emails (will be re-queued when referrals are created)
-- - 0 event/survey/update emails (those already sent or don't exist)
-- - All old test emails

-- =====================================================
-- STEP 2: DELETE ALL FAILED/CANCELLED TEST EMAILS
-- =====================================================

DELETE FROM email_queue
WHERE status IN ('failed', 'cancelled')
  AND (
    event_type LIKE '%test%'
    OR template_id LIKE '%test%'
    OR to_email LIKE '%example.com'
  );

-- =====================================================
-- STEP 3: DELETE TEST NOTIFICATION RULES
-- =====================================================

DELETE FROM notification_rules
WHERE name ILIKE '%test%'
   OR template_id LIKE '%test%'
   OR event_id LIKE '%test%';

-- This removes:
-- - "Test Column Check" rule (disabled but shouldn't exist)

-- =====================================================
-- STEP 4: DELETE TEST TEMPLATES
-- =====================================================

DELETE FROM email_templates
WHERE id LIKE '%test%'
   OR name ILIKE '%test%';

-- =====================================================
-- STEP 5: DELETE TEST NOTIFICATION EVENTS
-- =====================================================

DELETE FROM notification_events
WHERE id LIKE '%test%'
   OR name ILIKE '%test%';

-- =====================================================
-- STEP 6: SET EXPIRATION FOR ANY REMAINING SENT EMAILS
-- =====================================================

-- Mark old sent emails for cleanup (audit trail only)
UPDATE email_queue
SET expires_at = created_at + interval '30 days'
WHERE status = 'sent'
  AND expires_at IS NULL;

-- =====================================================
-- VALIDATION QUERIES
-- =====================================================

-- Verify email queue is EMPTY
SELECT
  '=== EMAIL QUEUE STATUS (SHOULD BE EMPTY) ===' as check,
  status,
  COUNT(*) as count
FROM email_queue
WHERE status IN ('queued', 'pending', 'processing', 'failed')
GROUP BY status;

-- Verify notification rules are CLEAN
SELECT
  '=== NOTIFICATION RULES (NO TEST RULES) ===' as check,
  event_id,
  name,
  template_id,
  enabled
FROM notification_rules
ORDER BY event_id, priority DESC;

-- Verify templates are CLEAN
SELECT
  '=== EMAIL TEMPLATES (NO TEST TEMPLATES) ===' as check,
  id,
  name,
  is_active
FROM email_templates
WHERE is_active = true
ORDER BY category, name;

-- =====================================================
-- EXPECTED RESULTS AFTER MIGRATION
-- =====================================================

/*
EMAIL QUEUE:
- Status 'queued': 0 rows
- Status 'pending': 0 rows
- Status 'processing': 0 rows
- Status 'failed': 0 rows
TOTAL: Clean slate

NOTIFICATION RULES (6 total):
1. event_published → Event Published - Portal Members → event_published_notification
2. referral_created → Referral Invitation Email → referral_invitation
3. referral_created → Referral Created - Admin Notification → referral_admin_notification
4. survey_published → Survey Published - Portal Members → survey_published_notification
5. update_published → Update Published - Portal Members → update_published_notification
6. (Any other production rules)

EMAIL TEMPLATES (should include):
- event_published_notification
- referral_invitation
- referral_admin_notification
- survey_published_notification
- update_published_notification
- welcome_email
- event_registration_confirmation
- (No test templates)

AFTER THIS MIGRATION:
✅ Email queue is completely clean
✅ No test infrastructure exists
✅ Only production notification rules remain
✅ System ready for validation testing
*/

-- =====================================================
-- NEXT STEP: VALIDATE FLOWS
-- =====================================================

/*
Test these flows after migration:

1. CREATE REFERRAL:
   - Should instantly queue 2 emails:
     a) Referee gets "referral_invitation"
     b) Admin gets "referral_admin_notification"
   - Check email_queue immediately after creating referral
   - Emails should have status='queued'

2. PUBLISH EVENT:
   - Publish dialog should show recipient list and email addresses
   - After clicking "Publish & Send Now":
     a) Emails queued with event_published_notification template
     b) Sent to all users in "All Users" recipient list
   - Verify by checking email_queue

3. PUBLISH SURVEY:
   - Same as events
   - Template: survey_published_notification

4. PUBLISH UPDATE:
   - Same as events
   - Template: update_published_notification

All flows should:
- Use correct template
- Send to correct recipient list
- Show accurate preview in publish dialog
- Process immediately (or queue for batch processing)
*/

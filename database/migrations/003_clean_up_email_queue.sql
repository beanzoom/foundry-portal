-- Migration 003: Clean up old test emails and failed queue entries
-- Date: 2025-10-22
-- Purpose: Remove stuck/old emails that might get sent erroneously
-- Issue: Old test event/survey emails being sent when new actions trigger queue processor

-- =====================================================
-- STEP 1: Delete old failed test emails
-- =====================================================

DELETE FROM email_queue
WHERE status = 'failed'
  AND event_type = 'test'
  AND template_id = 'test'
  AND created_at < now() - interval '1 day';

-- =====================================================
-- STEP 2: Delete old queued test emails (over 6 hours old)
-- =====================================================

-- Any email queued more than 6 hours ago that hasn't been processed
-- is likely stuck and should not be sent
DELETE FROM email_queue
WHERE status = 'queued'
  AND created_at < now() - interval '6 hours'
  AND (
    -- Test emails
    event_type LIKE '%test%'
    OR template_id LIKE '%test%'
    OR to_email LIKE '%example.com'
  );

-- =====================================================
-- STEP 3: Update old legitimate queued emails to 'expired'
-- =====================================================

-- For production emails that are old but weren't sent,
-- mark them as expired instead of deleting (for audit trail)
UPDATE email_queue
SET
  status = 'expired',
  last_error = 'Email expired - queued for more than 24 hours without processing'
WHERE status = 'queued'
  AND created_at < now() - interval '24 hours'
  AND event_type NOT IN ('test');

-- =====================================================
-- STEP 4: Add expires_at for future emails
-- =====================================================

-- Update any remaining queued emails to have an expiration
UPDATE email_queue
SET expires_at = created_at + interval '24 hours'
WHERE status = 'queued'
  AND expires_at IS NULL;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check what's left in the queue
SELECT
  status,
  event_type,
  COUNT(*) as count,
  MIN(created_at) as oldest,
  MAX(created_at) as newest
FROM email_queue
WHERE status IN ('queued', 'failed', 'expired')
GROUP BY status, event_type
ORDER BY status, event_type;

-- =====================================================
-- NOTES
-- =====================================================

/*
This migration cleans up:
1. Old failed test emails (> 1 day old)
2. Stuck test emails in queue (> 6 hours old)
3. Old production emails (> 24 hours) marked as expired

Going forward:
- Email queue processor should check expires_at before sending
- Emails older than 24 hours should not be sent
- This prevents old test emails from being sent when queue processor runs
*/

-- Migration 001: Disable Test Notification Rule
-- This rule is causing "Publish Test Event" emails to be sent
-- Date: 2025-10-22
-- Issue: Test rule still enabled, interfering with production notifications

-- Disable the test rule
UPDATE notification_rules
SET enabled = false
WHERE id = '604e9088-e5da-4447-9825-9a70474eabcf'
  AND name = 'Test Column Check'
  AND template_id = 'test_template';

-- Verify the update
SELECT
    id,
    event_id,
    name,
    template_id,
    enabled
FROM notification_rules
WHERE id = '604e9088-e5da-4447-9825-9a70474eabcf';

-- Expected result: enabled = false

-- Actual Diagnosis: Same Database, Different Problem
-- Since both apps use the same database, the trigger SHOULD exist
-- Let's find what's actually wrong

-- =====================================================
-- 1. Check the trigger function EXISTS and has referral logic
-- =====================================================

SELECT
    p.proname as function_name,
    CASE
        WHEN pg_get_functiondef(p.oid) LIKE '%portal_referrals%' THEN 'Has referral logic ✓'
        ELSE 'Missing referral logic ✗'
    END as has_referral_code
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'trigger_email_notification';

-- =====================================================
-- 2. Check notification rules for referral_created
-- =====================================================

SELECT
    nr.id,
    nr.event_id,
    nr.name as rule_name,
    nr.template_id,
    et.name as template_name,
    et.subject as template_subject,
    nr.recipient_list_id,
    rl.name as recipient_list_name,
    rl.type as recipient_list_type,
    rl.filter_criteria,
    nr.enabled,
    nr.priority
FROM notification_rules nr
LEFT JOIN email_templates et ON et.id = nr.template_id
LEFT JOIN recipient_lists rl ON rl.id = nr.recipient_list_id
WHERE nr.event_id = 'referral_created'
ORDER BY nr.priority DESC, nr.enabled DESC;

-- Expected:
-- - Should show 2 rules: one for referee (referral_invitation), one for admin (referral_admin_notification)
-- - Check if BOTH are enabled
-- - Check recipient_list type is 'dynamic' for referee

-- =====================================================
-- 3. Check what emails were ACTUALLY queued recently
-- =====================================================

SELECT
    eq.id,
    eq.to_email,
    eq.event_type,
    eq.template_id,
    et.name as template_name,
    et.subject as template_subject,
    eq.status,
    eq.created_at,
    eq.processed_at,
    eq.sent_at,
    eq.event_payload->>'referee_email' as payload_referee_email
FROM email_queue eq
LEFT JOIN email_templates et ON et.id = eq.template_id
WHERE eq.created_at > now() - interval '24 hours'
ORDER BY eq.created_at DESC
LIMIT 20;

-- Check:
-- - Is there an entry with template_id = 'referral_invitation'?
-- - What status does it have?
-- - Was it sent (processed_at/sent_at not null)?

-- =====================================================
-- 4. Check your most recent referral
-- =====================================================

SELECT
    pr.id,
    pr.referrer_id,
    pr.referee_email,
    pr.referee_first_name,
    pr.referee_last_name,
    pr.referral_code,
    pr.status,
    pr.invitation_sent_at,
    pr.created_at,
    p.email as referrer_email,
    p.first_name as referrer_first_name
FROM portal_referrals pr
LEFT JOIN profiles p ON p.id = pr.referrer_id
ORDER BY pr.created_at DESC
LIMIT 5;

-- =====================================================
-- 5. Check if there's a DIFFERENT email system being used
-- =====================================================

-- Check for email_notifications table (legacy system)
SELECT COUNT(*) as legacy_email_count
FROM email_notifications
WHERE created_at > now() - interval '24 hours';

-- Check email_logs (what was actually sent)
SELECT
    el.id,
    el.to_email,
    el.subject,
    el.status,
    el.created_at,
    el.sent_at
FROM email_logs el
WHERE el.created_at > now() - interval '24 hours'
ORDER BY el.created_at DESC
LIMIT 10;

-- =====================================================
-- 6. Check recipient_lists configuration
-- =====================================================

SELECT
    id,
    name,
    type,
    filter_criteria,
    description
FROM recipient_lists
WHERE id IN (
    SELECT recipient_list_id
    FROM notification_rules
    WHERE event_id = 'referral_created'
);

-- For 'dynamic' type, check filter_criteria->>'source' should be 'referee_email' or similar

-- =====================================================
-- HYPOTHESIS
-- =====================================================

/*
Possible issues:

1. Notification rule is DISABLED
   → Check query 2, look for enabled = false

2. Wrong template_id in notification_rules
   → Check query 2, template_id should be 'referral_invitation'

3. Recipient list is misconfigured
   → Check query 6, type should be 'dynamic' with correct filter

4. Email queue processor isn't running
   → Check query 3, if status = 'queued' and never changes to 'sent'

5. Multiple rules with different priorities
   → Check query 2, wrong rule might have higher priority

6. Template variables are wrong
   → Email queues correctly but fails to send

Since you said "wrong email is sent immediately", this suggests:
- Email IS being sent (not stuck in queue)
- But wrong template is used
- This points to notification_rules having wrong template_id mapping
*/

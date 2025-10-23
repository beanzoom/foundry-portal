-- DEFINITIVE DIAGNOSIS: Find Referral Email Bug
-- Run this in Supabase SQL Editor to see exactly what's wrong
-- Date: 2025-10-22

-- =====================================================
-- STEP 1: What notification rules exist for referral_created?
-- =====================================================

SELECT
    '=== NOTIFICATION RULES FOR REFERRAL_CREATED ===' as section,
    nr.id::text,
    nr.name,
    nr.template_id,
    et.name as template_name,
    et.subject as will_send_subject,
    nr.enabled,
    nr.priority,
    rl.name as recipient_list,
    rl.type as list_type
FROM notification_rules nr
LEFT JOIN email_templates et ON et.id = nr.template_id
LEFT JOIN recipient_lists rl ON rl.id = nr.recipient_list_id
WHERE nr.event_id = 'referral_created'
ORDER BY nr.enabled DESC, nr.priority DESC;

-- LOOK FOR:
-- ❌ Multiple rules enabled (should only be 1-2)
-- ❌ Wrong template_id (should be 'referral_invitation' for referee)
-- ❌ Test templates enabled

-- =====================================================
-- STEP 2: What emails were ACTUALLY queued for your recent referral?
-- =====================================================

WITH recent_referral AS (
    SELECT id, referee_email, created_at
    FROM portal_referrals
    ORDER BY created_at DESC
    LIMIT 1
)
SELECT
    '=== EMAILS QUEUED FOR LATEST REFERRAL ===' as section,
    eq.to_email,
    eq.template_id,
    et.name as template_name,
    et.subject as email_subject,
    eq.event_type,
    eq.status,
    eq.created_at,
    eq.processed_at,
    CASE
        WHEN eq.template_id = 'referral_invitation' THEN '✅ CORRECT'
        ELSE '❌ WRONG TEMPLATE'
    END as is_correct
FROM email_queue eq
LEFT JOIN email_templates et ON et.id = eq.template_id
CROSS JOIN recent_referral rr
WHERE eq.created_at >= rr.created_at - interval '1 minute'
  AND eq.created_at <= rr.created_at + interval '5 minutes'
ORDER BY eq.created_at;

-- LOOK FOR:
-- ❌ No rows (trigger didn't fire)
-- ❌ Wrong template_id
-- ❌ Multiple emails queued with different templates

-- =====================================================
-- STEP 3: What emails are stuck in the queue?
-- =====================================================

SELECT
    '=== OLD QUEUED EMAILS (NEVER SENT) ===' as section,
    eq.to_email,
    eq.template_id,
    et.subject,
    eq.event_type,
    eq.created_at,
    age(now(), eq.created_at) as how_old
FROM email_queue eq
LEFT JOIN email_templates et ON et.id = eq.template_id
WHERE eq.status = 'queued'
  AND eq.created_at < now() - interval '1 hour'
ORDER BY eq.created_at DESC
LIMIT 10;

-- LOOK FOR:
-- ⚠️ Old test emails that might get sent when you click "Send Now"

-- =====================================================
-- STEP 4: Are there TEST rules that are still ENABLED?
-- =====================================================

SELECT
    '=== TEST/DEBUG RULES THAT SHOULD BE DISABLED ===' as section,
    nr.id::text,
    nr.event_id,
    nr.name,
    nr.template_id,
    et.subject,
    nr.enabled,
    CASE
        WHEN nr.enabled = true THEN '❌ SHOULD BE DISABLED'
        ELSE '✅ Disabled correctly'
    END as status
FROM notification_rules nr
LEFT JOIN email_templates et ON et.id = nr.template_id
WHERE (
    nr.name ILIKE '%test%'
    OR nr.template_id ILIKE '%test%'
    OR et.subject ILIKE '%test%'
)
ORDER BY nr.enabled DESC;

-- LOOK FOR:
-- ❌ Any test rules with enabled = true

-- =====================================================
-- STEP 5: Check recipient lists for referral rules
-- =====================================================

SELECT
    '=== RECIPIENT LIST CONFIGURATION ===' as section,
    rl.id::text,
    rl.name,
    rl.type,
    rl.config,
    COUNT(nr.id) as used_by_rules
FROM recipient_lists rl
LEFT JOIN notification_rules nr ON nr.recipient_list_id = rl.id AND nr.event_id = 'referral_created'
WHERE rl.id IN (
    SELECT recipient_list_id
    FROM notification_rules
    WHERE event_id = 'referral_created'
)
GROUP BY rl.id, rl.name, rl.type, rl.config;

-- LOOK FOR:
-- ❌ config that doesn't match referee_email
-- ❌ type = 'static' with wrong email
-- ❌ type = 'role_based' (should be 'dynamic' for referee)

-- =====================================================
-- ANALYSIS GUIDE
-- =====================================================

/*
COMMON ISSUES:

ISSUE 1: Multiple rules enabled for referral_created
SYMPTOM: Step 1 shows 3+ enabled rules
FIX: Disable all test rules, keep only production rules

ISSUE 2: Wrong template mapped
SYMPTOM: Step 1 shows template_id = 'test_template' or 'survey_published'
FIX: Update notification_rules.template_id to 'referral_invitation'

ISSUE 3: Old emails in queue
SYMPTOM: Step 3 shows old test emails
FIX: Delete old queued test emails

ISSUE 4: Recipient list misconfigured
SYMPTOM: Step 5 shows wrong filter_criteria
FIX: Update recipient_list.filter_criteria

ISSUE 5: Trigger not firing
SYMPTOM: Step 2 shows NO ROWS
FIX: Check trigger exists and function has referral logic
*/

-- =====================================================
-- NEXT STEPS
-- =====================================================

/*
After running this query:

1. Copy ALL results and paste them below
2. Look for issues marked with ❌
3. I'll create a fix migration based on what we find

Expected to find ONE of these:
□ Test notification rule is enabled (disable it)
□ Wrong template_id in notification rule (fix mapping)
□ Multiple rules firing (disable duplicates)
□ Old test emails in queue (delete them)
*/

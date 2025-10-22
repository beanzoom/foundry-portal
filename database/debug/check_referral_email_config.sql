-- Debug Query: Check Referral Email Configuration
-- Run this in Supabase SQL Editor to diagnose the wrong email issue
-- Date: 2025-10-22

-- =====================================================
-- PART 1: Check Notification Rules for Referrals
-- =====================================================

SELECT
    nr.id,
    nr.event_id,
    nr.rule_name,
    nr.template_id,
    et.template_name,
    et.subject,
    nr.enabled,
    nr.created_at
FROM notification_rules nr
LEFT JOIN email_templates et ON et.id = nr.template_id
WHERE nr.event_id LIKE '%referral%'
   OR nr.rule_name LIKE '%referral%'
ORDER BY nr.created_at DESC;

-- =====================================================
-- PART 2: Check ALL Active Notification Rules
-- =====================================================

SELECT
    nr.id,
    nr.event_id,
    nr.rule_name,
    nr.template_id,
    et.template_name,
    et.subject,
    nr.enabled
FROM notification_rules nr
LEFT JOIN email_templates et ON et.id = nr.template_id
WHERE nr.enabled = true
ORDER BY nr.event_id;

-- =====================================================
-- PART 3: Check Email Templates
-- =====================================================

SELECT
    id,
    template_name,
    subject,
    created_at,
    updated_at
FROM email_templates
WHERE template_name LIKE '%referral%'
   OR template_name LIKE '%Test%'
   OR subject LIKE '%Test%'
ORDER BY created_at DESC;

-- =====================================================
-- PART 4: Check Recent Email Queue Entries
-- =====================================================

SELECT
    eq.id,
    eq.to_email,
    eq.subject,
    eq.template_id,
    et.template_name,
    eq.status,
    eq.created_at,
    eq.sent_at
FROM email_queue eq
LEFT JOIN email_templates et ON et.id = eq.template_id
ORDER BY eq.created_at DESC
LIMIT 10;

-- =====================================================
-- PART 5: Check Your Most Recent Referral
-- =====================================================

SELECT
    pr.id,
    pr.referee_email,
    pr.referee_first_name,
    pr.referee_last_name,
    pr.referral_code,
    pr.status,
    pr.invitation_sent_at,
    pr.created_at
FROM portal_referrals pr
ORDER BY pr.created_at DESC
LIMIT 5;

-- =====================================================
-- INSTRUCTIONS
-- =====================================================

/*
Run each query above and paste the results here.

We're looking for:
1. Is there a notification rule for 'referral_created' event?
2. What template is mapped to that rule?
3. Are there multiple rules accidentally enabled?
4. What email was actually sent (check email_queue)?

This will help us identify why you got "Publish Test Event" instead of referral email.
*/

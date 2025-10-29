-- Debug Query: Check Referral Email Configuration (FIXED)
-- Run this in Supabase SQL Editor to diagnose the wrong email issue
-- Date: 2025-10-22

-- =====================================================
-- PART 1: Check Notification Rules Table Structure
-- =====================================================

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'notification_rules'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- PART 2: Check ALL Notification Rules
-- =====================================================

SELECT *
FROM notification_rules
ORDER BY created_at DESC;

-- =====================================================
-- PART 3: Check ALL Email Templates
-- =====================================================

SELECT *
FROM email_templates
ORDER BY created_at DESC;

-- =====================================================
-- PART 4: Check Recent Email Queue Entries
-- =====================================================

SELECT *
FROM email_queue
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- PART 5: Check Your Most Recent Referrals
-- =====================================================

SELECT *
FROM portal_referrals
ORDER BY created_at DESC
LIMIT 5;

-- =====================================================
-- INSTRUCTIONS
-- =====================================================

/*
Run this entire query in Supabase SQL Editor.

We need to see:
1. What columns exist in notification_rules table
2. All notification rules (to find the referral_created rule)
3. All email templates (to find which template IDs exist)
4. Recent emails sent (to see which template was actually used)
5. Your recent referrals

This will help us identify why you got "Publish Test Event" instead of referral email.

Just run the whole thing and paste ALL the results back.
*/

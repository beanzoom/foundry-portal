# Prompt for AI Assistant: Fix Referral Email Bug

## Problem Statement

When a user creates a referral in the FleetDRMS portal, they receive the wrong email ("Survey publish test" or similar test email) instead of the proper "Referral Invitation" email.

## What We've Discovered

### 1. The Notification Queue is CORRECT
The `email_queue` table shows correct entries being created:
- `event_type`: "referral_created" ✅
- `template_id`: "referral_invitation" ✅
- `to_email`: correct referee email ✅
- `event_payload`: has all correct data ✅
- **BUT**: `status: "queued"` and `processed_at: null` - **NEVER SENT**

### 2. Multiple Email Systems Exist
Database has duplicate email infrastructure:

**PUBLIC schema tables:**
- `email_queue` (new unified system) - queues emails but doesn't send
- `email_notifications` (legacy system) - probably what's actually sending
- `email_logs` - actual send log
- `email_templates` - template definitions
- `email_notification_batches` - batch processing
- Plus backup tables from migration 042

### 3. Notification Rules are CORRECT
Query shows proper rules configured:
- Rule "Referral Invitation Email" maps `referral_created` → `referral_invitation` template
- Rule is enabled
- Test rule has been disabled

### 4. User Receives Email IMMEDIATELY
When creating referral, user gets email instantly, but:
- Wrong template/subject being sent
- `email_queue` shows status still "queued" after send
- This proves a DIFFERENT email path is being used

## Database Schema Details

### email_queue (new system)
Key columns: `id`, `to_email`, `event_type`, `template_id`, `status`, `event_payload`, `created_at`, `processed_at`

### email_notifications (legacy system)
Structure: UNKNOWN - need to query

### email_templates
Templates exist with IDs like: `referral_invitation`, `test_template`, etc.

### notification_rules
Maps event_id → template_id with priority and recipient_list_id

## Your Task

**Find and fix why the wrong email is being sent for referrals.**

Specifically:

1. **Identify the actual email sending mechanism**
   - Is there a database trigger on `portal_referrals` table?
   - Is there an Edge Function being called?
   - Is there legacy code in `email_notifications` system?

2. **Find what's sending the wrong template**
   - Check `email_logs` table for recent sends
   - Check `email_notifications` for what was actually processed
   - Check database functions that reference "referral" or "email"

3. **Determine why email_queue is not being processed**
   - Is there a cron job that should be running?
   - Is there an Edge Function that processes the queue?
   - Should we be using `email_notifications` instead?

4. **Provide the fix**
   - SQL migration to fix triggers/functions
   - OR instructions to enable queue processor
   - OR fix to point to correct email system

## Database Access

You have access to run SQL queries in Supabase. The database is at:
- Project: `kssbljbxapejckgassgf`
- All tables in `public` schema

## Queries to Run

```sql
-- Check what's in email_notifications
SELECT * FROM email_notifications ORDER BY created_at DESC LIMIT 5;

-- Check what was actually sent
SELECT * FROM email_logs ORDER BY created_at DESC LIMIT 5;

-- Find triggers on portal_referrals
SELECT
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'portal_referrals';

-- Find functions that handle referral emails
SELECT
    routine_name,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (routine_name LIKE '%referral%' OR routine_name LIKE '%email%')
  AND routine_type = 'FUNCTION';
```

## Expected Output

Provide:
1. Root cause explanation (which system is sending, why wrong template)
2. SQL migration script to fix the issue
3. Verification query to confirm fix worked

## Repository Location

Portal repo: `/home/joeylutes/projects/foundry-portal`
- Put fix in: `/home/joeylutes/projects/foundry-portal/database/migrations/002_fix_referral_email.sql`
- Document in: `/home/joeylutes/projects/foundry-portal/database/SCHEMA.md`

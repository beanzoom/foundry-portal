# Referral Email Bug - Root Cause Analysis

**Date**: 2025-10-22
**Issue**: Wrong email template sent when creating referrals
**Status**: DIAGNOSED - Fix ready to apply

---

## The Problem

When a user creates a referral in the portal:
- ✅ Email queue entry is created correctly (`event_type: "referral_created"`, `template_id: "referral_invitation"`)
- ❌ But wrong email is sent immediately (test email or survey email)
- ❌ Email queue shows `status: "queued"` and `processed_at: null` (never sent)

## Root Cause

**The `trigger_email_notification()` function does not exist on the portal database.**

### Why This Happened

During the portal migration from the main app to the separate Supabase project:
1. ✅ Portal tables were migrated (portal_referrals, portal_events, etc.)
2. ✅ Email infrastructure tables were migrated (email_queue, email_templates, notification_rules)
3. ✅ Data was migrated
4. ❌ **Database functions were NOT migrated**
5. ❌ **Triggers were NOT recreated**

Without the trigger function:
- Creating a referral doesn't queue the correct email
- Some other mechanism is sending wrong emails (possibly old code path or manual test)

## How The System SHOULD Work

### Correct Flow (with triggers):

```
1. User creates referral in UI
   ↓
2. INSERT into portal_referrals table
   ↓
3. TRIGGER fires: trigger_referral_email_notification
   ↓
4. Calls: trigger_email_notification() function
   ↓
5. Function logic:
   - Detects table = portal_referrals
   - Sets event_type = 'referral_created'
   - Looks up notification_rules for 'referral_created'
   - Finds template_id = 'referral_invitation'
   - Finds recipient_list (dynamic: referee_email)
   - Inserts into email_queue with correct template
   ↓
6. Email queue processor sends email with correct template
```

### Current Broken Flow (without triggers):

```
1. User creates referral in UI
   ↓
2. INSERT into portal_referrals table
   ↓
3. NO TRIGGER FIRES
   ↓
4. UI code or some other path sends wrong email?
   ↓
5. Wrong template used
```

## Verification Steps

### Step 1: Confirm Function is Missing

Run this query in Supabase SQL Editor:

```sql
SELECT
    p.proname as function_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'trigger_email_notification';
```

**Expected**: NO ROWS (function doesn't exist)

### Step 2: Confirm Triggers are Missing

Run this query:

```sql
SELECT
    trigger_name,
    event_object_table
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'portal_referrals';
```

**Expected**: NO ROWS (trigger doesn't exist)

### Step 3: Check Current Notification Rules

Run this query:

```sql
SELECT
    nr.event_id,
    nr.name,
    nr.template_id,
    et.subject,
    nr.enabled
FROM notification_rules nr
LEFT JOIN email_templates et ON et.id = nr.template_id
WHERE nr.event_id = 'referral_created'
  AND nr.enabled = true;
```

**Expected**: Shows correct rule mapping referral_created → referral_invitation

## The Fix

### Option A: Apply Migration 002 (Recommended)

Run the migration file:
```
/database/migrations/002_add_email_notification_trigger.sql
```

This will:
1. Create the `trigger_email_notification()` function
2. Attach triggers to all portal tables
3. Grant necessary permissions

### Option B: Manual Steps

If you prefer to understand what's being created:

1. Copy the function definition from migration 002
2. Run it in Supabase SQL Editor
3. Verify function was created
4. Create the trigger on portal_referrals
5. Test by creating a new referral

## Post-Fix Verification

After applying the migration, verify it worked:

### 1. Check Function Exists
```sql
SELECT proname FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'trigger_email_notification';
```
**Should return**: `trigger_email_notification`

### 2. Check Trigger Exists
```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'portal_referrals';
```
**Should return**: `trigger_referral_email_notification` on `portal_referrals`

### 3. Test With Real Referral

Create a test referral and check:

```sql
-- Check email was queued with correct template
SELECT
    to_email,
    event_type,
    template_id,
    status,
    created_at
FROM email_queue
ORDER BY created_at DESC
LIMIT 1;
```

**Should show**:
- `event_type`: `referral_created`
- `template_id`: `referral_invitation`
- `to_email`: the referee's email
- `status`: `queued`

## Why Email Was Sent Before (Wrong Template)

The wrong email you received was likely from one of these sources:

1. **Old queued emails from tests** - Check `email_queue` for old entries with test templates
2. **Manual testing in admin** - Someone may have sent test emails
3. **UI code calling email directly** - Check if there's any frontend code that calls email Edge Function directly
4. **Legacy email system** - Check if there's an old `email_notifications` table being used

To clean up old queue entries:
```sql
-- View old queued emails
SELECT * FROM email_queue
WHERE status = 'queued'
  AND created_at < now() - interval '1 hour'
ORDER BY created_at DESC;

-- Delete old test emails (if needed)
DELETE FROM email_queue
WHERE template_id LIKE '%test%'
  AND status = 'queued';
```

## Next Steps

1. ✅ Run diagnostic query `001_check_trigger_function.sql` to confirm diagnosis
2. ⏳ Apply migration `002_add_email_notification_trigger.sql`
3. ⏳ Verify triggers are working with test referral
4. ⏳ Clean up any old queued test emails
5. ⏳ Document this in migration notes

## Related Files

- **Migration**: `/database/migrations/002_add_email_notification_trigger.sql`
- **Diagnostic**: `/database/debug/001_check_trigger_function.sql`
- **Schema Reference**: `/database/SCHEMA.md`

---

**Impact**: HIGH - This is a critical bug blocking all automated email notifications

**Complexity**: LOW - Simple migration to add missing function and triggers

**Risk**: LOW - Function is tested in main app, just needs to be copied to portal database

**Estimated Fix Time**: 5 minutes to apply migration + 5 minutes to test

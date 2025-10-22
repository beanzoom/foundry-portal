# Migrations to Apply - Email Issue Cleanup

**Date**: 2025-10-22
**Issue**: Test emails sent to production users
**Status**: Ready to apply

---

## What Happened

You published a real event titled "Publish Test Event" and a real survey titled "Publish Test" from the portal UI. The notification system worked correctly - it sent emails to all your users. Some emails got stuck in the queue and were sent later when you created a referral.

---

## Migrations to Apply

Apply these in order in your Supabase SQL Editor:

### 1. Migration 003: Clean up email queue
**File**: `database/migrations/003_clean_up_email_queue.sql`

**What it does**:
- Deletes old failed test emails (> 1 day old)
- Marks old queued emails as expired (> 24 hours)
- Sets expiration for all future queued emails (24 hours)

**Run this first**

---

### 2. Migration 004: Final test cleanup
**File**: `database/migrations/004_final_test_cleanup.sql`

**What it does**:
- Deletes test notification rule "Test Column Check"
- Deletes any test email templates
- Removes all test-related infrastructure
- Prevents test emails from being sent

**Run this second**

---

## After Applying

**Verify with these queries**:

```sql
-- Should return 0
SELECT COUNT(*) FROM notification_rules WHERE name ILIKE '%test%';

-- Should return 0
SELECT COUNT(*) FROM email_templates WHERE name ILIKE '%test%';

-- Should only show legitimate queued referral emails
SELECT status, event_type, COUNT(*)
FROM email_queue
WHERE status = 'queued'
GROUP BY status, event_type;
```

---

## Going Forward

### ✅ Safe Email Testing Workflow

1. Create event/survey with `status = 'draft'`
2. Go to Notification Rules admin
3. Find the rule (e.g., "Event Published Notification")
4. Change recipient list to "Super Admins Only"
5. Publish the event/survey
6. Check your email
7. **IMPORTANT**: Change recipient list back to original
8. Delete the test event/survey

### ❌ Don't Do This

- Don't publish events/surveys with "test" in the title
- Don't leave test notification rules enabled
- Don't assume queued emails won't be sent later

---

## The Real Issue

The notification system worked perfectly. The problem was:
1. You published test content to production (real publish, not draft)
2. Emails were queued for all users
3. Some got stuck and sent later

Now:
- All test infrastructure removed
- Old emails will expire after 24 hours
- Only your workflow (change recipient list) can test safely

---

**Apply migrations 003 and 004 now to clean everything up.**

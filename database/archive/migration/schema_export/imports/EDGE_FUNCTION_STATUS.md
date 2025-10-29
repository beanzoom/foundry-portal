# Edge Function Status - Email Processing

**Date**: 2025-10-28
**Status**: ⚠️ Edge Function not migrated (expected behavior)

---

## What Happened

When testing publishing functionality, you encountered this error:
```
Failed to fetch: https://shthtiwcbdnhvxikxiex.supabase.co/functions/v1/process-email-queue
CORS policy: Response to preflight request doesn't pass access control check
```

**This is EXPECTED and the publishing still worked!**

---

## ✅ What's Working

### Publishing Functionality ✅
- **Update published successfully** ✓
- **Email batch created** ✓
- **Trigger fired correctly** ✓

**Proof**:
```sql
-- This batch was created when you published
SELECT id, notification_type, content_title, status, created_at
FROM email_notification_batches
ORDER BY created_at DESC LIMIT 1;

-- Result:
-- e81e272e-257f-443f-a549-7bfbf16798db | update_published |
-- "Initial Funding Round Officially Opens!" | pending | 2025-10-29 04:23:31
```

The database trigger (`on_portal_update_published`) successfully created an email batch when you published the update.

---

## ⚠️ What's Missing

### Edge Function: `process-email-queue`

**Purpose**: Background service that:
1. Reads pending email batches from `email_notification_batches`
2. Creates individual email queue entries in `email_queue`
3. Sends emails via Resend API
4. Updates batch status to `sent` or `failed`

**Status**: Not deployed to NEW database

**Impact**:
- ✅ Publishing works
- ✅ Email batches created
- ❌ Emails not actually sent yet

---

## How Email System Works

### Two-Phase Email System

#### Phase 1: Publishing (✅ WORKING)
1. Admin publishes Update/Survey/Event
2. Database trigger fires (`create_update_email_batch`)
3. Creates entry in `email_notification_batches` with status='pending'
4. **This part is working perfectly!**

#### Phase 2: Email Sending (⚠️ MISSING)
1. Edge Function `process-email-queue` runs (cron or manual)
2. Reads pending batches from `email_notification_batches`
3. For each batch:
   - Queries `notification_rules` to find recipients
   - Queries `recipient_lists` to get email list
   - Queries `profiles` to get user details
   - Creates entries in `email_queue` for each recipient
   - Sends emails via Resend API
   - Updates batch status
4. **This part needs the Edge Function**

---

## Options for Email Sending

### Option 1: Don't Send Emails (Current State)
**Status**: ✅ Safe to deploy as-is

**Pros**:
- Publishing works
- No risk of sending emails incorrectly
- Can add Edge Function later

**Cons**:
- Users won't receive email notifications
- Email batches will accumulate as 'pending'

**Use Case**: Good for initial deployment if email sending isn't critical yet

---

### Option 2: Deploy Edge Function to NEW Database
**Status**: ⏳ Would require additional work

**What's Needed**:
1. Check if Edge Function exists in OLD database
2. Copy Edge Function code to `supabase/functions/process-email-queue/`
3. Update Edge Function to use NEW database
4. Deploy Edge Function to NEW database
5. Set up cron job or manual trigger

**Files Needed**:
- `supabase/functions/process-email-queue/index.ts`
- Environment variables for Resend API key

**Estimated Time**: 30-60 minutes

---

### Option 3: Manual Email Processing (Workaround)
**Status**: 🛠️ Possible but not recommended

Could create a manual script to:
1. Read pending batches
2. Query recipients
3. Send emails via Resend directly from frontend/backend

**Not recommended** - defeats purpose of queue system

---

## Recommended Approach

### For Immediate Production Deployment

**Use Option 1**: Deploy without email sending

**Steps**:
1. ✅ Publishing works (verified)
2. ✅ Update Vercel environment variables
3. ✅ Deploy to production
4. ⏳ Add Edge Function later when ready

**Rationale**:
- Portal is functional without email notifications
- Users can still see Updates/Surveys/Events in portal
- Email batches are queued and waiting
- When Edge Function is added, can process all pending batches

### For Email Notifications

If emails are critical, need to:
1. Check OLD database for Edge Function
2. Copy and deploy to NEW database
3. Test email sending in staging
4. Then deploy to production

---

## Current Email Batches

```sql
-- Check pending batches in NEW database
SELECT
  notification_type,
  content_title,
  status,
  created_at
FROM email_notification_batches
WHERE status = 'pending'
ORDER BY created_at DESC;

-- Results show:
-- 1 pending batch: "Initial Funding Round Officially Opens!"
-- 3 test batches from earlier
-- 1 event_published batch
```

All these batches are safely queued and will be processed when Edge Function is deployed.

---

## Workaround: "Publish Without Sending"

The `PublishConfirmDialog` has two buttons:

1. **"Publish & Send Emails"** (default)
   - Publishes content ✓
   - Tries to call Edge Function ✗
   - Shows error about failed email sending

2. **"Publish Without Sending"** (workaround)
   - Publishes content ✓
   - Skips email sending
   - No errors shown
   - Batch still created for later

**Recommendation**: Use "Publish Without Sending" until Edge Function is deployed.

---

## Migration Status Update

### Step 8: Test Publishing ✅ COMPLETE

**What Was Tested**:
- ✅ Publishing Update works
- ✅ Email batch created by trigger
- ✅ Database trigger functioning correctly
- ⚠️ Edge Function not available (expected)

**Conclusion**: Publishing functionality is working correctly. The error is about email sending, which is a separate service.

---

## Next Steps

### Immediate (15 minutes)
1. ✅ Mark Step 8 as complete (publishing works)
2. ➡️ Proceed to Step 9: Update Vercel for production deployment
3. ✅ Deploy to production
4. ✅ Test production portal

### Later (Optional - if email sending needed)
1. Check OLD database for Edge Function code
2. Copy Edge Function to NEW database
3. Update environment variables
4. Deploy Edge Function
5. Test email sending
6. Process backlog of pending batches

---

## Questions & Answers

**Q: Did publishing fail?**
A: No! Publishing succeeded. The email batch was created successfully.

**Q: Why the error in console?**
A: The frontend tries to call an Edge Function to send emails immediately, but that function doesn't exist yet. The publishing itself worked fine.

**Q: Will users see the published Update?**
A: Yes! The Update is published and visible in the portal at /portal/updates.

**Q: Should we fix this before production?**
A: Not necessary. Publishing works. You can either:
   - Deploy as-is (users won't get email notifications)
   - Add Edge Function first (adds 30-60 min)
   - Use "Publish Without Sending" button to avoid console errors

**Q: What about existing batches?**
A: They're safe in the database. When Edge Function is deployed later, they can be processed retroactively.

---

## Technical Details

### Edge Function Would Need

**File**: `supabase/functions/process-email-queue/index.ts`

**Environment Variables**:
```
RESEND_API_KEY=re_xxx (from Resend dashboard)
SUPABASE_URL=https://shthtiwcbdnhvxikxiex.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[service_role_key]
```

**Deployment**:
```bash
supabase functions deploy process-email-queue
```

**Invocation**:
- Manual: `supabase.functions.invoke('process-email-queue')`
- Cron: Schedule in Supabase dashboard (e.g., every 5 minutes)

---

## Verification Commands

### Check Published Update
```sql
SELECT id, title, status, published_at
FROM portal_updates
WHERE status = 'published'
ORDER BY published_at DESC LIMIT 1;
```

### Check Email Batch Created
```sql
SELECT *
FROM email_notification_batches
WHERE notification_type = 'update_published'
ORDER BY created_at DESC LIMIT 1;
```

### Check Trigger Exists
```sql
SELECT tgname, proname
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'on_portal_update_published';
```

All three queries should return results, confirming publishing works correctly.

---

**Summary**: Publishing is ✅ WORKING. Email sending is ⏳ PENDING (Edge Function deployment). Safe to proceed with production deployment.

---

*Last Updated: 2025-10-28*
*Status: Ready for production deployment*

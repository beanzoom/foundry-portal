# Edge Function Deployment Guide

## Overview

This Edge Function processes the email queue and sends emails via Resend API.

**Status**: Ready to deploy - Just needs RESEND_API_KEY

---

## Prerequisites

✅ **Already Done**:
1. Edge Function code copied from FleetDRMS
2. Supabase CLI linked to NEW database (shthtiwcbdnhvxikxiex)
3. Database functions exist (`get_next_email_batch`, `mark_email_sent`, `mark_email_failed`)
4. Email templates migrated to NEW database

⚠️ **Still Needed**:
1. RESEND_API_KEY from Resend dashboard

---

## Get Resend API Key

### Option 1: From Resend Dashboard
1. Go to https://resend.com/api-keys
2. Login with your account
3. Copy existing API key OR create new one
4. Key format: `re_...`

### Option 2: Check OLD Database Edge Function Secrets
The OLD database (FleetDRMS) already has this configured. You can:
1. Go to OLD Supabase project dashboard
2. Navigate to Settings → Edge Functions → Secrets
3. Copy the RESEND_API_KEY value
4. Use same key for NEW database

**Note**: Same Resend account/key can be used for both databases.

---

## Deployment Steps

### Step 1: Set Resend API Key

```bash
# Replace re_YOUR_API_KEY with actual key from Resend
supabase secrets set RESEND_API_KEY=re_YOUR_API_KEY
```

**Note**: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are automatically provided by Supabase - no need to set them manually.

### Step 2: Deploy the Edge Function

```bash
cd /home/joeylutes/projects/foundry-portal
supabase functions deploy process-email-queue
```

This will:
- Upload the function code to Supabase
- Make it available at: `https://shthtiwcbdnhvxikxiex.supabase.co/functions/v1/process-email-queue`
- Enable CORS for browser requests

### Step 3: Verify Deployment

Check function is deployed:
```bash
supabase functions list
```

Should show:
```
NAME                    VERSION    STATUS
process-email-queue     1          ACTIVE
```

### Step 4: Test the Function

#### Option A: From Browser Console (Easiest)
1. Login to localhost:5173
2. Go to /admin/updates
3. Publish an update with "Publish & Send Emails" button
4. Check browser console for success message

#### Option B: Manual Test via psql
```bash
# First, create a test email batch
psql "$NEW_DB" -c "
INSERT INTO email_notification_batches (notification_type, content_title, status)
VALUES ('test', 'Test Email', 'pending');
"

# Then invoke the function via Supabase client
# (This would be done from your app code)
```

#### Option C: Direct HTTP Call
```bash
curl -X POST \
  'https://shthtiwcbdnhvxikxiex.supabase.co/functions/v1/process-email-queue' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"batchSize": 10}'
```

---

## Verify Email Sending

After deploying and testing:

### Check Email Queue
```sql
-- Should see emails being processed
SELECT status, COUNT(*)
FROM email_queue
GROUP BY status;
```

### Check Email Batches
```sql
-- Should see batches marked as 'sent' or 'failed'
SELECT notification_type, content_title, status, created_at
FROM email_notification_batches
ORDER BY created_at DESC
LIMIT 5;
```

### Check Resend Dashboard
1. Go to https://resend.com/emails
2. Should see emails being sent
3. Check delivery status

---

## Environment Variables

The Edge Function uses these environment variables:

| Variable | Source | Value |
|----------|--------|-------|
| `SUPABASE_URL` | Auto-provided | https://shthtiwcbdnhvxikxiex.supabase.co |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-provided | [automatically set by Supabase] |
| `RESEND_API_KEY` | **YOU MUST SET** | re_... (from Resend dashboard) |

---

## How It Works

### Trigger Flow

1. **Admin publishes Update/Survey/Event**
   - Content status → 'published'

2. **Database trigger fires**
   - `on_portal_update_published` (for updates)
   - `on_portal_survey_published` (for surveys)
   - `on_portal_event_published` (for events)

3. **Email batch created**
   - Entry in `email_notification_batches` with status='pending'

4. **Frontend calls Edge Function**
   - `emailQueueService.processQueue()` in React app
   - Makes POST request to Edge Function

5. **Edge Function processes batch**
   - Calls `get_next_email_batch()` to get pending emails
   - For each email:
     - Fetches template from `email_templates`
     - Interpolates variables (title, portal_url, etc.)
     - Sends via Resend API
     - Calls `mark_email_sent()` or `mark_email_failed()`

6. **Result returned to frontend**
   - Shows success/failure message to admin
   - Logs sent/failed counts

---

## Rate Limiting

The Edge Function includes rate limiting:
- **500ms delay between emails** = 2 emails/second max
- Respects Resend API limits
- Processes batches of 10-50 emails at a time

---

## Error Handling

### If Email Fails
- Marked as 'failed' in `email_queue`
- Error message logged
- Can be retried via admin panel

### If Template Missing
- Falls back to generic template
- Still sends email with basic content

### If Resend API Error
- Logged to Edge Function logs
- Email marked as failed
- Can check logs: `supabase functions logs process-email-queue`

---

## Monitoring

### View Edge Function Logs
```bash
# Real-time logs
supabase functions logs process-email-queue --follow

# Recent logs
supabase functions logs process-email-queue --limit 50
```

### Check Email Statistics
```sql
-- Email queue stats
SELECT
  status,
  COUNT(*) as count,
  MIN(created_at) as oldest,
  MAX(created_at) as newest
FROM email_queue
GROUP BY status;

-- Recent email activity
SELECT
  to_email,
  event_type,
  status,
  sent_at,
  error_message
FROM email_queue
ORDER BY created_at DESC
LIMIT 20;
```

---

## Troubleshooting

### Issue: "Failed to send a request to the Edge Function"
**Cause**: Edge Function not deployed or not accessible
**Fix**: Deploy function with `supabase functions deploy process-email-queue`

### Issue: "RESEND_API_KEY is not defined"
**Cause**: Secret not set in Supabase
**Fix**: `supabase secrets set RESEND_API_KEY=re_YOUR_KEY`

### Issue: Emails not sending
**Possible Causes**:
1. No pending batches - Check `email_notification_batches` table
2. Resend API key invalid - Check Resend dashboard
3. Email templates missing - Check `email_templates` table
4. Database functions missing - Check `get_next_email_batch` exists

### Issue: CORS error in browser
**Cause**: Edge Function CORS headers not set
**Fix**: Already configured in function code - make sure latest version is deployed

---

## Production Considerations

### Set Up Cron Job (Optional)
Instead of triggering from frontend, can set up automatic processing:

1. Go to Supabase Dashboard
2. Navigate to Database → Cron Jobs
3. Create new cron job:
```sql
SELECT net.http_post(
  url := 'https://shthtiwcbdnhvxikxiex.supabase.co/functions/v1/process-email-queue',
  headers := '{"Authorization": "Bearer SERVICE_ROLE_KEY", "Content-Type": "application/json"}',
  body := '{"batchSize": 50}'
);
```

Schedule: Every 5 minutes

### Monitor Email Delivery
- Check Resend dashboard daily
- Monitor bounce rates
- Check spam reports
- Review failed emails weekly

### Backup Strategy
- Email batches stored in database
- Can reprocess failed emails anytime
- Resend keeps email logs for 30 days

---

## Quick Reference Commands

```bash
# Deploy function
supabase functions deploy process-email-queue

# Set secret
supabase secrets set RESEND_API_KEY=re_YOUR_KEY

# List functions
supabase functions list

# View logs
supabase functions logs process-email-queue

# Delete function (if needed)
supabase functions delete process-email-queue
```

---

**Next Step**: Get RESEND_API_KEY and run deployment commands above.

**Estimated Time**: 5-10 minutes

---

*Last Updated: 2025-10-28*
*Status: Ready for deployment - needs RESEND_API_KEY*

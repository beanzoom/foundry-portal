# Edge Function Deployment - COMPLETE ✅

**Date**: 2025-10-28
**Status**: ✅ Deployed and tested successfully
**Function**: process-email-queue

---

## ✅ Deployment Summary

### What Was Done

1. **✅ Edge Function Code Copied**
   - Source: `/home/joeylutes/projects/a_fleetdrms/supabase/functions/process-email-queue/`
   - Destination: `/home/joeylutes/projects/foundry-portal/supabase/functions/process-email-queue/`
   - Fixed template interface to use `body_html` and `body_text`

2. **✅ Supabase CLI Configured**
   - Linked to NEW database: `shthtiwcbdnhvxikxiex`
   - Fixed config.toml compatibility issues
   - Removed unsupported settings (`email_optional`, `oauth_server`)

3. **✅ Resend API Key Created**
   - Created new key in Resend dashboard: "foundry-portal"
   - Key: `re_gdst8rM6_FboCwcbiqZ81ZoX7hFsumQbq`
   - Set as secret: `supabase secrets set RESEND_API_KEY=...`

4. **✅ Edge Function Deployed**
   - Deployed to: `https://shthtiwcbdnhvxikxiex.supabase.co/functions/v1/process-email-queue`
   - Status: **ACTIVE**
   - Version: 1
   - Deployed at: 2025-10-29 04:42:47 UTC

5. **✅ Email Sending Tested**
   - Test Result: **SUCCESS**
   - Processed: 1 email
   - Sent: 1 email
   - Failed: 0
   - Recipient: joey.lutes@beanzoom.com
   - Resend ID: 68ef6a1d-e009-412e-b9c7-a406206d8fcf

---

## Test Results

### Edge Function Invocation
```bash
curl -X POST \
  "https://shthtiwcbdnhvxikxiex.supabase.co/functions/v1/process-email-queue" \
  -H "Authorization: Bearer ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"batchSize": 10}'
```

**Response:**
```json
{
  "message": "Email queue processed",
  "processed": 1,
  "sent": 1,
  "failed": 0,
  "errors": []
}
```

### Database Verification

**Email Queue Status:**
```sql
SELECT to_email, event_type, status, metadata->>'resend_id' as resend_id
FROM email_queue
WHERE event_type = 'update_published'
ORDER BY created_at DESC
LIMIT 1;

-- Result:
-- to_email: joey.lutes@beanzoom.com
-- event_type: update_published
-- status: sent
-- resend_id: 68ef6a1d-e009-412e-b9c7-a406206d8fcf
```

**Email Statistics (Last Hour):**
- Total emails: 1
- Sent: 1
- Failed: 0
- Success rate: 100%

---

## How Email System Now Works

### Full Flow (End-to-End)

1. **Admin publishes Update/Survey/Event**
   - Status changes to 'published' in database

2. **Database trigger fires**
   - `on_portal_update_published` (for updates)
   - Creates entry in `email_notification_batches` with status='pending'

3. **Frontend calls Edge Function** (optional)
   - User clicks "Publish & Send Emails"
   - OR "Publish Without Sending" (batch stays pending)

4. **Edge Function processes queue**
   - Calls `get_next_email_batch(batch_size)` database function
   - Gets pending emails from queue
   - For each email:
     - Fetches template from `email_templates`
     - Fetches user details from `profiles`
     - Interpolates variables (title, portal_url, user_name, etc.)
     - Sends via Resend API
     - Updates status to 'sent' or 'failed'

5. **Email delivered**
   - Resend handles delivery
   - Tracking available in Resend dashboard
   - Status stored in database for audit

---

## Verification Commands

### Check Edge Function Status
```bash
supabase functions list

# Expected output:
# process-email-queue | ACTIVE | Version 1
```

### View Edge Function Logs
```bash
# Real-time logs
supabase functions logs process-email-queue --follow

# Recent logs (last 50)
supabase functions logs process-email-queue --limit 50
```

### Check Email Queue in Database
```sql
-- Overall statistics
SELECT
  status,
  COUNT(*) as count
FROM email_queue
GROUP BY status;

-- Recent emails
SELECT
  to_email,
  event_type,
  status,
  metadata->>'resend_id' as resend_id,
  created_at
FROM email_queue
ORDER BY created_at DESC
LIMIT 10;
```

### Check Email Batches
```sql
SELECT
  notification_type,
  content_title,
  status,
  created_at
FROM email_notification_batches
ORDER BY created_at DESC
LIMIT 10;
```

### Check Resend Dashboard
1. Go to https://resend.com/emails
2. See all sent emails
3. Check delivery status
4. View email content

---

## Environment Configuration

### Edge Function Secrets (Set in Supabase)

| Secret | Value | Source |
|--------|-------|--------|
| `SUPABASE_URL` | https://shthtiwcbdnhvxikxiex.supabase.co | Auto-provided by Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | [service_role_key] | Auto-provided by Supabase |
| `RESEND_API_KEY` | re_gdst8rM6_FboCwcbiqZ81ZoX7hFsumQbq | Set manually |

### How to Update Secrets
```bash
# Update Resend API key
supabase secrets set RESEND_API_KEY=re_NEW_KEY

# View all secrets (values are hidden)
supabase secrets list
```

---

## Email Templates

### Available Templates in Database

Check with:
```sql
SELECT id, name, category, subject
FROM email_templates
WHERE is_active = true
ORDER BY category, name;
```

### Template Variables

Common variables available in all templates:
- `{{user_name}}` - Recipient's first name
- `{{user_email}}` - Recipient's email
- `{{current_date}}` - Today's date
- `{{current_year}}` - Current year
- `{{portal_url}}` - Link to portal content

Event-specific variables:
- **update_published**: `{{title}}`, `{{content}}`, `{{description}}`
- **survey_published**: `{{survey_title}}`, `{{due_date}}`
- **event_published**: `{{event_title}}`, `{{event_date}}`, `{{location}}`

---

## Rate Limiting

**Built into Edge Function:**
- 500ms delay between emails = 2 emails/second max
- Respects Resend API limits
- Processes in batches (default: 10, max: 50)

**Why rate limiting?**
- Prevents overwhelming Resend API
- Avoids getting flagged as spam
- Ensures reliable delivery

---

## Monitoring & Troubleshooting

### Check Email Sending Health

```sql
-- Email success rate (last 24 hours)
SELECT
  COUNT(*) FILTER (WHERE status = 'sent') as sent,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  COUNT(*) as total,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'sent') / COUNT(*), 2) as success_rate
FROM email_queue
WHERE created_at > NOW() - INTERVAL '24 hours';
```

### View Failed Emails
```sql
SELECT
  to_email,
  event_type,
  error_details,
  attempts,
  created_at
FROM email_queue
WHERE status = 'failed'
ORDER BY created_at DESC;
```

### Retry Failed Emails
```sql
-- Reset failed emails back to 'queued' status
UPDATE email_queue
SET status = 'queued', attempts = 0
WHERE status = 'failed'
AND id = 'SPECIFIC_EMAIL_ID';
```

---

## Next Steps

### ✅ Completed
1. Edge Function deployed and working
2. Email sending tested successfully
3. Database integration verified

### ⏳ Remaining
1. **Update Vercel environment variables** (Step 9)
   - Point production to NEW database
   - Deploy to portal.fleetdrms.com

2. **Test in production**
   - Verify login works
   - Test publishing with email sending
   - Monitor for errors

3. **Monitor email delivery**
   - Check Resend dashboard daily
   - Review failed emails weekly
   - Adjust rate limiting if needed

---

## Resend Dashboard Access

**URL**: https://resend.com
**API Key**: foundry-portal (re_gdst8rM6_FboCwcbiqZ81ZoX7hFsumQbq)

**What to monitor:**
- Email delivery rate
- Bounce rate
- Spam complaints
- Daily sending volume

---

## Optional: Automated Email Processing

### Option 1: Cron Job (Recommended for production)

Set up in Supabase Dashboard to process emails automatically every 5 minutes:

1. Go to Supabase Dashboard → Database → Cron Jobs
2. Create new cron job:

```sql
SELECT
  net.http_post(
    url := 'https://shthtiwcbdnhvxikxiex.supabase.co/functions/v1/process-email-queue',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object('batchSize', 50)
  );
```

Schedule: `*/5 * * * *` (every 5 minutes)

### Option 2: Manual Processing

Keep current setup where admin manually triggers email sending via "Publish & Send Emails" button.

**Pros**: More control, can review before sending
**Cons**: Emails won't send automatically

---

## Files Created

| File | Purpose |
|------|---------|
| `/home/joeylutes/projects/foundry-portal/supabase/functions/process-email-queue/index.ts` | Edge Function code |
| `/home/joeylutes/projects/foundry-portal/supabase/functions/process-email-queue/README.md` | Function documentation |
| `/home/joeylutes/projects/foundry-portal/supabase/functions/process-email-queue/DEPLOYMENT.md` | Deployment guide |
| `/home/joeylutes/projects/foundry-portal/database/schema_export/imports/EDGE_FUNCTION_DEPLOYED.md` | This file |

---

## Quick Reference

```bash
# Deploy function
supabase functions deploy process-email-queue

# View logs
supabase functions logs process-email-queue

# List functions
supabase functions list

# Update secret
supabase secrets set RESEND_API_KEY=re_NEW_KEY

# Test from command line
curl -X POST \
  "https://shthtiwcbdnhvxikxiex.supabase.co/functions/v1/process-email-queue" \
  -H "Authorization: Bearer ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"batchSize": 10}'
```

---

**Status**: ✅ **COMPLETE** - Email system fully operational
**Next Step**: Update Vercel for production deployment

---

*Deployment completed: 2025-10-28*
*Email sending tested: 2025-10-28*
*Ready for production: YES*

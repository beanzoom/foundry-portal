# Email Queue Processor

This Edge Function processes the email notification queue asynchronously, providing excellent UX by not blocking survey submissions while emails are sent.

## Deployment

1. **Deploy the function:**
```bash
supabase functions deploy process-email-queue
```

2. **Set environment variables in Supabase Dashboard:**
- `RESEND_API_KEY`: Your Resend API key

3. **Set up a cron job to run every minute:**

In Supabase Dashboard, go to Database → Extensions and enable `pg_cron`, then run:

```sql
-- Create a cron job to process email queue every minute
SELECT cron.schedule(
  'process-email-queue',
  '* * * * *', -- Every minute
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT.supabase.co/functions/v1/process-email-queue',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY',
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object('batchSize', 10)
  );
  $$
);
```

Or use Supabase's built-in scheduled functions (if available in your plan).

## Manual Testing

Test the function manually:

```bash
# Process queue locally
supabase functions serve process-email-queue

# In another terminal, trigger it
curl -i --location --request POST 'http://localhost:54321/functions/v1/process-email-queue' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"batchSize": 5}'
```

## How It Works

1. **Survey Completion**: When a user completes a survey, a database trigger fires
2. **Queue Notification**: The trigger calls `queue_survey_notification()` which adds an email to the queue
3. **Background Processing**: This Edge function runs periodically (every minute) to:
   - Fetch pending notifications
   - Render email templates with survey data
   - Send emails via Resend API
   - Update notification status
4. **Retry Logic**: Failed emails are retried up to 3 times with exponential backoff

## Benefits

- **Non-blocking**: Survey submissions complete instantly
- **Reliable**: Failed emails are automatically retried
- **Scalable**: Processes emails in batches
- **Trackable**: All emails are logged with status

## Monitoring

Check email queue status:
```sql
-- View pending emails
SELECT * FROM email_notifications
WHERE status = 'pending'
ORDER BY created_at DESC;

-- View failed emails
SELECT * FROM email_notifications
WHERE status = 'failed'
ORDER BY updated_at DESC;

-- View today's sent emails
SELECT * FROM email_notifications
WHERE status = 'sent'
AND sent_at >= CURRENT_DATE
ORDER BY sent_at DESC;
```
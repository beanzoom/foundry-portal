/*
================================================================================
ADD ALL DATABASE FUNCTIONS
================================================================================
Run this in NEW database to add all 242 functions
================================================================================
*/

-- Function 1/242
CREATE OR REPLACE FUNCTION public.check_email_queue_health()
 RETURNS TABLE(metric text, value bigint, status text)
 LANGUAGE sql
AS $function$
    SELECT 'Pending Emails' as metric,
           COUNT(*) as value,
           CASE
               WHEN COUNT(*) > 100 THEN 'WARNING: High backlog'
               WHEN COUNT(*) > 50 THEN 'CAUTION: Growing backlog'
               ELSE 'OK'
           END as status
    FROM email_queue
    WHERE status = 'pending'

    UNION ALL

    SELECT 'Failed Emails (24h)' as metric,
           COUNT(*) as value,
           CASE
               WHEN COUNT(*) > 10 THEN 'WARNING: High failure rate'
               WHEN COUNT(*) > 5 THEN 'CAUTION: Some failures'
               ELSE 'OK'
           END as status
    FROM email_queue
    WHERE status = 'failed'
        AND created_at > now() - interval '24 hours'

    UNION ALL

    SELECT 'Sent Emails (24h)' as metric,
           COUNT(*) as value,
           'INFO' as status
    FROM email_queue
    WHERE status = 'sent'
        AND updated_at > now() - interval '24 hours'

    UNION ALL

    SELECT 'Oldest Pending (minutes)' as metric,
           EXTRACT(EPOCH FROM (now() - MIN(created_at)))/60 as value,
           CASE
               WHEN EXTRACT(EPOCH FROM (now() - MIN(created_at)))/60 > 60 THEN 'WARNING: Old emails pending'
               WHEN EXTRACT(EPOCH FROM (now() - MIN(created_at)))/60 > 30 THEN 'CAUTION: Emails aging'
               ELSE 'OK'
           END as status
    FROM email_queue
    WHERE status = 'pending';
$function$;


-- ======================================================================

-- Function 2/242
CREATE OR REPLACE FUNCTION public.complete_email_batch(p_batch_id uuid, p_emails_sent integer, p_emails_failed integer, p_error_message text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE email_notification_batches
  SET status = CASE
        WHEN p_emails_failed > 0 AND p_emails_sent = 0 THEN 'failed'
        WHEN p_emails_failed > 0 THEN 'partial'
        ELSE 'completed'
      END,
      emails_sent = p_emails_sent,
      emails_failed = p_emails_failed,
      processed_count = p_emails_sent,
      failed_count = p_emails_failed,
      completed_at = now(),
      error_message = p_error_message,
      updated_at = now()
  WHERE id = p_batch_id;
END;
$function$;


-- ======================================================================

-- Function 3/242
CREATE OR REPLACE FUNCTION public.create_email_batch(p_content_id uuid, p_content_type text, p_target_audience text DEFAULT 'all'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_batch_id UUID;
BEGIN
  -- Call the portal schema function
  SELECT portal.create_email_batch(p_content_id, p_content_type, p_target_audience) INTO v_batch_id;
  RETURN v_batch_id;
END;
$function$;


-- ======================================================================

-- Function 4/242
CREATE OR REPLACE FUNCTION public.create_update_email_batch()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_recipients JSONB;
  v_recipient_array JSONB[];
  v_user RECORD;
BEGIN
  -- Only create batch on status change to 'published'
  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN

    -- Build recipients array
    v_recipient_array := ARRAY[]::JSONB[];

    FOR v_user IN
      SELECT id as user_id, email, first_name, last_name
      FROM public.profiles
      WHERE role IN ('portal_member', 'admin', 'super_admin', 'investor')
        AND email IS NOT NULL
    LOOP
      v_recipient_array := array_append(
        v_recipient_array,
        jsonb_build_object(
          'user_id', v_user.user_id::TEXT,
          'email', v_user.email,
          'first_name', v_user.first_name,
          'last_name', v_user.last_name
        )
      );
    END LOOP;

    -- Convert array to JSONB
    v_recipients := to_jsonb(v_recipient_array);

    -- Create the batch in portal schema
    INSERT INTO portal.email_notification_batches (
      notification_type,
      content_id,
      content_title,
      content_data,
      status
    ) VALUES (
      'update_published',
      NEW.id,
      NEW.title,
      jsonb_build_object(
        'content', NEW.content,
        'update_type', NEW.update_type,
        'target_audience', COALESCE(NEW.target_audience, 'all'),
        'published_at', COALESCE(NEW.published_at, NOW()),
        'recipients', v_recipients
      ),
      'pending'
    );

    RAISE NOTICE 'Created email batch for update % with % recipients', NEW.title, array_length(v_recipient_array, 1);
  END IF;

  RETURN NEW;
END;
$function$;


-- ======================================================================

-- Function 5/242
CREATE OR REPLACE FUNCTION public.get_email_stats(p_days integer DEFAULT 30)
 RETURNS TABLE(total_emails bigint, sent_emails bigint, failed_emails bigint, pending_emails bigint, avg_retry_count numeric, emails_today bigint, emails_this_week bigint, emails_this_month bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) AS total_emails,
    COUNT(*) FILTER (WHERE status = 'sent') AS sent_emails,
    COUNT(*) FILTER (WHERE status = 'failed') AS failed_emails,
    COUNT(*) FILTER (WHERE status = 'pending') AS pending_emails,
    AVG(retry_count) AS avg_retry_count,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) AS emails_today,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') AS emails_this_week,
    COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)) AS emails_this_month
  FROM public.email_logs
  WHERE created_at >= NOW() - INTERVAL '1 day' * p_days;
END;
$function$;


-- ======================================================================

-- Function 6/242
CREATE OR REPLACE FUNCTION public.get_next_email_batch(p_batch_size integer DEFAULT 10)
 RETURNS TABLE(queue_id uuid, event_type text, event_id text, template_id text, to_email text, to_user_id uuid, event_payload jsonb, metadata jsonb)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    UPDATE email_queue
    SET
        status = 'processing',
        attempts = attempts + 1,
        last_attempt_at = now(),
        updated_at = now()
    WHERE id IN (
        SELECT id
        FROM email_queue
        WHERE status IN ('queued', 'pending')  -- Accept both queued and pending
            AND scheduled_for <= now()
            AND (expires_at IS NULL OR expires_at > now())
        ORDER BY priority ASC, scheduled_for ASC
        LIMIT p_batch_size
        FOR UPDATE SKIP LOCKED
    )
    RETURNING
        id as queue_id,
        email_queue.event_type,
        email_queue.event_id,
        email_queue.template_id,
        email_queue.to_email,
        email_queue.to_user_id,
        email_queue.event_payload,
        email_queue.metadata;
END;
$function$;


-- ======================================================================

-- Function 7/242
CREATE OR REPLACE FUNCTION public.get_notification_stats(p_hours integer DEFAULT 24)
 RETURNS json
 LANGUAGE plpgsql
 STABLE
AS $function$
DECLARE
  v_stats JSON;
BEGIN
  WITH stats AS (
    SELECT
      COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
      COUNT(*) FILTER (WHERE status = 'processing') as processing_count,
      COUNT(*) FILTER (WHERE status = 'sent' AND sent_at >= NOW() - (p_hours || ' hours')::interval) as sent_count,
      COUNT(*) FILTER (WHERE status = 'failed' AND error_count >= max_retries) as failed_count,
      COUNT(*) FILTER (WHERE status = 'failed' AND error_count < max_retries) as retry_count,
      AVG(EXTRACT(EPOCH FROM (sent_at - created_at))) FILTER (WHERE status = 'sent') as avg_send_time_seconds,
      MAX(created_at) FILTER (WHERE status = 'pending') as oldest_pending
    FROM public.email_notifications
    WHERE created_at >= NOW() - (p_hours || ' hours')::interval
  ),
  event_stats AS (
    SELECT
      event_id,
      COUNT(*) as count
    FROM public.email_notifications
    WHERE created_at >= NOW() - (p_hours || ' hours')::interval
    GROUP BY event_id
    ORDER BY count DESC
    LIMIT 10
  )
  SELECT jsonb_build_object(
    'summary', row_to_json(stats),
    'by_event', json_agg(row_to_json(event_stats))
  ) INTO v_stats
  FROM stats, event_stats
  GROUP BY stats.*;

  RETURN v_stats;
END;
$function$;


-- ======================================================================

-- Function 8/242
CREATE OR REPLACE FUNCTION public.get_pending_email_batch()
 RETURNS TABLE(batch_id uuid, notification_type text, content_id text, content_title text, content_data jsonb, recipients jsonb)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        b.id as batch_id,
        b.notification_type,
        b.content_id,
        CASE
            WHEN b.notification_type = 'update_published' THEN
                COALESCE(b.content_data->>'update_title', 'Update')
            WHEN b.notification_type = 'survey_published' THEN
                COALESCE(b.content_data->>'survey_title', 'Survey')
            WHEN b.notification_type = 'event_published' THEN
                COALESCE(b.content_data->>'event_title', 'Event')
            ELSE 'Notification'
        END as content_title,
        b.content_data,
        b.content_data->'recipients' as recipients
    FROM email_notification_batches b
    WHERE b.status = 'pending'
    ORDER BY b.created_at ASC
    LIMIT 1;
END;
$function$;


-- ======================================================================

-- Function 9/242
CREATE OR REPLACE FUNCTION public.get_pending_notifications(p_limit integer DEFAULT 20)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_notifications JSON;
BEGIN
  -- Mark notifications as processing and return them
  WITH pending AS (
    UPDATE public.email_notifications
    SET
      status = 'processing',
      updated_at = NOW()
    WHERE id IN (
      SELECT id
      FROM public.email_notifications
      WHERE (
        (status = 'pending' AND scheduled_for <= NOW())
        OR (status = 'failed' AND retry_after <= NOW() AND error_count < max_retries)
      )
      ORDER BY priority DESC, scheduled_for ASC
      LIMIT p_limit
      FOR UPDATE SKIP LOCKED
    )
    RETURNING *
  )
  SELECT json_agg(row_to_json(pending)) INTO v_notifications
  FROM pending;

  -- Log processing start for each notification
  INSERT INTO public.notification_logs (notification_id, event_type, details)
  SELECT
    (n->>'id')::UUID,
    'processing',
    jsonb_build_object('batch_size', p_limit)
  FROM json_array_elements(COALESCE(v_notifications, '[]'::json)) AS n;

  RETURN COALESCE(v_notifications, '[]'::json);
END;
$function$;


-- ======================================================================

-- Function 10/242
CREATE OR REPLACE FUNCTION public.get_portal_email_recipients(p_target_audience text DEFAULT 'all'::text, p_notification_type text DEFAULT 'updates'::text)
 RETURNS TABLE(user_id uuid, email text, first_name text, last_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN QUERY
  WITH portal_users AS (
    -- 1. System admins (super_admin and admin) - they automatically have portal access
    SELECT DISTINCT
      sua.user_id,
      p.email,
      p.first_name,
      p.last_name,
      'portal_admin' as portal_role
    FROM system_user_assignments sua
    INNER JOIN profiles p ON p.id = sua.user_id
    WHERE sua.system_role IN ('super_admin', 'admin')
      AND sua.is_active = true
      AND p.email IS NOT NULL

    UNION

    -- 2. Explicit portal memberships from portal_memberships table
    SELECT DISTINCT
      pm.user_id,
      p.email,
      p.first_name,
      p.last_name,
      pm.portal_role
    FROM portal_memberships pm
    INNER JOIN profiles p ON p.id = pm.user_id
    WHERE pm.is_active = true
      AND p.email IS NOT NULL

    UNION

    -- 3. Portal members from profiles table (users with portal_member role)
    SELECT DISTINCT
      p.id as user_id,
      p.email,
      p.first_name,
      p.last_name,
      'portal_member' as portal_role
    FROM profiles p
    WHERE p.role = 'portal_member'
      AND p.email IS NOT NULL
  )
  SELECT DISTINCT
    pu.user_id,
    pu.email::TEXT,
    pu.first_name::TEXT,
    pu.last_name::TEXT
  FROM portal_users pu
  LEFT JOIN user_email_preferences ep ON ep.user_id = pu.user_id
  WHERE
    -- Check email preferences
    (
      ep.user_id IS NULL -- No preferences = enabled by default
      OR (
        -- Check specific notification type preferences
        CASE
          WHEN p_notification_type = 'updates' THEN COALESCE(ep.updates_enabled, true)
          WHEN p_notification_type = 'surveys' THEN COALESCE(ep.surveys_enabled, true)
          WHEN p_notification_type = 'events' THEN COALESCE(ep.events_enabled, true)
          ELSE true
        END
        AND COALESCE(ep.frequency, 'immediate') != 'never'
      )
    )
    -- Apply target audience filter if specified
    AND (
      p_target_audience = 'all'
      OR (p_target_audience = 'investors' AND pu.portal_role = 'portal_investor')
      OR (p_target_audience = 'members' AND pu.portal_role = 'portal_member')
      OR (p_target_audience = 'admins' AND pu.portal_role = 'portal_admin')
    )
  ORDER BY pu.email;
END;
$function$;


-- ======================================================================

-- Function 11/242
CREATE OR REPLACE FUNCTION public.invoke_email_processing()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_edge_function_url text;
  v_service_role_key text;
BEGIN
  -- Get configuration from table
  SELECT value INTO v_edge_function_url
  FROM email_config
  WHERE key = 'supabase_url';

  SELECT value INTO v_service_role_key
  FROM email_config
  WHERE key = 'service_role_key';

  IF v_edge_function_url IS NOT NULL AND v_service_role_key IS NOT NULL THEN
    -- Append function path
    v_edge_function_url := v_edge_function_url || '/functions/v1/process-email-queue';

    -- Make async HTTP request to Edge Function using pg_net
    PERFORM net.http_post(
      url := v_edge_function_url,
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || v_service_role_key,
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object('batchSize', 10),
      timeout_milliseconds := 30000
    );
  END IF;

  RETURN NEW;
END;
$function$;


-- ======================================================================

-- Function 12/242
CREATE OR REPLACE FUNCTION public.mark_email_failed(p_queue_id uuid, p_error text, p_error_details jsonb DEFAULT '{}'::jsonb)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_attempts integer;
    v_max_attempts integer;
    v_retry_delay interval;
BEGIN
    SELECT attempts, max_attempts
    INTO v_attempts, v_max_attempts
    FROM email_queue
    WHERE id = p_queue_id;

    -- Calculate retry delay (exponential backoff)
    v_retry_delay := (power(2, LEAST(v_attempts, 6))::text || ' minutes')::interval;

    UPDATE email_queue
    SET
        status = CASE
            WHEN v_attempts >= v_max_attempts THEN 'failed'
            ELSE 'pending'
        END,
        last_error = p_error,
        error_details = p_error_details,
        next_retry_at = CASE
            WHEN v_attempts < v_max_attempts THEN now() + v_retry_delay
            ELSE NULL
        END,
        scheduled_for = CASE
            WHEN v_attempts < v_max_attempts THEN now() + v_retry_delay
            ELSE scheduled_for
        END,
        updated_at = now()
    WHERE id = p_queue_id;
END;
$function$;


-- ======================================================================

-- Function 13/242
CREATE OR REPLACE FUNCTION public.mark_email_sent(p_queue_id uuid, p_resend_id text DEFAULT NULL::text, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE email_queue
    SET
        status = 'sent',
        processed_at = now(),
        metadata = metadata || p_metadata,
        updated_at = now()
    WHERE id = p_queue_id;

    -- Also log to email_logs if desired
    INSERT INTO email_logs (
        id,
        to_email,
        subject,
        template,
        status,
        resend_id,
        sent_at,
        metadata
    )
    SELECT
        gen_random_uuid(),
        eq.to_email,
        COALESCE(et.subject, 'Email Notification'),
        et.name,
        'sent',
        p_resend_id,
        now(),
        eq.metadata || p_metadata
    FROM email_queue eq
    LEFT JOIN email_templates et ON eq.template_id = et.id::text
    WHERE eq.id = p_queue_id;
END;
$function$;


-- ======================================================================

-- Function 14/242
CREATE OR REPLACE FUNCTION public.process_email_queue()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  processed_count INTEGER := 0;
  queue_record RECORD;
BEGIN
  -- Get emails ready to be sent
  FOR queue_record IN
    SELECT * FROM public.email_queue
    WHERE status = 'queued'
      AND scheduled_for <= NOW()
      AND attempts < max_attempts
    ORDER BY priority DESC, scheduled_for
    LIMIT 10
  LOOP
    -- Mark as processing
    UPDATE public.email_queue
    SET status = 'processing',
        attempts = attempts + 1,
        processor_id = gen_random_uuid()::text
    WHERE id = queue_record.id;
    
    -- Here you would trigger the actual email send
    -- For now, we'll just mark it as ready for the Edge Function
    
    processed_count := processed_count + 1;
  END LOOP;
  
  RETURN processed_count;
END;
$function$;


-- ======================================================================

-- Function 15/242
CREATE OR REPLACE FUNCTION public.process_email_queue_manual(p_batch_size integer DEFAULT 10)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_processed int := 0;
    v_email RECORD;
    v_result jsonb := jsonb_build_object('processed', 0, 'errors', ARRAY[]::text[]);
BEGIN
    -- Get batch of pending emails
    FOR v_email IN
        SELECT *
        FROM email_queue
        WHERE status = 'pending'
            AND scheduled_for <= now()
            AND (expires_at IS NULL OR expires_at > now())
        ORDER BY priority DESC, created_at ASC
        LIMIT p_batch_size
        FOR UPDATE SKIP LOCKED
    LOOP
        -- Mark as processing
        UPDATE email_queue
        SET status = 'processing',
            attempts = attempts + 1,
            last_attempt_at = now()
        WHERE id = v_email.id;

        v_processed := v_processed + 1;

        -- Note: Actual email sending would happen via edge function
        -- This is just for manual queue inspection
        RAISE NOTICE 'Would process email % to %', v_email.id, v_email.to_email;
    END LOOP;

    v_result := jsonb_set(v_result, '{processed}', to_jsonb(v_processed));
    RETURN v_result;
END;
$function$;


-- ======================================================================

-- Function 16/242
CREATE OR REPLACE FUNCTION public.process_email_queue_trigger()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_batch RECORD;
    v_result jsonb;
BEGIN
    -- Process emails by calling the edge function via HTTP
    -- Note: This requires pg_net extension

    -- For now, we'll just mark emails for processing
    -- The actual sending needs to be done by the edge function

    -- Get batch of emails to process
    FOR v_batch IN
        SELECT * FROM get_next_email_batch(10)
    LOOP
        RAISE NOTICE 'Would process email: % to %', v_batch.queue_id, v_batch.to_email;

        -- In production, this would call the edge function
        -- For now, we need to manually process or use the UI
    END LOOP;

    -- Alternative: Use Supabase's HTTP client if available
    -- This is what actually needs to happen:
    -- PERFORM net.http_post(
    --     url := 'https://your-project.supabase.co/functions/v1/process-email-queue',
    --     headers := '{"Authorization": "Bearer YOUR_SERVICE_KEY"}'::jsonb,
    --     body := '{"batchSize": 10}'::jsonb
    -- );

    RETURN;
END;
$function$;


-- ======================================================================

-- Function 17/242
CREATE OR REPLACE FUNCTION public.process_referral_emails_now()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_result jsonb;
  v_edge_function_url text;
  v_service_role_key text;
BEGIN
  v_edge_function_url := current_setting('app.supabase_url', true) || '/functions/v1/process-email-queue';
  v_service_role_key := current_setting('app.service_role_key', true);

  -- Check configuration
  IF v_edge_function_url IS NULL OR v_service_role_key IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Missing configuration: app.supabase_url or app.service_role_key not set'
    );
  END IF;

  -- Call Edge Function synchronously and return result
  SELECT content::jsonb INTO v_result
  FROM net.http_post(
    url := v_edge_function_url,
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || v_service_role_key,
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object('batchSize', 50),
    timeout_milliseconds := 60000
  );

  RETURN v_result;
END;
$function$;


-- ======================================================================

-- Function 18/242
CREATE OR REPLACE FUNCTION public.queue_email(p_event_type text, p_event_id text DEFAULT NULL::text, p_event_payload jsonb DEFAULT '{}'::jsonb, p_template_id text DEFAULT NULL::text, p_recipient_list_id text DEFAULT NULL::text, p_to_email text DEFAULT NULL::text, p_to_user_id uuid DEFAULT NULL::uuid, p_priority integer DEFAULT 5, p_scheduled_for timestamp with time zone DEFAULT now(), p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_queue_id uuid;
BEGIN
    -- Validate that we have either a recipient list or individual recipient
    IF p_recipient_list_id IS NULL AND p_to_email IS NULL THEN
        RAISE EXCEPTION 'Must provide either recipient_list_id or to_email';
    END IF;

    IF p_to_email IS NOT NULL THEN
        -- Single recipient
        INSERT INTO email_queue (
            event_type, event_id, event_payload, template_id,
            to_email, to_user_id, priority, scheduled_for, metadata
        )
        VALUES (
            p_event_type, p_event_id, p_event_payload, p_template_id,
            p_to_email, p_to_user_id, p_priority, p_scheduled_for, p_metadata
        )
        RETURNING id INTO v_queue_id;
    END IF;

    RETURN v_queue_id;
END;
$function$;


-- ======================================================================

-- Function 19/242
CREATE OR REPLACE FUNCTION public.queue_event_email_notifications()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_batch_id UUID;
    v_recipients JSONB;
    v_recipient_count INT;
BEGIN
    -- Only process on status change to 'published'
    IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN

        -- Don't create duplicate batches
        IF EXISTS (
            SELECT 1 FROM email_notification_batches
            WHERE content_id = NEW.id::TEXT
            AND notification_type = 'event_published'
        ) THEN
            RAISE NOTICE 'Email batch already exists for event %', NEW.id;
            RETURN NEW;
        END IF;

        v_batch_id := gen_random_uuid();

        -- Get recipients (all portal users)
        SELECT
            COUNT(*),
            jsonb_agg(jsonb_build_object(
                'user_id', p.id,
                'email', p.email,
                'first_name', p.first_name,
                'last_name', p.last_name
            ))
        INTO v_recipient_count, v_recipients
        FROM profiles p
        WHERE p.email IS NOT NULL
        AND p.email != ''
        AND p.role IN ('portal_member', 'admin', 'super_admin', 'investor');

        IF v_recipient_count > 0 THEN
            -- Insert batch
            INSERT INTO email_notification_batches (
                id,
                notification_type,
                content_id,
                content_data,
                status,
                created_at
            ) VALUES (
                v_batch_id,
                'event_published',
                NEW.id::TEXT,
                jsonb_build_object(
                    'event_id', NEW.id,
                    'event_title', NEW.title,
                    'event_description', NEW.description,
                    'event_date', NEW.event_date,
                    'location', NEW.location,
                    'recipients', v_recipients
                ),
                'pending',
                NOW()
            );

            -- Update event record
            NEW.email_batch_id := v_batch_id;
            NEW.email_sent_at := NOW();

            RAISE NOTICE 'Created email batch % for event % with % recipients',
                v_batch_id, NEW.id, v_recipient_count;
        ELSE
            RAISE NOTICE 'No recipients found for event %', NEW.id;
        END IF;
    END IF;

    RETURN NEW;
END;
$function$;


-- ======================================================================

-- Function 20/242
CREATE OR REPLACE FUNCTION public.queue_notification(p_event_id text, p_event_data jsonb, p_triggered_by uuid DEFAULT NULL::uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  DECLARE
    v_rule RECORD;
    v_template RECORD;
    v_recipients UUID[];
    v_recipient UUID;
    v_email TEXT;
    v_user_name TEXT;
    v_queued_count INTEGER := 0;
    v_result JSON;
    v_dynamic_emails TEXT[];
    v_dynamic_email TEXT;
    v_static_email TEXT;
    v_notification_id UUID;
  BEGIN
    RAISE NOTICE 'queue_notification called with event_id: %, data: %', p_event_id, p_event_data;

    -- Get active rules for this event
    FOR v_rule IN
      SELECT * FROM public.notification_rules
      WHERE event_id = p_event_id AND enabled = true
      ORDER BY priority
    LOOP
      RAISE NOTICE 'Processing rule: % (type: %)', v_rule.name, v_rule.recipient_type;

      -- Get the template
      SELECT * INTO v_template
      FROM public.email_templates
      WHERE id = v_rule.template_id AND is_active = true;

      IF v_template IS NULL THEN
        RAISE NOTICE 'No active template found for rule';
        CONTINUE;
      END IF;

      -- Determine recipients based on recipient_type
      v_recipients := ARRAY[]::UUID[];
      v_dynamic_emails := ARRAY[]::TEXT[];

      -- HANDLE STATIC RECIPIENT TYPE
      IF v_rule.recipient_type = 'static' THEN
        -- Get the static email from recipient_config
        v_static_email := v_rule.recipient_config->>'email';

        IF v_static_email IS NOT NULL THEN
          -- Insert notification for static email
          INSERT INTO public.email_notifications (
            id,
            event_id,
            rule_id,
            to_email,
            subject,
            template_id,
            template_data,
            status,
            priority,
            created_by,
            created_at
          ) VALUES (
            gen_random_uuid(),
            p_event_id,
            v_rule.id,
            v_static_email,
            v_template.subject,
            v_template.id,
            p_event_data,
            'pending',
            v_rule.priority,
            p_triggered_by,
            NOW()
          );

          v_queued_count := v_queued_count + 1;
          RAISE NOTICE 'Queued static email for %', v_static_email;
        END IF;

      ELSIF v_rule.recipient_type = 'role' THEN
        -- Get all users with specified roles
        IF v_rule.recipient_config ? 'roles' THEN
          SELECT array_agg(id) INTO v_recipients
          FROM public.profiles
          WHERE role = ANY((v_rule.recipient_config->>'roles')::text[])
            AND email IS NOT NULL;
        ELSE
          -- Fallback to default roles
          SELECT array_agg(id) INTO v_recipients
          FROM public.profiles
          WHERE role IN ('portal_member', 'admin', 'super_admin', 'investor')
            AND email IS NOT NULL;
        END IF;

        RAISE NOTICE 'Found % recipients with roles', COALESCE(array_length(v_recipients, 1), 0);

      ELSIF v_rule.recipient_type = 'dynamic' THEN
        -- Handle dynamic recipient type
        -- Check if it's a simple field reference (like the welcome email)
        IF v_rule.recipient_config ? 'field' AND v_rule.recipient_config ? 'source' THEN
          -- Extract email from event data
          v_dynamic_email := p_event_data->>(v_rule.recipient_config->>'field');

          IF v_dynamic_email IS NOT NULL THEN
            -- Insert notification for dynamic email
            INSERT INTO public.email_notifications (
              id,
              event_id,
              rule_id,
              to_email,
              subject,
              template_id,
              template_data,
              status,
              priority,
              created_by,
              created_at
            ) VALUES (
              gen_random_uuid(),
              p_event_id,
              v_rule.id,
              v_dynamic_email,
              v_template.subject,
              v_template.id,
              p_event_data,
              'pending',
              v_rule.priority,
              p_triggered_by,
              NOW()
            );

            v_queued_count := v_queued_count + 1;
            RAISE NOTICE 'Queued dynamic email for %', v_dynamic_email;
          END IF;

        ELSIF v_rule.recipient_config ? 'query' THEN
          -- Handle SQL query based dynamic recipients (existing code)
          BEGIN
            EXECUTE v_rule.recipient_config->>'query' INTO v_dynamic_emails;
            RAISE NOTICE 'Dynamic query returned % emails', COALESCE(array_length(v_dynamic_emails,
   1), 0);
          EXCEPTION
            WHEN OTHERS THEN
              -- If query fails, try simpler approach
              SELECT array_agg(email) INTO v_dynamic_emails
              FROM public.profiles
              WHERE role IN ('portal_member', 'admin', 'super_admin', 'investor')
                AND email IS NOT NULL;
              RAISE NOTICE 'Fallback query returned % emails',
  COALESCE(array_length(v_dynamic_emails, 1), 0);
          END;

          -- Queue emails for dynamic query results
          IF v_dynamic_emails IS NOT NULL AND array_length(v_dynamic_emails, 1) > 0 THEN
            FOREACH v_dynamic_email IN ARRAY v_dynamic_emails
            LOOP
              IF v_dynamic_email IS NOT NULL THEN
                INSERT INTO public.email_notifications (
                  id,
                  event_id,
                  rule_id,
                  to_email,
                  subject,
                  template_id,
                  template_data,
                  status,
                  priority,
                  created_by,
                  created_at
                ) VALUES (
                  gen_random_uuid(),
                  p_event_id,
                  v_rule.id,
                  v_dynamic_email,
                  v_template.subject,
                  v_template.id,
                  p_event_data || jsonb_build_object('user_name', 'Portal Member'),
                  'pending',
                  v_rule.priority,
                  p_triggered_by,
                  NOW()
                );

                v_queued_count := v_queued_count + 1;
                RAISE NOTICE 'Queued email for %', v_dynamic_email;
              END IF;
            END LOOP;
          END IF;
        END IF;
      END IF;

      -- Queue email for role-based recipients
      IF v_recipients IS NOT NULL AND array_length(v_recipients, 1) > 0 THEN
        FOREACH v_recipient IN ARRAY v_recipients
        LOOP
          -- Get recipient details
          SELECT email, COALESCE(first_name, 'Portal Member')
          INTO v_email, v_user_name
          FROM public.profiles
          WHERE id = v_recipient;

          IF v_email IS NOT NULL THEN
            -- Add user_name to event data
            p_event_data := p_event_data || jsonb_build_object('user_name', v_user_name);

            -- Insert into email_notifications table
            INSERT INTO public.email_notifications (
              id,
              event_id,
              rule_id,
              to_email,
              subject,
              template_id,
              template_data,
              status,
              priority,
              created_by,
              created_at
            ) VALUES (
              gen_random_uuid(),
              p_event_id,
              v_rule.id,
              v_email,
              v_template.subject,
              v_template.id,
              p_event_data,
              'pending',
              v_rule.priority,
              v_recipient,  -- Use the user's ID as created_by
              NOW()
            );

            v_queued_count := v_queued_count + 1;
            RAISE NOTICE 'Queued email for %', v_email;
          END IF;
        END LOOP;
      END IF;
    END LOOP;

    -- Return result
    v_result := json_build_object(
      'success', true,
      'queued_count', v_queued_count,
      'event_id', p_event_id
    );

    RAISE NOTICE 'queue_notification result: %', v_result;
    RETURN v_result;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Error in queue_notification: %', SQLERRM;
      RETURN json_build_object(
        'success', false,
        'error', SQLERRM
      );
  END;
  $function$;


-- ======================================================================

-- Function 21/242
CREATE OR REPLACE FUNCTION public.queue_notification_emails()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_event_type TEXT;
    v_event_payload JSONB;
    v_rule RECORD;
    v_recipient_list RECORD;
    v_recipient RECORD;
    v_roles TEXT[];
    v_source_field TEXT;
    v_recipient_email TEXT;
    v_recipient_id UUID;
    v_base_url TEXT := 'https://portal.fleetdrms.com';
    v_portal_url TEXT;
    v_referrer RECORD;
BEGIN
    -- Determine event type based on table and operation
    IF TG_TABLE_NAME = 'portal_updates' THEN
        IF TG_OP = 'INSERT' THEN
            v_event_type := 'update_published';
        ELSE
            RETURN NEW;
        END IF;
        -- Build portal URL for updates
        v_portal_url := v_base_url || '/updates/' || NEW.id;
    ELSIF TG_TABLE_NAME = 'portal_events' THEN
        IF TG_OP = 'INSERT' THEN
            v_event_type := 'event_created';
        ELSIF TG_OP = 'UPDATE' AND OLD.event_date IS DISTINCT FROM NEW.event_date THEN
            v_event_type := 'event_updated';
        ELSE
            RETURN NEW;
        END IF;
        -- Build portal URL for events
        v_portal_url := v_base_url || '/events/' || NEW.id;
    ELSIF TG_TABLE_NAME = 'portal_referrals' THEN
        IF TG_OP = 'INSERT' THEN
            v_event_type := 'referral_created';
            -- Build portal URL for referral registration
            v_portal_url := v_base_url || '/register?ref=' || NEW.referral_code;
        ELSE
            RETURN NEW;
        END IF;
    ELSIF TG_TABLE_NAME = 'contact_submissions' THEN
        IF TG_OP = 'INSERT' THEN
            v_event_type := 'contact_form_submitted';
        ELSE
            RETURN NEW;
        END IF;
    ELSE
        RETURN NEW;
    END IF;

    -- Build event payload
    v_event_payload := to_jsonb(NEW);
    IF v_portal_url IS NOT NULL THEN
        v_event_payload := v_event_payload || jsonb_build_object('portal_url', v_portal_url);
    END IF;

    -- For referral events, look up the referrer's information from profiles table
    IF TG_TABLE_NAME = 'portal_referrals' AND NEW.referrer_id IS NOT NULL THEN
        RAISE NOTICE 'Looking up referrer with ID: %', NEW.referrer_id;

        SELECT first_name, last_name, email
        INTO v_referrer
        FROM profiles
        WHERE id = NEW.referrer_id;

        IF FOUND THEN
            RAISE NOTICE 'Found referrer: % %', v_referrer.first_name, v_referrer.last_name;
            -- Add referrer information to payload
            v_event_payload := v_event_payload || jsonb_build_object(
                'referrer_first_name', COALESCE(v_referrer.first_name, ''),
                'referrer_last_name', COALESCE(v_referrer.last_name, ''),
                'referrer_email', COALESCE(v_referrer.email, '')
            );
            RAISE NOTICE 'Added referrer to payload';
        ELSE
            RAISE NOTICE 'Referrer NOT found in profiles table';
        END IF;
    END IF;

    -- Find all enabled notification rules for this event type
    FOR v_rule IN
        SELECT * FROM notification_rules
        WHERE event_id = v_event_type
        AND enabled = true
    LOOP
        -- Get the recipient list
        SELECT * INTO v_recipient_list
        FROM recipient_lists
        WHERE id = v_rule.recipient_list_id;

        IF NOT FOUND THEN
            CONTINUE;
        END IF;

        -- Handle different recipient list types
        IF v_recipient_list.type = 'role_based' THEN
            -- Role-based recipient list
            SELECT ARRAY(SELECT jsonb_array_elements_text(v_recipient_list.config->'roles'))
            INTO v_roles;

            FOR v_recipient IN
                SELECT DISTINCT p.email, p.id as user_id, p.first_name, p.last_name
                FROM profiles p
                WHERE p.role = ANY(v_roles)
                AND p.email IS NOT NULL
            LOOP
                INSERT INTO email_queue (
                    to_email,
                    to_user_id,
                    template_id,
                    event_type,
                    event_id,
                    event_payload,
                    recipient_list_id,
                    status,
                    priority,
                    created_at
                )
                VALUES (
                    v_recipient.email,
                    v_recipient.user_id,
                    v_rule.template_id,
                    v_event_type,
                    NEW.id::text,
                    v_event_payload || jsonb_build_object(
                        'recipient_first_name', v_recipient.first_name,
                        'recipient_last_name', v_recipient.last_name
                    ),
                    v_rule.recipient_list_id,
                    'pending',
                    v_rule.priority,
                    NOW()
                );
            END LOOP;
        ELSIF v_recipient_list.type = 'static' THEN
            -- Static recipient list
            FOR v_recipient IN
                SELECT DISTINCT
                    u.email,
                    u.id as user_id,
                    u.first_name,
                    u.last_name
                FROM jsonb_array_elements(v_recipient_list.config->'user_ids') AS user_id_elem
                JOIN profiles u ON u.id = (user_id_elem#>>'{}')::uuid
                WHERE u.email IS NOT NULL
            LOOP
                INSERT INTO email_queue (
                    to_email,
                    to_user_id,
                    template_id,
                    event_type,
                    event_id,
                    event_payload,
                    recipient_list_id,
                    status,
                    priority,
                    created_at
                )
                VALUES (
                    v_recipient.email,
                    v_recipient.user_id,
                    v_rule.template_id,
                    v_event_type,
                    NEW.id::text,
                    v_event_payload || jsonb_build_object(
                        'recipient_first_name', v_recipient.first_name,
                        'recipient_last_name', v_recipient.last_name
                    ),
                    v_rule.recipient_list_id,
                    'pending',
                    v_rule.priority,
                    NOW()
                );
            END LOOP;
        ELSIF v_recipient_list.type = 'dynamic' THEN
            -- Dynamic recipient list - extract email from event payload using configured path
            v_source_field := v_recipient_list.config->>'source';

            IF v_source_field IS NOT NULL THEN
                -- Remove "event." prefix if present
                v_source_field := regexp_replace(v_source_field, '^event\.', '');

                -- Extract email from event payload
                v_recipient_email := v_event_payload->>v_source_field;

                IF v_recipient_email IS NOT NULL AND v_recipient_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
                    -- Look up user by email to get their ID and name
                    SELECT id, first_name, last_name
                    INTO v_recipient_id, v_recipient.first_name, v_recipient.last_name
                    FROM profiles
                    WHERE email = v_recipient_email;

                    -- Determine which name to use for personalization
                    -- For referee emails, use referee's name from the payload
                    IF v_source_field = 'referee_email' THEN
                        INSERT INTO email_queue (
                            to_email,
                            to_user_id,
                            template_id,
                            event_type,
                            event_id,
                            event_payload,
                            recipient_list_id,
                            status,
                            priority,
                            created_at
                        )
                        VALUES (
                            v_recipient_email,
                            v_recipient_id,
                            v_rule.template_id,
                            v_event_type,
                            NEW.id::text,
                            v_event_payload || jsonb_build_object(
                                'recipient_first_name', COALESCE(v_event_payload->>'referee_first_name', ''),
                                'recipient_last_name', COALESCE(v_event_payload->>'referee_last_name', '')
                            ),
                            v_rule.recipient_list_id,
                            'pending',
                            v_rule.priority,
                            NOW()
                        );
                    ELSE
                        -- For other recipients, use their profiles name if found
                        IF v_recipient_id IS NOT NULL THEN
                            INSERT INTO email_queue (
                                to_email,
                                to_user_id,
                                template_id,
                                event_type,
                                event_id,
                                event_payload,
                                recipient_list_id,
                                status,
                                priority,
                                created_at
                            )
                            VALUES (
                                v_recipient_email,
                                v_recipient_id,
                                v_rule.template_id,
                                v_event_type,
                                NEW.id::text,
                                v_event_payload || jsonb_build_object(
                                    'recipient_first_name', v_recipient.first_name,
                                    'recipient_last_name', v_recipient.last_name
                                ),
                                v_rule.recipient_list_id,
                                'pending',
                                v_rule.priority,
                                NOW()
                            );
                        END IF;
                    END IF;
                END IF;
            END IF;

        ELSIF v_recipient_list.type = 'custom' THEN
            -- Custom recipient list logic can be added here in the future
            CONTINUE;
        END IF;
    END LOOP;

    RETURN NEW;
END;
$function$;


-- ======================================================================

-- Function 22/242
CREATE OR REPLACE FUNCTION public.queue_survey_email_notifications()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_batch_id UUID;
    v_recipients JSONB;
    v_recipient_count INT;
BEGIN
    -- Only process on status change to 'published'
    IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN

        -- Don't create duplicate batches
        IF EXISTS (
            SELECT 1 FROM email_notification_batches
            WHERE content_id = NEW.id::TEXT
            AND notification_type = 'survey_published'
        ) THEN
            RAISE NOTICE 'Email batch already exists for survey %', NEW.id;
            RETURN NEW;
        END IF;

        v_batch_id := gen_random_uuid();

        -- Get recipients (all portal users)
        SELECT
            COUNT(*),
            jsonb_agg(jsonb_build_object(
                'user_id', p.id,
                'email', p.email,
                'first_name', p.first_name,
                'last_name', p.last_name
            ))
        INTO v_recipient_count, v_recipients
        FROM profiles p
        WHERE p.email IS NOT NULL
        AND p.email != ''
        AND p.role IN ('portal_member', 'admin', 'super_admin', 'investor');

        IF v_recipient_count > 0 THEN
            -- Insert batch
            INSERT INTO email_notification_batches (
                id,
                notification_type,
                content_id,
                content_data,
                status,
                created_at
            ) VALUES (
                v_batch_id,
                'survey_published',
                NEW.id::TEXT,
                jsonb_build_object(
                    'survey_id', NEW.id,
                    'survey_title', NEW.title,
                    'survey_description', NEW.description,
                    'recipients', v_recipients
                ),
                'pending',
                NOW()
            );

            -- Update survey record
            NEW.email_batch_id := v_batch_id;
            NEW.email_sent_at := NOW();

            RAISE NOTICE 'Created email batch % for survey % with % recipients',
                v_batch_id, NEW.id, v_recipient_count;
        END IF;
    END IF;

    RETURN NEW;
END;
$function$;


-- ======================================================================

-- Function 23/242
CREATE OR REPLACE FUNCTION public.retry_failed_emails(p_hours integer DEFAULT 24)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_count int;
BEGIN
    UPDATE email_queue
    SET status = 'pending',
        attempts = 0,
        last_error = null,
        last_attempt_at = null
    WHERE status = 'failed'
        AND created_at > now() - interval '1 hour' * p_hours
        AND attempts < max_attempts;

    GET DIAGNOSTICS v_count = ROW_COUNT;

    RAISE NOTICE 'Reset % failed emails to pending status', v_count;
    RETURN v_count;
END;
$function$;


-- ======================================================================

-- Function 24/242
CREATE OR REPLACE FUNCTION public.send_calculator_notification(p_submission_data jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_result JSONB;
BEGIN
  -- Queue the notification
  v_result := public.queue_notification(
    'calculator_submission',
    jsonb_build_object(
      'user_name', p_submission_data->>'user_name',
      'user_email', p_submission_data->>'user_email',
      'company_name', p_submission_data->>'company_name',
      'fleet_size', p_submission_data->>'fleet_size',
      'submission_date', COALESCE(p_submission_data->>'submission_date', NOW()::text),
      'total_monthly_savings', p_submission_data->>'total_monthly_savings',
      'total_annual_savings', p_submission_data->>'total_annual_savings',
      'labor_savings_total', p_submission_data->>'labor_savings_total',
      'system_savings_total', p_submission_data->>'system_savings_total',
      'fixed_savings_total', p_submission_data->>'fixed_savings_total',
      'labor_savings_items', p_submission_data->'labor_savings_items',
      'labor_savings_items_count', jsonb_array_length(COALESCE(p_submission_data->'labor_savings_items', '[]'::jsonb)),
      'system_replacement_items', p_submission_data->'system_replacement_items',
      'system_replacement_items_count', jsonb_array_length(COALESCE(p_submission_data->'system_replacement_items', '[]'::jsonb)),
      'fixed_savings_items', p_submission_data->'fixed_savings_items',
      'fixed_savings_items_count', jsonb_array_length(COALESCE(p_submission_data->'fixed_savings_items', '[]'::jsonb)),
      'notes', p_submission_data->>'notes',
      'admin_calculator_url', 'https://fleetdrms.com/portal/admin/calculator',
      'admin_dashboard_url', 'https://fleetdrms.com/portal/admin'
    ),
    p_submission_data->>'user_id'
  );

  RETURN v_result;
END;
$function$;


-- ======================================================================

-- Function 25/242
CREATE OR REPLACE FUNCTION public.set_default_email_preferences()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  UPDATE public.profiles
  SET 
    email_updates = COALESCE(email_updates, true),
    email_surveys = COALESCE(email_surveys, true),
    email_events = COALESCE(email_events, true)
  WHERE email_updates IS NULL 
     OR email_surveys IS NULL 
     OR email_events IS NULL;
END;
$function$;


-- ======================================================================

-- Function 26/242
CREATE OR REPLACE FUNCTION public.trigger_email_notification()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_rule notification_rules;
    v_recipient_list recipient_lists;
    v_recipient RECORD;
    v_template email_templates;
    v_roles text[];
    v_event_type text;
    v_event_payload jsonb;
    v_base_url text := 'https://portal.fleetdrms.com';
    v_portal_url text;
    v_dynamic_email text;
    v_static_email text;
    v_referrer RECORD;
    v_email_pref_column text; -- Which email preference column to check
BEGIN
    -- Determine event type and email preference column based on table and operation
    IF TG_TABLE_NAME = 'portal_updates' THEN
        IF TG_OP = 'INSERT' AND NEW.status = 'published' THEN
            v_event_type := 'update_published';
            v_email_pref_column := 'email_updates';
        ELSIF TG_OP = 'UPDATE' AND OLD.status != 'published' AND NEW.status = 'published' THEN
            v_event_type := 'update_published';
            v_email_pref_column := 'email_updates';
        ELSE
            RETURN NEW;
        END IF;
        v_portal_url := v_base_url || '/updates/' || NEW.id;

    ELSIF TG_TABLE_NAME = 'portal_surveys' THEN
        IF TG_OP = 'INSERT' AND NEW.status = 'published' THEN
            v_event_type := 'survey_published';
            v_email_pref_column := 'email_surveys';
        ELSIF TG_OP = 'UPDATE' AND OLD.status != 'published' AND NEW.status = 'published' THEN
            v_event_type := 'survey_published';
            v_email_pref_column := 'email_surveys';
        ELSE
            RETURN NEW;
        END IF;
        v_portal_url := v_base_url || '/surveys/' || NEW.id;

    ELSIF TG_TABLE_NAME = 'portal_events' THEN
        IF TG_OP = 'INSERT' AND NEW.status = 'published' THEN
            v_event_type := 'event_published';
            v_email_pref_column := 'email_events';
        ELSIF TG_OP = 'UPDATE' AND OLD.status != 'published' AND NEW.status = 'published' THEN
            v_event_type := 'event_published';
            v_email_pref_column := 'email_events';
        ELSE
            RETURN NEW;
        END IF;
        v_portal_url := v_base_url || '/events/' || NEW.id;

    ELSIF TG_TABLE_NAME = 'portal_referrals' THEN
        IF TG_OP = 'INSERT' THEN
            v_event_type := 'referral_created';
            v_email_pref_column := 'email_updates'; -- Default to email_updates for referrals
            v_portal_url := v_base_url || '/register?ref=' || NEW.referral_code;

            -- For referral events, look up the referrer's information
            IF NEW.referrer_id IS NOT NULL THEN
                SELECT first_name, last_name, email
                INTO v_referrer
                FROM profiles
                WHERE id = NEW.referrer_id;
            END IF;
        ELSE
            RETURN NEW;
        END IF;

    ELSIF TG_TABLE_NAME = 'contact_submissions' THEN
        IF TG_OP = 'INSERT' THEN
            v_event_type := 'contact_form_submitted';
            v_email_pref_column := 'email_updates'; -- Default to email_updates for contact submissions
        ELSE
            RETURN NEW;
        END IF;
    ELSE
        RETURN NEW;
    END IF;

    -- Build event payload
    v_event_payload := to_jsonb(NEW);
    IF v_portal_url IS NOT NULL THEN
        v_event_payload := v_event_payload || jsonb_build_object('portal_url', v_portal_url);
    END IF;

    -- Add referrer info to payload if this was a referral event
    IF TG_TABLE_NAME = 'portal_referrals' AND v_referrer IS NOT NULL THEN
        v_event_payload := v_event_payload || jsonb_build_object(
            'referrer_first_name', COALESCE(v_referrer.first_name, ''),
            'referrer_last_name', COALESCE(v_referrer.last_name, ''),
            'referrer_email', COALESCE(v_referrer.email, '')
        );
    END IF;

    -- Find all enabled notification rules for this event type
    FOR v_rule IN
        SELECT * FROM notification_rules
        WHERE event_id = v_event_type
        AND enabled = true
    LOOP
        -- Get the recipient list
        SELECT * INTO v_recipient_list
        FROM recipient_lists
        WHERE id = v_rule.recipient_list_id;

        IF NOT FOUND THEN
            CONTINUE;
        END IF;

        -- Handle different recipient list types
        IF v_recipient_list.type = 'role_based' THEN
            -- Role-based recipient list
            SELECT ARRAY(SELECT jsonb_array_elements_text(v_recipient_list.config->'roles'))
            INTO v_roles;

            -- Build dynamic query based on event type's email preference column
            FOR v_recipient IN EXECUTE format(
                'SELECT DISTINCT p.email, p.id as user_id, p.first_name, p.last_name
                 FROM profiles p
                 WHERE p.role = ANY($1)
                 AND p.email IS NOT NULL
                 AND (p.%I = true OR p.%I IS NULL)',
                v_email_pref_column, v_email_pref_column
            ) USING v_roles
            LOOP
                INSERT INTO email_queue (
                    to_email,
                    to_user_id,
                    template_id,
                    event_type,
                    event_id,
                    event_payload,
                    recipient_list_id,
                    status,
                    priority,
                    created_at
                )
                VALUES (
                    v_recipient.email,
                    v_recipient.user_id,
                    v_rule.template_id,
                    v_event_type,
                    NEW.id::text,
                    v_event_payload || jsonb_build_object(
                        'recipient_first_name', v_recipient.first_name,
                        'recipient_last_name', v_recipient.last_name
                    ),
                    v_rule.recipient_list_id::text,
                    'queued',
                    v_rule.priority,
                    NOW()
                );
            END LOOP;

        ELSIF v_recipient_list.type = 'static' THEN
            -- Static recipient list - emails stored in config.emails array
            -- For static lists, we send regardless of email preferences (admin override)
            IF v_recipient_list.config ? 'emails' THEN
                FOR v_static_email IN
                    SELECT jsonb_array_elements_text(v_recipient_list.config->'emails')
                LOOP
                    -- Try to get user info if they exist
                    SELECT p.id, p.first_name, p.last_name, p.email
                    INTO v_recipient
                    FROM profiles p
                    WHERE p.email = v_static_email;

                    IF FOUND THEN
                        INSERT INTO email_queue (
                            to_email,
                            to_user_id,
                            template_id,
                            event_type,
                            event_id,
                            event_payload,
                            recipient_list_id,
                            status,
                            priority,
                            created_at
                        )
                        VALUES (
                            v_recipient.email,
                            v_recipient.id,
                            v_rule.template_id,
                            v_event_type,
                            NEW.id::text,
                            v_event_payload || jsonb_build_object(
                                'recipient_first_name', v_recipient.first_name,
                                'recipient_last_name', v_recipient.last_name
                            ),
                            v_rule.recipient_list_id::text,
                            'queued',
                            v_rule.priority,
                            NOW()
                        );
                    ELSE
                        INSERT INTO email_queue (
                            to_email,
                            to_user_id,
                            template_id,
                            event_type,
                            event_id,
                            event_payload,
                            recipient_list_id,
                            status,
                            priority,
                            created_at
                        )
                        VALUES (
                            v_static_email,
                            NULL,
                            v_rule.template_id,
                            v_event_type,
                            NEW.id::text,
                            v_event_payload,
                            v_rule.recipient_list_id::text,
                            'queued',
                            v_rule.priority,
                            NOW()
                        );
                    END IF;
                END LOOP;
            END IF;

        ELSIF v_recipient_list.type = 'dynamic' THEN
            -- Dynamic recipient list - extract email from event payload
            IF v_recipient_list.config ? 'source' THEN
                DECLARE
                    v_source_path text;
                BEGIN
                    v_source_path := v_recipient_list.config->>'source';

                    IF v_source_path LIKE 'event.%' THEN
                        v_source_path := substring(v_source_path from 7);
                        v_dynamic_email := v_event_payload->>v_source_path;

                        IF v_dynamic_email IS NOT NULL AND v_dynamic_email != '' THEN
                            SELECT p.id, p.first_name, p.last_name, p.email
                            INTO v_recipient
                            FROM profiles p
                            WHERE p.email = v_dynamic_email;

                            IF FOUND THEN
                                INSERT INTO email_queue (
                                    to_email,
                                    to_user_id,
                                    template_id,
                                    event_type,
                                    event_id,
                                    event_payload,
                                    recipient_list_id,
                                    status,
                                    priority,
                                    created_at
                                )
                                VALUES (
                                    v_recipient.email,
                                    v_recipient.id,
                                    v_rule.template_id,
                                    v_event_type,
                                    NEW.id::text,
                                    v_event_payload || jsonb_build_object(
                                        'recipient_first_name', v_recipient.first_name,
                                        'recipient_last_name', v_recipient.last_name
                                    ),
                                    v_rule.recipient_list_id::text,
                                    'queued',
                                    v_rule.priority,
                                    NOW()
                                );
                            ELSE
                                INSERT INTO email_queue (
                                    to_email,
                                    to_user_id,
                                    template_id,
                                    event_type,
                                    event_id,
                                    event_payload,
                                    recipient_list_id,
                                    status,
                                    priority,
                                    created_at
                                )
                                VALUES (
                                    v_dynamic_email,
                                    NULL,
                                    v_rule.template_id,
                                    v_event_type,
                                    NEW.id::text,
                                    v_event_payload || jsonb_build_object(
                                        'recipient_first_name', COALESCE(v_event_payload->>'referee_first_name', ''),
                                        'recipient_last_name', COALESCE(v_event_payload->>'referee_last_name', '')
                                    ),
                                    v_rule.recipient_list_id::text,
                                    'queued',
                                    v_rule.priority,
                                    NOW()
                                );
                            END IF;
                        END IF;
                    END IF;
                END;
            END IF;

        ELSIF v_recipient_list.type = 'custom' THEN
            CONTINUE;
        END IF;
    END LOOP;

    RETURN NEW;
END;
$function$;


-- ======================================================================

-- Function 27/242
CREATE OR REPLACE FUNCTION public.update_email_notification_status(p_batch_id uuid, p_user_id text, p_email text, p_status text, p_resend_id text DEFAULT NULL::text, p_error_message text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- For now, just log that we processed this recipient
    -- In production, you'd want to track individual recipient status
    IF p_status = 'failed' THEN
        UPDATE email_notification_batches
        SET error_message = COALESCE(error_message || '; ', '') || p_email || ': ' || COALESCE(p_error_message, 'Failed')
        WHERE id = p_batch_id;
    END IF;
END;
$function$;


-- ======================================================================

-- Function 28/242
CREATE OR REPLACE FUNCTION public.update_email_notification_status(p_batch_id uuid, p_status text, p_emails_sent integer DEFAULT 0, p_emails_failed integer DEFAULT 0)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE email_notification_batches
    SET
        status = p_status,
        processed_at = CASE WHEN p_status IN ('sent', 'completed', 'failed') THEN NOW() ELSE processed_at END,
        error_message = CASE WHEN p_status = 'failed' THEN 'Processing failed' ELSE NULL END
    WHERE id = p_batch_id;
END;
$function$;


-- ======================================================================

-- Function 29/242
CREATE OR REPLACE FUNCTION public.update_email_notification_status(p_batch_id uuid, p_user_id uuid, p_email text, p_status text, p_resend_id text DEFAULT NULL::text, p_error_message text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Log the email status (you could create a separate table for this)
  -- For now, just update the batch counts
  IF p_status = 'sent' THEN
    UPDATE portal.email_notification_batches
    SET emails_sent = emails_sent + 1
    WHERE id = p_batch_id;
  ELSIF p_status = 'failed' THEN
    UPDATE portal.email_notification_batches
    SET
      emails_failed = emails_failed + 1,
      error_message = COALESCE(error_message || '; ', '') || p_error_message
    WHERE id = p_batch_id;
  END IF;
END;
$function$;


-- ======================================================================

-- Function 30/242
CREATE OR REPLACE FUNCTION public.update_notification_status(p_notification_id uuid, p_status text, p_error_message text DEFAULT NULL::text, p_email_provider_id text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_current_error_count INTEGER;
  v_max_retries INTEGER;
BEGIN
  -- Get current error count and max retries
  SELECT error_count, max_retries
  INTO v_current_error_count, v_max_retries
  FROM public.email_notifications
  WHERE id = p_notification_id;

  -- Update notification based on status
  IF p_status = 'sent' THEN
    UPDATE public.email_notifications
    SET
      status = 'sent',
      sent_at = NOW(),
      email_provider_id = p_email_provider_id,
      updated_at = NOW()
    WHERE id = p_notification_id;

    -- Log success
    INSERT INTO public.notification_logs (notification_id, event_type, details)
    VALUES (p_notification_id, 'sent', jsonb_build_object('provider_id', p_email_provider_id));

  ELSIF p_status = 'failed' THEN
    UPDATE public.email_notifications
    SET
      status = CASE
        WHEN v_current_error_count + 1 >= v_max_retries THEN 'failed'
        ELSE 'failed'
      END,
      failed_at = CASE
        WHEN v_current_error_count + 1 >= v_max_retries THEN NOW()
        ELSE failed_at
      END,
      error_message = p_error_message,
      error_count = error_count + 1,
      retry_after = CASE
        WHEN v_current_error_count + 1 < v_max_retries
        THEN NOW() + (interval '1 minute' * power(2, v_current_error_count + 1))  -- Exponential backoff
        ELSE NULL
      END,
      updated_at = NOW()
    WHERE id = p_notification_id;

    -- Log failure
    INSERT INTO public.notification_logs (notification_id, event_type, details)
    VALUES (
      p_notification_id,
      CASE
        WHEN v_current_error_count + 1 >= v_max_retries THEN 'failed'
        ELSE 'retried'
      END,
      jsonb_build_object(
        'error', p_error_message,
        'attempt', v_current_error_count + 1,
        'max_retries', v_max_retries
      )
    );
  END IF;
END;
$function$;


-- ======================================================================

-- Function 31/242
CREATE OR REPLACE FUNCTION public.check_referral_deletion_eligibility(p_referral_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_referral RECORD;
  v_issues TEXT[] := ARRAY[]::TEXT[];
  v_related_data JSONB := '{}'::jsonb;
  v_portal_user_exists BOOLEAN := false;
  v_app_user_exists BOOLEAN := false;
BEGIN
  -- Get referral details
  SELECT * INTO v_referral
  FROM public.portal_referrals
  WHERE id = p_referral_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'eligible', false,
      'reason', 'Referral not found',
      'referral_id', p_referral_id
    );
  END IF;

  -- Check referral status
  IF v_referral.status IN ('registered', 'completed') THEN
    v_issues := array_append(v_issues, 'User has already registered (status: ' || v_referral.status || ')');
  END IF;

  -- Check for conversion record
  IF EXISTS (
    SELECT 1 FROM public.portal_referral_conversions
    WHERE referral_id = p_referral_id
  ) THEN
    v_issues := array_append(v_issues, 'Conversion record exists');
  END IF;

  -- Check if user exists as a PORTAL user (this should block deletion)
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE LOWER(email) = LOWER(v_referral.referee_email)
    AND role IN ('super_admin', 'admin', 'portal_member', 'investor')  -- Only portal roles
  ) INTO v_portal_user_exists;

  -- Check if user exists as an APP user (this should NOT block deletion)
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE LOWER(email) = LOWER(v_referral.referee_email)
    AND role = 'user'  -- App user role
  ) INTO v_app_user_exists;

  IF v_portal_user_exists THEN
    v_issues := array_append(v_issues, 'User is already a member of the PORTAL with email: ' || v_referral.referee_email);
  END IF;

  -- Gather related data that would be deleted
  v_related_data := jsonb_build_object(
    'contacts', (
      SELECT COUNT(*) FROM public.contacts
      WHERE referral_id = p_referral_id
    ),
    'pending_emails', (
      SELECT COUNT(*) FROM public.email_notifications
      WHERE metadata->>'referral_id' = p_referral_id::text
      AND status IN ('pending', 'failed')
    ),
    'rate_limits', (
      SELECT COUNT(*) FROM public.portal_referral_rate_limits
      WHERE referral_id = p_referral_id
    ),
    'is_app_user', v_app_user_exists,
    'is_portal_user', v_portal_user_exists,
    'note', CASE
      WHEN v_app_user_exists AND NOT v_portal_user_exists
      THEN 'User exists in main app but not portal - OK to refer to portal'
      WHEN v_portal_user_exists
      THEN 'User already has portal access - cannot refer'
      ELSE 'User does not exist in either system - OK to refer'
    END
  );

  -- Return eligibility status
  IF array_length(v_issues, 1) > 0 THEN
    RETURN json_build_object(
      'eligible', false,
      'reasons', v_issues,
      'referral', row_to_json(v_referral),
      'related_data', v_related_data
    );
  ELSE
    RETURN json_build_object(
      'eligible', true,
      'referral', row_to_json(v_referral),
      'related_data', v_related_data,
      'message', 'Referral is eligible for deletion'
    );
  END IF;
END;
$function$;


-- ======================================================================

-- Function 32/242
CREATE OR REPLACE FUNCTION public.check_referral_rate_limit(p_user_id uuid, p_action_type text, p_referral_id uuid DEFAULT NULL::uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    action_count INTEGER;
    max_allowed INTEGER;
    time_window INTERVAL;
    user_role TEXT;
BEGIN
    -- Check if user is super_admin - they are exempt from rate limits
    SELECT role INTO user_role
    FROM profiles
    WHERE id = p_user_id;

    IF user_role = 'super_admin' THEN
        RETURN TRUE; -- Super admins bypass all rate limits
    END IF;

    -- Set limits based on action type
    IF p_action_type = 'create_referral' THEN
        max_allowed := 10;
        time_window := INTERVAL '1 day';
    ELSIF p_action_type = 'resend_invitation' THEN
        max_allowed := 3;
        time_window := INTERVAL '1 day';

        -- For resend, check per referral
        IF p_referral_id IS NOT NULL THEN
            SELECT COUNT(*) INTO action_count
            FROM public.portal_referral_rate_limits
            WHERE referral_id = p_referral_id
                AND action_type = p_action_type
                AND action_timestamp > NOW() - time_window;

            RETURN action_count < max_allowed;
        END IF;
    ELSE
        RETURN FALSE;
    END IF;

    -- Check user's action count
    SELECT COUNT(*) INTO action_count
    FROM public.portal_referral_rate_limits
    WHERE user_id = p_user_id
        AND action_type = p_action_type
        AND action_timestamp > NOW() - time_window;

    RETURN action_count < max_allowed;
END;
$function$;


-- ======================================================================

-- Function 33/242
CREATE OR REPLACE FUNCTION public.complete_referral_onboarding(p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_conversion_id UUID;
    v_referral_id UUID;
BEGIN
    -- Find conversion record
    SELECT id, referral_id
    INTO v_conversion_id, v_referral_id
    FROM public.portal_referral_conversions
    WHERE referee_profile_id = p_user_id
    AND onboarding_completed_at IS NULL;

    IF v_conversion_id IS NULL THEN
        RETURN false;
    END IF;

    -- Update conversion record
    UPDATE public.portal_referral_conversions
    SET
        onboarding_completed_at = NOW(),
        updated_at = NOW()
    WHERE id = v_conversion_id;

    -- Update referral status
    UPDATE public.portal_referrals
    SET
        status = 'completed',
        updated_at = NOW()
    WHERE id = v_referral_id;

    -- Update contact status
    UPDATE public.contacts
    SET
        status = 'Active Member',
        updated_at = NOW()
    WHERE referral_id = v_referral_id;

    RETURN true;
END;
$function$;


-- ======================================================================

-- Function 34/242
CREATE OR REPLACE FUNCTION public.create_referral(p_referrer_id uuid, p_referee_first_name text, p_referee_last_name text, p_referee_email text, p_referee_phone text DEFAULT NULL::text, p_dsp_name text DEFAULT NULL::text, p_dsp_code text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_referral_id UUID;
    v_referral_code TEXT;
    v_contact_id UUID;
    v_can_proceed BOOLEAN;
BEGIN
    -- Validate user is authenticated
    IF auth.uid() IS NULL OR auth.uid() != p_referrer_id THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- Check rate limiting
    SELECT check_referral_rate_limit(p_referrer_id, 'create_referral') INTO v_can_proceed;

    IF NOT v_can_proceed THEN
        RAISE EXCEPTION 'Rate limit exceeded. Maximum 10 referrals per day.';
    END IF;

    -- Check if referral already exists
    IF EXISTS (
        SELECT 1 FROM public.portal_referrals
        WHERE referrer_id = p_referrer_id
        AND LOWER(referee_email) = LOWER(p_referee_email)
    ) THEN
        RAISE EXCEPTION 'You have already sent a referral to this email address';
    END IF;

    -- Generate unique referral code
    SELECT generate_referral_code() INTO v_referral_code;

    -- Create the referral
    INSERT INTO public.portal_referrals (
        referrer_id,
        referee_first_name,
        referee_last_name,
        referee_email,
        referee_phone,
        dsp_name,
        dsp_code,
        referral_code,
        status
    ) VALUES (
        p_referrer_id,
        p_referee_first_name,
        p_referee_last_name,
        LOWER(p_referee_email),
        p_referee_phone,
        p_dsp_name,
        p_dsp_code,
        v_referral_code,
        'pending'
    )
    RETURNING id INTO v_referral_id;

    -- Record rate limit action
    PERFORM record_rate_limit_action(p_referrer_id, 'create_referral');

    -- Create contact record (using correct column structure)
    -- Note: contacts table doesn't have source, status, or referral_id columns
    -- and uses dsp_id (foreign key) not dsp_name (text)
    -- We'll store basic contact info and track referral via referred_by_text
    INSERT INTO public.contacts (
        first_name,
        last_name,
        email,
        phone,
        referred_by_text,
        contact_status,
        notes
    ) VALUES (
        p_referee_first_name,
        p_referee_last_name,
        LOWER(p_referee_email),
        p_referee_phone,
        'Portal Referral Code: ' || v_referral_code,
        'new',
        'Created via portal referral from user ' || p_referrer_id::TEXT ||
        CASE WHEN p_dsp_name IS NOT NULL THEN ' - DSP: ' || p_dsp_name ELSE '' END
    )
    RETURNING id INTO v_contact_id;

    -- Return the created referral details
    RETURN json_build_object(
        'referral_id', v_referral_id,
        'referral_code', v_referral_code,
        'contact_id', v_contact_id,
        'success', true
    );
END;
$function$;


-- ======================================================================

-- Function 35/242
CREATE OR REPLACE FUNCTION public.delete_referral_admin(p_referral_id uuid, p_deletion_reason text DEFAULT NULL::text, p_admin_note text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_referral RECORD;
  v_user_role TEXT;
  v_admin_id UUID;
  v_user_email TEXT;
BEGIN
  -- Get the calling user's ID and details
  v_admin_id := auth.uid();

  -- Get user details for debugging
  SELECT role, email INTO v_user_role, v_user_email
  FROM public.profiles
  WHERE id = v_admin_id;

  -- Better error message with actual values
  IF v_user_role IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User profile not found. Your ID: ' || COALESCE(v_admin_id::text, 'NULL')
    );
  END IF;

  -- Check admin permissions with detailed error
  IF v_user_role NOT IN ('admin', 'super_admin') THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Insufficient permissions. Your role: ' || v_user_role || ' (email: ' || v_user_email || '). Required: admin or super_admin.'
    );
  END IF;

  -- Get referral details
  SELECT * INTO v_referral
  FROM public.portal_referrals
  WHERE id = p_referral_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Referral not found with ID: ' || p_referral_id
    );
  END IF;

  -- Critical check: Prevent deletion of registered users
  IF v_referral.status IN ('registered', 'completed') THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cannot delete referral: User has already registered (status: ' || v_referral.status || ')'
    );
  END IF;

  -- Check if there's a conversion record
  IF EXISTS (
    SELECT 1 FROM public.portal_referral_conversions
    WHERE referral_id = p_referral_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cannot delete referral: Conversion record exists'
    );
  END IF;

  -- Check if user exists with this email (regardless of portal status for now)
  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE LOWER(email) = LOWER(v_referral.referee_email)
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cannot delete referral: User account exists with this email: ' || v_referral.referee_email
    );
  END IF;

  -- For now, just return success without actually deleting (for testing)
  RETURN json_build_object(
    'success', true,
    'message', 'TEST MODE: Would delete referral for ' || v_referral.referee_email,
    'debug_info', jsonb_build_object(
      'admin_id', v_admin_id,
      'admin_email', v_user_email,
      'admin_role', v_user_role,
      'referral_id', p_referral_id,
      'referee_email', v_referral.referee_email,
      'referral_status', v_referral.status
    )
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Unexpected error: ' || SQLERRM || ' (Admin: ' || COALESCE(v_user_email, 'unknown') || ', Role: ' || COALESCE(v_user_role, 'unknown') || ')'
    );
END;
$function$;


-- ======================================================================

-- Function 36/242
CREATE OR REPLACE FUNCTION public.delete_referral_admin_fixed(p_referral_id uuid, p_admin_user_id uuid, p_deletion_reason text DEFAULT NULL::text, p_admin_note text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_referral RECORD;
  v_user_role TEXT;
  v_user_email TEXT;
BEGIN
  -- Get admin user details using the passed ID
  SELECT role, email INTO v_user_role, v_user_email
  FROM public.profiles
  WHERE id = p_admin_user_id;

  -- Check if admin user exists
  IF v_user_role IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Admin user not found with ID: ' || p_admin_user_id
    );
  END IF;

  -- Check admin permissions (only portal admin roles)
  IF v_user_role NOT IN ('admin', 'super_admin') THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Insufficient permissions. Your role: ' || v_user_role || ' (email: ' || v_user_email || '). Required: admin or super_admin.'
    );
  END IF;

  -- Get referral details
  SELECT * INTO v_referral
  FROM public.portal_referrals
  WHERE id = p_referral_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Referral not found with ID: ' || p_referral_id
    );
  END IF;

  -- Check if user has registered for the portal
  IF v_referral.status IN ('registered', 'completed') THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cannot delete referral: User has already registered for the portal (status: ' || v_referral.status || ')'
    );
  END IF;

  -- Check for conversion record
  IF EXISTS (
    SELECT 1 FROM public.portal_referral_conversions
    WHERE referral_id = p_referral_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cannot delete referral: Portal conversion record exists'
    );
  END IF;

  -- IMPORTANT: Only check if user exists as a PORTAL user, not app user
  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE LOWER(email) = LOWER(v_referral.referee_email)
    AND role IN ('super_admin', 'admin', 'portal_member', 'investor')  -- Only portal roles
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cannot delete referral: User already has portal access with this email: ' || v_referral.referee_email
    );
  END IF;

  -- Actually delete the referral and related data

  -- Delete contact records
  DELETE FROM public.contacts
  WHERE referral_id = p_referral_id;

  -- Cancel pending email notifications
  UPDATE public.email_notifications
  SET status = 'cancelled',
      metadata = metadata || jsonb_build_object(
        'cancelled_reason', 'Referral deleted by admin',
        'cancelled_at', NOW(),
        'cancelled_by', p_admin_user_id
      )
  WHERE metadata->>'referral_id' = p_referral_id::text
  AND status IN ('pending', 'failed');

  -- Delete rate limit records
  DELETE FROM public.portal_referral_rate_limits
  WHERE referral_id = p_referral_id;

  -- Delete the referral itself
  DELETE FROM public.portal_referrals
  WHERE id = p_referral_id;

  -- REMOVED LOGGING FOR NOW - will fix in separate migration once we know the table structure

  RETURN json_build_object(
    'success', true,
    'message', 'Referral successfully deleted',
    'deleted', jsonb_build_object(
      'referral_id', p_referral_id,
      'referee_email', v_referral.referee_email,
      'deleted_by', v_user_email
    )
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Unexpected error: ' || SQLERRM
    );
END;
$function$;


-- ======================================================================

-- Function 37/242
CREATE OR REPLACE FUNCTION public.generate_referral_code()
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate a code with format: ref_<random_string>
        new_code := 'ref_' || substr(md5(random()::text || clock_timestamp()::text), 1, 12);

        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM public.portal_referrals WHERE referral_code = new_code) INTO code_exists;

        -- Exit loop if code is unique
        EXIT WHEN NOT code_exists;
    END LOOP;

    RETURN new_code;
END;
$function$;


-- ======================================================================

-- Function 38/242
CREATE OR REPLACE FUNCTION public.get_referral_by_code(p_code text)
 RETURNS TABLE(referee_first_name text, referee_last_name text, referee_email text, referrer_name text, dsp_name text, status text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    pr.referee_first_name,
    pr.referee_last_name,
    pr.referee_email,
    COALESCE(p.first_name || ' ' || p.last_name, 'A FleetDRMS Member') as referrer_name,
    pr.dsp_name,
    pr.status
  FROM portal_referrals pr
  LEFT JOIN profiles p ON pr.referrer_id = p.id
  WHERE pr.referral_code = p_code
    AND pr.status IN ('pending', 'sent')
  LIMIT 1;
END;
$function$;


-- ======================================================================

-- Function 39/242
CREATE OR REPLACE FUNCTION public.get_user_referral_stats(p_user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_stats JSON;
BEGIN
    -- Validate user is authenticated
    IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    SELECT json_build_object(
        'total_referrals', COUNT(*),
        'invitations_sent', COUNT(CASE WHEN status IN ('sent', 'registered', 'completed') THEN 1 END),
        'registrations', COUNT(CASE WHEN status IN ('registered', 'completed') THEN 1 END),
        'completed', COUNT(CASE WHEN status = 'completed' THEN 1 END),
        'pending', COUNT(CASE WHEN status = 'pending' THEN 1 END),
        'conversion_rate',
            CASE
                WHEN COUNT(CASE WHEN status IN ('sent', 'registered', 'completed') THEN 1 END) > 0
                THEN ROUND(
                    (COUNT(CASE WHEN status IN ('registered', 'completed') THEN 1 END)::NUMERIC /
                     COUNT(CASE WHEN status IN ('sent', 'registered', 'completed') THEN 1 END)::NUMERIC) * 100,
                    2
                )
                ELSE 0
            END,
        'this_month', COUNT(CASE WHEN created_at >= date_trunc('month', CURRENT_DATE) THEN 1 END),
        'last_referral_date', MAX(created_at)
    ) INTO v_stats
    FROM public.portal_referrals
    WHERE referrer_id = p_user_id;

    RETURN v_stats;
END;
$function$;


-- ======================================================================

-- Function 40/242
CREATE OR REPLACE FUNCTION public.get_user_referrals(p_user_id uuid)
 RETURNS TABLE(id uuid, referee_first_name text, referee_last_name text, referee_email text, referee_phone text, dsp_name text, dsp_code text, referral_code text, status text, invitation_sent_at timestamp with time zone, last_resent_at timestamp with time zone, resend_count integer, registered_at timestamp with time zone, created_at timestamp with time zone, conversion_date timestamp with time zone, onboarding_completed boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    -- Validate user is authenticated
    IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    RETURN QUERY
    SELECT
        r.id,
        r.referee_first_name,
        r.referee_last_name,
        r.referee_email,
        r.referee_phone,
        r.dsp_name,
        r.dsp_code,
        r.referral_code,
        r.status,
        r.invitation_sent_at,
        r.last_resent_at,
        r.resend_count,
        r.registered_at,
        r.created_at,
        rc.converted_at as conversion_date,
        (rc.onboarding_completed_at IS NOT NULL) as onboarding_completed
    FROM public.portal_referrals r
    LEFT JOIN public.portal_referral_conversions rc ON rc.referral_id = r.id
    WHERE r.referrer_id = p_user_id
    ORDER BY r.created_at DESC;
END;
$function$;


-- ======================================================================

-- Function 41/242
CREATE OR REPLACE FUNCTION public.process_referral_registration(p_referral_code text, p_user_id uuid, p_user_email text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_referral_id UUID;
    v_referrer_id UUID;
    v_conversion_id UUID;
    v_contact_id UUID;
BEGIN
    -- Find the referral by code and email
    SELECT id, referrer_id
    INTO v_referral_id, v_referrer_id
    FROM public.portal_referrals
    WHERE referral_code = p_referral_code
    AND LOWER(referee_email) = LOWER(p_user_email)
    AND status IN ('pending', 'sent');

    IF v_referral_id IS NULL THEN
        -- Not a valid referral, but don't error - just return
        RETURN json_build_object(
            'success', false,
            'message', 'No matching referral found'
        );
    END IF;

    -- Check if conversion already exists
    IF EXISTS (
        SELECT 1 FROM public.portal_referral_conversions
        WHERE referral_id = v_referral_id
    ) THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Referral already converted'
        );
    END IF;

    -- Create conversion record
    INSERT INTO public.portal_referral_conversions (
        referral_id,
        referee_profile_id,
        converted_at
    ) VALUES (
        v_referral_id,
        p_user_id,
        NOW()
    )
    RETURNING id INTO v_conversion_id;

    -- Update referral status
    UPDATE public.portal_referrals
    SET
        status = 'registered',
        registered_at = NOW(),
        updated_at = NOW()
    WHERE id = v_referral_id;

    -- Update contact record if exists
    UPDATE public.contacts
    SET
        is_portal_member = true,
        portal_profile_id = p_user_id,
        status = 'Registered',
        updated_at = NOW()
    WHERE referral_id = v_referral_id
    RETURNING id INTO v_contact_id;

    RETURN json_build_object(
        'success', true,
        'conversion_id', v_conversion_id,
        'referrer_id', v_referrer_id,
        'contact_updated', v_contact_id IS NOT NULL
    );
END;
$function$;


-- ======================================================================

-- Function 42/242
CREATE OR REPLACE FUNCTION public.record_referral_conversion(p_referral_code text, p_user_id uuid, p_metadata jsonb DEFAULT NULL::jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_referral_id UUID;
  v_is_reusable BOOLEAN;
  v_max_uses INTEGER;
  v_current_uses INTEGER;
BEGIN
  -- Get referral info
  SELECT id, is_reusable, max_uses, usage_count
  INTO v_referral_id, v_is_reusable, v_max_uses, v_current_uses
  FROM portal_referrals
  WHERE referral_code = p_referral_code;

  IF v_referral_id IS NULL THEN
    RAISE EXCEPTION 'Referral code not found: %', p_referral_code;
  END IF;

  -- Check if code is reusable and hasn't exceeded max uses
  IF v_is_reusable THEN
    IF v_max_uses IS NOT NULL AND v_current_uses >= v_max_uses THEN
      RAISE EXCEPTION 'Referral code has exceeded maximum uses';
    END IF;
  END IF;

  -- Record the conversion
  INSERT INTO referral_conversions (
    referral_id,
    user_id,
    converted_at,
    conversion_metadata
  ) VALUES (
    v_referral_id,
    p_user_id,
    NOW(),
    p_metadata
  )
  ON CONFLICT (referral_id, user_id) DO NOTHING; -- Prevent duplicate conversions

  -- Increment usage count
  UPDATE portal_referrals
  SET usage_count = usage_count + 1
  WHERE id = v_referral_id;

  RETURN true;
END;
$function$;


-- ======================================================================

-- Function 43/242
CREATE OR REPLACE FUNCTION public.resend_referral_invitation(p_referral_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_referrer_id UUID;
    v_can_proceed BOOLEAN;
    v_current_resend_count INTEGER;
BEGIN
    -- Get referrer_id and validate ownership
    SELECT referrer_id, resend_count
    INTO v_referrer_id, v_current_resend_count
    FROM public.portal_referrals
    WHERE id = p_referral_id;

    IF v_referrer_id IS NULL THEN
        RAISE EXCEPTION 'Referral not found';
    END IF;

    IF auth.uid() IS NULL OR auth.uid() != v_referrer_id THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- Check rate limiting for resend
    SELECT check_referral_rate_limit(v_referrer_id, 'resend_invitation', p_referral_id) INTO v_can_proceed;

    IF NOT v_can_proceed THEN
        RAISE EXCEPTION 'Rate limit exceeded. Maximum 3 resends per referral per day.';
    END IF;

    -- Update referral with resend information
    UPDATE public.portal_referrals
    SET
        last_resent_at = NOW(),
        resend_count = v_current_resend_count + 1,
        updated_at = NOW()
    WHERE id = p_referral_id;

    -- Record rate limit action
    PERFORM record_rate_limit_action(v_referrer_id, 'resend_invitation', p_referral_id);

    RETURN json_build_object(
        'success', true,
        'resend_count', v_current_resend_count + 1,
        'resent_at', NOW()
    );
END;
$function$;


-- ======================================================================

-- Function 44/242
CREATE OR REPLACE FUNCTION public.update_referral_on_registration()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Check if this new profile was created via a referral
  -- Look for matching email in portal_referrals (case-insensitive)
  UPDATE portal_referrals
  SET
    status = 'registered',
    registered_at = NEW.created_at
  WHERE LOWER(referee_email) = LOWER(NEW.email)
    AND status IN ('pending', 'sent')
    AND registered_at IS NULL;

  RETURN NEW;
END;
$function$;


-- ======================================================================

-- Function 45/242
CREATE OR REPLACE FUNCTION public.validate_referral_eligibility(p_email text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_profile RECORD;
BEGIN
  -- Check if email exists in profiles
  SELECT
    id,
    email,
    is_portal_user,
    role
  INTO v_profile
  FROM public.profiles
  WHERE LOWER(email) = LOWER(p_email);

  IF v_profile.id IS NULL THEN
    -- Email doesn't exist at all - OK to refer
    RETURN json_build_object(
      'eligible', true,
      'message', 'Email is eligible for referral'
    );
  END IF;

  -- Check if they're already a portal user
  IF v_profile.is_portal_user = true THEN
    RETURN json_build_object(
      'eligible', false,
      'reason', 'already_portal_user',
      'message', 'This person already has access to the DSP Portal'
    );
  END IF;

  -- They're an app user but not portal user - OK to refer
  RETURN json_build_object(
    'eligible', true,
    'is_app_user', true,
    'message', 'This person uses the Fleet DRMS app but not the portal - they can be referred'
  );
END;
$function$;


-- ======================================================================

-- Function 46/242
CREATE OR REPLACE FUNCTION public.delete_portal_user(p_user_id uuid, p_admin_id uuid, p_reason text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_result JSON;
  v_deleted_counts JSON;
BEGIN
  -- Verify admin permissions
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = p_admin_id
    AND role IN ('super_admin', 'portal_admin')
  ) THEN
    RAISE EXCEPTION 'User % does not have admin permissions', p_admin_id;
  END IF;

  -- Verify user exists
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User % not found', p_user_id;
  END IF;

  -- Prevent self-deletion
  IF p_user_id = p_admin_id THEN
    RAISE EXCEPTION 'Cannot delete your own account';
  END IF;

  -- Count what will be deleted
  SELECT json_build_object(
    'businesses', (SELECT COUNT(*) FROM businesses WHERE user_id = p_user_id),
    'survey_responses', (SELECT COUNT(*) FROM portal_survey_responses WHERE user_id = p_user_id),
    'event_registrations', (SELECT COUNT(*) FROM portal_event_registrations WHERE user_id = p_user_id),
    'referrals_made', (SELECT COUNT(*) FROM portal_referrals WHERE referrer_id = p_user_id),
    'updates_created', (SELECT COUNT(*) FROM portal_updates WHERE created_by = p_user_id),
    'surveys_created', (SELECT COUNT(*) FROM portal_surveys WHERE created_by = p_user_id),
    'events_created', (SELECT COUNT(*) FROM portal_events WHERE created_by = p_user_id),
    'marketing_conversions', (SELECT COUNT(*) FROM marketing_conversions WHERE user_id = p_user_id),
    'portal_memberships', (SELECT COUNT(*) FROM portal_memberships WHERE user_id = p_user_id)
  )
  INTO v_deleted_counts;

  -- Delete the user (CASCADE will handle related data)
  DELETE FROM profiles WHERE id = p_user_id;

  -- Return success result
  RETURN json_build_object(
    'success', true,
    'deleted_user_id', p_user_id,
    'deleted_by', p_admin_id,
    'reason', p_reason,
    'deleted_at', NOW(),
    'deleted_data', v_deleted_counts
  );
END;
$function$;


-- ======================================================================

-- Function 47/242
CREATE OR REPLACE FUNCTION public.get_portal_admin_stats()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  result JSON;
BEGIN
  result := json_build_object(
    'updates', (
      SELECT json_build_object(
        'total', COALESCE(COUNT(*), 0)::INTEGER,
        'published', COALESCE(COUNT(*) FILTER (WHERE status = 'published'), 0)::INTEGER,
        'draft', COALESCE(COUNT(*) FILTER (WHERE status = 'draft'), 0)::INTEGER,
        'recent', COALESCE(
          (SELECT json_agg(row_to_json(r))
           FROM (
             SELECT id, title, status, created_at
             FROM portal_updates
             ORDER BY created_at DESC
             LIMIT 5
           ) r
          ), '[]'::json
        )
      )
      FROM portal_updates
    ),
    'surveys', (
      SELECT json_build_object(
        'total', COALESCE(COUNT(*), 0)::INTEGER,
        'active', COALESCE(COUNT(*) FILTER (WHERE status = 'published'), 0)::INTEGER,
        'total_responses', COALESCE((
          SELECT COUNT(*)::INTEGER FROM portal_survey_responses
        ), 0),
        'completed_responses', COALESCE((
          SELECT COUNT(*)::INTEGER FROM portal_survey_responses WHERE is_complete = true
        ), 0),
        'recent', COALESCE(
          (SELECT json_agg(row_to_json(r))
           FROM (
             SELECT 
               id, 
               title, 
               CASE WHEN status = 'published' THEN true ELSE false END as is_active,
               created_at
             FROM portal_surveys
             ORDER BY created_at DESC
             LIMIT 5
           ) r
          ), '[]'::json
        )
      )
      FROM portal_surveys
    ),
    'events', COALESCE((
      SELECT json_build_object(
        'total', COUNT(*)::INTEGER,
        'upcoming', COUNT(*) FILTER (WHERE start_datetime > NOW())::INTEGER,
        'total_registrations', COALESCE((
          SELECT COUNT(*)::INTEGER FROM portal_event_registrations
        ), 0),
        'recent', COALESCE(
          (SELECT json_agg(row_to_json(r))
           FROM (
             SELECT 
               id, 
               title, 
               event_type,
               start_datetime,
               CASE 
                 WHEN start_datetime > NOW() THEN 'upcoming'
                 WHEN end_datetime > NOW() THEN 'ongoing'
                 ELSE 'past'
               END as status
             FROM portal_events
             ORDER BY created_at DESC
             LIMIT 5
           ) r
          ), '[]'::json
        )
      )
      FROM portal_events
    ), json_build_object(
      'total', 0,
      'upcoming', 0,
      'total_registrations', 0,
      'recent', '[]'::json
    )),
    'users', json_build_object(
      'total_portal_users', COALESCE((
        SELECT COUNT(DISTINCT id)::INTEGER 
        FROM profiles 
        WHERE role IN ('portal_member', 'pilotowner', 'investor', 'user', 'super_admin', 'admin')
      ), 0),
      'active_today', COALESCE((
        SELECT COUNT(DISTINCT user_id)::INTEGER
        FROM portal_survey_responses 
        WHERE started_at > NOW() - INTERVAL '24 hours'
      ), 0)
    )
  );
  
  RETURN result;
END;
$function$;


-- ======================================================================

-- Function 48/242
CREATE OR REPLACE FUNCTION public.get_portal_user_stats()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN json_build_object(
    'total', (
      SELECT COUNT(DISTINCT p.id) 
      FROM public.profiles p
      LEFT JOIN public.user_roles ur ON ur.user_id = p.id
      WHERE 
        p.role::text IN ('super_admin', 'admin', 'portal_member', 'investor')
        OR (ur.role IS NOT NULL AND ur.role::text IN ('super_admin', 'admin', 'portal_member', 'investor'))
    ),
    'breakdown', json_build_object(
      'super_admin', (
        SELECT COUNT(DISTINCT p.id) 
        FROM public.profiles p
        LEFT JOIN public.user_roles ur ON ur.user_id = p.id
        WHERE p.role::text = 'super_admin' 
           OR (ur.role IS NOT NULL AND ur.role::text = 'super_admin')
      ),
      'admin', (
        SELECT COUNT(DISTINCT p.id) 
        FROM public.profiles p
        LEFT JOIN public.user_roles ur ON ur.user_id = p.id
        WHERE p.role::text = 'admin' OR (ur.role IS NOT NULL AND ur.role::text = 'admin')
      ),
      'portal_member', (
        SELECT COUNT(DISTINCT p.id) 
        FROM public.profiles p
        LEFT JOIN public.user_roles ur ON ur.user_id = p.id
        WHERE p.role::text = 'portal_member' OR (ur.role IS NOT NULL AND ur.role::text = 'portal_member')
      ),
      'investor', (
        SELECT COUNT(DISTINCT p.id) 
        FROM public.profiles p
        LEFT JOIN public.user_roles ur ON ur.user_id = p.id
        WHERE p.role::text = 'investor' OR (ur.role IS NOT NULL AND ur.role::text = 'investor')
      )
    ),
    'other_users', (
      SELECT COUNT(*) 
      FROM public.profiles p
      LEFT JOIN public.user_roles ur ON ur.user_id = p.id
      WHERE 
        (p.role IS NULL OR p.role::text NOT IN ('super_admin', 'admin', 'portal_member', 'investor'))
        AND (ur.role IS NULL OR ur.role::text NOT IN ('super_admin', 'admin', 'portal_member', 'investor'))
    )
  );
END;
$function$;


-- ======================================================================

-- Function 49/242
CREATE OR REPLACE FUNCTION public.has_portal_role(p_user_id uuid, p_roles text[] DEFAULT NULL::text[])
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF p_roles IS NULL OR array_length(p_roles, 1) IS NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM public.portal_memberships
      WHERE user_id = p_user_id AND is_active = true
    );
  ELSE
    RETURN EXISTS (
      SELECT 1 FROM public.portal_memberships
      WHERE user_id = p_user_id 
      AND portal_role = ANY(p_roles)
      AND is_active = true
    );
  END IF;
END;
$function$;


-- ======================================================================

-- Function 50/242
CREATE OR REPLACE FUNCTION public.is_portal_admin(user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_role TEXT;
  v_is_admin BOOLEAN := false;
BEGIN
  -- Check profiles table
  SELECT role INTO v_role FROM public.profiles WHERE id = user_id;
  v_is_admin := v_role IN ('super_admin', 'superadmin', 'admin');
  
  -- Check system_user_assignments if not admin yet
  IF NOT v_is_admin AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_user_assignments') THEN
    v_is_admin := EXISTS (
      SELECT 1 FROM public.system_user_assignments 
      WHERE system_user_assignments.user_id = is_portal_admin.user_id 
      AND system_role IN ('super_admin', 'admin')
      AND is_active = true
    );
  END IF;
  
  -- Check user_roles if not admin yet
  IF NOT v_is_admin AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') THEN
    v_is_admin := EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = is_portal_admin.user_id 
      AND role IN ('super_admin', 'admin')
    );
  END IF;
  
  RETURN v_is_admin;
END;
$function$;


-- ======================================================================

-- Function 51/242
CREATE OR REPLACE FUNCTION public.log_portal_membership_change()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_user_email TEXT;
BEGIN
  -- Check if portal_admin_activity table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'portal_admin_activity'
  ) THEN
    -- Get user email for entity_title
    SELECT email INTO v_user_email FROM public.profiles WHERE id = NEW.user_id;
    
    IF TG_OP = 'INSERT' THEN
      INSERT INTO public.portal_admin_activity (
        admin_id,
        action,
        entity_type,
        entity_id,
        entity_title,
        changes,
        created_at
      ) VALUES (
        auth.uid(),
        'portal_role_assignment',
        'portal_member',
        NEW.id,
        COALESCE(v_user_email, 'Unknown User') || ' - Portal: ' || NEW.portal_role,
        jsonb_build_object(
          'user_id', NEW.user_id,
          'role', NEW.portal_role,
          'subscription_tier', NEW.subscription_tier,
          'operation', 'create',
          'context', 'portal'
        ),
        NOW()
      );
    ELSIF TG_OP = 'UPDATE' THEN
      IF OLD.is_active != NEW.is_active THEN
        INSERT INTO public.portal_admin_activity (
          admin_id,
          action,
          entity_type,
          entity_id,
          entity_title,
          changes,
          created_at
        ) VALUES (
          auth.uid(),
          CASE WHEN NEW.is_active THEN 'portal_role_activation' ELSE 'portal_role_deactivation' END,
          'portal_member',
          NEW.id,
          COALESCE(v_user_email, 'Unknown User') || ' - Portal: ' || NEW.portal_role,
          jsonb_build_object(
            'user_id', NEW.user_id,
            'role', NEW.portal_role,
            'subscription_tier', NEW.subscription_tier,
            'is_active', NEW.is_active,
            'operation', 'update',
            'context', 'portal'
          ),
          NOW()
        );
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;


-- ======================================================================

-- Function 52/242
CREATE OR REPLACE FUNCTION public.promote_portal_user(p_user_id uuid, p_new_role text)
 RETURNS TABLE(success boolean, message text, old_role text, new_role text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_caller_role TEXT;
  v_current_role TEXT;
  v_user_email TEXT;
BEGIN
  -- Get caller's role
  SELECT role INTO v_caller_role
  FROM profiles
  WHERE id = auth.uid();

  -- Only super_admins can promote users
  IF v_caller_role != 'super_admin' THEN
    RETURN QUERY SELECT FALSE, 'Only super administrators can promote users', NULL::TEXT, NULL::TEXT;
    RETURN;
  END IF;

  -- Validate new role is a valid portal role
  IF p_new_role NOT IN ('portal_member', 'investor', 'admin', 'super_admin') THEN
    RETURN QUERY SELECT FALSE, 'Invalid portal role. Must be: portal_member, investor, admin, or super_admin', NULL::TEXT, NULL::TEXT;
    RETURN;
  END IF;

  -- Get current user info
  SELECT role, email INTO v_current_role, v_user_email
  FROM profiles
  WHERE id = p_user_id;

  IF v_current_role IS NULL THEN
    RETURN QUERY SELECT FALSE, 'User not found or not a portal user', NULL::TEXT, NULL::TEXT;
    RETURN;
  END IF;

  -- Prevent promoting system users (role='user')
  IF v_current_role = 'user' THEN
    RETURN QUERY SELECT FALSE, 'Cannot promote system users. User must be a portal member first.', v_current_role, NULL::TEXT;
    RETURN;
  END IF;

  -- Update the user's role
  UPDATE profiles
  SET
    role = p_new_role,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Return success
  RETURN QUERY SELECT TRUE,
    format('User %s promoted from %s to %s', v_user_email, v_current_role, p_new_role),
    v_current_role,
    p_new_role;
END;
$function$;


-- ======================================================================

-- Function 53/242
CREATE OR REPLACE FUNCTION public.archive_system_user(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_updated_count INTEGER;
BEGIN
    -- Perform the archive
    UPDATE profiles
    SET 
        status = 'archived',
        updated_at = NOW()
    WHERE id = p_user_id
    AND status != 'archived';  -- Don't update if already archived
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    IF v_updated_count = 0 THEN
        -- Check if user exists
        IF EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id) THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'User is already archived or update failed'
            );
        ELSE
            RETURN jsonb_build_object(
                'success', false,
                'error', 'User not found'
            );
        END IF;
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'User archived successfully',
        'user_id', p_user_id
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$function$;


-- ======================================================================

-- Function 54/242
CREATE OR REPLACE FUNCTION public.archive_system_user_simple(target_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_result JSONB;
    v_user_email TEXT;
BEGIN
    -- Get user email for response
    SELECT email INTO v_user_email FROM public.profiles WHERE id = target_user_id;
    
    -- Direct update bypassing RLS since SECURITY DEFINER
    UPDATE public.profiles
    SET 
        status = 'archived',
        updated_at = CURRENT_TIMESTAMP
    WHERE id = target_user_id
    AND status != 'archived';
    
    IF FOUND THEN
        v_result := jsonb_build_object(
            'success', true,
            'message', 'User archived successfully',
            'email', v_user_email
        );
    ELSE
        -- Check if user exists
        IF EXISTS (SELECT 1 FROM public.profiles WHERE id = target_user_id) THEN
            v_result := jsonb_build_object(
                'success', false,
                'error', 'User already archived'
            );
        ELSE
            v_result := jsonb_build_object(
                'success', false,
                'error', 'User not found'
            );
        END IF;
    END IF;
    
    RETURN v_result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$function$;


-- ======================================================================

-- Function 55/242
CREATE OR REPLACE FUNCTION public.can_access_profiles()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Direct query without using RLS to prevent recursion
  RETURN EXISTS (
    SELECT 1 
    FROM user_roles 
    WHERE user_id = auth.uid() 
    AND (role = 'admin' OR role = 'owner')
  );
END;
$function$;


-- ======================================================================

-- Function 56/242
CREATE OR REPLACE FUNCTION public.can_rate_users()
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'owner', 'manager')
  );
$function$;


-- ======================================================================

-- Function 57/242
CREATE OR REPLACE FUNCTION public.check_profiles_columns()
 RETURNS TABLE(column_name text, data_type text)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    c.column_name::text,
    c.data_type::text
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'profiles'
  ORDER BY c.ordinal_position;
END;
$function$;


-- ======================================================================

-- Function 58/242
CREATE OR REPLACE FUNCTION public.check_user_exists(user_email text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- First check if the user exists in auth.users (case insensitive)
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE lower(email) = lower(user_email)
  );
END;
$function$;


-- ======================================================================

-- Function 59/242
CREATE OR REPLACE FUNCTION public.check_user_membership_agreement(p_user_id uuid, p_version text DEFAULT '1.0'::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.membership_agreements
    WHERE user_id = p_user_id
    AND agreement_version = p_version
  );
END;
$function$;


-- ======================================================================

-- Function 60/242
CREATE OR REPLACE FUNCTION public.check_user_nda_agreement(p_user_id uuid, p_version text DEFAULT '1.0'::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.nda_agreements
    WHERE user_id = p_user_id
    AND nda_version = p_version
  );
END;
$function$;


-- ======================================================================

-- Function 61/242
CREATE OR REPLACE FUNCTION public.check_user_permission(p_permission_name text, p_user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM get_user_permissions(p_user_id) 
    WHERE permission = p_permission_name
  );
END;
$function$;


-- ======================================================================

-- Function 62/242
CREATE OR REPLACE FUNCTION public.check_user_roles(user_email text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_result json;
BEGIN
    WITH user_data AS (
        SELECT 
            p.id,
            p.email,
            p.first_name,
            p.last_name,
            array_agg(DISTINCT ur.role::text ORDER BY ur.role::text) FILTER (WHERE ur.role IS NOT NULL) as roles,
            da.password_hash IS NOT NULL as has_dev_password
        FROM profiles p
        LEFT JOIN user_roles ur ON ur.user_id = p.id
        LEFT JOIN dev_auth da ON da.user_id = p.id
        WHERE lower(p.email) = lower(user_email)
        GROUP BY p.id, p.email, p.first_name, p.last_name, da.password_hash
    )
    SELECT json_build_object(
        'found', COUNT(*) > 0,
        'user', CASE 
            WHEN COUNT(*) > 0 THEN 
                json_build_object(
                    'id', id,
                    'email', email,
                    'name', TRIM(CONCAT(first_name, ' ', last_name)),
                    'roles', CASE 
                        WHEN roles IS NULL THEN ARRAY[]::text[]
                        ELSE roles
                    END,
                    'has_dev_password', has_dev_password,
                    'role_count', CASE 
                        WHEN roles IS NULL THEN 0
                        ELSE array_length(roles, 1)
                    END
                )
            ELSE NULL 
        END
    ) INTO v_result
    FROM user_data
    GROUP BY id, email, first_name, last_name, roles, has_dev_password;
    
    RETURN v_result;
END;
$function$;


-- ======================================================================

-- Function 63/242
CREATE OR REPLACE FUNCTION public.create_new_user(email text, first_name text, last_name text, middle_name text DEFAULT NULL::text, suffix text DEFAULT NULL::text, preferred_name text DEFAULT NULL::text, phone_number text DEFAULT NULL::text, organization_id uuid DEFAULT NULL::uuid, user_role app_role DEFAULT NULL::app_role)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    new_user_id uuid;
    user_password text;
    calling_user_role text;
    is_system_user boolean;
BEGIN
    -- Check if the calling user has admin privileges
    SELECT role INTO calling_user_role
    FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin', 'developer')
    LIMIT 1;

    IF calling_user_role IS NULL THEN
        RAISE EXCEPTION 'Only administrators can create users';
    END IF;

    -- Check if email already exists
    IF EXISTS (
        SELECT 1 FROM auth.users u WHERE lower(u.email) = lower(create_new_user.email)
    ) THEN
        RAISE EXCEPTION 'Email already exists';
    END IF;

    -- Determine if this is a system user
    is_system_user := (user_role IN ('super_admin', 'admin', 'developer', 'finance'));

    -- Set password
    IF is_system_user THEN
        user_password := 'FleetDRMS!';
    ELSE
        user_password := encode(gen_random_bytes(12), 'base64');
    END IF;

    -- Generate user ID
    new_user_id := gen_random_uuid();

    -- Insert into auth.users with proper password hashing
    INSERT INTO auth.users (
        id,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        recovery_token,
        email_change_token_new,
        email_change
    ) VALUES (
        new_user_id,
        lower(create_new_user.email),
        extensions.crypt(user_password, extensions.gen_salt('bf', 10)),
        NOW(),
        jsonb_build_object(
            'first_name', create_new_user.first_name,
            'last_name', create_new_user.last_name,
            'middle_name', create_new_user.middle_name,
            'suffix', create_new_user.suffix,
            'preferred_name', create_new_user.preferred_name,
            'phone_number', create_new_user.phone_number,
            'organization_id', create_new_user.organization_id
        ),
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    );

    -- Wait briefly for trigger execution
    PERFORM pg_sleep(0.1);

    -- Update profile with additional fields
    UPDATE public.profiles
    SET 
        middle_name = create_new_user.middle_name,
        suffix = create_new_user.suffix,
        preferred_name = create_new_user.preferred_name,
        phone_number = create_new_user.phone_number,
        organization_id = create_new_user.organization_id,
        updated_at = NOW()
    WHERE id = new_user_id;

    -- Add role if specified
    IF user_role IS NOT NULL THEN
        INSERT INTO user_roles (user_id, role)
        VALUES (new_user_id, user_role);
    END IF;

    -- For system users also set dev_auth password with email
    IF is_system_user THEN
        INSERT INTO dev_auth (user_id, email, password_hash, created_at, updated_at)
        VALUES (
            new_user_id, 
            lower(create_new_user.email), 
            extensions.crypt(user_password, extensions.gen_salt('bf', 10)),
            NOW(),
            NOW()
        )
        ON CONFLICT (user_id) DO UPDATE SET
            email = lower(create_new_user.email),
            password_hash = extensions.crypt(user_password, extensions.gen_salt('bf', 10)),
            updated_at = NOW();
    END IF;

    RETURN new_user_id;

EXCEPTION
    WHEN OTHERS THEN
        -- Clean up on error
        DELETE FROM auth.users WHERE id = new_user_id;
        DELETE FROM public.profiles WHERE id = new_user_id;
        DELETE FROM user_roles WHERE user_id = new_user_id;
        DELETE FROM dev_auth WHERE user_id = new_user_id;
        
        RAISE EXCEPTION 'Unexpected error while creating user: %', SQLERRM;
END;
$function$;


-- ======================================================================

-- Function 64/242
CREATE OR REPLACE FUNCTION public.create_new_user_v2(email text, first_name text, last_name text, middle_name text DEFAULT NULL::text, suffix text DEFAULT NULL::text, preferred_name text DEFAULT NULL::text, phone_number text DEFAULT NULL::text, organization_id uuid DEFAULT NULL::uuid, user_role app_role DEFAULT NULL::app_role)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_result json;
  v_user_id uuid;
  v_password text;
  v_is_system_user boolean;
BEGIN
  -- Determine if this is a system user
  v_is_system_user := (user_role IN ('super_admin', 'admin', 'developer', 'finance'));
  
  -- Set password
  IF v_is_system_user THEN
    v_password := 'FleetDRMS!';
  ELSE
    v_password := encode(gen_random_bytes(12), 'base64');
  END IF;

  -- Call the new function
  v_result := create_user_with_supabase_auth(
    email, v_password, first_name, last_name,
    middle_name, suffix, preferred_name, phone_number,
    organization_id, user_role
  );

  -- Check if successful
  IF (v_result->>'success')::boolean THEN
    v_user_id := (v_result->>'user_id')::uuid;
    
    -- Log the password for system users
    IF v_is_system_user THEN
      RAISE NOTICE 'System user % created with password: FleetDRMS!', email;
    END IF;
    
    RETURN v_user_id;
  ELSE
    RAISE EXCEPTION '%', v_result->>'error';
  END IF;
END;
$function$;


-- ======================================================================

-- Function 65/242
CREATE OR REPLACE FUNCTION public.create_profile_after_signup()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    -- Try to insert profile, ignore if it fails
    BEGIN
        INSERT INTO public.profiles (id, email, role)
        VALUES (NEW.id, NEW.email, 'portal_member')
        ON CONFLICT (id) DO NOTHING;
    EXCEPTION
        WHEN OTHERS THEN
            -- Silently ignore all errors
            NULL;
    END;

    RETURN NEW;
END;
$function$;


-- ======================================================================

-- Function 66/242
CREATE OR REPLACE FUNCTION public.create_user_with_supabase_auth(p_email text, p_password text, p_first_name text, p_last_name text, p_middle_name text DEFAULT NULL::text, p_suffix text DEFAULT NULL::text, p_preferred_name text DEFAULT NULL::text, p_phone_number text DEFAULT NULL::text, p_organization_id uuid DEFAULT NULL::uuid, p_role app_role DEFAULT NULL::app_role)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
  v_calling_user_role text;
  v_is_system_user boolean;
  v_result json;
BEGIN
  -- Check if the calling user has admin privileges
  SELECT role INTO v_calling_user_role
  FROM user_roles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'super_admin', 'developer')
  LIMIT 1;

  IF v_calling_user_role IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Only administrators can create users'
    );
  END IF;

  -- Check if email already exists
  IF EXISTS (
    SELECT 1 FROM auth.users WHERE lower(email) = lower(p_email)
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Email already exists'
    );
  END IF;

  -- Determine if this is a system user
  v_is_system_user := (p_role IN ('super_admin', 'admin', 'developer', 'finance'));

  -- Generate user ID
  v_user_id := gen_random_uuid();

  BEGIN
    -- Insert into auth.users with proper password hashing
    -- Using the same bcrypt format that Supabase uses
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change
    ) VALUES (
      v_user_id,
      lower(p_email),
      crypt(p_password, gen_salt('bf', 10)), -- Using cost factor 10 like Supabase
      NOW(), -- Auto-confirm email
      jsonb_build_object(
        'first_name', p_first_name,
        'last_name', p_last_name,
        'middle_name', p_middle_name,
        'suffix', p_suffix,
        'preferred_name', p_preferred_name,
        'phone_number', p_phone_number,
        'organization_id', p_organization_id
      ),
      NOW(),
      NOW(),
      '',  -- Empty tokens
      '',
      '',
      ''
    );

    -- The trigger will create the profile, but let's ensure it has all fields
    PERFORM pg_sleep(0.1);
    
    -- Update profile with additional fields
    UPDATE profiles
    SET 
      middle_name = p_middle_name,
      suffix = p_suffix,
      preferred_name = p_preferred_name,
      phone_number = p_phone_number,
      organization_id = p_organization_id
    WHERE id = v_user_id;

    -- Add role if specified
    IF p_role IS NOT NULL THEN
      INSERT INTO user_roles (user_id, role)
      VALUES (v_user_id, p_role);
    END IF;

    -- Return success with user details
    RETURN json_build_object(
      'success', true,
      'user_id', v_user_id,
      'email', p_email,
      'is_system_user', v_is_system_user,
      'message', CASE 
        WHEN v_is_system_user THEN 'System user created with password: ' || p_password
        ELSE 'User created successfully'
      END
    );

  EXCEPTION
    WHEN OTHERS THEN
      -- Clean up if something went wrong
      DELETE FROM auth.users WHERE id = v_user_id;
      
      RETURN json_build_object(
        'success', false,
        'error', SQLERRM,
        'detail', SQLSTATE
      );
  END;
END;
$function$;


-- ======================================================================

-- Function 67/242
CREATE OR REPLACE FUNCTION public.diagnose_user_auth(user_email text, test_password text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_record record;
  v_profile_record record;
  v_roles text[];
  v_password_valid boolean := false;
  v_auth_method text;
BEGIN
  -- Only admins can run diagnostics
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin', 'developer')
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Only administrators can run auth diagnostics'
    );
  END IF;

  -- Get user from auth.users
  SELECT 
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_sent_at,
    confirmed_at,
    created_at,
    updated_at,
    last_sign_in_at,
    raw_user_meta_data
  INTO v_user_record
  FROM auth.users
  WHERE lower(email) = lower(user_email);

  IF v_user_record IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not found in auth.users',
      'checked_email', user_email
    );
  END IF;

  -- Get profile data
  SELECT *
  INTO v_profile_record
  FROM profiles
  WHERE id = v_user_record.id;

  -- Get user roles
  SELECT array_agg(role ORDER BY role)
  INTO v_roles
  FROM user_roles
  WHERE user_id = v_user_record.id;

  -- Test password if provided
  IF test_password IS NOT NULL AND v_user_record.encrypted_password IS NOT NULL THEN
    -- Check if password matches using crypt
    v_password_valid := v_user_record.encrypted_password = crypt(test_password, v_user_record.encrypted_password);
    
    -- Detect auth method
    IF v_user_record.encrypted_password LIKE '$2a$%' OR v_user_record.encrypted_password LIKE '$2b$%' THEN
      v_auth_method := 'bcrypt';
    ELSIF v_user_record.encrypted_password LIKE '$argon2%' THEN
      v_auth_method := 'argon2';
    ELSE
      v_auth_method := 'unknown';
    END IF;
  END IF;

  -- Return diagnostic information
  RETURN json_build_object(
    'success', true,
    'user', json_build_object(
      'id', v_user_record.id,
      'email', v_user_record.email,
      'created_at', v_user_record.created_at,
      'updated_at', v_user_record.updated_at,
      'last_sign_in_at', v_user_record.last_sign_in_at,
      'email_confirmed_at', v_user_record.email_confirmed_at,
      'has_password', v_user_record.encrypted_password IS NOT NULL,
      'password_prefix', CASE 
        WHEN v_user_record.encrypted_password IS NOT NULL 
        THEN substring(v_user_record.encrypted_password, 1, 7)
        ELSE NULL
      END,
      'auth_method', v_auth_method,
      'metadata', v_user_record.raw_user_meta_data
    ),
    'profile', CASE 
      WHEN v_profile_record IS NOT NULL 
      THEN json_build_object(
        'first_name', v_profile_record.first_name,
        'last_name', v_profile_record.last_name,
        'organization_id', v_profile_record.organization_id,
        'status', v_profile_record.status
      )
      ELSE NULL
    END,
    'roles', v_roles,
    'password_test', CASE 
      WHEN test_password IS NOT NULL 
      THEN json_build_object(
        'tested', true,
        'valid', v_password_valid,
        'test_password_length', length(test_password)
      )
      ELSE json_build_object('tested', false)
    END
  );
END;
$function$;


-- ======================================================================

-- Function 68/242
CREATE OR REPLACE FUNCTION public.end_user_impersonation(session_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Verify the caller is the admin who started this session
    IF NOT EXISTS (
        SELECT 1 
        FROM impersonation_sessions 
        WHERE id = session_id 
        AND admin_id = auth.uid() 
        AND ended_at IS NULL
    ) THEN
        RAISE EXCEPTION 'Invalid impersonation session';
    END IF;

    -- End the session
    UPDATE impersonation_sessions
    SET ended_at = now()
    WHERE id = session_id;

    RETURN TRUE;
END;
$function$;


-- ======================================================================

-- Function 69/242
CREATE OR REPLACE FUNCTION public.get_my_user_info()
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_user_id UUID;
  v_profile RECORD;
BEGIN
  v_user_id := auth.uid();

  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = v_user_id;

  RETURN json_build_object(
    'user_id', v_user_id,
    'email', v_profile.email,
    'role', v_profile.role,
    'can_delete', v_profile.role IN ('admin', 'super_admin')
  );
END;
$function$;


-- ======================================================================

-- Function 70/242
CREATE OR REPLACE FUNCTION public.get_new_users_today_count(today_date timestamp with time zone)
 RETURNS integer
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COUNT(*)::integer 
  FROM profiles 
  WHERE created_at >= today_date;
$function$;


-- ======================================================================

-- Function 71/242
CREATE OR REPLACE FUNCTION public.get_total_users_count()
 RETURNS integer
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COUNT(*)::integer 
  FROM profiles;
$function$;


-- ======================================================================

-- Function 72/242
CREATE OR REPLACE FUNCTION public.get_unread_updates_for_user(p_user_id uuid)
 RETURNS TABLE(update_id uuid, title character varying, content text, update_type character varying, target_audience character varying, priority integer, published_at timestamp with time zone, is_read boolean, is_acknowledged boolean, is_dismissed boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        pu.id as update_id,
        pu.title,
        pu.content,
        pu.update_type,
        pu.target_audience,
        pu.priority,
        pu.published_at,
        COALESCE(pur.id IS NOT NULL, false) as is_read,
        COALESCE(pur.acknowledged_at IS NOT NULL, false) as is_acknowledged,
        COALESCE(pur.dismissed_at IS NOT NULL, false) as is_dismissed
    FROM public.portal_updates pu
    LEFT JOIN public.portal_update_reads pur 
        ON pur.update_id = pu.id 
        AND pur.user_id = p_user_id
    WHERE pu.status = 'published'
        AND (pur.dismissed_at IS NULL OR pu.update_type = 'compulsory')
        AND (pur.acknowledged_at IS NULL OR pu.update_type = 'advisory')
    ORDER BY 
        CASE WHEN pu.update_type = 'compulsory' THEN 0 ELSE 1 END,
        pu.priority DESC,
        pu.published_at DESC NULLS LAST;
END;
$function$;


-- ======================================================================

-- Function 73/242
CREATE OR REPLACE FUNCTION public.get_user_context(p_email text)
 RETURNS TABLE(user_id uuid, organization_id uuid, roles text[])
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.organization_id,
    array_agg(DISTINCT ur.role::text) FILTER (WHERE ur.role IS NOT NULL) as roles
  FROM profiles p
  LEFT JOIN user_roles ur ON ur.user_id = p.id
  WHERE lower(p.email) = lower(p_email)
  GROUP BY p.id, p.organization_id;
END;
$function$;


-- ======================================================================

-- Function 74/242
CREATE OR REPLACE FUNCTION public.get_user_contexts(p_user_id uuid)
 RETURNS TABLE(context_type text, role text, organization_id uuid, organization_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    'system'::TEXT as context_type,
    sua.system_role as role,
    NULL::UUID as organization_id,
    NULL::TEXT as organization_name
  FROM public.system_user_assignments sua
  WHERE sua.user_id = p_user_id AND sua.is_active = true
  
  UNION ALL
  
  SELECT 
    'organization'::TEXT as context_type,
    om.org_role as role,
    om.organization_id,
    o.name as organization_name
  FROM public.organization_memberships om
  LEFT JOIN public.organizations o ON o.id = om.organization_id
  WHERE om.user_id = p_user_id AND om.is_active = true
  
  UNION ALL
  
  SELECT 
    'portal'::TEXT as context_type,
    pm.portal_role as role,
    NULL::UUID as organization_id,
    NULL::TEXT as organization_name
  FROM public.portal_memberships pm
  WHERE pm.user_id = p_user_id AND pm.is_active = true;
END;
$function$;


-- ======================================================================

-- Function 75/242
CREATE OR REPLACE FUNCTION public.get_user_deletion_preview(p_user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_data JSON;
  v_deletion_counts JSON;
BEGIN
  -- Get user data
  SELECT json_build_object(
    'id', id,
    'email', email,
    'name', COALESCE(first_name || ' ' || last_name, first_name, last_name, email),
    'role', role,
    'created_at', created_at
  )
  INTO v_user_data
  FROM profiles
  WHERE id = p_user_id;

  IF v_user_data IS NULL THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;

  -- Count related data that will be deleted
  SELECT json_build_object(
    'businesses', (SELECT COUNT(*) FROM businesses WHERE user_id = p_user_id),
    'survey_responses', (SELECT COUNT(*) FROM portal_survey_responses WHERE user_id = p_user_id),
    'event_registrations', (SELECT COUNT(*) FROM portal_event_registrations WHERE user_id = p_user_id),
    'referrals_made', (SELECT COUNT(*) FROM portal_referrals WHERE referrer_id = p_user_id),
    'updates_created', (SELECT COUNT(*) FROM portal_updates WHERE created_by = p_user_id),
    'surveys_created', (SELECT COUNT(*) FROM portal_surveys WHERE created_by = p_user_id),
    'events_created', (SELECT COUNT(*) FROM portal_events WHERE created_by = p_user_id),
    'marketing_conversions', (SELECT COUNT(*) FROM marketing_conversions WHERE user_id = p_user_id),
    'portal_memberships', (SELECT COUNT(*) FROM portal_memberships WHERE user_id = p_user_id)
  )
  INTO v_deletion_counts;

  RETURN json_build_object(
    'user', v_user_data,
    'data_to_delete', v_deletion_counts
  );
END;
$function$;


-- ======================================================================

-- Function 76/242
CREATE OR REPLACE FUNCTION public.get_user_organization(user_uuid uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    SELECT organization_id 
    FROM profiles 
    WHERE id = user_uuid
    LIMIT 1;
$function$;


-- ======================================================================

-- Function 77/242
CREATE OR REPLACE FUNCTION public.get_user_permissions(p_user_id uuid DEFAULT auth.uid())
 RETURNS TABLE(permission text, context jsonb, expires_at timestamp with time zone, inherited_from text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_user_roles app_role[];
BEGIN
  -- Get user's roles
  v_user_roles := get_user_roles(p_user_id);
  
  -- Return direct permissions
  RETURN QUERY
  SELECT 
    p.name as permission,
    jsonb_build_object(
      'scope', p.scope,
      'resource', p.resource,
      'action', p.action,
      'role', rp.role::text
    ) as context,
    rp.expires_at,
    'direct'::text as inherited_from
  FROM role_permissions rp
  JOIN permissions p ON p.id = rp.permission_id
  WHERE rp.role = ANY(v_user_roles)
  AND (rp.expires_at IS NULL OR rp.expires_at > now());

  -- Return wildcard inherited permissions (admin:* grants admin:organizations)
  RETURN QUERY
  SELECT DISTINCT
    p.name as permission,
    jsonb_build_object(
      'scope', p.scope,
      'resource', p.resource,
      'action', p.action,
      'wildcard_source', wp.name,
      'role', rp.role::text
    ) as context,
    rp.expires_at,
    'wildcard'::text as inherited_from
  FROM role_permissions rp
  JOIN permissions wp ON wp.id = rp.permission_id
  JOIN permissions p ON p.resource = wp.resource
  WHERE rp.role = ANY(v_user_roles)
  AND wp.action = '*'
  AND p.name != wp.name
  AND (rp.expires_at IS NULL OR rp.expires_at > now());

  -- Legacy compatibility for existing code
  IF 'super_admin' = ANY(v_user_roles) OR 'admin' = ANY(v_user_roles) THEN
    RETURN QUERY
    SELECT 
      legacy_perm.permission,
      jsonb_build_object('scope', 'legacy') as context,
      NULL::timestamptz as expires_at,
      'legacy'::text as inherited_from
    FROM (
      VALUES 
        ('admin:*'),
        ('organization:*'),
        ('user:*'),
        ('module:*'),
        ('fleet:*'),
        ('fleet_maintenance:*'),
        ('profile:view'),
        ('profile:edit')
    ) AS legacy_perm(permission);
  END IF;
END;
$function$;


-- ======================================================================

-- Function 78/242
CREATE OR REPLACE FUNCTION public.get_user_permissions_old_backup(p_user_id uuid DEFAULT auth.uid())
 RETURNS TABLE(permission text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Check admin status using materialized view
  IF EXISTS (SELECT 1 FROM admin_users_view WHERE user_id = p_user_id) THEN
    RETURN QUERY 
      SELECT 'admin:*'
      UNION SELECT 'organization:*'
      UNION SELECT 'user:*'
      UNION SELECT 'module:*'
      UNION SELECT 'fleet:*'
      UNION SELECT 'fleet_maintenance:*'
      UNION SELECT 'profile:view'
      UNION SELECT 'profile:edit';
    RETURN;
  END IF;
  
  -- Direct table access for role checks
  IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = p_user_id AND role = 'owner') THEN
    RETURN QUERY SELECT * FROM public.get_owner_permissions();
    RETURN;
  END IF;
  
  -- Basic permissions for all authenticated users
  RETURN QUERY
    SELECT 'profile:view'
    UNION SELECT 'profile:edit';
END;
$function$;


-- ======================================================================

-- Function 79/242
CREATE OR REPLACE FUNCTION public.get_user_roles(p_user_id uuid DEFAULT auth.uid())
 RETURNS app_role[]
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  user_roles app_role[];
BEGIN
  SELECT array_agg(DISTINCT role) 
  INTO user_roles
  FROM user_roles
  WHERE user_id = p_user_id;
  
  RETURN COALESCE(user_roles, ARRAY[]::app_role[]);
END;
$function$;


-- ======================================================================

-- Function 80/242
CREATE OR REPLACE FUNCTION public.get_user_survey_status(p_user_id uuid)
 RETURNS TABLE(survey_id uuid, survey_title text, survey_description text, survey_status text, created_at timestamp with time zone, updated_at timestamp with time zone, user_status text, progress_percentage integer, started_at timestamp with time zone, completed_at timestamp with time zone, response_id uuid, is_complete boolean, answered_questions integer, total_questions integer, due_date timestamp with time zone)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    s.id as survey_id,
    s.title::TEXT as survey_title,
    s.description::TEXT as survey_description,
    s.status::TEXT as survey_status,
    s.created_at,
    s.updated_at,
    CASE
      WHEN sr.is_complete THEN 'completed'
      WHEN sr.id IS NOT NULL THEN 'in_progress'
      ELSE 'not_started'
    END as user_status,
    CASE
      WHEN COALESCE(s.question_count, 0) > 0 AND COALESCE(sr.answered_questions, 0) > 0 THEN
        COALESCE(ROUND((sr.answered_questions::NUMERIC / s.question_count) * 100), 0)::INTEGER
      WHEN sr.is_complete THEN 100
      ELSE 0
    END as progress_percentage,
    sr.started_at,
    sr.completed_at,
    sr.id as response_id,
    COALESCE(sr.is_complete, false) as is_complete,
    COALESCE(sr.answered_questions, 0)::INTEGER as answered_questions,
    COALESCE(s.question_count, 0)::INTEGER as total_questions,
    s.due_date
  FROM public.portal_surveys s
  LEFT JOIN public.portal_survey_responses sr
    ON s.id = sr.survey_id
    AND sr.user_id = p_user_id
  WHERE s.status = 'published'
  ORDER BY s.created_at DESC;
END;
$function$;


-- ======================================================================

-- Function 81/242
CREATE OR REPLACE FUNCTION public.list_all_users()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_users json;
BEGIN
  -- Check if the calling user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin', 'developer')
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Only administrators can list users'
    );
  END IF;

  SELECT json_agg(
    json_build_object(
      'email', u.email,
      'id', u.id,
      'created_at', u.created_at,
      'last_sign_in', u.last_sign_in_at,
      'profile', json_build_object(
        'first_name', p.first_name,
        'last_name', p.last_name,
        'organization', o.name
      ),
      'roles', (
        SELECT array_agg(role ORDER BY role) 
        FROM user_roles 
        WHERE user_id = u.id
      )
    ) ORDER BY u.email
  )
  INTO v_users
  FROM auth.users u
  LEFT JOIN profiles p ON p.id = u.id
  LEFT JOIN organizations o ON o.id = p.organization_id;

  RETURN json_build_object(
    'success', true,
    'users', COALESCE(v_users, '[]'::json),
    'count', COALESCE(json_array_length(v_users), 0)
  );
END;
$function$;


-- ======================================================================

-- Function 82/242
CREATE OR REPLACE FUNCTION public.preview_user_deletion(p_user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_data JSON;
  v_deletion_counts JSON;
BEGIN
  -- Get user basic info
  SELECT json_build_object(
    'id', id,
    'email', email,
    'name', COALESCE(first_name || ' ' || last_name, first_name, last_name, email),
    'role', role,
    'created_at', created_at
  )
  INTO v_user_data
  FROM profiles
  WHERE id = p_user_id;

  -- If user not found, return error
  IF v_user_data IS NULL THEN
    RETURN json_build_object(
      'error', 'User not found',
      'user_id', p_user_id
    );
  END IF;

  -- Count all data that will be deleted
  SELECT json_build_object(
    'businesses', (SELECT COUNT(*) FROM businesses WHERE user_id = p_user_id),
    'survey_responses', (SELECT COUNT(*) FROM portal_survey_responses WHERE user_id = p_user_id),
    'event_registrations', (SELECT COUNT(*) FROM portal_event_registrations WHERE user_id = p_user_id),
    'referrals_made', (SELECT COUNT(*) FROM portal_referrals WHERE referrer_id = p_user_id AND referral_type = 'individual'),
    'updates_created', (SELECT COUNT(*) FROM portal_updates WHERE created_by = p_user_id),
    'surveys_created', (SELECT COUNT(*) FROM portal_surveys WHERE created_by = p_user_id),
    'events_created', (SELECT COUNT(*) FROM portal_events WHERE created_by = p_user_id),
    'marketing_conversions', (SELECT COUNT(*) FROM referral_conversions WHERE user_id = p_user_id),
    'portal_memberships', (SELECT COUNT(*) FROM portal_memberships WHERE user_id = p_user_id)
  )
  INTO v_deletion_counts;

  -- Return combined data
  RETURN json_build_object(
    'user', v_user_data,
    'data_to_delete', v_deletion_counts
  );
END;
$function$;


-- ======================================================================

-- Function 83/242
CREATE OR REPLACE FUNCTION public.record_user_login(p_user_id uuid, p_auth_type character varying DEFAULT 'supabase'::character varying, p_ip_address inet DEFAULT NULL::inet, p_user_agent text DEFAULT NULL::text, p_success boolean DEFAULT true, p_error_message text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_login_id UUID;
BEGIN
    -- Insert login record
    INSERT INTO public.login_history (
        user_id,
        auth_type,
        ip_address,
        user_agent,
        success,
        error_message
    ) VALUES (
        p_user_id,
        p_auth_type,
        p_ip_address,
        p_user_agent,
        p_success,
        p_error_message
    ) RETURNING id INTO v_login_id;
    
    -- Update profiles with last login time if successful
    IF p_success THEN
        UPDATE public.profiles
        SET last_sign_in_at = NOW()
        WHERE id = p_user_id;
    END IF;
    
    RETURN v_login_id;
EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail
    RAISE WARNING 'Failed to record login for user %: %', p_user_id, SQLERRM;
    RETURN NULL;
END;
$function$;


-- ======================================================================

-- Function 84/242
CREATE OR REPLACE FUNCTION public.reset_user_password(user_email text, new_password text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
    v_user_id UUID;
    v_is_admin BOOLEAN;
    v_admin_org_id UUID;
    v_target_org_id UUID;
    v_is_company_admin BOOLEAN;
BEGIN
    -- Check if requesting user is authenticated
    IF auth.uid() IS NULL THEN
        -- Allow for dev sessions
        v_is_admin := true;
        v_is_company_admin := true;
    ELSE
        -- Check if the requesting user is an admin or owner
        SELECT EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'owner')
        ) INTO v_is_admin;
        
        -- Check if company-level admin
        SELECT EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('super_admin', 'admin', 'developer', 'finance')
        ) INTO v_is_company_admin;
    END IF;
    
    IF NOT v_is_admin AND NOT v_is_company_admin THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Only admins and owners can reset passwords'
        );
    END IF;
    
    -- Get the target user's ID and organization
    SELECT p.id, p.organization_id 
    INTO v_user_id, v_target_org_id
    FROM profiles p
    WHERE LOWER(p.email) = LOWER(user_email);
    
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'User not found'
        );
    END IF;
    
    -- If not a company admin, check organization boundaries
    IF NOT v_is_company_admin AND auth.uid() IS NOT NULL THEN
        -- Get admin's organization
        SELECT organization_id INTO v_admin_org_id
        FROM profiles
        WHERE id = auth.uid();
        
        -- Check if admin and target user are in the same organization
        IF v_admin_org_id IS DISTINCT FROM v_target_org_id THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'You can only reset passwords for users in your organization'
            );
        END IF;
    END IF;
    
    -- Update the user's password in auth.users using extensions schema
    UPDATE auth.users
    SET 
        encrypted_password = extensions.crypt(new_password, extensions.gen_salt('bf')),
        updated_at = NOW()
    WHERE id = v_user_id;
    
    -- Also update dev_auth if the user exists there
    UPDATE dev_auth
    SET 
        password_hash = extensions.crypt(new_password, extensions.gen_salt('bf', 10)),
        updated_at = NOW()
    WHERE user_id = v_user_id;
    
    -- Check if we actually updated anything
    IF NOT FOUND THEN
        -- Check if the user exists in auth.users
        IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user_id) THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'User not found in authentication system'
            );
        END IF;
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'user_id', v_user_id,
        'message', 'Password has been reset successfully'
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'detail', SQLSTATE
    );
END;
$function$;


-- ======================================================================

-- Function 85/242
CREATE OR REPLACE FUNCTION public.reset_user_password_admin(admin_user_id uuid, target_email text, new_password text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  v_target_user_id UUID;
  v_admin_role TEXT;
  v_encrypted_password TEXT;
BEGIN
  -- Check if the requesting user is an admin
  SELECT role INTO v_admin_role
  FROM public.profiles
  WHERE id = admin_user_id;
  
  IF v_admin_role IS NULL OR v_admin_role NOT IN ('superadmin', 'super_admin', 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can reset passwords';
  END IF;
  
  -- Find the target user by email
  SELECT id INTO v_target_user_id
  FROM auth.users
  WHERE email = LOWER(target_email);
  
  IF v_target_user_id IS NULL THEN
    -- User doesn't exist in auth, try to find in profiles and create auth record
    SELECT id INTO v_target_user_id
    FROM public.profiles
    WHERE email = LOWER(target_email);
    
    IF v_target_user_id IS NULL THEN
      RAISE EXCEPTION 'User not found: %', target_email;
    END IF;
    
    -- Create auth record for existing profile
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      instance_id,
      aud,
      role
    ) VALUES (
      v_target_user_id,
      LOWER(target_email),
      crypt(new_password, gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated'
    );
    
    RETURN 'Password set successfully (new auth record created)';
  END IF;
  
  -- Update the password
  UPDATE auth.users
  SET 
    encrypted_password = crypt(new_password, gen_salt('bf')),
    updated_at = NOW()
  WHERE id = v_target_user_id;
  
  RETURN 'Password reset successfully';
END;
$function$;


-- ======================================================================

-- Function 86/242
CREATE OR REPLACE FUNCTION public.set_user_password(target_user_id uuid, new_password text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  calling_user_role text;
  target_user_email text;
  is_system_user boolean;
BEGIN
  -- Check if the calling user has admin privileges
  SELECT role INTO calling_user_role
  FROM user_roles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'super_admin', 'developer')
  LIMIT 1;

  IF calling_user_role IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Only administrators can set user passwords'
    );
  END IF;

  -- Get target user email
  SELECT email INTO target_user_email
  FROM auth.users
  WHERE id = target_user_id;

  IF target_user_email IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;

  -- Check if this is a system user
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = target_user_id 
    AND role IN ('super_admin', 'admin', 'developer', 'finance')
  ) INTO is_system_user;

  -- For now, we'll use the reset_user_password function if it exists
  -- Otherwise, we'll update the auth.users table directly
  BEGIN
    -- Try to use reset_user_password if it exists
    PERFORM reset_user_password(target_user_email, new_password);
    
    RETURN json_build_object(
      'success', true,
      'message', 'Password updated successfully',
      'user_email', target_user_email,
      'is_system_user', is_system_user
    );
  EXCEPTION
    WHEN undefined_function THEN
      -- If reset_user_password doesn't exist, update directly
      UPDATE auth.users
      SET 
        encrypted_password = crypt(new_password, gen_salt('bf')),
        updated_at = NOW()
      WHERE id = target_user_id;

      RETURN json_build_object(
        'success', true,
        'message', 'Password updated directly',
        'user_email', target_user_email,
        'is_system_user', is_system_user
      );
    WHEN OTHERS THEN
      RETURN json_build_object(
        'success', false,
        'error', SQLERRM,
        'detail', SQLSTATE
      );
  END;
END;
$function$;


-- ======================================================================

-- Function 87/242
CREATE OR REPLACE FUNCTION public.start_user_impersonation(target_user_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    new_session_id UUID;
BEGIN
    -- Verify the caller is an admin using our existing is_admin function
    IF NOT (SELECT is_admin()) THEN
        RAISE EXCEPTION 'Only administrators can impersonate users';
    END IF;

    -- Create new impersonation session
    INSERT INTO impersonation_sessions (admin_id, impersonated_user_id)
    VALUES (auth.uid(), target_user_id)
    RETURNING id INTO new_session_id;

    RETURN new_session_id;
END;
$function$;


-- ======================================================================

-- Function 88/242
CREATE OR REPLACE FUNCTION public.sync_primary_business_to_profile()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.is_primary = TRUE THEN
    UPDATE public.profiles
    SET 
      company_name = NEW.company_name,
      website = NEW.website,
      year_dsp_began = NEW.year_dsp_began,
      avg_fleet_vehicles = NEW.avg_fleet_vehicles,
      avg_drivers = NEW.avg_drivers,
      average_fleet_size = NEW.avg_fleet_vehicles,
      average_drivers = NEW.avg_drivers,
      email = COALESCE(profiles.email, NEW.email),
      phone = NEW.phone,
      mobile = NEW.mobile,
      street1 = NEW.street1,
      street2 = NEW.street2,
      city = NEW.city,
      state = NEW.state,
      zip = NEW.zip,
      updated_at = NOW()
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$function$;


-- ======================================================================

-- Function 89/242
CREATE OR REPLACE FUNCTION public.sync_system_user_assignments()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Handle INSERT and UPDATE
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    -- Check if the new role is a system role
    IF NEW.role IN ('super_admin', 'admin', 'developer', 'finance') THEN
      -- Insert or update in system_user_assignments
      INSERT INTO system_user_assignments (user_id, system_role, assigned_at, is_active)
      VALUES (NEW.user_id, NEW.role::text, NOW(), true)
      ON CONFLICT (user_id, system_role) 
      DO UPDATE SET 
        is_active = true,
        assigned_at = CASE 
          WHEN system_user_assignments.is_active = false 
          THEN NOW() 
          ELSE system_user_assignments.assigned_at 
        END;
    END IF;
    
    -- If updating from a system role to a non-system role, deactivate
    IF TG_OP = 'UPDATE' AND OLD.role IN ('super_admin', 'admin', 'developer', 'finance') 
       AND NEW.role NOT IN ('super_admin', 'admin', 'developer', 'finance') THEN
      UPDATE system_user_assignments 
      SET is_active = false 
      WHERE user_id = OLD.user_id AND system_role = OLD.role::text;
    END IF;
  END IF;
  
  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    -- If deleting a system role, deactivate in system_user_assignments
    IF OLD.role IN ('super_admin', 'admin', 'developer', 'finance') THEN
      UPDATE system_user_assignments 
      SET is_active = false 
      WHERE user_id = OLD.user_id AND system_role = OLD.role::text;
    END IF;
  END IF;
  
  -- Handle organization roles for organization_memberships
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    IF NEW.role IN ('owner', 'manager', 'dispatch', 'tech', 'driver') THEN
      -- Get the user's organization_id from profiles
      DECLARE
        v_org_id UUID;
      BEGIN
        SELECT organization_id INTO v_org_id
        FROM profiles
        WHERE id = NEW.user_id;
        
        -- Only insert if user has an organization
        IF v_org_id IS NOT NULL THEN
          INSERT INTO organization_memberships (user_id, organization_id, org_role, joined_at, is_active)
          VALUES (NEW.user_id, v_org_id, NEW.role::text, NOW(), true)
          ON CONFLICT (user_id, organization_id, org_role) 
          DO UPDATE SET 
            is_active = true,
            joined_at = CASE 
              WHEN organization_memberships.is_active = false 
              THEN NOW() 
              ELSE organization_memberships.joined_at 
            END;
        END IF;
      END;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;


-- ======================================================================

-- Function 90/242
CREATE OR REPLACE FUNCTION public.sync_user_roles_to_context()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- System roles
    IF NEW.role IN ('super_admin', 'admin', 'developer', 'finance') THEN
      INSERT INTO public.system_user_assignments (user_id, system_role, notes)
      VALUES (NEW.user_id, NEW.role::text, 'Synced from user_roles')
      ON CONFLICT (user_id, system_role) 
      DO UPDATE SET is_active = true;
    END IF;
    
    -- Organization roles (need to determine org)
    IF NEW.role IN ('owner', 'manager', 'dispatch', 'tech', 'driver') THEN
      -- Try to find organization
      INSERT INTO public.organization_memberships (user_id, organization_id, org_role, notes)
      SELECT 
        NEW.user_id,
        COALESCE(
          p.organization_id,
          (SELECT id FROM public.organizations WHERE name = 'Default Organization (Migration)')
        ),
        NEW.role::text,
        'Synced from user_roles - verify org assignment'
      FROM public.profiles p
      WHERE p.id = NEW.user_id
      ON CONFLICT (user_id, organization_id, org_role) 
      DO UPDATE SET is_active = true;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    -- Deactivate in context tables
    UPDATE public.system_user_assignments 
    SET is_active = false 
    WHERE user_id = OLD.user_id AND system_role = OLD.role::text;
    
    UPDATE public.organization_memberships 
    SET is_active = false 
    WHERE user_id = OLD.user_id AND org_role = OLD.role::text;
  END IF;
  
  RETURN NEW;
END;
$function$;


-- ======================================================================

-- Function 91/242
CREATE OR REPLACE FUNCTION public.update_user_roles(p_user_id uuid, new_roles app_role[])
 RETURNS TABLE(role app_role)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Check if the calling user is an admin
  IF NOT (SELECT EXISTS(SELECT 1 FROM admin_users_view WHERE user_id = auth.uid())) THEN
    RAISE EXCEPTION 'Only administrators can update user roles';
  END IF;

  -- Delete existing roles
  DELETE FROM public.user_roles
  WHERE user_roles.user_id = p_user_id;

  -- Insert new roles if any are provided
  IF array_length(new_roles, 1) > 0 THEN
    INSERT INTO public.user_roles (user_id, role)
    SELECT p_user_id, unnest(new_roles);
  END IF;

  -- NOTE: admin_users_view is a regular view, it updates automatically
  -- No REFRESH needed

  -- Return the new roles
  RETURN QUERY
  SELECT user_roles.role
  FROM public.user_roles
  WHERE user_roles.user_id = p_user_id;
END;
$function$;


-- ======================================================================

-- Function 92/242
CREATE OR REPLACE FUNCTION public.upgrade_user_to_admin(user_email text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  DECLARE
    v_user_id UUID;
  BEGIN
    -- Find the user
    SELECT id INTO v_user_id
    FROM public.profiles
    WHERE email = LOWER(user_email);

    IF v_user_id IS NULL THEN
      RAISE EXCEPTION 'User not found: %', user_email;
    END IF;

    -- Update their role to admin
    UPDATE public.profiles
    SET
      role = 'admin',
      updated_at = NOW()
    WHERE id = v_user_id;

    -- Add to system_user_assignments if that table exists
    BEGIN
      INSERT INTO system_user_assignments (user_id, system_role, is_active, assigned_at)
      VALUES (v_user_id, 'admin', true, NOW())
      ON CONFLICT (user_id, system_role)
      DO UPDATE SET is_active = true, assigned_at = NOW();
    EXCEPTION
      WHEN undefined_table THEN
        -- Table doesn't exist, skip
        NULL;
      WHEN undefined_column THEN
        -- Column doesn't exist, skip
        NULL;
    END;

    -- Add to user_roles if that table exists  
    BEGIN
      INSERT INTO user_roles (user_id, role, created_at)
      VALUES (v_user_id, 'admin', NOW())
      ON CONFLICT (user_id, role) DO NOTHING;
    EXCEPTION
      WHEN undefined_table THEN
        -- Table doesn't exist, skip
        NULL;
    END;

    RETURN 'User ' || user_email || ' upgraded to admin role';
  END;
  $function$;


-- ======================================================================

-- Function 93/242
CREATE OR REPLACE FUNCTION public.upsert_user_business(p_user_id uuid, p_company_name text, p_type text, p_website text, p_phone text, p_address text, p_city text, p_state text, p_zip text, p_services_offered text, p_primary_markets text, p_year_established integer, p_fleet_size integer DEFAULT NULL::integer, p_driver_count integer DEFAULT NULL::integer)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_business_id UUID;
  v_result JSON;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if user owns this profile or is admin
  IF p_user_id != auth.uid() AND NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin', 'superadmin')
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Check if business exists
  SELECT id INTO v_business_id
  FROM public.businesses
  WHERE owner_id = p_user_id OR id = p_user_id
  LIMIT 1;

  IF v_business_id IS NOT NULL THEN
    -- Update existing business
    UPDATE public.businesses
    SET
      company_name = p_company_name,
      type = p_type,
      website = p_website,
      phone = p_phone,
      address = p_address,
      city = p_city,
      state = p_state,
      zip = p_zip,
      services_offered = p_services_offered,
      primary_markets = p_primary_markets,
      year_established = p_year_established,
      fleet_size = p_fleet_size,
      driver_count = p_driver_count,
      updated_at = NOW()
    WHERE id = v_business_id;
    
    v_result := json_build_object('action', 'updated', 'id', v_business_id);
  ELSE
    -- Insert new business
    INSERT INTO public.businesses (
      id,
      owner_id,
      company_name,
      type,
      website,
      phone,
      address,
      city,
      state,
      zip,
      services_offered,
      primary_markets,
      year_established,
      fleet_size,
      driver_count,
      created_at,
      updated_at
    ) VALUES (
      p_user_id, -- Use user ID as business ID
      p_user_id,
      p_company_name,
      p_type,
      p_website,
      p_phone,
      p_address,
      p_city,
      p_state,
      p_zip,
      p_services_offered,
      p_primary_markets,
      p_year_established,
      p_fleet_size,
      p_driver_count,
      NOW(),
      NOW()
    )
    RETURNING id INTO v_business_id;
    
    v_result := json_build_object('action', 'inserted', 'id', v_business_id);
  END IF;

  RETURN v_result;
END;
$function$;


-- ======================================================================

-- Function 94/242
CREATE OR REPLACE FUNCTION public.user_has_role(p_role app_role)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Special case for admin role - use materialized view to avoid recursion
  IF p_role = 'admin' THEN
    RETURN EXISTS (
      SELECT 1 FROM admin_users_view
      WHERE user_id = auth.uid()
    );
  END IF;

  -- For other roles, directly query the table without using RLS
  -- This avoids the recursion issue
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = p_role
  );
END;
$function$;


-- ======================================================================

-- Function 95/242
CREATE OR REPLACE FUNCTION public.verify_user_setup(user_email text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user record;
  v_profile record;
BEGIN
  -- Get user info
  SELECT 
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    substring(encrypted_password, 1, 7) as password_prefix
  INTO v_user
  FROM auth.users
  WHERE lower(email) = lower(user_email);

  -- Get profile info
  SELECT 
    id,
    email,
    first_name,
    last_name,
    created_at
  INTO v_profile
  FROM profiles
  WHERE lower(email) = lower(user_email);

  RETURN json_build_object(
    'user_exists', v_user.id IS NOT NULL,
    'profile_exists', v_profile.id IS NOT NULL,
    'user', CASE 
      WHEN v_user.id IS NOT NULL THEN
        json_build_object(
          'id', v_user.id,
          'email', v_user.email,
          'email_confirmed', v_user.email_confirmed_at IS NOT NULL,
          'password_prefix', v_user.password_prefix,
          'has_password', v_user.encrypted_password IS NOT NULL AND v_user.encrypted_password != '',
          'created_at', v_user.created_at,
          'updated_at', v_user.updated_at
        )
      ELSE NULL
    END,
    'profile', CASE
      WHEN v_profile.id IS NOT NULL THEN
        json_build_object(
          'id', v_profile.id,
          'email', v_profile.email,
          'name', concat(v_profile.first_name, ' ', v_profile.last_name),
          'created_at', v_profile.created_at
        )
      ELSE NULL
    END,
    'ids_match', v_user.id = v_profile.id
  );
END;
$function$;


-- ======================================================================

-- Function 96/242
CREATE OR REPLACE FUNCTION public.acknowledge_update(p_update_id uuid, p_user_id uuid)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
    INSERT INTO public.portal_update_reads (
        update_id, 
        user_id, 
        first_viewed_at,
        last_viewed_at,
        acknowledged_at,
        time_to_acknowledge
    )
    VALUES (
        p_update_id, 
        p_user_id, 
        NOW(),
        NOW(),
        NOW(),
        INTERVAL '0 seconds'
    )
    ON CONFLICT (update_id, user_id) 
    DO UPDATE SET
        acknowledged_at = NOW(),
        last_viewed_at = NOW(),
        time_to_acknowledge = NOW() - portal_update_reads.first_viewed_at;
        
    UPDATE public.portal_updates 
    SET acknowledgment_count = COALESCE(acknowledgment_count, 0) + 1
    WHERE id = p_update_id;
$function$;


-- ======================================================================

-- Function 97/242
CREATE OR REPLACE FUNCTION public.add_dsp_location(p_dsp_id uuid, p_station_id uuid, p_is_primary boolean DEFAULT false)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_location_id UUID;
BEGIN
  -- If setting as primary, unset other primaries
  IF p_is_primary THEN
    UPDATE dsp_locations 
    SET is_primary = false 
    WHERE dsp_id = p_dsp_id AND is_primary = true;
    
    UPDATE dsps 
    SET primary_station_id = p_station_id 
    WHERE id = p_dsp_id;
  END IF;
  
  -- Insert or update the location
  INSERT INTO dsp_locations (dsp_id, station_id, is_primary, is_active)
  VALUES (p_dsp_id, p_station_id, p_is_primary, true)
  ON CONFLICT (dsp_id, station_id) 
  DO UPDATE SET 
    is_primary = EXCLUDED.is_primary,
    is_active = true,
    updated_at = now()
  RETURNING id INTO v_location_id;
  
  RETURN v_location_id;
END;
$function$;


-- ======================================================================

-- Function 98/242
CREATE OR REPLACE FUNCTION public.admin_reset_password(user_email text, new_password text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    -- Just redirect to set_dev_password for now
    RETURN set_dev_password(user_email, new_password);
END;
$function$;


-- ======================================================================

-- Function 99/242
CREATE OR REPLACE FUNCTION public.archive_update(p_update_id uuid, p_admin_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  update_title TEXT;
  current_status TEXT;
BEGIN
  -- Get update details
  SELECT title, status INTO update_title, current_status
  FROM portal_updates 
  WHERE id = p_update_id;
  
  -- Check if update exists
  IF update_title IS NULL THEN
    RAISE EXCEPTION 'Update not found';
  END IF;
  
  -- Check if already archived
  IF current_status = 'archived' THEN
    RAISE EXCEPTION 'Update is already archived';
  END IF;
  
  -- Archive the update
  UPDATE portal_updates
  SET 
    status = 'archived',
    archived_at = NOW(),
    archived_by = p_admin_id,
    updated_at = NOW()
  WHERE id = p_update_id;
  
  -- Log the action
  INSERT INTO portal_audit_log (
    action, 
    entity_type, 
    entity_id, 
    admin_id, 
    details
  ) VALUES (
    'archive_update',
    'update',
    p_update_id,
    p_admin_id,
    json_build_object(
      'title', update_title,
      'previous_status', current_status,
      'archived_at', NOW()
    )
  );
  
  RETURN json_build_object(
    'success', true,
    'title', update_title,
    'archived_at', NOW()
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$function$;


-- ======================================================================

-- Function 100/242
CREATE OR REPLACE FUNCTION public.assign_market_region()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_region_id UUID;
    v_all_states_same_region BOOLEAN := true;
    v_temp_region_id UUID;
BEGIN
    -- If primary_state is set, use it to determine region
    IF NEW.primary_state IS NOT NULL THEN
        NEW.region_id := public.get_region_from_state(NEW.primary_state);
    -- If states array is set, check all states are in same region
    ELSIF array_length(NEW.states, 1) > 0 THEN
        FOR i IN 1..array_length(NEW.states, 1) LOOP
            v_temp_region_id := public.get_region_from_state(NEW.states[i]);
            
            IF v_region_id IS NULL THEN
                v_region_id := v_temp_region_id;
            ELSIF v_region_id != v_temp_region_id THEN
                v_all_states_same_region := false;
                EXIT;
            END IF;
        END LOOP;
        
        -- Only auto-assign if all states are in the same region
        IF v_all_states_same_region THEN
            NEW.region_id := v_region_id;
        ELSE
            RAISE WARNING 'Market % spans multiple regions. Please set primary_state to determine region.', NEW.name;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$;


-- ======================================================================

-- Function 101/242
CREATE OR REPLACE FUNCTION public.auto_accept_terms_for_admins()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
  BEGIN
    IF NEW.role IN ('super_admin', 'admin')
       OR NEW.email IN ('admin@fleetdrms.com', 'superadmin@fleetdrms.com') THEN
      NEW.terms_accepted := TRUE;
      NEW.terms_accepted_at := COALESCE(NEW.terms_accepted_at, NOW());
      NEW.terms_version := COALESCE(NEW.terms_version, '1.0');
    END IF;
    RETURN NEW;
  END;
  $function$;


-- ======================================================================

-- Function 102/242
CREATE OR REPLACE FUNCTION public.can_access_fleet_record(p_organization_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_org_id uuid;
BEGIN
  -- Admin check using materialized view
  IF EXISTS (SELECT 1 FROM admin_users_view WHERE user_id = auth.uid()) THEN
    RETURN TRUE;
  END IF;
  
  -- Get user's organization
  SELECT organization_id INTO v_user_org_id
  FROM profiles
  WHERE id = auth.uid();
  
  -- Check if user belongs to the organization
  RETURN v_user_org_id = p_organization_id;
END;
$function$;


-- ======================================================================

-- Function 103/242
CREATE OR REPLACE FUNCTION public.can_access_maintenance_note(p_note_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_record_id UUID;
BEGIN
  -- Get the parent record ID - Direct query to avoid RLS
  SELECT maintenance_record_id INTO v_record_id
  FROM maintenance_notes
  WHERE id = p_note_id;
  
  -- Use the record access function
  RETURN can_access_maintenance_record(v_record_id);
END;
$function$;


-- ======================================================================

-- Function 104/242
CREATE OR REPLACE FUNCTION public.can_access_maintenance_record(p_record_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_org_id UUID;
  v_user_org_id UUID;
BEGIN
  -- Admin users always have access
  IF EXISTS (SELECT 1 FROM admin_users_view WHERE user_id = auth.uid()) THEN
    RETURN TRUE;
  END IF;
  
  -- Get organization ID for the maintenance record
  SELECT organization_id INTO v_org_id
  FROM maintenance_records
  WHERE id = p_record_id;
  
  -- Get user's organization - Direct table access to avoid RLS recursion
  SELECT organization_id INTO v_user_org_id
  FROM profiles
  WHERE id = auth.uid();
  
  -- Check if user belongs to the same organization
  RETURN v_org_id = v_user_org_id;
END;
$function$;


-- ======================================================================

-- Function 105/242
CREATE OR REPLACE FUNCTION public.can_access_module(p_module_type module_type, p_organization_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_is_admin boolean;
  v_is_owner boolean;
  v_user_org_id uuid;
  v_module_enabled boolean;
BEGIN
  -- Check if user is admin
  SELECT EXISTS (
    SELECT 1 FROM admin_users_view 
    WHERE user_id = auth.uid()
  ) INTO v_is_admin;
  
  -- Admins have access to all modules
  IF v_is_admin THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is owner
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'owner'
  ) INTO v_is_owner;
  
  -- Get user's organization
  SELECT organization_id INTO v_user_org_id
  FROM profiles
  WHERE id = auth.uid();
  
  -- Owner can only access modules for their organization
  IF v_is_owner THEN
    -- Must be owner's organization
    IF v_user_org_id != p_organization_id THEN
      RETURN FALSE;
    END IF;
    
    -- Check if the module is enabled for the organization
    SELECT COALESCE(mc.is_enabled, FALSE) INTO v_module_enabled
    FROM modules m
    JOIN module_configurations mc ON m.id = mc.module_id
    WHERE m.type = p_module_type
    AND mc.organization_id = p_organization_id;
    
    RETURN v_module_enabled;
  END IF;
  
  -- For regular users, check organization match and module enabled status
  IF v_user_org_id = p_organization_id THEN
    SELECT COALESCE(mc.is_enabled, FALSE) INTO v_module_enabled
    FROM modules m
    JOIN module_configurations mc ON m.id = mc.module_id
    WHERE m.type = p_module_type
    AND mc.organization_id = p_organization_id;
    
    RETURN v_module_enabled;
  END IF;
  
  -- Default: no access
  RETURN FALSE;
END;
$function$;


-- ======================================================================

-- Function 106/242
CREATE OR REPLACE FUNCTION public.can_access_organization()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Direct query without using RLS to prevent recursion
  RETURN EXISTS (
    SELECT 1 
    FROM user_roles 
    WHERE user_id = auth.uid() 
    AND (role = 'admin' OR role = 'owner')
  );
END;
$function$;


-- ======================================================================

-- Function 107/242
CREATE OR REPLACE FUNCTION public.can_access_organization(p_organization_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_org_id uuid;
BEGIN
  -- Use materialized view to check admin status - prevents recursion
  IF EXISTS (SELECT 1 FROM admin_users_view WHERE user_id = auth.uid()) THEN
    RETURN TRUE;
  END IF;
  
  -- Direct table access without RLS to prevent recursion
  SELECT organization_id INTO v_user_org_id
  FROM profiles
  WHERE id = auth.uid();
  
  -- Owner check - direct table access without triggering RLS
  IF EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'owner'
  ) THEN
    RETURN v_user_org_id = p_organization_id;
  END IF;
  
  -- All other cases
  RETURN FALSE;
END;
$function$;


-- ======================================================================

-- Function 108/242
CREATE OR REPLACE FUNCTION public.can_access_organization_data(p_organization_id uuid, p_dev_user_email text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id uuid;
  v_user_org_id uuid;
  v_user_roles text[];
  v_is_company_user boolean;
BEGIN
  -- If dev email provided, use that for context
  IF p_dev_user_email IS NOT NULL THEN
    SELECT user_id, organization_id, roles 
    INTO v_user_id, v_user_org_id, v_user_roles
    FROM get_user_context(p_dev_user_email);
  ELSE
    -- Otherwise use auth session
    v_user_id := auth.uid();
  END IF;
  
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Get user's organization and roles if not already set
  IF v_user_org_id IS NULL THEN
    SELECT p.organization_id INTO v_user_org_id
    FROM profiles p
    WHERE p.id = v_user_id;
    
    SELECT array_agg(DISTINCT ur.role::text) INTO v_user_roles
    FROM user_roles ur
    WHERE ur.user_id = v_user_id;
  END IF;
  
  -- Check if user has company-level roles
  v_is_company_user := EXISTS (
    SELECT 1 FROM unnest(v_user_roles) AS role
    WHERE role IN ('super_admin', 'admin', 'developer', 'finance')
  );
  
  -- Company users can access any organization
  IF v_is_company_user THEN
    RETURN true;
  END IF;
  
  -- Organization users can only access their own organization
  RETURN v_user_org_id = p_organization_id;
END;
$function$;


-- ======================================================================

-- Function 109/242
CREATE OR REPLACE FUNCTION public.can_delete_wiki_article()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Use the materialized view to check admin status
  RETURN EXISTS (
    SELECT 1 
    FROM admin_users_view
    WHERE user_id = auth.uid()
  );
END;
$function$;


-- ======================================================================

-- Function 110/242
CREATE OR REPLACE FUNCTION public.can_owner_access_organization(p_organization_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_org_id uuid;
  v_is_owner boolean;
BEGIN
  -- Get user's organization from profiles table
  SELECT organization_id INTO v_user_org_id
  FROM profiles
  WHERE id = auth.uid();
  
  -- Check if user has owner role (direct query to avoid recursion)
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'owner'
  ) INTO v_is_owner;
  
  -- Owner can only access their own organization
  RETURN v_is_owner AND v_user_org_id = p_organization_id;
END;
$function$;


-- ======================================================================

-- Function 111/242
CREATE OR REPLACE FUNCTION public.cancel_event_registration(event_uuid uuid, reason text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  UPDATE public.portal_event_registrations
  SET 
    attendance_status = 'cancelled',
    cancellation_date = NOW(),
    cancellation_reason = reason
  WHERE event_id = event_uuid
  AND user_id = auth.uid();

  -- Move someone from waitlist if available
  UPDATE public.portal_event_registrations
  SET attendance_status = 'registered'
  WHERE id = (
    SELECT id 
    FROM public.portal_event_registrations
    WHERE event_id = event_uuid
    AND attendance_status = 'waitlisted'
    ORDER BY registration_date
    LIMIT 1
  );
END;
$function$;


-- ======================================================================

-- Function 112/242
CREATE OR REPLACE FUNCTION public.check_is_admin(uid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  result boolean;
BEGIN
  -- Use the materialized view instead of directly querying user_roles
  SELECT EXISTS(
    SELECT 1 FROM admin_users_view
    WHERE user_id = uid
  ) INTO result;
  
  RETURN result;
END;
$function$;


-- ======================================================================

-- Function 113/242
CREATE OR REPLACE FUNCTION public.check_survey_completion(p_response_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_required_count INTEGER;
  v_answered_count INTEGER;
  v_survey_id UUID;
BEGIN
  -- Get survey_id from response
  SELECT survey_id INTO v_survey_id
  FROM portal_survey_responses
  WHERE id = p_response_id;
  
  -- Count required questions
  SELECT COUNT(*) INTO v_required_count
  FROM portal_survey_questions
  WHERE survey_id = v_survey_id
    AND required = true;
  
  -- Count answered required questions
  SELECT COUNT(DISTINCT q.id) INTO v_answered_count
  FROM portal_survey_questions q
  JOIN portal_survey_answers a ON a.question_id = q.id
  WHERE q.survey_id = v_survey_id
    AND q.required = true
    AND a.response_id = p_response_id;
  
  RETURN v_required_count = v_answered_count;
END;
$function$;


-- ======================================================================

-- Function 114/242
CREATE OR REPLACE FUNCTION public.clean_old_schedules()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
  retention_days INTEGER := 60; -- Keep 60 days of history
BEGIN
  -- Soft delete old schedules
  UPDATE driver_schedules
  SET is_deleted = true
  WHERE shift_date < CURRENT_DATE - INTERVAL '1 day' * retention_days
    AND is_deleted = false;
  
  -- Hard delete very old soft-deleted records
  DELETE FROM driver_schedules
  WHERE is_deleted = true
    AND shift_date < CURRENT_DATE - INTERVAL '1 day' * (retention_days * 2);
END;
$function$;


-- ======================================================================

-- Function 115/242
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.portal_referral_rate_limits
    WHERE action_timestamp < NOW() - INTERVAL '7 days';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$function$;


-- ======================================================================

-- Function 116/242
CREATE OR REPLACE FUNCTION public.clear_test_responses(p_survey_id uuid DEFAULT NULL::uuid, p_admin_id uuid DEFAULT NULL::uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  deleted_responses INTEGER;
  deleted_answers INTEGER;
BEGIN
  -- Delete test response answers
  DELETE FROM portal_survey_answers 
  WHERE response_id IN (
    SELECT id FROM portal_survey_responses 
    WHERE is_test_response = true
    AND (p_survey_id IS NULL OR survey_id = p_survey_id)
  );
  
  GET DIAGNOSTICS deleted_answers = ROW_COUNT;
  
  -- Delete test responses
  DELETE FROM portal_survey_responses 
  WHERE is_test_response = true
  AND (p_survey_id IS NULL OR survey_id = p_survey_id);
  
  GET DIAGNOSTICS deleted_responses = ROW_COUNT;
  
  -- Log the action if admin ID provided
  IF p_admin_id IS NOT NULL AND deleted_responses > 0 THEN
    INSERT INTO portal_audit_log (
      action, 
      entity_type, 
      entity_id, 
      admin_id, 
      details
    ) VALUES (
      'clear_test_responses',
      'survey',
      p_survey_id,
      p_admin_id,
      json_build_object(
        'responses_deleted', deleted_responses,
        'answers_deleted', deleted_answers,
        'survey_specific', p_survey_id IS NOT NULL,
        'cleared_at', NOW()
      )
    );
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'deleted_responses', deleted_responses,
    'deleted_answers', deleted_answers
  );
END;
$function$;


-- ======================================================================

-- Function 117/242
CREATE OR REPLACE FUNCTION public.close_overdue_surveys()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  closed_count INTEGER := 0;
BEGIN
  UPDATE portal_surveys
  SET 
    status = 'closed',
    closed_at = NOW()
  WHERE 
    status = 'published' 
    AND due_date IS NOT NULL 
    AND due_date < NOW()
    AND status != 'closed';
    
  GET DIAGNOSTICS closed_count = ROW_COUNT;
  
  RETURN closed_count;
END;
$function$;


-- ======================================================================

-- Function 118/242
CREATE OR REPLACE FUNCTION public.count_search_contacts(search_query text, p_market_id uuid DEFAULT NULL::uuid, p_station_id uuid DEFAULT NULL::uuid, p_dsp_id uuid DEFAULT NULL::uuid, p_status text DEFAULT NULL::text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    total_count INTEGER;
BEGIN
    WITH contact_locations AS (
      SELECT 
        cdl.contact_id,
        STRING_AGG(DISTINCT m.name || ' - ' || s.station_code, ', ' ORDER BY m.name || ' - ' || s.station_code) as locations
      FROM contact_dsp_locations cdl
      INNER JOIN dsp_locations dl ON dl.id = cdl.dsp_location_id
      INNER JOIN stations s ON s.id = dl.station_id
      LEFT JOIN markets m ON m.id = s.market_id
      WHERE dl.is_active = true
      GROUP BY cdl.contact_id
    )
    SELECT COUNT(DISTINCT c.id) INTO total_count
    FROM public.contacts c
    LEFT JOIN public.dsps d ON c.dsp_id = d.id
    LEFT JOIN contact_locations cl ON cl.contact_id = c.id
    WHERE c.is_active = true
        AND (p_market_id IS NULL OR c.market_id = p_market_id)
        AND (p_station_id IS NULL OR c.station_id = p_station_id)
        AND (p_dsp_id IS NULL OR c.dsp_id = p_dsp_id)
        AND (p_status IS NULL OR c.contact_status = p_status)
        AND (
            search_query IS NULL 
            OR search_query = ''
            OR to_tsvector('english', 
                coalesce(c.first_name, '') || ' ' || 
                coalesce(c.last_name, '') || ' ' || 
                coalesce(c.email, '') || ' ' ||
                coalesce(c.phone, '') || ' ' ||
                coalesce(c.notes, '') || ' ' ||
                coalesce(d.dsp_code, '') || ' ' ||
                coalesce(d.dsp_name, '') || ' ' ||
                coalesce(cl.locations, '')
            ) @@ plainto_tsquery('english', search_query)
        );
    
    RETURN total_count;
END;
$function$;


-- ======================================================================

-- Function 119/242
CREATE OR REPLACE FUNCTION public.create_campaign_link(p_funnel_id uuid, p_campaign_name text, p_campaign_code text DEFAULT NULL::text, p_notes text DEFAULT NULL::text)
 RETURNS TABLE(link_id uuid, link_campaign_code text, link_landing_url text, link_direct_url text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_campaign_code VARCHAR(50);
  v_referral_code TEXT;
  v_referral_source VARCHAR(50);
  v_base_domain TEXT;
  v_landing_url TEXT;
  v_direct_url TEXT;
  v_link_id UUID;
BEGIN
  -- Get funnel details (REMOVED status check - allow all statuses)
  SELECT referral_code, referral_source
  INTO v_referral_code, v_referral_source
  FROM portal_referrals
  WHERE id = p_funnel_id
    AND referral_type = 'marketing';

  IF v_referral_code IS NULL THEN
    RAISE EXCEPTION 'Funnel not found.';
  END IF;

  -- Generate campaign code if not provided
  IF p_campaign_code IS NULL OR p_campaign_code = '' THEN
    v_campaign_code := LOWER(REGEXP_REPLACE(p_campaign_name, '[^a-zA-Z0-9]+', '-', 'g'));
    v_campaign_code := TRIM(BOTH '-' FROM v_campaign_code);
  ELSE
    v_campaign_code := LOWER(REGEXP_REPLACE(p_campaign_code, '[^a-zA-Z0-9-]+', '-', 'g'));
    v_campaign_code := TRIM(BOTH '-' FROM v_campaign_code);
  END IF;

  -- Ensure campaign code is unique for this funnel
  WHILE EXISTS (
    SELECT 1 FROM marketing_campaign_links
    WHERE funnel_id = p_funnel_id
      AND campaign_code = v_campaign_code
  ) LOOP
    v_campaign_code := v_campaign_code || '-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 3);
  END LOOP;

  -- Base domain for production
  v_base_domain := 'fleetdrms.com';

  -- Generate URLs with https:// protocol
  -- Landing URL: Goes to the source landing page (e.g., https://foundry.fleetdrms.com?campaign=xxx)
  v_landing_url := 'https://' || v_referral_source || '.' || v_base_domain || '?campaign=' || v_campaign_code;

  -- Direct URL: Skips landing page, goes straight to auth
  v_direct_url := 'https://portal.' || v_base_domain || '/auth?ref=' || v_referral_code || '&campaign=' || v_campaign_code;

  -- Insert the campaign link
  INSERT INTO marketing_campaign_links (
    funnel_id,
    campaign_name,
    campaign_code,
    landing_url,
    direct_url,
    notes
  ) VALUES (
    p_funnel_id,
    p_campaign_name,
    v_campaign_code,
    v_landing_url,
    v_direct_url,
    p_notes
  ) RETURNING id INTO v_link_id;

  -- Return the created link info
  RETURN QUERY
  SELECT
    v_link_id,
    v_campaign_code,
    v_landing_url,
    v_direct_url;
END;
$function$;


-- ======================================================================

-- Function 120/242
CREATE OR REPLACE FUNCTION public.create_campaign_link(p_funnel_id uuid, p_campaign_name text, p_campaign_code character varying DEFAULT NULL::character varying, p_notes text DEFAULT NULL::text)
 RETURNS TABLE(link_id uuid, link_campaign_code character varying, link_landing_url text, link_direct_url text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_campaign_code VARCHAR(50);
  v_referral_code TEXT;
  v_referral_source VARCHAR(50);
  v_base_domain TEXT;
  v_landing_url TEXT;
  v_direct_url TEXT;
  v_link_id UUID;
BEGIN
  -- Get funnel details
  SELECT referral_code, referral_source
  INTO v_referral_code, v_referral_source
  FROM portal_referrals
  WHERE id = p_funnel_id
    AND referral_type = 'marketing'
    AND status = 'sent'; -- Only allow on published funnels

  IF v_referral_code IS NULL THEN
    RAISE EXCEPTION 'Funnel not found or not published. Only published funnels can generate campaign links.';
  END IF;

  -- Generate campaign code if not provided
  -- Format: lowercase, replace spaces/special chars with hyphens
  IF p_campaign_code IS NULL OR p_campaign_code = '' THEN
    v_campaign_code := LOWER(REGEXP_REPLACE(p_campaign_name, '[^a-zA-Z0-9]+', '-', 'g'));
    v_campaign_code := TRIM(BOTH '-' FROM v_campaign_code);
  ELSE
    v_campaign_code := LOWER(REGEXP_REPLACE(p_campaign_code, '[^a-zA-Z0-9-]+', '-', 'g'));
    v_campaign_code := TRIM(BOTH '-' FROM v_campaign_code);
  END IF;

  -- Ensure campaign code is unique for this funnel
  WHILE EXISTS (
    SELECT 1 FROM marketing_campaign_links
    WHERE funnel_id = p_funnel_id
      AND campaign_code = v_campaign_code
  ) LOOP
    -- Append a number to make it unique
    v_campaign_code := v_campaign_code || '-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 3);
  END LOOP;

  -- Determine base domain (production vs localhost)
  -- This will be overridden by frontend in practice, but provides a default
  v_base_domain := 'fleetdrms.com';

  -- Generate URLs
  -- Landing URL: Goes to the source landing page (e.g., foundry.fleetdrms.com)
  v_landing_url := v_referral_source || '.' || v_base_domain || '?campaign=' || v_campaign_code;

  -- Direct URL: Skips landing page, goes straight to auth
  v_direct_url := 'portal.' || v_base_domain || '/auth?ref=' || v_referral_code || '&campaign=' || v_campaign_code;

  -- Insert the campaign link
  INSERT INTO marketing_campaign_links (
    funnel_id,
    campaign_name,
    campaign_code,
    landing_url,
    direct_url,
    notes
  ) VALUES (
    p_funnel_id,
    p_campaign_name,
    v_campaign_code,
    v_landing_url,
    v_direct_url,
    p_notes
  ) RETURNING id INTO v_link_id;

  -- Return the created link info - use different column names to avoid ambiguity
  RETURN QUERY
  SELECT
    v_link_id,
    v_campaign_code,
    v_landing_url,
    v_direct_url;
END;
$function$;


-- ======================================================================

-- Function 121/242
CREATE OR REPLACE FUNCTION public.create_maintenance_record_with_vehicle_update(record_data jsonb, vehicle_id uuid, severity integer DEFAULT 1)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_record_id uuid;
  current_status text;
  record_state maintenance_state;
  v_organization_id uuid;
BEGIN
  -- Log for debugging
  RAISE NOTICE 'Creating maintenance record with data: %, vehicle_id: %, severity: %', 
               record_data, vehicle_id, severity;
  
  -- Set default state if not provided
  record_state := COALESCE(
    (record_data->>'state')::maintenance_state, 
    'in-maintenance'::maintenance_state
  );
  
  -- If organization_id is not provided, get it from the vehicle
  IF (record_data->>'organization_id') IS NULL THEN
    SELECT organization_id INTO v_organization_id
    FROM fleet
    WHERE id = vehicle_id;
    
    IF v_organization_id IS NULL THEN
      RAISE EXCEPTION 'Cannot find organization_id for vehicle %', vehicle_id;
    END IF;
  ELSE
    v_organization_id := (record_data->>'organization_id')::uuid;
  END IF;

  -- Create the maintenance record
  INSERT INTO maintenance_records (
    vehicle_id,
    organization_id,
    issue,
    location,
    severity,
    afs_eligible,
    support_ticket,
    maintenance_notes,
    date_due,
    created_by,
    state  -- Use state instead of is_active
  ) VALUES (
    vehicle_id,
    v_organization_id,
    record_data->>'issue',
    (record_data->>'location')::maintenance_location,
    COALESCE((record_data->>'severity')::integer, severity),
    record_data->>'afs_eligible',
    CASE 
      WHEN record_data->>'support_ticket' = '' THEN NULL 
      ELSE (record_data->>'support_ticket')::integer 
    END,
    record_data->>'maintenance_notes',
    CASE 
      WHEN record_data->>'date_due' = '' THEN NULL 
      ELSE (record_data->>'date_due')::date 
    END,
    COALESCE((record_data->>'created_by')::uuid, auth.uid()),
    record_state  -- Use the new state field
  )
  RETURNING id INTO new_record_id;
  
  -- Get current vehicle status for logging purposes
  SELECT status_maintenance::text INTO current_status
  FROM fleet
  WHERE id = vehicle_id;
  
  -- Call the update vehicle status function with status_maintenance if provided
  IF record_data->>'status_maintenance' IS NOT NULL THEN
    PERFORM update_vehicle_maintenance_status(vehicle_id, record_data->>'status_maintenance');
  ELSE
    PERFORM update_vehicle_maintenance_status(vehicle_id);
  END IF;
  
  RETURN new_record_id;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Error creating maintenance record: %', SQLERRM;
    RAISE;
END;
$function$;


-- ======================================================================

-- Function 122/242
CREATE OR REPLACE FUNCTION public.create_maintenance_record_with_vehicle_update(record_data jsonb, vehicle_id uuid, severity integer DEFAULT 1, operational_state text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_record_id uuid;
  v_maintenance_record_status maintenance_record_status;
  v_organization_id uuid;
  v_operational_state text;
BEGIN
  -- Store the input parameter in a variable to avoid ambiguity
  v_operational_state := operational_state;
  
  -- Set default status if not provided
  v_maintenance_record_status := COALESCE(
    (record_data->>'maintenance_record_status')::maintenance_record_status, 
    'New Request'::maintenance_record_status
  );
  
  -- If organization_id is not provided, get it from the vehicle
  IF (record_data->>'organization_id') IS NULL THEN
    SELECT organization_id INTO v_organization_id
    FROM fleet
    WHERE id = vehicle_id;
    
    IF v_organization_id IS NULL THEN
      RAISE EXCEPTION 'Cannot find organization_id for vehicle %', vehicle_id;
    END IF;
  ELSE
    v_organization_id := (record_data->>'organization_id')::uuid;
  END IF;

  -- Create the maintenance record
  INSERT INTO maintenance_records (
    vehicle_id,
    organization_id,
    issue_title,
    issue,
    location,
    severity,
    afs_eligible,
    support_ticket,
    maintenance_notes,
    date_due,
    created_by,
    maintenance_record_status,
    assignee
  ) VALUES (
    vehicle_id,
    v_organization_id,
    record_data->>'issue_title',
    record_data->>'issue',
    (record_data->>'location')::maintenance_location,
    COALESCE((record_data->>'severity')::integer, severity),
    record_data->>'afs_eligible',
    CASE 
      WHEN record_data->>'support_ticket' = '' THEN NULL 
      ELSE (record_data->>'support_ticket')::integer 
    END,
    record_data->>'maintenance_notes',
    CASE 
      WHEN record_data->>'date_due' = '' THEN NULL 
      ELSE (record_data->>'date_due')::date 
    END,
    COALESCE((record_data->>'created_by')::uuid, auth.uid()),
    v_maintenance_record_status,
    (record_data->>'assignee')::uuid
  )
  RETURNING id INTO new_record_id;
  
  -- Call the update vehicle operational state function
  IF v_operational_state IS NOT NULL THEN
    PERFORM update_vehicle_operational_state(vehicle_id, v_operational_state);
  ELSE
    -- Set operational state based on new maintenance record
    PERFORM update_vehicle_operational_state(vehicle_id, 'Grounded');
  END IF;
  
  -- Insert the initial status history record
  INSERT INTO maintenance_status_history (
    maintenance_record_id,
    previous_status,
    new_status,
    changed_by
  ) VALUES (
    new_record_id,
    NULL,
    v_maintenance_record_status,
    COALESCE((record_data->>'created_by')::uuid, auth.uid())
  );
  
  RETURN new_record_id;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Error creating maintenance record: %', SQLERRM;
    RAISE;
END;
$function$;


-- ======================================================================

-- Function 123/242
CREATE OR REPLACE FUNCTION public.create_marketing_funnel(p_source character varying, p_source_name text, p_metadata jsonb DEFAULT NULL::jsonb, p_max_uses integer DEFAULT NULL::integer, p_expires_at timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS TABLE(funnel_id uuid, funnel_code text, funnel_source character varying)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_system_user_id UUID;
  v_referral_code TEXT;
  v_referral_id UUID;
BEGIN
  -- Get system user ID
  SELECT profiles.id INTO v_system_user_id
  FROM profiles
  WHERE email = 'portal@fleetdrms.com'
  LIMIT 1;

  IF v_system_user_id IS NULL THEN
    RAISE EXCEPTION 'System user (portal@fleetdrms.com) not found';
  END IF;

  -- Generate unique referral code
  -- Format: First 6 chars of source (uppercase) + 4 random chars
  v_referral_code := UPPER(
    SUBSTRING(REGEXP_REPLACE(p_source, '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 6) ||
    SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4)
  );

  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM portal_referrals WHERE referral_code = v_referral_code) LOOP
    v_referral_code := UPPER(
      SUBSTRING(REGEXP_REPLACE(p_source, '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 6) ||
      SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4)
    );
  END LOOP;

  -- Create the marketing funnel referral
  INSERT INTO portal_referrals (
    referrer_id,
    referral_code,
    referral_type,
    referral_source,
    is_reusable,
    usage_count,
    max_uses,
    source_metadata,
    expires_at,
    status,
    created_at,
    referee_email,
    referee_first_name,
    referee_last_name
  ) VALUES (
    v_system_user_id,
    v_referral_code,
    'marketing',
    p_source,
    true,
    0,
    p_max_uses,
    COALESCE(p_metadata, '{}'::jsonb) || jsonb_build_object('source_name', p_source_name),
    p_expires_at,
    'pending',
    NOW(),
    '',
    '',
    ''
  ) RETURNING id INTO v_referral_id;

  -- Return the created referral info
  -- Using only variable names without aliases to avoid ambiguity
  RETURN QUERY
  SELECT
    v_referral_id,
    v_referral_code,
    p_source;
END;
$function$;


-- ======================================================================

-- Function 124/242
CREATE OR REPLACE FUNCTION public.decrypt_credentials(p_encrypted bytea, p_key text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN pgp_sym_decrypt(p_encrypted, p_key)::JSONB;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$function$;


-- ======================================================================

-- Function 125/242
CREATE OR REPLACE FUNCTION public.delete_campaign_link(p_link_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  DELETE FROM marketing_campaign_links
  WHERE id = p_link_id;

  RETURN FOUND;
END;
$function$;


-- ======================================================================

-- Function 126/242
CREATE OR REPLACE FUNCTION public.delete_maintenance_document_file()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog', 'storage'
AS $function$
BEGIN
  PERFORM storage.delete_object('maintenance_documents', OLD.file_path);
  RETURN OLD;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Failed to delete file from storage: %', SQLERRM;
    RETURN OLD;
END;
$function$;


-- ======================================================================

-- Function 127/242
CREATE OR REPLACE FUNCTION public.delete_survey_complete(p_survey_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Delete all survey answers first (foreign key constraint)
  DELETE FROM portal_survey_answers 
  WHERE response_id IN (
    SELECT id FROM portal_survey_responses 
    WHERE survey_id = p_survey_id
  );
  
  -- Delete all survey responses
  DELETE FROM portal_survey_responses 
  WHERE survey_id = p_survey_id;
  
  -- Delete all survey questions
  DELETE FROM portal_survey_questions 
  WHERE survey_id = p_survey_id;
  
  -- Finally delete the survey itself
  DELETE FROM portal_surveys 
  WHERE id = p_survey_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to delete survey: %', SQLERRM;
    RETURN FALSE;
END;
$function$;


-- ======================================================================

-- Function 128/242
CREATE OR REPLACE FUNCTION public.delete_survey_force(p_survey_id uuid, p_confirm_title text, p_admin_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  actual_title TEXT;
  deleted_responses INTEGER;
  deleted_questions INTEGER;
  deleted_answers INTEGER;
  result JSON;
BEGIN
  -- Get actual survey title
  SELECT title INTO actual_title 
  FROM portal_surveys 
  WHERE id = p_survey_id;
  
  -- Check if survey exists
  IF actual_title IS NULL THEN
    RAISE EXCEPTION 'Survey not found';
  END IF;
  
  -- Verify title matches exactly (case-sensitive)
  IF actual_title != p_confirm_title THEN
    RAISE EXCEPTION 'Title confirmation does not match. Expected: %, Got: %', actual_title, p_confirm_title;
  END IF;
  
  -- Count what we're deleting for audit trail
  SELECT COUNT(*) INTO deleted_responses 
  FROM portal_survey_responses 
  WHERE survey_id = p_survey_id;
  
  SELECT COUNT(*) INTO deleted_questions 
  FROM portal_survey_questions 
  WHERE survey_id = p_survey_id;
  
  SELECT COUNT(*) INTO deleted_answers
  FROM portal_survey_answers 
  WHERE response_id IN (
    SELECT id FROM portal_survey_responses 
    WHERE survey_id = p_survey_id
  );
  
  -- Delete in correct order (foreign key constraints)
  DELETE FROM portal_survey_answers 
  WHERE response_id IN (
    SELECT id FROM portal_survey_responses 
    WHERE survey_id = p_survey_id
  );
  
  DELETE FROM portal_survey_responses 
  WHERE survey_id = p_survey_id;
  
  DELETE FROM portal_survey_questions 
  WHERE survey_id = p_survey_id;
  
  DELETE FROM portal_surveys 
  WHERE id = p_survey_id;
  
  -- Create audit log entry
  INSERT INTO portal_audit_log (
    action, 
    entity_type, 
    entity_id, 
    admin_id, 
    details
  ) VALUES (
    'force_delete_survey',
    'survey',
    p_survey_id,
    p_admin_id,
    json_build_object(
      'title', actual_title,
      'responses_deleted', deleted_responses,
      'questions_deleted', deleted_questions,
      'answers_deleted', deleted_answers,
      'deleted_at', NOW()
    )
  );
  
  result := json_build_object(
    'success', true,
    'title', actual_title,
    'deleted_responses', deleted_responses,
    'deleted_questions', deleted_questions,
    'deleted_answers', deleted_answers
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$function$;


-- ======================================================================

-- Function 129/242
CREATE OR REPLACE FUNCTION public.delete_update_force(p_update_id uuid, p_confirm_title text, p_admin_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  actual_title TEXT;
  update_status TEXT;
  update_type TEXT;
  acknowledgment_count INTEGER := 0;
BEGIN
  -- Get actual update title and details
  SELECT title, status, COALESCE(type, 'general') INTO actual_title, update_status, update_type
  FROM portal_updates 
  WHERE id = p_update_id;
  
  -- Check if update exists
  IF actual_title IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Update not found'
    );
  END IF;
  
  -- Verify title matches exactly (case-sensitive)
  IF actual_title != p_confirm_title THEN
    RETURN json_build_object(
      'success', false,
      'error', format('Title confirmation does not match. Expected: %s, Got: %s', actual_title, p_confirm_title)
    );
  END IF;
  
  -- Check for acknowledgments if compulsory update
  IF update_type = 'compulsory' THEN
    -- Check if acknowledgments table exists
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'compulsory_updates_acknowledgments'
    ) THEN
      EXECUTE 'SELECT COUNT(*) FROM compulsory_updates_acknowledgments WHERE update_id = $1'
      INTO acknowledgment_count
      USING p_update_id;
    END IF;
  END IF;
  
  -- Delete any acknowledgments first (if table exists)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'compulsory_updates_acknowledgments'
  ) THEN
    EXECUTE 'DELETE FROM compulsory_updates_acknowledgments WHERE update_id = $1'
    USING p_update_id;
  END IF;
  
  -- Delete the update
  DELETE FROM portal_updates WHERE id = p_update_id;
  
  -- Create audit log entry
  INSERT INTO portal_audit_log (
    action, 
    entity_type, 
    entity_id, 
    admin_id, 
    details
  ) VALUES (
    'force_delete_update',
    'update',
    p_update_id,
    p_admin_id,
    json_build_object(
      'title', actual_title,
      'status', update_status,
      'type', update_type,
      'acknowledgments_deleted', acknowledgment_count,
      'deleted_at', NOW()
    )
  );
  
  RETURN json_build_object(
    'success', true,
    'title', actual_title,
    'acknowledgments_deleted', acknowledgment_count
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$function$;


-- ======================================================================

-- Function 130/242
CREATE OR REPLACE FUNCTION public.dev_set_temp_password(user_email text, new_password text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN admin_reset_password(user_email, new_password);
END;
$function$;


-- ======================================================================

-- Function 131/242
CREATE OR REPLACE FUNCTION public.dismiss_update(p_update_id uuid, p_user_id uuid)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
    -- Insert or update the read record with dismissed status
    INSERT INTO public.portal_update_reads (
        update_id, 
        user_id, 
        first_viewed_at,
        last_viewed_at,
        dismissed_at
    )
    VALUES (
        p_update_id, 
        p_user_id, 
        NOW(),
        NOW(),
        NOW()
    )
    ON CONFLICT (update_id, user_id) 
    DO UPDATE SET
        dismissed_at = NOW(),
        last_viewed_at = NOW();
        
    -- Update dismissal count on the update
    UPDATE public.portal_updates 
    SET dismissal_count = COALESCE(dismissal_count, 0) + 1
    WHERE id = p_update_id;
$function$;


-- ======================================================================

-- Function 132/242
CREATE OR REPLACE FUNCTION public.encrypt_credentials(p_credentials jsonb, p_key text)
 RETURNS bytea
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN pgp_sym_encrypt(
    p_credentials::TEXT,
    p_key,
    'compress-algo=2, cipher-algo=aes256'
  );
END;
$function$;


-- ======================================================================

-- Function 133/242
CREATE OR REPLACE FUNCTION public.ensure_admin_roles(user_email text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_user_id uuid;
    v_existing_roles text[];
    v_added_roles text[] := ARRAY[]::text[];
BEGIN
    -- Get user ID
    SELECT id INTO v_user_id
    FROM profiles
    WHERE lower(email) = lower(user_email);
    
    IF v_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User not found'
        );
    END IF;
    
    -- Get existing roles as text array
    SELECT array_agg(role::text) INTO v_existing_roles
    FROM user_roles
    WHERE user_id = v_user_id;
    
    -- Add admin role if not present
    IF v_existing_roles IS NULL OR NOT ('admin' = ANY(v_existing_roles)) THEN
        INSERT INTO user_roles (user_id, role, created_at)
        VALUES (v_user_id, 'admin'::app_role, NOW())
        ON CONFLICT (user_id, role) DO NOTHING;
        v_added_roles := array_append(v_added_roles, 'admin');
    END IF;
    
    -- Add super_admin role if email suggests it or if requested
    IF (user_email LIKE '%admin%' OR user_email LIKE '%super%') 
        AND (v_existing_roles IS NULL OR NOT ('super_admin' = ANY(v_existing_roles))) THEN
        INSERT INTO user_roles (user_id, role, created_at)
        VALUES (v_user_id, 'super_admin'::app_role, NOW())
        ON CONFLICT (user_id, role) DO NOTHING;
        v_added_roles := array_append(v_added_roles, 'super_admin');
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'user_id', v_user_id,
        'email', user_email,
        'existing_roles', CASE 
            WHEN v_existing_roles IS NULL THEN ARRAY[]::text[]
            ELSE v_existing_roles
        END,
        'added_roles', v_added_roles,
        'message', CASE 
            WHEN array_length(v_added_roles, 1) > 0 THEN 
                'Roles added: ' || array_to_string(v_added_roles, ', ')
            ELSE 
                'User already has admin roles'
        END
    );
END;
$function$;


-- ======================================================================

-- Function 134/242
CREATE OR REPLACE FUNCTION public.ensure_primary_business()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- If this is the first business for a user, make it primary
  IF NOT EXISTS (
    SELECT 1 FROM public.businesses 
    WHERE user_id = NEW.user_id 
    AND id != COALESCE(NEW.id, gen_random_uuid())
  ) THEN
    NEW.is_primary := TRUE;
  END IF;
  
  -- If setting this as primary, unset others
  IF NEW.is_primary = TRUE THEN
    UPDATE public.businesses 
    SET is_primary = FALSE 
    WHERE user_id = NEW.user_id 
    AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$function$;


-- ======================================================================

-- Function 135/242
CREATE OR REPLACE FUNCTION public.export_event_registrations(event_uuid uuid)
 RETURNS TABLE(registration_id uuid, user_email text, user_name text, company_name text, registration_date timestamp with time zone, attendance_status character varying, payment_status character varying, check_in_time timestamp with time zone, notes text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Check if user is admin
  IF NOT is_portal_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  RETURN QUERY
  SELECT 
    r.id as registration_id,
    p.email as user_email,
    p.full_name as user_name,
    p.company_name,
    r.registration_date,
    r.attendance_status,
    r.payment_status,
    r.check_in_time,
    r.notes
  FROM public.portal_event_registrations r
  JOIN public.profiles p ON p.id = r.user_id
  WHERE r.event_id = event_uuid
  ORDER BY r.registration_date;
END;
$function$;


-- ======================================================================

-- Function 136/242
CREATE OR REPLACE FUNCTION public.export_survey_responses(survey_uuid uuid)
 RETURNS TABLE(response_id uuid, user_email text, user_name text, started_at timestamp with time zone, completed_at timestamp with time zone, is_complete boolean, question_text text, answer_text text, answer_options jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Check if user is admin
  IF NOT is_portal_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  RETURN QUERY
  SELECT 
    r.id as response_id,
    p.email as user_email,
    p.full_name as user_name,
    r.started_at,
    r.completed_at,
    r.is_complete,
    q.question_text,
    a.answer_text,
    a.answer_options
  FROM public.portal_survey_responses r
  LEFT JOIN public.profiles p ON p.id = r.user_id
  JOIN public.portal_survey_answers a ON a.response_id = r.id
  JOIN public.portal_survey_questions q ON q.id = a.question_id
  WHERE r.survey_id = survey_uuid
  ORDER BY r.started_at, q.display_order;
END;
$function$;


-- ======================================================================

-- Function 137/242
CREATE OR REPLACE FUNCTION public.generate_event_slug()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    -- Use start_datetime if available, otherwise use NOW()
    NEW.slug := generate_slug(NEW.title) || '-' || TO_CHAR(COALESCE(NEW.start_datetime, NOW()), 'YYYY-MM-DD');
  END IF;
  RETURN NEW;
END;
$function$;


-- ======================================================================

-- Function 138/242
CREATE OR REPLACE FUNCTION public.generate_slug(title text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(title, '[^a-zA-Z0-9\s-]', '', 'g'),
      '\s+', '-', 'g'
    )
  );
END;
$function$;


-- ======================================================================

-- Function 139/242
CREATE OR REPLACE FUNCTION public.get_active_impersonations()
 RETURNS TABLE(id uuid, admin_id uuid, impersonated_user_id uuid, started_at timestamp with time zone, admin_email text, impersonated_email text)
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
    -- Only admins can see impersonations
    IF NOT EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'super_admin', 'developer')
    ) THEN
        RETURN; -- Return empty set for non-admins
    END IF;

    RETURN QUERY
    SELECT 
        i.id,
        i.admin_id,
        i.impersonated_user_id,
        i.started_at,
        a.email AS admin_email,
        p.email AS impersonated_email
    FROM impersonation_sessions i
    JOIN profiles a ON a.id = i.admin_id
    JOIN profiles p ON p.id = i.impersonated_user_id
    WHERE i.ended_at IS NULL;
END;
$function$;


-- ======================================================================

-- Function 140/242
CREATE OR REPLACE FUNCTION public.get_all_permissions()
 RETURNS TABLE(id uuid, name text, resource text, action text, description text, scope text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.resource,
    p.action,
    p.description,
    p.scope
  FROM permissions p
  ORDER BY p.resource, p.action;
END;
$function$;


-- ======================================================================

-- Function 141/242
CREATE OR REPLACE FUNCTION public.get_contact_analytics()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'summary', (
            SELECT jsonb_build_object(
                'total_contacts', COUNT(DISTINCT c.id),
                'total_markets', COUNT(DISTINCT m.id),
                'total_stations', COUNT(DISTINCT s.id),
                'total_dsps', COUNT(DISTINCT d.id),
                'total_interactions', COUNT(DISTINCT i.id)
            )
            FROM public.contacts c
            LEFT JOIN public.markets m ON m.is_active = true
            LEFT JOIN public.stations s ON s.is_active = true
            LEFT JOIN public.dsps d ON d.is_active = true
            LEFT JOIN public.interactions i ON true
            WHERE c.is_active = true
        ),
        'contacts_by_status', (
            SELECT jsonb_object_agg(
                COALESCE(contact_status, 'unknown'), 
                count
            )
            FROM (
                SELECT contact_status, COUNT(*) as count
                FROM public.contacts
                WHERE is_active = true
                GROUP BY contact_status
            ) t
        ),
        'contacts_by_title', (
            SELECT jsonb_object_agg(
                COALESCE(title::text, 'none'), 
                count
            )
            FROM (
                SELECT title, COUNT(*) as count
                FROM public.contacts
                WHERE is_active = true
                GROUP BY title
            ) t
        ),
        'interactions_by_type', (
            SELECT jsonb_object_agg(
                interaction_type::text, 
                count
            )
            FROM (
                SELECT interaction_type, COUNT(*) as count
                FROM public.interactions
                GROUP BY interaction_type
            ) t
        ),
        'recent_activity', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'date', date,
                    'new_contacts', new_contacts,
                    'interactions', interactions
                )
                ORDER BY date DESC
            )
            FROM (
                SELECT 
                    d.date,
                    COALESCE(c.count, 0) as new_contacts,
                    COALESCE(i.count, 0) as interactions
                FROM (
                    SELECT generate_series(
                        CURRENT_DATE - INTERVAL '29 days',
                        CURRENT_DATE,
                        '1 day'::interval
                    )::date as date
                ) d
                LEFT JOIN (
                    SELECT DATE(created_at) as date, COUNT(*) as count
                    FROM public.contacts
                    WHERE is_active = true
                    GROUP BY DATE(created_at)
                ) c ON d.date = c.date
                LEFT JOIN (
                    SELECT DATE(interaction_date) as date, COUNT(*) as count
                    FROM public.interactions
                    GROUP BY DATE(interaction_date)
                ) i ON d.date = i.date
                ORDER BY d.date DESC
                LIMIT 30
            ) t
        ),
        'conversion_funnel', (
            WITH status_counts AS (
                SELECT 
                    COUNT(*) FILTER (WHERE contact_status = 'new') as new_count,
                    COUNT(*) FILTER (WHERE contact_status = 'contacted') as contacted_count,
                    COUNT(*) FILTER (WHERE contact_status = 'qualified') as qualified_count,
                    COUNT(*) FILTER (WHERE contact_status = 'active') as active_count
                FROM public.contacts
                WHERE is_active = true
            )
            SELECT jsonb_build_object(
                'new', new_count,
                'contacted', contacted_count,
                'qualified', qualified_count,
                'active', active_count,
                'new_to_contacted', 
                    CASE WHEN new_count > 0 
                    THEN ROUND((contacted_count::numeric / new_count::numeric) * 100, 2) 
                    ELSE 0 END,
                'contacted_to_qualified', 
                    CASE WHEN contacted_count > 0 
                    THEN ROUND((qualified_count::numeric / contacted_count::numeric) * 100, 2) 
                    ELSE 0 END,
                'qualified_to_active', 
                    CASE WHEN qualified_count > 0 
                    THEN ROUND((active_count::numeric / qualified_count::numeric) * 100, 2) 
                    ELSE 0 END
            )
            FROM status_counts
        )
    ) INTO v_result;
    
    RETURN v_result;
END;
$function$;


-- ======================================================================

-- Function 142/242
CREATE OR REPLACE FUNCTION public.get_contact_full_name(p_first_name text, p_last_name text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
BEGIN
    IF p_first_name IS NOT NULL AND p_last_name IS NOT NULL THEN
        RETURN p_first_name || ' ' || p_last_name;
    ELSIF p_first_name IS NOT NULL THEN
        RETURN p_first_name;
    ELSIF p_last_name IS NOT NULL THEN
        RETURN p_last_name;
    ELSE
        RETURN 'Unknown Contact';
    END IF;
END;
$function$;


-- ======================================================================

-- Function 143/242
CREATE OR REPLACE FUNCTION public.get_contact_identifier(p_first_name text, p_last_name text, p_email text, p_phone text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
BEGIN
    IF p_email IS NOT NULL THEN
        RETURN COALESCE(get_contact_full_name(p_first_name, p_last_name) || ' - ', '') || p_email;
    ELSIF p_phone IS NOT NULL THEN
        RETURN COALESCE(get_contact_full_name(p_first_name, p_last_name) || ' - ', '') || p_phone;
    ELSE
        RETURN get_contact_full_name(p_first_name, p_last_name);
    END IF;
END;
$function$;


-- ======================================================================

-- Function 144/242
CREATE OR REPLACE FUNCTION public.get_contact_submission_stats()
 RETURNS TABLE(total_submissions bigint, new_submissions bigint, in_progress_submissions bigint, resolved_submissions bigint, submissions_today bigint, submissions_this_week bigint, submissions_this_month bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) AS total_submissions,
    COUNT(*) FILTER (WHERE status = 'new') AS new_submissions,
    COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress_submissions,
    COUNT(*) FILTER (WHERE status = 'resolved') AS resolved_submissions,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) AS submissions_today,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') AS submissions_this_week,
    COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)) AS submissions_this_month
  FROM public.contact_submissions;
END;
$function$;


-- ======================================================================

-- Function 145/242
CREATE OR REPLACE FUNCTION public.get_dsp_contacts(p_dsp_id uuid, p_location_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(contact_id uuid, first_name character varying, last_name character varying, email character varying, phone character varying, title contact_title_enum, location_ids uuid[], location_names text[])
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as contact_id,
    c.first_name,
    c.last_name,
    c.email,
    c.phone,
    c.title,
    ARRAY_AGG(DISTINCT dl.id) as location_ids,
    ARRAY_AGG(DISTINCT m.name || ' - ' || s.station_code ORDER BY m.name || ' - ' || s.station_code) as location_names
  FROM contacts c
  INNER JOIN contact_dsp_locations cdl ON cdl.contact_id = c.id
  INNER JOIN dsp_locations dl ON dl.id = cdl.dsp_location_id
  INNER JOIN stations s ON s.id = dl.station_id
  LEFT JOIN markets m ON m.id = s.market_id
  WHERE dl.dsp_id = p_dsp_id
    AND dl.is_active = true
    AND c.is_active = true
    AND (p_location_id IS NULL OR dl.id = p_location_id)
  GROUP BY c.id, c.first_name, c.last_name, c.email, c.phone, c.title
  ORDER BY c.last_name, c.first_name;
END;
$function$;


-- ======================================================================

-- Function 146/242
CREATE OR REPLACE FUNCTION public.get_dsp_locations(p_dsp_id uuid)
 RETURNS TABLE(location_id uuid, station_id uuid, station_code character varying, market_id uuid, market_name character varying, is_primary boolean, is_active boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    dl.id as location_id,
    s.id as station_id,
    s.station_code,
    m.id as market_id,
    m.name as market_name,
    dl.is_primary,
    dl.is_active
  FROM dsp_locations dl
  INNER JOIN stations s ON s.id = dl.station_id
  LEFT JOIN markets m ON m.id = s.market_id
  WHERE dl.dsp_id = p_dsp_id
    AND dl.is_active = true
  ORDER BY dl.is_primary DESC, m.name, s.station_code;
END;
$function$;


-- ======================================================================

-- Function 147/242
CREATE OR REPLACE FUNCTION public.get_event_with_registration(event_uuid uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  event_data JSON;
BEGIN
  SELECT json_build_object(
    'event', row_to_json(e),
    'registration_count', (
      SELECT COUNT(*) 
      FROM public.portal_event_registrations 
      WHERE event_id = event_uuid
      AND attendance_status IN ('registered', 'attended')
    ),
    'spots_remaining', CASE
      WHEN e.registration_limit IS NULL THEN NULL
      ELSE GREATEST(0, e.registration_limit - (
        SELECT COUNT(*) 
        FROM public.portal_event_registrations 
        WHERE event_id = event_uuid
        AND attendance_status IN ('registered', 'attended')
      ))
    END,
    'user_registration', (
      SELECT row_to_json(r)
      FROM public.portal_event_registrations r
      WHERE r.event_id = event_uuid
      AND r.user_id = auth.uid()
      LIMIT 1
    )
  )
  FROM public.portal_events e
  WHERE e.id = event_uuid
  INTO event_data;

  RETURN event_data;
END;
$function$;


-- ======================================================================

-- Function 148/242
CREATE OR REPLACE FUNCTION public.get_filtered_maintenance_records(p_organization_id uuid, p_include_all_orgs boolean DEFAULT false)
 RETURNS SETOF maintenance_records
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  -- For admin requesting all orgs
  IF p_include_all_orgs AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin', 'developer')
  ) THEN
    RETURN QUERY
    SELECT * FROM maintenance_records;
    RETURN;
  END IF;
  
  -- If specific organization requested, verify access first
  IF p_organization_id IS NOT NULL THEN
    -- Check admin status directly
    IF EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'developer')
    ) THEN
      -- Admin can access any organization
      RETURN QUERY
      SELECT * FROM maintenance_records
      WHERE organization_id = p_organization_id;
      RETURN;
    END IF;
    
    -- For owner role, check if organization matches
    IF EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'owner'
    ) THEN
      -- Get user's organization - direct query to avoid RLS
      DECLARE
        v_user_org_id uuid;
      BEGIN
        SELECT organization_id INTO v_user_org_id
        FROM profiles
        WHERE id = auth.uid();
        
        -- Only allow if organization matches
        IF v_user_org_id = p_organization_id THEN
          RETURN QUERY
          SELECT * FROM maintenance_records
          WHERE organization_id = p_organization_id;
        ELSE
          -- No access, return empty set
          RETURN;
        END IF;
        
        RETURN;
      END;
    END IF;
    
    -- For all other users, check if organization matches
    DECLARE
      v_user_org_id uuid;
    BEGIN
      SELECT organization_id INTO v_user_org_id
      FROM profiles
      WHERE id = auth.uid();
      
      IF v_user_org_id = p_organization_id THEN
        RETURN QUERY
        SELECT * FROM maintenance_records
        WHERE organization_id = p_organization_id;
      ELSE
        -- No access, return empty set
        RETURN;
      END IF;
      
      RETURN;
    END;
  END IF;
  
  -- If no specific org requested, use user's organization
  DECLARE
    v_user_org_id uuid;
    v_is_admin boolean;
  BEGIN
    -- Check admin status directly
    SELECT EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'developer')
    ) INTO v_is_admin;
    
    -- Admin with no specific organization sees all
    IF v_is_admin THEN
      RETURN QUERY
      SELECT * FROM maintenance_records;
      RETURN;
    END IF;
    
    -- Non-admin users see only their organization
    SELECT organization_id INTO v_user_org_id
    FROM profiles
    WHERE id = auth.uid();
    
    RETURN QUERY
    SELECT * FROM maintenance_records
    WHERE organization_id = v_user_org_id;
    RETURN;
  END;
END;
$function$;


-- ======================================================================

-- Function 149/242
CREATE OR REPLACE FUNCTION public.get_fleet_vehicles_with_context(p_organization_id uuid DEFAULT NULL::uuid, p_search_term text DEFAULT NULL::text, p_operational_state text DEFAULT NULL::text, p_dev_user_email text DEFAULT NULL::text)
 RETURNS SETOF fleet
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_context RECORD;
  v_is_company_user boolean;
BEGIN
  -- Get user context
  IF p_dev_user_email IS NOT NULL THEN
    SELECT * INTO v_user_context FROM get_user_context(p_dev_user_email);
    
    -- Check if user has company-level roles
    v_is_company_user := EXISTS (
      SELECT 1 FROM unnest(v_user_context.roles) AS role
      WHERE role IN ('super_admin', 'admin', 'developer', 'finance')
    );
  ELSE
    -- For regular auth, check roles directly
    v_is_company_user := EXISTS (
      SELECT 1 
      FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('super_admin', 'admin', 'developer', 'finance')
    );
  END IF;
  
  RETURN QUERY
  SELECT f.*
  FROM fleet f
  WHERE 
    -- Organization filter
    (
      p_organization_id IS NULL -- Show all if no org specified
      OR f.organization_id = p_organization_id -- Or match specific org
      OR (
        -- For non-company users, restrict to their org
        NOT v_is_company_user 
        AND f.organization_id = v_user_context.organization_id
      )
    )
    -- Access control
    AND (
      v_is_company_user -- Company users see all
      OR f.organization_id = v_user_context.organization_id -- Or user's own org
      OR can_access_organization_data(f.organization_id, p_dev_user_email)
    )
    -- Search filter
    AND (
      p_search_term IS NULL
      OR f.vehicle_name ILIKE '%' || p_search_term || '%'
      OR f.vin ILIKE '%' || p_search_term || '%'
      OR f.make ILIKE '%' || p_search_term || '%'
      OR f.model ILIKE '%' || p_search_term || '%'
    )
    -- Operational state filter - cast to text for comparison
    AND (
      p_operational_state IS NULL
      OR f.operational_state::text = p_operational_state
    )
  ORDER BY f.vehicle_name;
END;
$function$;


-- ======================================================================

-- Function 150/242
CREATE OR REPLACE FUNCTION public.get_funnel_campaign_analytics(p_funnel_id uuid)
 RETURNS TABLE(campaign_code character varying, campaign_name text, total_conversions bigint, last_30_days bigint, last_7_days bigint, conversion_rate numeric, last_conversion_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN QUERY
  WITH campaign_conversions AS (
    SELECT
      COALESCE(
        rc.conversion_metadata->>'campaign',
        'direct'
      ) as campaign,
      COUNT(*) as conversions,
      COUNT(*) FILTER (WHERE rc.converted_at >= NOW() - INTERVAL '30 days') as last_30d,
      COUNT(*) FILTER (WHERE rc.converted_at >= NOW() - INTERVAL '7 days') as last_7d,
      MAX(rc.converted_at) as last_conversion
    FROM referral_conversions rc
    WHERE rc.referral_id = p_funnel_id
    GROUP BY campaign
  )
  SELECT
    cc.campaign::VARCHAR(50) as campaign_code,
    COALESCE(mcl.campaign_name, 'Direct (no campaign)') as campaign_name,
    cc.conversions::BIGINT as total_conversions,
    cc.last_30d::BIGINT as last_30_days,
    cc.last_7d::BIGINT as last_7_days,
    ROUND(
      (cc.conversions::NUMERIC / NULLIF(SUM(cc.conversions) OVER (), 0)) * 100,
      1
    ) as conversion_rate,
    cc.last_conversion as last_conversion_at
  FROM campaign_conversions cc
  LEFT JOIN marketing_campaign_links mcl
    ON mcl.funnel_id = p_funnel_id
    AND mcl.campaign_code = cc.campaign
  ORDER BY cc.conversions DESC;
END;
$function$;


-- ======================================================================

-- Function 151/242
CREATE OR REPLACE FUNCTION public.get_latest_odometer(p_vehicle_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_odometer INTEGER;
BEGIN
  SELECT odometer INTO v_odometer
  FROM public.fleet
  WHERE id = p_vehicle_id;
  
  RETURN v_odometer;
END;
$function$;


-- ======================================================================

-- Function 152/242
CREATE OR REPLACE FUNCTION public.get_maintenance_assignees(p_organization_id uuid)
 RETURNS TABLE(id uuid, first_name text, last_name text, email text, is_current_user boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Admin users can see eligible assignees across all organizations
  IF (SELECT EXISTS(SELECT 1 FROM admin_users_view WHERE user_id = auth.uid())) THEN
    RETURN QUERY
    SELECT DISTINCT ON (p.id)
      p.id, 
      p.first_name, 
      p.last_name, 
      p.email,
      p.id = auth.uid() as is_current_user
    FROM profiles p
    JOIN user_roles ur ON p.id = ur.user_id
    WHERE ur.role IN ('owner', 'manager', 'tech')
    ORDER BY 
      p.id,
      p.id = auth.uid() DESC, -- Current user first
      p.first_name, 
      p.last_name;
    RETURN;
  END IF;
  
  -- Organization users can see only users from their organization with eligible roles
  RETURN QUERY
  SELECT DISTINCT ON (p.id)
    p.id, 
    p.first_name, 
    p.last_name, 
    p.email,
    p.id = auth.uid() as is_current_user
  FROM profiles p
  JOIN user_roles ur ON p.id = ur.user_id
  WHERE p.organization_id = p_organization_id
  AND ur.role IN ('owner', 'manager', 'tech')
  ORDER BY 
    p.id,
    p.id = auth.uid() DESC, -- Current user first
    p.first_name, 
    p.last_name;
END;
$function$;


-- ======================================================================

-- Function 153/242
CREATE OR REPLACE FUNCTION public.get_maintenance_records_with_context(p_organization_id uuid DEFAULT NULL::uuid, p_search_term text DEFAULT NULL::text, p_status text DEFAULT NULL::text, p_operational_state text DEFAULT NULL::text, p_severity text DEFAULT NULL::text, p_vehicle_id uuid DEFAULT NULL::uuid, p_include_resolved boolean DEFAULT false, p_dev_user_email text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_context RECORD;
  v_is_company_user boolean := false;
  v_result JSON;
BEGIN
  -- Get user context from dev email if provided
  IF p_dev_user_email IS NOT NULL THEN
    SELECT * INTO v_user_context FROM get_user_context(p_dev_user_email);
    
    -- Check if user has company-level roles
    IF v_user_context.roles IS NOT NULL THEN
      v_is_company_user := EXISTS (
        SELECT 1 FROM unnest(v_user_context.roles) AS role
        WHERE role IN ('super_admin', 'admin', 'developer', 'finance')
      );
    END IF;
  END IF;

  -- Build and execute query
  SELECT json_build_object(
    'records', COALESCE(json_agg(record_data ORDER BY created_at DESC), '[]'::json),
    'count', COUNT(*)
  ) INTO v_result
  FROM (
    SELECT 
      m.id,
      m.vehicle_id,
      m.organization_id,
      m.issue_title,
      m.issue,
      m.maintenance_record_status::text as maintenance_record_status,
      m.location,
      m.severity,
      m.date_due,
      m.created_at,
      m.updated_at,
      m.created_by,
      m.assignee,
      m.resolved_at,
      m.resolved_by,
      m.resolution,
      m.resolution_reason,
      m.maintenance_notes,
      m.support_ticket,
      m.afs_eligible,
      m.odometer,
      json_build_object(
        'id', f.id,
        'vehicle_name', f.vehicle_name,
        'vin', f.vin,
        'make', f.make,
        'model', f.model,
        'year', f.year,
        'vehicle_type', f.vehicle_type,
        'operational_state', f.operational_state::text,
        'organization_id', f.organization_id,
        'odometer', f.odometer
      ) as fleet,
      CASE 
        WHEN p.id IS NOT NULL THEN json_build_object(
          'first_name', p.first_name,
          'last_name', p.last_name
        )
        ELSE NULL
      END as profiles,
      CASE 
        WHEN ap.id IS NOT NULL THEN json_build_object(
          'id', ap.id,
          'first_name', ap.first_name,
          'last_name', ap.last_name,
          'email', ap.email
        )
        ELSE NULL
      END as assignee_profile,
      CASE 
        WHEN rp.id IS NOT NULL THEN json_build_object(
          'first_name', rp.first_name,
          'last_name', rp.last_name
        )
        ELSE NULL
      END as resolved_by_profile
    FROM maintenance_records m
    JOIN fleet f ON f.id = m.vehicle_id
    LEFT JOIN profiles p ON p.id = m.created_by
    LEFT JOIN profiles ap ON ap.id = m.assignee
    LEFT JOIN profiles rp ON rp.id = m.resolved_by
    WHERE 
      -- Organization filter
      (
        -- If specific org requested, filter by it
        (p_organization_id IS NOT NULL AND m.organization_id = p_organization_id)
        OR
        -- If no org specified and user is company user, show all
        (p_organization_id IS NULL AND v_is_company_user = true)
        OR
        -- If no org specified and user is not company user, show only their org
        (p_organization_id IS NULL AND v_is_company_user = false AND m.organization_id = v_user_context.organization_id)
      )
      -- Status filter (cast to text for comparison)
      AND (
        p_status IS NULL 
        OR p_status = 'all'
        OR (p_status = 'active' AND m.maintenance_record_status::text != 'Resolved')
        OR (p_status != 'active' AND m.maintenance_record_status::text = p_status)
      )
      -- Include resolved filter (only apply if not already filtered by status)
      AND (
        p_include_resolved = true 
        OR p_status = 'active'  -- Don't double-filter if status is already 'active'
        OR m.maintenance_record_status::text != 'Resolved'
      )
      -- Vehicle filter
      AND (p_vehicle_id IS NULL OR m.vehicle_id = p_vehicle_id)
      -- Search filter
      AND (
        p_search_term IS NULL 
        OR p_search_term = ''
        OR m.issue_title ILIKE '%' || p_search_term || '%'
        OR m.issue ILIKE '%' || p_search_term || '%'
        OR f.vehicle_name ILIKE '%' || p_search_term || '%'
        OR f.vin ILIKE '%' || p_search_term || '%'
      )
      -- Severity filter
      AND (p_severity IS NULL OR m.severity::text = p_severity)
      -- Operational state filter (cast to text for comparison)
      AND (p_operational_state IS NULL OR f.operational_state::text = p_operational_state)
  ) as record_data;

  RETURN v_result;
END;
$function$;


-- ======================================================================

-- Function 154/242
CREATE OR REPLACE FUNCTION public.get_marketing_funnel_stats(p_referral_id uuid)
 RETURNS TABLE(total_conversions bigint, last_30_days bigint, last_7_days bigint, last_conversion_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_conversions,
    COUNT(*) FILTER (WHERE converted_at >= NOW() - INTERVAL '30 days')::BIGINT as last_30_days,
    COUNT(*) FILTER (WHERE converted_at >= NOW() - INTERVAL '7 days')::BIGINT as last_7_days,
    MAX(converted_at) as last_conversion_at
  FROM referral_conversions
  WHERE referral_id = p_referral_id;
END;
$function$;


-- ======================================================================

-- Function 155/242
CREATE OR REPLACE FUNCTION public.get_my_active_impersonations()
 RETURNS TABLE(session_id text, target_user_id uuid, started_at timestamp with time zone, started_by uuid)
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Only return impersonations for the current user
    -- This enforces proper access control
    RETURN QUERY
    SELECT 
        i.session_id::TEXT,
        i.target_user_id,
        i.started_at,
        i.started_by
    FROM impersonation_sessions i
    WHERE i.started_by = auth.uid()
    AND i.ended_at IS NULL;
END;
$function$;


-- ======================================================================

-- Function 156/242
CREATE OR REPLACE FUNCTION public.get_organization_modules(org_id uuid)
 RETURNS TABLE(id uuid, name text, type module_type, description text, is_enabled boolean)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    m.id,
    m.name,
    m.type,
    m.description,
    COALESCE(mc.is_enabled, false) as is_enabled
  FROM 
    modules m
  LEFT JOIN 
    module_configurations mc ON m.id = mc.module_id AND mc.organization_id = org_id
  ORDER BY 
    m.name;
$function$;


-- ======================================================================

-- Function 157/242
CREATE OR REPLACE FUNCTION public.get_organizations_secure()
 RETURNS SETOF organizations
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_is_admin BOOLEAN;
  v_user_org_id UUID;
BEGIN
  -- Check if user is admin - if so, return all organizations
  SELECT EXISTS (
    SELECT 1 FROM admin_users_view
    WHERE user_id = auth.uid()
  ) INTO v_is_admin;
  
  IF v_is_admin THEN
    RETURN QUERY
    SELECT * FROM organizations
    ORDER BY name;
    RETURN;
  END IF;
  
  -- If not admin, get user's organization
  SELECT organization_id INTO v_user_org_id
  FROM profiles
  WHERE id = auth.uid();
  
  -- If user has owner role, return only their organization
  IF EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'owner'
  ) THEN
    RETURN QUERY
    SELECT * FROM organizations
    WHERE id = v_user_org_id
    ORDER BY name;
    RETURN;
  END IF;
  
  -- For all other roles or cases, return empty set
  RETURN;
END;
$function$;


-- ======================================================================

-- Function 158/242
CREATE OR REPLACE FUNCTION public.get_owner_permissions()
 RETURNS TABLE(permission text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  -- Owner has all these permissions, but only for their organization
  SELECT 'organization:view' AS permission
  UNION SELECT 'organization:edit'
  UNION SELECT 'user:view'
  UNION SELECT 'user:create'
  UNION SELECT 'user:edit'
  UNION SELECT 'module:view'
  UNION SELECT 'module:toggle'
  UNION SELECT 'fleet:view'
  UNION SELECT 'fleet:edit'
  UNION SELECT 'fleet:create'
  UNION SELECT 'fleet:archive'
  UNION SELECT 'fleet_maintenance:view'
  UNION SELECT 'fleet_maintenance:edit'
  UNION SELECT 'fleet_maintenance:create'
  UNION SELECT 'fleet_maintenance:archive'
  UNION SELECT 'profile:view'
  UNION SELECT 'profile:edit';
$function$;


-- ======================================================================

-- Function 159/242
CREATE OR REPLACE FUNCTION public.get_region_from_state(state_code character varying)
 RETURNS uuid
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
DECLARE
    v_region_id UUID;
BEGIN
    SELECT id INTO v_region_id
    FROM public.regions
    WHERE UPPER(state_code) = ANY(states);
    
    RETURN v_region_id;
END;
$function$;


-- ======================================================================

-- Function 160/242
CREATE OR REPLACE FUNCTION public.get_setting(setting_key text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN (
    SELECT value 
    FROM public.system_settings 
    WHERE key = setting_key
  );
END;
$function$;


-- ======================================================================

-- Function 161/242
CREATE OR REPLACE FUNCTION public.get_survey_analytics(survey_uuid uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  analytics JSON;
BEGIN
  -- Check if user is admin
  IF NOT is_portal_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  SELECT json_build_object(
    'survey', row_to_json(s),
    'response_stats', json_build_object(
      'total_responses', (
        SELECT COUNT(*) FROM public.portal_survey_responses 
        WHERE survey_id = survey_uuid
      ),
      'completed_responses', (
        SELECT COUNT(*) FROM public.portal_survey_responses 
        WHERE survey_id = survey_uuid AND is_complete = true
      ),
      'completion_rate', (
        SELECT ROUND(
          100.0 * COUNT(CASE WHEN is_complete THEN 1 END) / NULLIF(COUNT(*), 0), 
          2
        )
        FROM public.portal_survey_responses 
        WHERE survey_id = survey_uuid
      ),
      'avg_completion_time', (
        SELECT AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) / 60)::INTEGER
        FROM public.portal_survey_responses
        WHERE survey_id = survey_uuid AND is_complete = true
      )
    ),
    'question_analytics', (
      SELECT json_agg(
        json_build_object(
          'question', q.question_text,
          'question_type', q.question_type,
          'response_count', (
            SELECT COUNT(*) FROM public.portal_survey_answers a
            WHERE a.question_id = q.id
          ),
          'answers', (
            SELECT json_agg(
              json_build_object(
                'answer_text', a.answer_text,
                'answer_options', a.answer_options,
                'count', COUNT(*)
              )
            )
            FROM public.portal_survey_answers a
            WHERE a.question_id = q.id
            GROUP BY a.answer_text, a.answer_options
          )
        ) ORDER BY q.display_order
      )
      FROM public.portal_survey_questions q
      WHERE q.survey_id = survey_uuid
    )
  )
  FROM public.portal_surveys s
  WHERE s.id = survey_uuid
  INTO analytics;

  RETURN analytics;
END;
$function$;


-- ======================================================================

-- Function 162/242
CREATE OR REPLACE FUNCTION public.get_survey_with_questions(survey_uuid uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  survey_data JSON;
BEGIN
  SELECT json_build_object(
    'survey', row_to_json(s),
    'questions', (
      SELECT json_agg(row_to_json(q) ORDER BY q.display_order)
      FROM public.portal_survey_questions q
      WHERE q.survey_id = survey_uuid
    ),
    'response_count', (
      SELECT COUNT(*) 
      FROM public.portal_survey_responses 
      WHERE survey_id = survey_uuid
    ),
    'user_response', (
      SELECT row_to_json(r)
      FROM public.portal_survey_responses r
      WHERE r.survey_id = survey_uuid
      AND r.user_id = auth.uid()
      LIMIT 1
    )
  )
  FROM public.portal_surveys s
  WHERE s.id = survey_uuid
  INTO survey_data;

  RETURN survey_data;
END;
$function$;


-- ======================================================================

-- Function 163/242
CREATE OR REPLACE FUNCTION public.get_survey_with_sections(p_survey_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'survey', to_jsonb(s.*),
    'sections', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'section', to_jsonb(sec.*),
          'questions', (
            SELECT jsonb_agg(to_jsonb(q.*) ORDER BY q.section_order, q.question_order)
            FROM portal_survey_questions q
            WHERE q.section_id = sec.id
          )
        )
        ORDER BY sec.display_order
      )
      FROM portal_survey_sections sec
      WHERE sec.survey_id = p_survey_id
    ),
    'ungrouped_questions', (
      SELECT jsonb_agg(to_jsonb(q.*) ORDER BY q.question_order)
      FROM portal_survey_questions q
      WHERE q.survey_id = p_survey_id
      AND q.section_id IS NULL
    )
  )
  INTO v_result
  FROM portal_surveys s
  WHERE s.id = p_survey_id;

  RETURN v_result;
END;
$function$;


-- ======================================================================

-- Function 164/242
CREATE OR REPLACE FUNCTION public.get_technicians(p_organization_id uuid)
 RETURNS TABLE(id uuid, first_name text, last_name text, email text, is_current_user boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Admin users can see all technicians
  IF (SELECT EXISTS(SELECT 1 FROM admin_users_view WHERE user_id = auth.uid())) THEN
    RETURN QUERY
    SELECT 
      p.id, 
      p.first_name, 
      p.last_name, 
      p.email,
      p.id = auth.uid() as is_current_user
    FROM profiles p
    WHERE p.id NOT IN (
      SELECT ur.user_id 
      FROM user_roles ur 
      WHERE ur.role = 'driver'
    )
    ORDER BY 
      p.id = auth.uid() DESC, -- Current user first
      p.first_name, 
      p.last_name;
    RETURN;
  END IF;
  
  -- Organization users can see only users from their organization
  RETURN QUERY
  SELECT 
    p.id, 
    p.first_name, 
    p.last_name, 
    p.email,
    p.id = auth.uid() as is_current_user
  FROM profiles p
  WHERE p.organization_id = p_organization_id
  AND p.id NOT IN (
    SELECT ur.user_id 
    FROM user_roles ur 
    WHERE ur.role = 'driver'
  )
  ORDER BY 
    p.id = auth.uid() DESC, -- Current user first
    p.first_name, 
    p.last_name;
END;
$function$;


-- ======================================================================

-- Function 165/242
CREATE OR REPLACE FUNCTION public.get_test_response_stats()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  stats JSON;
  response_count INTEGER;
BEGIN
  -- First check if there are any test responses
  SELECT COUNT(*) INTO response_count
  FROM portal_survey_responses
  WHERE is_test_response = true;

  IF response_count = 0 THEN
    -- Return empty stats if no test responses exist
    RETURN json_build_object(
      'total_test_responses', 0,
      'test_surveys', 0,
      'oldest_test_response', NULL,
      'newest_test_response', NULL,
      'by_survey', '[]'::json
    );
  END IF;

  -- Otherwise calculate full stats
  SELECT json_build_object(
    'total_test_responses', COUNT(*)::INTEGER,
    'test_surveys', COUNT(DISTINCT survey_id)::INTEGER,
    'oldest_test_response', MIN(started_at),
    'newest_test_response', MAX(started_at),
    'by_survey', COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'survey_id', s.id,
            'survey_title', s.title,
            'test_responses', COUNT(r.id)::INTEGER
          )
        )
        FROM portal_surveys s
        JOIN portal_survey_responses r ON r.survey_id = s.id
        WHERE r.is_test_response = true
        GROUP BY s.id, s.title
      ),
      '[]'::json
    )
  ) INTO stats
  FROM portal_survey_responses
  WHERE is_test_response = true;
  
  RETURN stats;
END;
$function$;


-- ======================================================================

-- Function 166/242
CREATE OR REPLACE FUNCTION public.get_top_calculator_savers(p_limit integer DEFAULT 10)
 RETURNS TABLE(submission_id uuid, user_email text, user_name text, company_name text, total_monthly_savings numeric, total_annual_savings numeric, submission_date timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    cs.id,
    cs.user_email,
    cs.user_name,
    cs.company_name,
    cs.total_monthly_savings,
    cs.total_annual_savings,
    cs.submission_date
  FROM public.calculator_submissions cs
  WHERE cs.is_latest = true
  ORDER BY cs.total_monthly_savings DESC
  LIMIT p_limit;
END;
$function$;


-- ======================================================================

-- Function 167/242
CREATE OR REPLACE FUNCTION public.get_total_admins_count()
 RETURNS integer
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COUNT(*)::integer 
  FROM user_roles 
  WHERE role = 'admin';
$function$;


-- ======================================================================

-- Function 168/242
CREATE OR REPLACE FUNCTION public.get_total_organizations_count()
 RETURNS integer
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COUNT(*)::integer 
  FROM organizations;
$function$;


-- ======================================================================

-- Function 169/242
CREATE OR REPLACE FUNCTION public.get_unread_updates_count(user_uuid uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.portal_updates u
    WHERE u.status = 'published'
    AND u.publish_at <= NOW()
    AND (u.expires_at IS NULL OR u.expires_at > NOW())
    AND NOT EXISTS (
      SELECT 1 FROM public.portal_update_reads r
      WHERE r.update_id = u.id
      AND r.user_id = user_uuid
    )
  );
END;
$function$;


-- ======================================================================

-- Function 170/242
CREATE OR REPLACE FUNCTION public.get_updates_admin_stats()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'total_updates', COUNT(*)::INTEGER,
    'draft_count', COUNT(CASE WHEN status = 'draft' THEN 1 END)::INTEGER,
    'published_count', COUNT(CASE WHEN status = 'published' THEN 1 END)::INTEGER,
    'archived_count', COUNT(CASE WHEN status = 'archived' THEN 1 END)::INTEGER,
    'compulsory_count', COUNT(CASE WHEN "type" = 'compulsory' THEN 1 END)::INTEGER,
    'advisory_count', COUNT(CASE WHEN "type" = 'general' OR "type" = 'advisory' THEN 1 END)::INTEGER,
    'recent_archives', (
      SELECT json_agg(
        json_build_object(
          'id', id,
          'title', title,
          'archived_at', archived_at,
          'archived_by', archived_by
        )
      )
      FROM (
        SELECT id, title, archived_at, archived_by
        FROM portal_updates
        WHERE archived_at IS NOT NULL
        ORDER BY archived_at DESC
        LIMIT 5
      ) recent
    )
  ) INTO stats
  FROM portal_updates;
  
  RETURN stats;
END;
$function$;


-- ======================================================================

-- Function 171/242
CREATE OR REPLACE FUNCTION public.handle_calculator_submission()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_notification_result JSONB;
BEGIN
  -- Send notification for new calculator submission
  v_notification_result := public.send_calculator_notification(
    jsonb_build_object(
      'user_id', NEW.user_id,
      'user_name', NEW.user_name,
      'user_email', NEW.user_email,
      'company_name', NEW.company_name,
      'fleet_size', NEW.fleet_size,
      'submission_date', NEW.submission_date,
      'total_monthly_savings', NEW.total_monthly_savings,
      'total_annual_savings', NEW.total_annual_savings,
      'labor_savings_total', NEW.labor_savings_total,
      'system_savings_total', NEW.system_savings_total,
      'fixed_savings_total', NEW.fixed_savings_total,
      'labor_savings_items', NEW.labor_savings_items,
      'system_replacement_items', NEW.system_replacement_items,
      'fixed_savings_items', NEW.fixed_savings_items,
      'notes', NEW.notes
    )
  );

  -- Log the notification result
  RAISE NOTICE 'Calculator submission notification result: %', v_notification_result;

  RETURN NEW;
END;
$function$;


-- ======================================================================

-- Function 172/242
CREATE OR REPLACE FUNCTION public.handle_survey_completion()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_survey RECORD;
  v_user RECORD;
  v_questions_answers JSON;
  v_response_count INTEGER;
  v_result JSON;
BEGIN
  -- Only trigger on completion (when completed_at is set)
  IF NEW.completed_at IS NULL OR (TG_OP = 'UPDATE' AND OLD.completed_at IS NOT NULL) THEN
    RETURN NEW;
  END IF;

  -- Get survey details
  SELECT * INTO v_survey
  FROM public.portal_surveys
  WHERE id = NEW.survey_id;

  IF v_survey IS NULL THEN
    RAISE WARNING 'Survey not found for response %', NEW.id;
    RETURN NEW;
  END IF;

  -- Get user details
  SELECT * INTO v_user
  FROM public.profiles
  WHERE id = NEW.user_id;

  -- Get questions and answers
  SELECT json_agg(
    json_build_object(
      'question', q.question_text,
      'answer', COALESCE(a.answer_text, a.answer_value, 'No answer')
    ) ORDER BY q.question_order
  ) INTO v_questions_answers
  FROM public.portal_survey_questions q
  LEFT JOIN public.portal_survey_answers a ON a.question_id = q.id AND a.response_id = NEW.id
  WHERE q.survey_id = NEW.survey_id;

  -- Get total response count for this survey
  SELECT COUNT(*) INTO v_response_count
  FROM public.portal_survey_responses
  WHERE survey_id = NEW.survey_id
  AND completed_at IS NOT NULL;

  -- Queue the notification
  v_result := public.queue_notification(
    'survey_completed',
    jsonb_build_object(
      'response_id', NEW.id,
      'survey_id', NEW.survey_id,
      'survey_title', v_survey.title,
      'survey_description', v_survey.description,
      'user_id', NEW.user_id,
      'user_email', COALESCE(v_user.email, 'unknown@example.com'),
      'user_name', COALESCE(
        v_user.first_name || ' ' || v_user.last_name,
        v_user.email,
        'Anonymous User'
      ),
      'completed_at', NEW.completed_at,
      'response_count', v_response_count,
      'questions_answers', v_questions_answers
    ),
    NEW.user_id
  );

  -- Log if queueing failed (but don't fail the transaction)
  IF NOT (v_result->>'success')::boolean THEN
    RAISE WARNING 'Failed to queue survey completion notification: %', v_result->>'error';
  END IF;

  RETURN NEW;
END;
$function$;


-- ======================================================================

-- Function 173/242
CREATE OR REPLACE FUNCTION public.handle_survey_published()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_result JSON;
  v_portal_url TEXT;
BEGIN
  -- Only trigger on status change to 'published'
  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN

    -- Build portal URL
    v_portal_url := 'https://portal.fleetdrms.com/portal/surveys/' || NEW.id;

    -- Queue the notification using the unified system
    v_result := public.queue_notification(
      'survey_published',
      jsonb_build_object(
        'survey_id', NEW.id,
        'title', NEW.title,
        'description', NEW.description,
        'deadline', NEW.deadline,
        'target_audience', COALESCE(NEW.target_audience, 'all'),
        'published_at', COALESCE(NEW.published_at, NOW()),
        'created_by', NEW.created_by,
        'portal_url', v_portal_url
      ),
      NEW.created_by
    );

    -- Log if queueing failed (but don't fail the transaction)
    IF NOT (v_result->>'success')::boolean THEN
      RAISE WARNING 'Failed to queue survey published notification: %', v_result->>'error';
    ELSE
      RAISE NOTICE 'Successfully queued survey published notification for: %', NEW.title;
    END IF;

  END IF;

  RETURN NEW;
END;
$function$;


-- ======================================================================

-- Function 174/242
CREATE OR REPLACE FUNCTION public.handle_update_published()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_result JSON;
  v_portal_url TEXT;
BEGIN
  -- Only trigger on status change to 'published'
  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN

    -- Build portal URL
    v_portal_url := 'https://portal.fleetdrms.com/portal/updates/' || NEW.id;

    -- Queue the notification
    v_result := public.queue_notification(
      'update_published',
      jsonb_build_object(
        'update_id', NEW.id,
        'title', NEW.title,
        'content', NEW.content,
        'update_type', NEW.update_type,
        'target_audience', COALESCE(NEW.target_audience, 'all'),
        'published_at', COALESCE(NEW.published_at, NOW()),
        'created_by', NEW.created_by,
        'portal_url', v_portal_url
      ),
      NEW.created_by
    );

    -- Log result
    IF (v_result->>'success')::boolean THEN
      RAISE NOTICE 'Successfully queued % update notifications for: %', v_result->>'queued_count', NEW.title;
    ELSE
      RAISE WARNING 'Failed to queue notifications: %', v_result->>'error';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;


-- ======================================================================

-- Function 175/242
CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;


-- ======================================================================

-- Function 176/242
CREATE OR REPLACE FUNCTION public.has_fleet_maintenance_permission(p_permission text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if user has admin privileges using the materialized view
  IF EXISTS (SELECT 1 FROM admin_users_view WHERE user_id = auth.uid()) THEN
    RETURN TRUE;
  END IF;
  
  -- Check for specific permission without using RLS
  RETURN EXISTS (
    SELECT 1 
    FROM public.get_user_permissions()
    WHERE permission IN (p_permission, 'fleet_maintenance:*')
  );
END;
$function$;


-- ======================================================================

-- Function 177/242
CREATE OR REPLACE FUNCTION public.has_fleet_permission(p_permission text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if user is admin
  IF EXISTS (SELECT 1 FROM admin_users_view WHERE user_id = auth.uid()) THEN
    RETURN TRUE;
  END IF;
  
  -- Check for specific permission without triggering RLS recursion
  RETURN EXISTS (
    SELECT 1 
    FROM public.get_user_permissions()
    WHERE permission IN (p_permission, 'fleet:*')
  );
END;
$function$;


-- ======================================================================

-- Function 178/242
CREATE OR REPLACE FUNCTION public.has_fleet_role(p_role text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- First check if admin
  IF EXISTS (SELECT 1 FROM admin_users_view WHERE user_id = auth.uid()) THEN
    RETURN TRUE;
  END IF;
  
  -- Direct table access without triggering RLS
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = p_role::app_role
  );
END;
$function$;


-- ======================================================================

-- Function 179/242
CREATE OR REPLACE FUNCTION public.has_org_role(p_user_id uuid, p_org_id uuid, p_roles text[] DEFAULT NULL::text[])
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF p_roles IS NULL OR array_length(p_roles, 1) IS NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM public.organization_memberships
      WHERE user_id = p_user_id 
      AND organization_id = p_org_id
      AND is_active = true
    );
  ELSE
    RETURN EXISTS (
      SELECT 1 FROM public.organization_memberships
      WHERE user_id = p_user_id 
      AND organization_id = p_org_id
      AND org_role = ANY(p_roles)
      AND is_active = true
    );
  END IF;
END;
$function$;


-- ======================================================================

-- Function 180/242
CREATE OR REPLACE FUNCTION public.has_role(user_id uuid, role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_roles.user_id = $1
      AND user_roles.role = $2
  );
$function$;


-- ======================================================================

-- Function 181/242
CREATE OR REPLACE FUNCTION public.has_system_role(p_user_id uuid, p_roles text[] DEFAULT NULL::text[])
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF p_roles IS NULL OR array_length(p_roles, 1) IS NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM public.system_user_assignments
      WHERE user_id = p_user_id AND is_active = true
    );
  ELSE
    RETURN EXISTS (
      SELECT 1 FROM public.system_user_assignments
      WHERE user_id = p_user_id 
      AND system_role = ANY(p_roles)
      AND is_active = true
    );
  END IF;
END;
$function$;


-- ======================================================================

-- Function 182/242
CREATE OR REPLACE FUNCTION public.increment_event_view_count(event_id uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE portal_events 
    SET views_count = views_count + 1
    WHERE id = event_id;
END;
$function$;


-- ======================================================================

-- Function 183/242
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  current_user_id UUID;
  has_admin_role BOOLEAN := FALSE;
BEGIN
  -- Get the current user ID
  current_user_id := auth.uid();
  
  -- Return false if no user is authenticated
  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check if user has admin, super_admin, or developer role
  -- All of these should be considered "admin" for Bridge access
  SELECT EXISTS(
    SELECT 1 FROM user_roles 
    WHERE user_id = current_user_id 
    AND role IN ('admin', 'super_admin', 'developer')
  ) INTO has_admin_role;

  RETURN has_admin_role;
END;
$function$;


-- ======================================================================

-- Function 184/242
CREATE OR REPLACE FUNCTION public.is_being_impersonated()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM impersonation_sessions 
        WHERE impersonated_user_id = auth.uid()
        AND ended_at IS NULL
    );
END;
$function$;


-- ======================================================================

-- Function 185/242
CREATE OR REPLACE FUNCTION public.is_contact_admin(user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    IF user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Simple check - just look for the role
    RETURN EXISTS (
        SELECT 1 
        FROM public.profiles 
        WHERE id = user_id 
        AND role IN ('admin', 'superadmin', 'super_admin')
    );
END;
$function$;


-- ======================================================================

-- Function 186/242
CREATE OR REPLACE FUNCTION public.is_event_published(event_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.portal_events
    WHERE id = event_id
    AND status = 'published'
  );
END;
$function$;


-- ======================================================================

-- Function 187/242
CREATE OR REPLACE FUNCTION public.is_fleet_enabled(p_organization_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_is_enabled BOOLEAN;
BEGIN
  -- Admin users can access all modules regardless of configuration
  IF (SELECT EXISTS(SELECT 1 FROM admin_users_view WHERE user_id = auth.uid())) THEN
    RETURN TRUE;
  END IF;

  SELECT mc.is_enabled
  FROM modules m
  JOIN module_configurations mc ON m.id = mc.module_id
  WHERE 
    m.type = 'fleet' AND 
    mc.organization_id = p_organization_id
  INTO v_is_enabled;

  RETURN COALESCE(v_is_enabled, FALSE);
END;
$function$;


-- ======================================================================

-- Function 188/242
CREATE OR REPLACE FUNCTION public.is_fleet_maintenance_enabled(p_organization_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_is_enabled BOOLEAN;
BEGIN
  -- Admin users can access all modules regardless of configuration
  IF (SELECT EXISTS(SELECT 1 FROM admin_users_view WHERE user_id = auth.uid())) THEN
    RETURN TRUE;
  END IF;

  SELECT mc.is_enabled
  FROM modules m
  JOIN module_configurations mc ON m.id = mc.module_id
  WHERE 
    m.type = 'fleet_maintenance' AND 
    mc.organization_id = p_organization_id
  INTO v_is_enabled;

  RETURN COALESCE(v_is_enabled, FALSE);
END;
$function$;


-- ======================================================================

-- Function 189/242
CREATE OR REPLACE FUNCTION public.is_module_enabled(p_module_type module_type, p_organization_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_is_enabled BOOLEAN;
BEGIN
  -- Admin users can access all modules regardless of configuration
  IF (SELECT EXISTS(SELECT 1 FROM admin_users_view WHERE user_id = auth.uid())) THEN
    RETURN TRUE;
  END IF;

  SELECT mc.is_enabled
  FROM modules m
  JOIN module_configurations mc ON m.id = mc.module_id
  WHERE 
    m.type = p_module_type AND 
    mc.organization_id = p_organization_id
  INTO v_is_enabled;

  RETURN COALESCE(v_is_enabled, FALSE);
END;
$function$;


-- ======================================================================

-- Function 190/242
CREATE OR REPLACE FUNCTION public.is_survey_active(survey_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.portal_surveys
    WHERE id = survey_id
    AND is_active = true
    AND start_date <= NOW()
    AND (end_date IS NULL OR end_date > NOW())
  );
END;
$function$;


-- ======================================================================

-- Function 191/242
CREATE OR REPLACE FUNCTION public.is_update_published(update_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.portal_updates
    WHERE id = update_id
    AND status = 'published'
    AND publish_at <= NOW()
    AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$function$;


-- ======================================================================

-- Function 192/242
CREATE OR REPLACE FUNCTION public.log_admin_activity(p_action character varying, p_entity_type character varying, p_entity_id uuid, p_entity_title character varying, p_changes jsonb DEFAULT NULL::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Only admins can log activity
  IF NOT is_portal_admin(auth.uid()) THEN
    RETURN;
  END IF;

  INSERT INTO public.portal_admin_activity (
    admin_id, action, entity_type, entity_id, entity_title, changes
  ) VALUES (
    auth.uid(), p_action, p_entity_type, p_entity_id, p_entity_title, p_changes
  );
END;
$function$;


-- ======================================================================

-- Function 193/242
CREATE OR REPLACE FUNCTION public.log_impersonation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog', 'auth'
AS $function$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO auth.audit_log_entries (
            id,           -- Add the required id field
            instance_id,
            ip_address,
            payload,
            created_at
        )
        VALUES (
            gen_random_uuid(),  -- Generate UUID for the id field
            gen_random_uuid(),  -- instance_id
            '0.0.0.0',
            jsonb_build_object(
                'admin_id', NEW.admin_id,
                'impersonated_user_id', NEW.impersonated_user_id,
                'action', 'start_impersonation',
                'event_type', 'impersonation'
            ),
            NEW.started_at
        );
    ELSIF TG_OP = 'UPDATE' AND NEW.ended_at IS NOT NULL AND OLD.ended_at IS NULL THEN
        INSERT INTO auth.audit_log_entries (
            id,           -- Add the required id field
            instance_id,
            ip_address,
            payload,
            created_at
        )
        VALUES (
            gen_random_uuid(),  -- Generate UUID for the id field
            gen_random_uuid(),  -- instance_id
            '0.0.0.0',
            jsonb_build_object(
                'admin_id', NEW.admin_id,
                'impersonated_user_id', NEW.impersonated_user_id,
                'action', 'end_impersonation',
                'event_type', 'impersonation'
            ),
            NEW.ended_at
        );
    END IF;
    RETURN NULL;
END;
$function$;


-- ======================================================================

-- Function 194/242
CREATE OR REPLACE FUNCTION public.log_org_membership_change()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_user_email TEXT;
  v_org_name TEXT;
BEGIN
  -- Check if portal_admin_activity table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'portal_admin_activity'
  ) THEN
    -- Get user email and org name
    SELECT email INTO v_user_email FROM public.profiles WHERE id = NEW.user_id;
    SELECT name INTO v_org_name FROM public.organizations WHERE id = NEW.organization_id;
    
    IF TG_OP = 'INSERT' THEN
      INSERT INTO public.portal_admin_activity (
        admin_id,
        action,
        entity_type,
        entity_id,
        entity_title,
        changes,
        created_at
      ) VALUES (
        COALESCE(NEW.invited_by, auth.uid()),
        'org_role_assignment',
        'org_member',
        NEW.id,
        COALESCE(v_user_email, 'Unknown User') || ' - ' || COALESCE(v_org_name, 'Unknown Org') || ': ' || NEW.org_role,
        jsonb_build_object(
          'user_id', NEW.user_id,
          'organization_id', NEW.organization_id,
          'organization_name', v_org_name,
          'role', NEW.org_role,
          'operation', 'create',
          'context', 'organization'
        ),
        NOW()
      );
    ELSIF TG_OP = 'UPDATE' THEN
      IF OLD.is_active != NEW.is_active THEN
        INSERT INTO public.portal_admin_activity (
          admin_id,
          action,
          entity_type,
          entity_id,
          entity_title,
          changes,
          created_at
        ) VALUES (
          auth.uid(),
          CASE WHEN NEW.is_active THEN 'org_role_activation' ELSE 'org_role_deactivation' END,
          'org_member',
          NEW.id,
          COALESCE(v_user_email, 'Unknown User') || ' - ' || COALESCE(v_org_name, 'Unknown Org') || ': ' || NEW.org_role,
          jsonb_build_object(
            'user_id', NEW.user_id,
            'organization_id', NEW.organization_id,
            'organization_name', v_org_name,
            'role', NEW.org_role,
            'is_active', NEW.is_active,
            'operation', 'update',
            'context', 'organization'
          ),
          NOW()
        );
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;


-- ======================================================================

-- Function 195/242
CREATE OR REPLACE FUNCTION public.log_system_assignment_change()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_user_email TEXT;
BEGIN
  -- Check if portal_admin_activity table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'portal_admin_activity'
  ) THEN
    -- Get user email for entity_title
    SELECT email INTO v_user_email FROM public.profiles WHERE id = NEW.user_id;
    
    IF TG_OP = 'INSERT' THEN
      INSERT INTO public.portal_admin_activity (
        admin_id,
        action,
        entity_type,
        entity_id,
        entity_title,
        changes,
        created_at
      ) VALUES (
        COALESCE(NEW.assigned_by, auth.uid()),
        'system_role_assignment',
        'system_user',
        NEW.id,
        COALESCE(v_user_email, 'Unknown User') || ' - System: ' || NEW.system_role,
        jsonb_build_object(
          'user_id', NEW.user_id,
          'role', NEW.system_role,
          'operation', 'create',
          'context', 'system'
        ),
        NOW()
      );
    ELSIF TG_OP = 'UPDATE' THEN
      IF OLD.is_active != NEW.is_active THEN
        INSERT INTO public.portal_admin_activity (
          admin_id,
          action,
          entity_type,
          entity_id,
          entity_title,
          changes,
          created_at
        ) VALUES (
          auth.uid(),
          CASE WHEN NEW.is_active THEN 'system_role_activation' ELSE 'system_role_deactivation' END,
          'system_user',
          NEW.id,
          COALESCE(v_user_email, 'Unknown User') || ' - System: ' || NEW.system_role,
          jsonb_build_object(
            'user_id', NEW.user_id,
            'role', NEW.system_role,
            'is_active', NEW.is_active,
            'operation', 'update',
            'context', 'system'
          ),
          NOW()
        );
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;


-- ======================================================================

-- Function 196/242
CREATE OR REPLACE FUNCTION public.mark_all_updates_as_read()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  INSERT INTO public.portal_update_reads (update_id, user_id)
  SELECT id, auth.uid()
  FROM public.portal_updates
  WHERE status = 'published'
  AND publish_at <= NOW()
  AND (expires_at IS NULL OR expires_at > NOW())
  ON CONFLICT (update_id, user_id) DO NOTHING;
END;
$function$;


-- ======================================================================

-- Function 197/242
CREATE OR REPLACE FUNCTION public.mark_update_as_read(update_uuid uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  INSERT INTO public.portal_update_reads (update_id, user_id)
  VALUES (update_uuid, auth.uid())
  ON CONFLICT (update_id, user_id) DO NOTHING;
END;
$function$;


-- ======================================================================

-- Function 198/242
CREATE OR REPLACE FUNCTION public.mark_update_viewed(p_update_id uuid, p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    INSERT INTO public.portal_update_reads (
        update_id, 
        user_id, 
        first_viewed_at, 
        last_viewed_at, 
        view_count
    )
    VALUES (
        p_update_id, 
        p_user_id, 
        NOW(), 
        NOW(), 
        1
    )
    ON CONFLICT (update_id, user_id) 
    DO UPDATE SET
        last_viewed_at = NOW(),
        view_count = portal_update_reads.view_count + 1;
        
    -- Update view count on the update itself
    UPDATE public.portal_updates 
    SET view_count = COALESCE(view_count, 0) + 1
    WHERE id = p_update_id;
END;
$function$;


-- ======================================================================

-- Function 199/242
CREATE OR REPLACE FUNCTION public.migrate_recipient_types_to_lists()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
  rule RECORD;
  list_id uuid;
BEGIN
  FOR rule IN
    SELECT id, event_id, recipient_type, recipient_config
    FROM notification_rules
    WHERE recipient_list_id IS NULL
  LOOP
    -- Determine which list to use based on recipient_type and event_id
    IF rule.event_id IN ('update_published', 'survey_published', 'event_published') THEN
      -- Published content goes to All Users
      SELECT id INTO list_id FROM recipient_lists WHERE code = 'all_users';
    ELSIF rule.recipient_type = 'admin' OR rule.recipient_type = 'static' THEN
      SELECT id INTO list_id FROM recipient_lists WHERE code = 'portal_admins';
    ELSIF rule.recipient_type = 'user' THEN
      SELECT id INTO list_id FROM recipient_lists WHERE code = 'triggering_user';
    ELSIF rule.recipient_type = 'dynamic' THEN
      -- Check if this is a referral
      IF rule.event_id = 'referral_created' THEN
        SELECT id INTO list_id FROM recipient_lists WHERE code = 'referred_user';
      ELSE
        SELECT id INTO list_id FROM recipient_lists WHERE code = 'triggering_user';
      END IF;
    ELSIF rule.recipient_type = 'role' THEN
      -- Check the config for specific roles
      IF rule.recipient_config::text ILIKE '%investor%' THEN
        SELECT id INTO list_id FROM recipient_lists WHERE code = 'investors';
      ELSE
        SELECT id INTO list_id FROM recipient_lists WHERE code = 'all_users';
      END IF;
    ELSE
      -- Default to portal admins for unknown types
      SELECT id INTO list_id FROM recipient_lists WHERE code = 'portal_admins';
    END IF;

    -- Update the rule with the new recipient_list_id
    IF list_id IS NOT NULL THEN
      UPDATE notification_rules
      SET recipient_list_id = list_id
      WHERE id = rule.id;
    END IF;
  END LOOP;
END;
$function$;


-- ======================================================================

-- Function 200/242
CREATE OR REPLACE FUNCTION public.record_rate_limit_action(p_user_id uuid, p_action_type text, p_referral_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    INSERT INTO public.portal_referral_rate_limits (user_id, action_type, referral_id)
    VALUES (p_user_id, p_action_type, p_referral_id);
END;
$function$;


-- ======================================================================

-- Function 201/242
CREATE OR REPLACE FUNCTION public.register_for_event(event_uuid uuid, registration_data jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_registration_id UUID;
  v_event RECORD;
BEGIN
  -- Get event details
  SELECT * INTO v_event
  FROM public.portal_events
  WHERE id = event_uuid
  AND status = 'published';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found or not published';
  END IF;

  -- Check registration limit
  IF v_event.registration_limit IS NOT NULL THEN
    IF (SELECT COUNT(*) FROM public.portal_event_registrations 
        WHERE event_id = event_uuid 
        AND attendance_status NOT IN ('cancelled', 'waitlisted')) >= v_event.registration_limit THEN
      -- Add to waitlist
      INSERT INTO public.portal_event_registrations (
        event_id, user_id, attendance_status, metadata
      ) VALUES (
        event_uuid, auth.uid(), 'waitlisted', registration_data
      )
      ON CONFLICT (event_id, user_id) DO UPDATE SET
        attendance_status = 'waitlisted',
        metadata = EXCLUDED.metadata
      RETURNING id INTO v_registration_id;
    ELSE
      -- Register normally
      INSERT INTO public.portal_event_registrations (
        event_id, user_id, attendance_status, metadata
      ) VALUES (
        event_uuid, auth.uid(), 'registered', registration_data
      )
      ON CONFLICT (event_id, user_id) DO UPDATE SET
        attendance_status = 'registered',
        metadata = EXCLUDED.metadata
      RETURNING id INTO v_registration_id;
    END IF;
  ELSE
    -- No limit, register normally
    INSERT INTO public.portal_event_registrations (
      event_id, user_id, attendance_status, metadata
    ) VALUES (
      event_uuid, auth.uid(), 'registered', registration_data
    )
    ON CONFLICT (event_id, user_id) DO UPDATE SET
      attendance_status = 'registered',
      metadata = EXCLUDED.metadata
    RETURNING id INTO v_registration_id;
  END IF;

  RETURN v_registration_id;
END;
$function$;


-- ======================================================================

-- Function 202/242
CREATE OR REPLACE FUNCTION public.render_template(template_text text, variables jsonb)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
DECLARE
  result TEXT := template_text;
  key TEXT;
  value TEXT;
BEGIN
  -- Loop through all variables and replace placeholders
  FOR key, value IN SELECT * FROM jsonb_each_text(variables)
  LOOP
    -- Replace {{key}} with value
    result := REPLACE(result, '{{' || key || '}}', COALESCE(value, ''));
  END LOOP;
  
  RETURN result;
END;
$function$;


-- ======================================================================

-- Function 203/242
CREATE OR REPLACE FUNCTION public.reopen_survey(p_survey_id uuid, p_new_due_date timestamp with time zone DEFAULT NULL::timestamp with time zone, p_clear_responses boolean DEFAULT false, p_admin_id uuid DEFAULT NULL::uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  survey_title TEXT;
  current_status TEXT;
  response_count INTEGER;
  cleared_count INTEGER := 0;
BEGIN
  -- Get survey details
  SELECT title, status INTO survey_title, current_status
  FROM public.portal_surveys
  WHERE id = p_survey_id;

  -- Check if survey exists
  IF survey_title IS NULL THEN
    RAISE EXCEPTION 'Survey not found';
  END IF;

  -- Check if survey is closed
  IF current_status != 'closed' THEN
    RAISE EXCEPTION 'Survey is not closed. Current status: %', current_status;
  END IF;

  -- Get current response count
  SELECT COUNT(*) INTO response_count
  FROM public.portal_survey_responses
  WHERE survey_id = p_survey_id;

  -- Clear responses if requested
  IF p_clear_responses AND response_count > 0 THEN
    -- Delete answers first (foreign key constraint)
    DELETE FROM public.portal_survey_answers
    WHERE response_id IN (
      SELECT id FROM public.portal_survey_responses
      WHERE survey_id = p_survey_id
    );

    -- Delete responses
    DELETE FROM public.portal_survey_responses
    WHERE survey_id = p_survey_id;

    cleared_count := response_count;
  END IF;

  -- Reopen the survey by setting status to 'published'
  UPDATE public.portal_surveys
  SET
    status = 'published',
    closed_at = NULL,
    due_date = COALESCE(p_new_due_date, due_date),
    updated_at = NOW()
  WHERE id = p_survey_id;

  -- Log the action if audit log exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'portal_audit_log'
  ) THEN
    INSERT INTO public.portal_audit_log (
      action,
      entity_type,
      entity_id,
      admin_id,
      details
    ) VALUES (
      'reopen_survey',
      'survey',
      p_survey_id,
      p_admin_id,
      json_build_object(
        'title', survey_title,
        'new_due_date', p_new_due_date,
        'responses_cleared', p_clear_responses,
        'cleared_count', cleared_count,
        'reopened_at', NOW()
      )
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'title', survey_title,
    'responses_cleared', cleared_count,
    'new_due_date', p_new_due_date,
    'status', 'published'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$function$;


-- ======================================================================

-- Function 204/242
CREATE OR REPLACE FUNCTION public.resolve_maintenance_record(p_record_id uuid, p_resolution text, p_resolved_at timestamp with time zone, p_vehicle_id uuid, p_operational_state text, p_additional_data jsonb DEFAULT '{}'::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Check permissions
  IF NOT can_access_maintenance_record(p_record_id) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;
  
  -- Update maintenance record
  UPDATE maintenance_records
  SET 
    resolution = p_resolution,
    resolved_at = p_resolved_at,
    resolved_by = auth.uid(),
    maintenance_record_status = 'Resolved'::maintenance_record_status,
    updated_at = now()
  WHERE id = p_record_id;
  
  -- Only update vehicle state if specifically provided
  IF p_operational_state IS NOT NULL AND p_vehicle_id IS NOT NULL THEN
    PERFORM update_vehicle_operational_state(p_vehicle_id, p_operational_state);
  ELSE
    -- Check if vehicle has any other active maintenance records
    -- If not, set to Available
    PERFORM update_vehicle_operational_state(p_vehicle_id);
  END IF;
END;
$function$;


-- ======================================================================

-- Function 205/242
CREATE OR REPLACE FUNCTION public.resolve_maintenance_record(p_record_id uuid, p_resolution text, p_resolved_at timestamp with time zone, p_vehicle_id uuid, p_operational_state text, p_resolution_reason text DEFAULT 'Repairs Completed'::text, p_odometer integer DEFAULT NULL::integer, p_assignee uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_operational_state operational_state;
  v_old_assignee uuid;
BEGIN
  -- Check permissions
  IF NOT can_access_maintenance_record(p_record_id) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;
  
  -- Convert operational_state string to enum type
  IF p_operational_state IS NOT NULL THEN
    v_operational_state := p_operational_state::operational_state;
  ELSE
    v_operational_state := 'Available'::operational_state;
  END IF;
  
  -- Get the current assignee for history tracking
  SELECT assignee INTO v_old_assignee
  FROM maintenance_records
  WHERE id = p_record_id;
  
  -- If assignee is changing during resolution, track it
  IF p_assignee IS NOT NULL AND p_assignee IS DISTINCT FROM v_old_assignee THEN
    INSERT INTO maintenance_assignment_history (
      maintenance_record_id,
      previous_assignee,
      new_assignee,
      assigned_by
    ) VALUES (
      p_record_id,
      v_old_assignee,
      p_assignee,
      auth.uid()
    );
  END IF;
  
  -- Update maintenance record
  UPDATE maintenance_records
  SET 
    resolution = p_resolution,
    resolved_at = p_resolved_at,
    resolved_by = auth.uid(),
    maintenance_record_status = 'Resolved'::maintenance_record_status,
    resolution_reason = p_resolution_reason::resolution_reason,
    updated_at = now(),
    odometer = COALESCE(p_odometer, odometer),
    assignee = COALESCE(p_assignee, assignee)
  WHERE id = p_record_id;
  
  -- If odometer is provided, update the vehicle's odometer as well
  IF p_odometer IS NOT NULL THEN
    -- First record in odometer history
    INSERT INTO odometer_history (
      vehicle_id,
      odometer,
      recorded_by,
      maintenance_record_id,
      notes
    ) VALUES (
      p_vehicle_id,
      p_odometer,
      auth.uid(),
      p_record_id,
      'Updated during maintenance record resolution'
    );
    
    -- Then try to update the vehicle if the new reading is higher or equal
    PERFORM update_odometer_with_validation(p_vehicle_id, p_odometer);
  END IF;
  
  -- Always set vehicle operational state when resolving
  IF p_vehicle_id IS NOT NULL THEN
    PERFORM update_vehicle_operational_state(p_vehicle_id, v_operational_state);
  END IF;
END;
$function$;


-- ======================================================================

-- Function 206/242
CREATE OR REPLACE FUNCTION public.resolve_maintenance_record(p_record_id uuid, p_resolution text, p_resolved_at timestamp with time zone, p_vehicle_id uuid, p_operational_state text, p_resolution_reason resolution_reason, p_additional_data jsonb DEFAULT '{}'::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Check permissions
  IF NOT can_access_maintenance_record(p_record_id) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;
  
  -- Update maintenance record
  UPDATE maintenance_records
  SET 
    resolution = p_resolution,
    resolved_at = p_resolved_at,
    resolved_by = auth.uid(),
    maintenance_record_status = 'Resolved'::maintenance_record_status,
    resolution_reason = p_resolution_reason,
    updated_at = now()
  WHERE id = p_record_id;
  
  -- Always set vehicle operational state to Available when resolving
  PERFORM update_vehicle_operational_state(p_vehicle_id, 'Available');
END;
$function$;


-- ======================================================================

-- Function 207/242
CREATE OR REPLACE FUNCTION public.resolve_maintenance_record_status(p_record_id uuid, p_resolution text, p_resolved_at timestamp with time zone, p_vehicle_status text)
 RETURNS SETOF maintenance_records
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_vehicle_id uuid;
BEGIN
  -- Check permissions
  IF NOT can_access_maintenance_record(p_record_id) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;
  
  -- Get the vehicle_id for later use
  SELECT vehicle_id INTO v_vehicle_id
  FROM maintenance_records
  WHERE id = p_record_id;
  
  IF v_vehicle_id IS NULL THEN
    RAISE EXCEPTION 'Maintenance record not found';
  END IF;
  
  -- Update maintenance record
  RETURN QUERY
  UPDATE maintenance_records
  SET 
    resolution = p_resolution,
    resolved_at = p_resolved_at,
    resolved_by = auth.uid(),
    state = 'in-service'::maintenance_state,  -- Set state to in-service (not operational)
    updated_at = now()
  WHERE id = p_record_id
  RETURNING *;
  
  -- Update vehicle status if provided
  IF p_vehicle_status IS NOT NULL AND v_vehicle_id IS NOT NULL THEN
    PERFORM update_vehicle_maintenance_status(v_vehicle_id, p_vehicle_status);
  END IF;
END;
$function$;


-- ======================================================================

-- Function 208/242
CREATE OR REPLACE FUNCTION public.save_survey_response(p_survey_id uuid, p_answers jsonb, p_is_complete boolean DEFAULT false)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_response_id UUID;
  v_answer JSONB;
BEGIN
  -- Create or update response
  INSERT INTO public.portal_survey_responses (
    survey_id, user_id, is_complete, completed_at, completion_percentage
  ) VALUES (
    p_survey_id, 
    auth.uid(), 
    p_is_complete,
    CASE WHEN p_is_complete THEN NOW() ELSE NULL END,
    CASE WHEN p_is_complete THEN 100 ELSE 50 END
  )
  ON CONFLICT (survey_id, user_id) DO UPDATE SET
    is_complete = EXCLUDED.is_complete,
    completed_at = EXCLUDED.completed_at,
    completion_percentage = EXCLUDED.completion_percentage
  RETURNING id INTO v_response_id;

  -- Save answers
  FOR v_answer IN SELECT * FROM jsonb_array_elements(p_answers)
  LOOP
    INSERT INTO public.portal_survey_answers (
      response_id, question_id, answer_text, answer_options, 
      answer_number, answer_date
    ) VALUES (
      v_response_id,
      (v_answer->>'question_id')::UUID,
      v_answer->>'answer_text',
      v_answer->'answer_options',
      (v_answer->>'answer_number')::NUMERIC,
      (v_answer->>'answer_date')::DATE
    )
    ON CONFLICT (response_id, question_id) DO UPDATE SET
      answer_text = EXCLUDED.answer_text,
      answer_options = EXCLUDED.answer_options,
      answer_number = EXCLUDED.answer_number,
      answer_date = EXCLUDED.answer_date,
      answered_at = NOW();
  END LOOP;

  RETURN v_response_id;
END;
$function$;


-- ======================================================================

-- Function 209/242
CREATE OR REPLACE FUNCTION public.search_contacts(search_query text, p_market_id uuid DEFAULT NULL::uuid, p_station_id uuid DEFAULT NULL::uuid, p_dsp_id uuid DEFAULT NULL::uuid, p_status text DEFAULT NULL::text, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, first_name character varying, last_name character varying, email character varying, phone character varying, title contact_title_enum, contact_status character varying, market_id uuid, market_name character varying, station_id uuid, station_code character varying, dsp_id uuid, dsp_name character varying, dsp_code character varying, dsp_locations text, interaction_count bigint, last_contacted_at timestamp with time zone, created_at timestamp with time zone, rank real)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    RETURN QUERY
    WITH contact_locations AS (
      SELECT 
        cdl.contact_id,
        STRING_AGG(DISTINCT m.name || ' - ' || s.station_code, ', ' ORDER BY m.name || ' - ' || s.station_code) as locations
      FROM contact_dsp_locations cdl
      INNER JOIN dsp_locations dl ON dl.id = cdl.dsp_location_id
      INNER JOIN stations s ON s.id = dl.station_id
      LEFT JOIN markets m ON m.id = s.market_id
      WHERE dl.is_active = true
      GROUP BY cdl.contact_id
    )
    SELECT 
        c.id,
        c.first_name,
        c.last_name,
        c.email,
        c.phone,
        c.title,
        c.contact_status,
        c.market_id,
        m.name as market_name,
        c.station_id,
        s.station_code,
        c.dsp_id,
        d.dsp_name,
        d.dsp_code,
        cl.locations as dsp_locations,
        COUNT(DISTINCT i.id) as interaction_count,
        c.last_contacted_at,
        c.created_at,
        CASE 
            WHEN search_query IS NULL OR search_query = '' THEN 1.0
            ELSE ts_rank(
                to_tsvector('english', 
                    coalesce(c.first_name, '') || ' ' || 
                    coalesce(c.last_name, '') || ' ' || 
                    coalesce(c.email, '') || ' ' ||
                    coalesce(c.phone, '') || ' ' ||
                    coalesce(c.notes, '') || ' ' ||
                    coalesce(d.dsp_code, '') || ' ' ||
                    coalesce(d.dsp_name, '') || ' ' ||
                    coalesce(cl.locations, '')
                ),
                plainto_tsquery('english', search_query)
            )
        END as rank
    FROM public.contacts c
    LEFT JOIN public.markets m ON c.market_id = m.id
    LEFT JOIN public.stations s ON c.station_id = s.id
    LEFT JOIN public.dsps d ON c.dsp_id = d.id
    LEFT JOIN public.interactions i ON c.id = i.contact_id
    LEFT JOIN contact_locations cl ON cl.contact_id = c.id
    WHERE c.is_active = true
        AND (p_market_id IS NULL OR c.market_id = p_market_id)
        AND (p_station_id IS NULL OR c.station_id = p_station_id)
        AND (p_dsp_id IS NULL OR c.dsp_id = p_dsp_id)
        AND (p_status IS NULL OR c.contact_status = p_status)
        AND (
            search_query IS NULL 
            OR search_query = ''
            OR to_tsvector('english', 
                coalesce(c.first_name, '') || ' ' || 
                coalesce(c.last_name, '') || ' ' || 
                coalesce(c.email, '') || ' ' ||
                coalesce(c.phone, '') || ' ' ||
                coalesce(c.notes, '') || ' ' ||
                coalesce(d.dsp_code, '') || ' ' ||
                coalesce(d.dsp_name, '') || ' ' ||
                coalesce(cl.locations, '')
            ) @@ plainto_tsquery('english', search_query)
        )
    GROUP BY 
        c.id, c.first_name, c.last_name, c.email, c.phone, 
        c.title, c.contact_status, c.last_contacted_at, c.created_at,
        c.market_id, m.name, c.station_id, s.station_code, 
        c.dsp_id, d.dsp_name, d.dsp_code, cl.locations
    ORDER BY rank DESC, c.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$function$;


-- ======================================================================

-- Function 210/242
CREATE OR REPLACE FUNCTION public.set_dev_password(user_email text, new_password text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_user_id uuid;
    v_password_hash text;
    v_calling_user_role text;
BEGIN
    -- Check admin permission
    SELECT role INTO v_calling_user_role
    FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'admin', 'developer')
    LIMIT 1;

    IF v_calling_user_role IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Only administrators can set dev passwords'
        );
    END IF;

    -- Get user ID from profiles
    SELECT id INTO v_user_id
    FROM profiles
    WHERE lower(email) = lower(user_email);

    IF v_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User not found'
        );
    END IF;

    -- Use pre-computed hashes for known passwords
    CASE new_password
        WHEN 'FleetDRMS!' THEN 
            v_password_hash := '$2a$10$knWloUPDUEOUR8dKz.RUyuwTtiTROffQfWPqVy4wlT1Ys3hVF8NXy';
        WHEN 'TempPassword123!' THEN 
            v_password_hash := '$2a$10$AY6ls4T2C6r1kN3O/i/lLOuKJF5voH0eKpCU50zl6cRLHtP0rEQCy';
        WHEN 'Password123!' THEN 
            v_password_hash := '$2a$10$aJg4ss4FzAn6hOuzDPPKK.EXVQWQHZ8J7wN/uHN6Aav15.RdYrYKO';
        ELSE
            -- For development, just store the plain password with a prefix
            v_password_hash := 'PLAIN:' || new_password;
    END CASE;

    -- Insert or update dev_auth
    INSERT INTO public.dev_auth (user_id, email, password_hash, updated_at)
    VALUES (v_user_id, user_email, v_password_hash, NOW())
    ON CONFLICT (user_id) DO UPDATE
    SET 
        password_hash = EXCLUDED.password_hash,
        updated_at = NOW();

    RETURN json_build_object(
        'success', true,
        'message', 'Dev password set successfully',
        'user_email', user_email,
        'password', new_password,
        'note', 'Use the Dev Login button on the auth page'
    );
END;
$function$;


-- ======================================================================

-- Function 211/242
CREATE OR REPLACE FUNCTION public.simple_password_test(email_to_test text, password_to_test text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'auth'
AS $function$
DECLARE
  v_user_id uuid;
  v_encrypted_password text;
  v_test_result boolean;
  v_search_path text;
BEGIN
  -- Get current search path for diagnostics
  SHOW search_path INTO v_search_path;

  -- Find user by email
  SELECT id, encrypted_password 
  INTO v_user_id, v_encrypted_password
  FROM auth.users
  WHERE lower(email) = lower(email_to_test);
  
  -- If no user found
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('User with email %s not found', email_to_test),
      'search_path', v_search_path
    );
  END IF;

  -- Test the password using each approach
  -- Method 1: Direct crypt comparison
  BEGIN
    v_test_result := (extensions.crypt(password_to_test, v_encrypted_password) = v_encrypted_password);
  
    RETURN jsonb_build_object(
      'success', true,
      'user_id', v_user_id,
      'password_matches', v_test_result,
      'encrypted_format', substring(v_encrypted_password from 1 for 29),
      'search_path', v_search_path,
      'method', 'extensions.crypt comparison'
    );
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'error_detail', SQLSTATE,
      'search_path', v_search_path
    );
  END;
END;
$function$;


-- ======================================================================

-- Function 212/242
CREATE OR REPLACE FUNCTION public.test_admin_permissions()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id UUID;
  v_user_role TEXT;
  v_user_email TEXT;
BEGIN
  v_user_id := auth.uid();

  SELECT role, email INTO v_user_role, v_user_email
  FROM public.profiles
  WHERE id = v_user_id;

  RETURN json_build_object(
    'user_id', v_user_id,
    'email', v_user_email,
    'role', v_user_role,
    'is_admin', v_user_role IN ('admin', 'super_admin'),
    'can_delete', CASE
      WHEN v_user_role IN ('admin', 'super_admin') THEN true
      ELSE false
    END
  );
END;
$function$;


-- ======================================================================

-- Function 213/242
CREATE OR REPLACE FUNCTION public.test_password_methods(email_to_test text, password_to_test text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'auth'
AS $function$
DECLARE
  v_user_id uuid;
  v_email text;
  v_encrypted_password text;
  v_result jsonb;
  v_method1 boolean;
  v_method2 boolean;
  v_method3 boolean;
  v_method4 boolean;
  v_method5 boolean;
BEGIN
  -- Find user by email
  SELECT id, email, encrypted_password 
  INTO v_user_id, v_email, v_encrypted_password
  FROM auth.users
  WHERE lower(email) = lower(email_to_test);
  
  -- If no user found
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'error', format('User with email %s not found', email_to_test)
    );
  END IF;

  -- Try different verification methods
  
  -- Method 1: Standard comparison with extensions prefix
  BEGIN
    v_method1 := (extensions.crypt(password_to_test, v_encrypted_password) = v_encrypted_password);
  EXCEPTION WHEN OTHERS THEN
    v_method1 := false;
  END;
  
  -- Method 2: Direct crypt with no prefix
  BEGIN
    v_method2 := (crypt(password_to_test, v_encrypted_password) = v_encrypted_password);
  EXCEPTION WHEN OTHERS THEN
    v_method2 := false;
  END;
  
  -- Method 3: Using pgcrypto explicit
  BEGIN
    v_method3 := (pgcrypto.crypt(password_to_test, v_encrypted_password) = v_encrypted_password);
  EXCEPTION WHEN OTHERS THEN
    v_method3 := false;
  END;
  
  -- Method 4: Check if there's an auth.check_password function
  BEGIN
    IF EXISTS (
      SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
      WHERE n.nspname = 'auth' AND p.proname = 'check_password'
    ) THEN
      EXECUTE 'SELECT auth.check_password($1, $2)' INTO v_method4 USING v_email, password_to_test;
    ELSE
      v_method4 := false;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_method4 := false;
  END;
  
  -- Method 5: Check for Gotrue format (Supabase auth system)
  BEGIN
    IF v_encrypted_password LIKE '$2a$%' OR v_encrypted_password LIKE '$2b$%' THEN
      -- Likely bcrypt - already tested in methods 1-3
      v_method5 := false;
    ELSIF v_encrypted_password LIKE '$pbkdf2%' THEN
      -- PBKDF2 format - not supported in our direct tests
      v_method5 := false;
    ELSE
      -- Unknown format
      v_method5 := false;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_method5 := false;
  END;
  
  -- Return results of all methods
  RETURN jsonb_build_object(
    'user_id', v_user_id,
    'password_format', substring(v_encrypted_password from 1 for 7),
    'password_length', length(v_encrypted_password),
    'method1_extensions_crypt', v_method1,
    'method2_direct_crypt', v_method2,
    'method3_pgcrypto_crypt', v_method3,
    'method4_auth_check_password', v_method4,
    'method5_special_format', v_method5,
    'timestamp', now()
  );
END;
$function$;


-- ======================================================================

-- Function 214/242
CREATE OR REPLACE FUNCTION public.test_pgcrypto_access()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'auth'
AS $function$
DECLARE
  test_result text;
  schema_search_path text;
BEGIN
  -- First, capture the current search_path for debugging
  SHOW search_path INTO schema_search_path;
  
  -- Try different approaches to access gen_salt
  BEGIN
    -- Attempt 1: Direct call
    SELECT gen_salt('bf', 10) INTO test_result;
    RETURN 'Success using direct gen_salt call: ' || test_result || ', Search path: ' || schema_search_path;
  EXCEPTION WHEN OTHERS THEN
    BEGIN
      -- Attempt 2: With extensions schema prefix
      SELECT extensions.gen_salt('bf', 10) INTO test_result;
      RETURN 'Success using extensions.gen_salt: ' || test_result || ', Search path: ' || schema_search_path;
    EXCEPTION WHEN OTHERS THEN
      BEGIN
        -- Attempt 3: With public schema prefix
        SELECT public.gen_salt('bf', 10) INTO test_result;
        RETURN 'Success using public.gen_salt: ' || test_result || ', Search path: ' || schema_search_path;
      EXCEPTION WHEN OTHERS THEN
        BEGIN
          -- Attempt 4: pgcrypto schema reference
          SELECT pgcrypto.gen_salt('bf', 10) INTO test_result;
          RETURN 'Success using pgcrypto.gen_salt: ' || test_result || ', Search path: ' || schema_search_path;
        EXCEPTION WHEN OTHERS THEN
          BEGIN
            -- Attempt 5: Check if the pgcrypto extension is installed
            SELECT EXISTS (
              SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto'
            ) INTO test_result;
            
            IF test_result = 'true' THEN
              RETURN 'pgcrypto extension is installed, but all gen_salt access attempts failed. Search path: ' || schema_search_path;
            ELSE
              RETURN 'pgcrypto extension is NOT installed. Search path: ' || schema_search_path;
            END IF;
          EXCEPTION WHEN OTHERS THEN
            RETURN 'All attempts failed. Last error: ' || SQLERRM || ', Search path: ' || schema_search_path;
          END;
        END;
      END;
    END;
  END;
END;
$function$;


-- ======================================================================

-- Function 215/242
CREATE OR REPLACE FUNCTION public.test_simple_function(test_input text)
 RETURNS text
 LANGUAGE sql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
  SELECT 'Test successful: ' || test_input;
$function$;


-- ======================================================================

-- Function 216/242
CREATE OR REPLACE FUNCTION public.toggle_module_status(p_module_id uuid, p_organization_id uuid, p_is_enabled boolean)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_exists BOOLEAN;
BEGIN
  -- Check if caller is an admin
  IF NOT (SELECT EXISTS(SELECT 1 FROM admin_users_view WHERE user_id = auth.uid())) THEN
    RAISE EXCEPTION 'Only administrators can toggle module status';
  END IF;

  -- Check if the configuration already exists
  SELECT EXISTS(
    SELECT 1 FROM module_configurations 
    WHERE module_id = p_module_id AND organization_id = p_organization_id
  ) INTO v_exists;

  IF v_exists THEN
    -- Update existing configuration
    UPDATE module_configurations
    SET 
      is_enabled = p_is_enabled,
      updated_at = NOW(),
      updated_by = auth.uid()
    WHERE 
      module_id = p_module_id AND 
      organization_id = p_organization_id;
  ELSE
    -- Insert new configuration
    INSERT INTO module_configurations (
      module_id, 
      organization_id, 
      is_enabled, 
      created_by, 
      updated_by
    )
    VALUES (
      p_module_id, 
      p_organization_id, 
      p_is_enabled, 
      auth.uid(), 
      auth.uid()
    );
  END IF;

  RETURN TRUE;
END;
$function$;


-- ======================================================================

-- Function 217/242
CREATE OR REPLACE FUNCTION public.track_maintenance_assignment_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF (OLD.assignee IS DISTINCT FROM NEW.assignee) THEN
    INSERT INTO maintenance_assignment_history (
      maintenance_record_id,
      previous_assignee,
      new_assignee,
      assigned_by
    ) VALUES (
      NEW.id,
      OLD.assignee,
      NEW.assignee,
      COALESCE(auth.uid(), NEW.created_by)
    );
  END IF;
  RETURN NEW;
END;
$function$;


-- ======================================================================

-- Function 218/242
CREATE OR REPLACE FUNCTION public.track_maintenance_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF (OLD.maintenance_record_status IS DISTINCT FROM NEW.maintenance_record_status) THEN
    INSERT INTO maintenance_status_history (
      maintenance_record_id,
      previous_status,
      new_status,
      changed_by
    ) VALUES (
      NEW.id,
      OLD.maintenance_record_status,
      NEW.maintenance_record_status,
      COALESCE(auth.uid(), NEW.created_by)
    );
  END IF;
  RETURN NEW;
END;
$function$;


-- ======================================================================

-- Function 219/242
CREATE OR REPLACE FUNCTION public.unarchive_update(p_update_id uuid, p_admin_id uuid, p_new_status text DEFAULT 'draft'::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  update_title TEXT;
  current_status TEXT;
BEGIN
  -- Get update details
  SELECT title, status INTO update_title, current_status
  FROM portal_updates 
  WHERE id = p_update_id;
  
  -- Check if update exists
  IF update_title IS NULL THEN
    RAISE EXCEPTION 'Update not found';
  END IF;
  
  -- Check if archived
  IF current_status != 'archived' THEN
    RAISE EXCEPTION 'Update is not archived';
  END IF;
  
  -- Validate new status
  IF p_new_status NOT IN ('draft', 'published') THEN
    RAISE EXCEPTION 'Invalid status. Must be draft or published';
  END IF;
  
  -- Unarchive the update
  UPDATE portal_updates
  SET 
    status = p_new_status,
    archived_at = NULL,
    archived_by = NULL,
    updated_at = NOW(),
    published_at = CASE WHEN p_new_status = 'published' THEN NOW() ELSE published_at END
  WHERE id = p_update_id;
  
  -- Log the action
  INSERT INTO portal_audit_log (
    action, 
    entity_type, 
    entity_id, 
    admin_id, 
    details
  ) VALUES (
    'unarchive_update',
    'update',
    p_update_id,
    p_admin_id,
    json_build_object(
      'title', update_title,
      'new_status', p_new_status,
      'unarchived_at', NOW()
    )
  );
  
  RETURN json_build_object(
    'success', true,
    'title', update_title,
    'new_status', p_new_status
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$function$;


-- ======================================================================

-- Function 220/242
CREATE OR REPLACE FUNCTION public.update_businesses_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;


-- ======================================================================

-- Function 221/242
CREATE OR REPLACE FUNCTION public.update_calculator_submission_is_latest()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- For users with user_id, mark all their submissions as not latest
  IF NEW.user_id IS NOT NULL THEN
    UPDATE calculator_submissions
    SET is_latest = false
    WHERE user_id = NEW.user_id
    AND id != NEW.id;

    -- Mark the new/updated submission as latest
    NEW.is_latest = true;

  -- For anonymous submissions (no user_id), use email
  ELSIF NEW.user_email IS NOT NULL THEN
    UPDATE calculator_submissions
    SET is_latest = false
    WHERE user_email = NEW.user_email
    AND user_id IS NULL
    AND id != NEW.id;

    -- Mark the new/updated submission as latest
    NEW.is_latest = true;
  END IF;

  RETURN NEW;
END;
$function$;


-- ======================================================================

-- Function 222/242
CREATE OR REPLACE FUNCTION public.update_campaign_link(p_link_id uuid, p_campaign_name text, p_notes text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  UPDATE marketing_campaign_links
  SET
    campaign_name = p_campaign_name,
    notes = p_notes,
    updated_at = NOW()
  WHERE id = p_link_id;

  RETURN FOUND;
END;
$function$;


-- ======================================================================

-- Function 223/242
CREATE OR REPLACE FUNCTION public.update_contact_last_contacted()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE public.contacts 
    SET last_contacted_at = NEW.interaction_date
    WHERE id = NEW.contact_id;
    RETURN NEW;
END;
$function$;


-- ======================================================================

-- Function 224/242
CREATE OR REPLACE FUNCTION public.update_contact_submission_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;


-- ======================================================================

-- Function 225/242
CREATE OR REPLACE FUNCTION public.update_event_date_attendees()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE portal_event_dates 
        SET current_attendees = current_attendees + 1 + (
            SELECT COUNT(*) FROM portal_event_guests 
            WHERE registration_id = NEW.id
        )
        WHERE id = NEW.event_date_id;
    ELSIF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.cancelled_at IS NOT NULL AND OLD.cancelled_at IS NULL) THEN
        UPDATE portal_event_dates 
        SET current_attendees = GREATEST(0, current_attendees - 1 - (
            SELECT COUNT(*) FROM portal_event_guests 
            WHERE registration_id = COALESCE(OLD.id, NEW.id)
        ))
        WHERE id = COALESCE(OLD.event_date_id, NEW.event_date_id);
    END IF;
    RETURN NEW;
END;
$function$;


-- ======================================================================

-- Function 226/242
CREATE OR REPLACE FUNCTION public.update_event_date_guests()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_event_date_id UUID;
BEGIN
    SELECT event_date_id INTO v_event_date_id
    FROM portal_event_registrations
    WHERE id = COALESCE(NEW.registration_id, OLD.registration_id);
    
    IF TG_OP = 'INSERT' THEN
        UPDATE portal_event_dates 
        SET current_attendees = current_attendees + 1
        WHERE id = v_event_date_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE portal_event_dates 
        SET current_attendees = GREATEST(0, current_attendees - 1)
        WHERE id = v_event_date_id;
    END IF;
    RETURN NEW;
END;
$function$;


-- ======================================================================

-- Function 227/242
CREATE OR REPLACE FUNCTION public.update_latest_submission()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Mark all previous submissions by this user as not latest
  UPDATE public.calculator_submissions
  SET is_latest = false
  WHERE user_id = NEW.user_id
  AND id != NEW.id;
  
  RETURN NEW;
END;
$function$;


-- ======================================================================

-- Function 228/242
CREATE OR REPLACE FUNCTION public.update_maintenance_record(p_id uuid, p_data jsonb)
 RETURNS SETOF maintenance_records
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_maintenance_record_status maintenance_record_status;
  v_vehicle_id uuid;
  v_operational_state text;
  v_odometer integer;
BEGIN
  -- Check permissions first
  IF NOT can_access_maintenance_record(p_id) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  -- Get vehicle ID for later use
  SELECT vehicle_id INTO v_vehicle_id
  FROM maintenance_records
  WHERE id = p_id;
  
  -- Extract the operational state for vehicle update
  v_operational_state := p_data->>'operational_state';
  
  -- Extract odometer for vehicle update
  IF p_data->>'odometer' IS NOT NULL AND (p_data->>'odometer')::integer > 0 THEN
    v_odometer := (p_data->>'odometer')::integer;
    RAISE NOTICE 'Updating record % with odometer reading: %', p_id, v_odometer;
  END IF;
  
  RAISE NOTICE 'Updating maintenance record % with operational state: %', p_id, v_operational_state;
  
  -- Handle maintenance_record_status conversion to ensure we only use valid enum values
  IF p_data->>'maintenance_record_status' IS NOT NULL THEN
    BEGIN
      v_maintenance_record_status := (p_data->>'maintenance_record_status')::maintenance_record_status;
    EXCEPTION WHEN OTHERS THEN
      -- Default to previous status if invalid value provided
      SELECT maintenance_record_status INTO v_maintenance_record_status FROM maintenance_records WHERE id = p_id;
    END;
  ELSE
    -- No status provided, keep existing
    SELECT maintenance_record_status INTO v_maintenance_record_status FROM maintenance_records WHERE id = p_id;
  END IF;
  
  -- Update and return the record
  -- CRITICAL: Removed operational_state column from UPDATE statement as it doesn't exist
  RETURN QUERY
  UPDATE maintenance_records
  SET 
    vehicle_id = COALESCE((p_data->>'vehicle_id')::uuid, vehicle_id),
    issue_title = COALESCE(p_data->>'issue_title', issue_title),
    issue = COALESCE(p_data->>'issue', issue),
    location = COALESCE((p_data->>'location')::maintenance_location, location),
    severity = COALESCE((p_data->>'severity')::smallint, severity),
    maintenance_record_status = v_maintenance_record_status,
    support_ticket = CASE
      WHEN p_data->>'support_ticket' = '' THEN NULL
      WHEN p_data->>'support_ticket' IS NULL THEN support_ticket
      ELSE (p_data->>'support_ticket')::integer
    END,
    afs_eligible = COALESCE(p_data->>'afs_eligible', afs_eligible),
    maintenance_notes = COALESCE(p_data->>'maintenance_notes', maintenance_notes),
    date_due = CASE
      WHEN p_data->>'date_due' = '' THEN NULL
      WHEN p_data->>'date_due' IS NULL THEN date_due
      ELSE (p_data->>'date_due')::date
    END,
    resolution = COALESCE(p_data->>'resolution', resolution),
    resolved_at = CASE
      WHEN p_data->>'resolved_at' = '' THEN NULL
      WHEN p_data->>'resolved_at' IS NULL THEN resolved_at
      ELSE (p_data->>'resolved_at')::timestamp with time zone
    END,
    resolved_by = COALESCE((p_data->>'resolved_by')::uuid, resolved_by),
    assignee = COALESCE((p_data->>'assignee')::uuid, assignee),
    odometer = CASE
      WHEN p_data->>'odometer' = '' THEN NULL
      WHEN p_data->>'odometer' IS NULL THEN odometer
      ELSE (p_data->>'odometer')::integer
    END,
    updated_at = now()
  WHERE id = p_id
  RETURNING *;
  
  -- If odometer is provided, update the vehicle's odometer as well
  IF v_odometer IS NOT NULL AND v_odometer > 0 AND v_vehicle_id IS NOT NULL THEN
    RAISE NOTICE 'Also updating vehicle % odometer to %', v_vehicle_id, v_odometer;
    PERFORM update_odometer_with_validation(v_vehicle_id, v_odometer);
  END IF;
  
  -- Update vehicle's operational state if provided
  IF v_operational_state IS NOT NULL AND v_vehicle_id IS NOT NULL THEN
    -- Validate operational state before updating (only attempt update with valid values)
    IF v_operational_state IN ('Available', 'Grounded') THEN
      RAISE NOTICE 'Also updating vehicle % operational state to %', v_vehicle_id, v_operational_state;
      PERFORM update_vehicle_operational_state(v_vehicle_id, v_operational_state);
    ELSE
      RAISE NOTICE 'Skipping vehicle operational state update due to invalid value: %', v_operational_state;
    END IF;
  END IF;
END;
$function$;


-- ======================================================================

-- Function 229/242
CREATE OR REPLACE FUNCTION public.update_odometer_from_maintenance_record()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_vehicle_id UUID;
  v_current_odometer INTEGER;
BEGIN
  -- Get the vehicle ID from the maintenance record
  v_vehicle_id := NEW.vehicle_id;
  
  -- If odometer is provided in maintenance record, update the vehicle and create history
  IF NEW.odometer IS NOT NULL THEN
    -- Get current odometer reading
    SELECT odometer INTO v_current_odometer
    FROM public.fleet
    WHERE id = v_vehicle_id;
    
    -- Update vehicle odometer only if the new reading is higher than current
    IF v_current_odometer IS NULL OR NEW.odometer > v_current_odometer THEN
      UPDATE public.fleet
      SET odometer = NEW.odometer
      WHERE id = v_vehicle_id;
    END IF;
    
    -- Always record in history
    INSERT INTO public.odometer_history (
      vehicle_id,
      odometer,
      recorded_by,
      maintenance_record_id,
      notes
    ) VALUES (
      v_vehicle_id,
      NEW.odometer,
      NEW.created_by,
      NEW.id,
      'Added via maintenance record'
    );
  END IF;
  
  RETURN NEW;
END;
$function$;


-- ======================================================================

-- Function 230/242
CREATE OR REPLACE FUNCTION public.update_odometer_history()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only create history entry if odometer value has changed and is not null
  IF (NEW.odometer IS NOT NULL AND (OLD.odometer IS NULL OR NEW.odometer <> OLD.odometer)) THEN
    INSERT INTO public.odometer_history (
      vehicle_id,
      odometer,
      recorded_by,
      notes
    ) VALUES (
      NEW.id,
      NEW.odometer,
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
      'Updated via vehicle edit'
    );
  END IF;
  
  RETURN NEW;
END;
$function$;


-- ======================================================================

-- Function 231/242
CREATE OR REPLACE FUNCTION public.update_odometer_with_validation(p_vehicle_id uuid, p_odometer integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_current_odometer INTEGER;
BEGIN
  -- Get current odometer reading
  SELECT odometer INTO v_current_odometer
  FROM public.fleet
  WHERE id = p_vehicle_id;
  
  -- Update vehicle odometer only if the new reading is higher than current or current is null
  IF v_current_odometer IS NULL OR p_odometer >= v_current_odometer THEN
    UPDATE public.fleet
    SET 
      odometer = p_odometer,
      updated_at = now()
    WHERE id = p_vehicle_id;
    RETURN TRUE;
  END IF;
  
  -- No update needed if current reading is higher
  RETURN FALSE;
END;
$function$;


-- ======================================================================

-- Function 232/242
CREATE OR REPLACE FUNCTION public.update_preferences_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF (OLD.email_updates IS DISTINCT FROM NEW.email_updates OR
      OLD.email_surveys IS DISTINCT FROM NEW.email_surveys OR
      OLD.email_events IS DISTINCT FROM NEW.email_events) THEN
    NEW.preferences_updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$function$;


-- ======================================================================

-- Function 233/242
CREATE OR REPLACE FUNCTION public.update_recipient_lists_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;


-- ======================================================================

-- Function 234/242
CREATE OR REPLACE FUNCTION public.update_role_permission(p_role app_role, p_permission_id uuid, p_granted boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  -- Check if user is super admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Only super admins can modify permissions';
  END IF;

  IF p_granted THEN
    -- Grant permission
    INSERT INTO role_permissions (role, permission_id, granted_by)
    VALUES (p_role, p_permission_id, auth.uid())
    ON CONFLICT (role, permission_id, organization_id) DO NOTHING;
  ELSE
    -- Revoke permission
    DELETE FROM role_permissions 
    WHERE role = p_role AND permission_id = p_permission_id;
  END IF;
END;
$function$;


-- ======================================================================

-- Function 235/242
CREATE OR REPLACE FUNCTION public.update_setting(setting_key text, setting_value jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  UPDATE public.system_settings 
  SET 
    value = setting_value,
    updated_at = NOW(),
    updated_by = auth.uid()
  WHERE key = setting_key;
  
  RETURN FOUND;
END;
$function$;


-- ======================================================================

-- Function 236/242
CREATE OR REPLACE FUNCTION public.update_survey_question_count()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
    BEGIN
      IF TG_OP = 'INSERT' THEN
        UPDATE public.portal_surveys
        SET question_count = (
          SELECT COUNT(*) FROM public.portal_survey_questions
          WHERE survey_id = NEW.survey_id
        )
        WHERE id = NEW.survey_id;
      ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.portal_surveys
        SET question_count = (
          SELECT COUNT(*) FROM public.portal_survey_questions
          WHERE survey_id = OLD.survey_id
        )
        WHERE id = OLD.survey_id;
      END IF;
      RETURN NULL;
    END;
$function$;


-- ======================================================================

-- Function 237/242
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;


-- ======================================================================

-- Function 238/242
CREATE OR REPLACE FUNCTION public.update_vehicle_operational_state(p_vehicle_id uuid, p_operational_state text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_has_maintenance boolean;
  v_state text;
BEGIN
  -- Log incoming parameters for debugging
  RAISE NOTICE 'update_vehicle_operational_state called with vehicle_id: %, operational_state: %', p_vehicle_id, p_operational_state;
  
  -- First check if vehicle has any active maintenance records
  SELECT EXISTS (
    SELECT 1
    FROM maintenance_records
    WHERE vehicle_id = p_vehicle_id
    AND maintenance_record_status != 'Resolved'
  ) INTO v_has_maintenance;
  
  RAISE NOTICE 'Vehicle has active maintenance: %', v_has_maintenance;
  
  -- If p_operational_state is provided, use it directly
  IF p_operational_state IS NOT NULL THEN
    v_state := p_operational_state;
    RAISE NOTICE 'Using provided state: %', v_state;
  ELSE
    -- Otherwise set a suitable default based on maintenance status
    IF v_has_maintenance THEN
      v_state := 'Grounded';
      RAISE NOTICE 'Vehicle has maintenance, setting to Grounded';
    ELSE
      v_state := 'Available';
      RAISE NOTICE 'No active maintenance, setting to Available';
    END IF;
  END IF;
  
  -- Update the vehicle state
  UPDATE fleet
  SET operational_state = v_state::operational_state,
      updated_at = now()
  WHERE id = p_vehicle_id;
  
  RAISE NOTICE 'Updated vehicle % state to %', p_vehicle_id, v_state;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error updating vehicle operational state: %', SQLERRM;
    RAISE;
    RETURN FALSE;
END;
$function$;


-- ======================================================================

-- Function 239/242
CREATE OR REPLACE FUNCTION public.update_vehicle_type(p_vehicle_id uuid, p_vehicle_type vehicle_type)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE fleet
  SET 
    vehicle_type = p_vehicle_type,
    updated_at = now()
  WHERE id = p_vehicle_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error updating vehicle type: %', SQLERRM;
    RETURN FALSE;
END;
$function$;


-- ======================================================================

-- Function 240/242
CREATE OR REPLACE FUNCTION public.vehicle_has_active_maintenance(p_vehicle_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM maintenance_records
    WHERE vehicle_id = p_vehicle_id
    AND state != 'operational'::maintenance_state  -- Check state instead of is_active
  );
END;
$function$;


-- ======================================================================

-- Function 241/242
CREATE OR REPLACE FUNCTION public.verify_dev_password(user_email character varying, provided_password character varying)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
    v_user RECORD;
    v_password_matches BOOLEAN;
    v_roles TEXT[];
BEGIN
    -- Find user in dev_auth
    SELECT 
        da.user_id,
        da.email,
        da.password_hash,
        p.first_name,
        p.last_name,
        p.status
    INTO v_user
    FROM dev_auth da
    JOIN profiles p ON p.id = da.user_id
    WHERE LOWER(da.email) = LOWER(user_email)
    LIMIT 1;
    
    IF NOT FOUND THEN
        -- Try to find user for logging purposes
        PERFORM record_user_login(
            (SELECT id FROM profiles WHERE LOWER(email) = LOWER(user_email) LIMIT 1),
            'dev',
            NULL,
            NULL,
            false,
            'User not found in dev_auth'
        );
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid credentials'
        );
    END IF;
    
    -- Check if user is active
    IF v_user.status != 'active' THEN
        PERFORM record_user_login(
            v_user.user_id,
            'dev',
            NULL,
            NULL,
            false,
            'Account is not active'
        );
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Account is not active'
        );
    END IF;
    
    -- Verify password using bcrypt
    v_password_matches := (v_user.password_hash = extensions.crypt(provided_password, v_user.password_hash));
    
    IF NOT v_password_matches THEN
        PERFORM record_user_login(
            v_user.user_id,
            'dev',
            NULL,
            NULL,
            false,
            'Invalid password'
        );
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid credentials'
        );
    END IF;
    
    -- Record successful login (if function exists)
    BEGIN
        PERFORM record_user_login(
            v_user.user_id,
            'dev',
            NULL,
            NULL,
            true,
            NULL
        );
    EXCEPTION WHEN undefined_function THEN
        -- record_user_login might not exist yet, that's okay
        NULL;
    END;
    
    -- Get user roles
    SELECT array_agg(role ORDER BY role) INTO v_roles
    FROM user_roles
    WHERE user_id = v_user.user_id;
    
    -- Return success with user data
    RETURN jsonb_build_object(
        'success', true,
        'user', jsonb_build_object(
            'id', v_user.user_id,
            'email', v_user.email,
            'name', COALESCE(v_user.first_name || ' ' || v_user.last_name, v_user.email),
            'first_name', v_user.first_name,
            'last_name', v_user.last_name,
            'roles', COALESCE(v_roles, ARRAY[]::text[])
        )
    );
EXCEPTION WHEN OTHERS THEN
    -- Log the error but return a generic message
    RAISE WARNING 'Error in verify_dev_password: %', SQLERRM;
    RETURN jsonb_build_object(
        'success', false,
        'error', 'Authentication failed'
    );
END;
$function$;


-- ======================================================================

-- Function 242/242
CREATE OR REPLACE FUNCTION public.verify_temp_password(user_email text, provided_password text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id uuid;
  v_stored_password text;
  v_email text;
BEGIN
  -- Get user and their temp password
  SELECT 
    p.id,
    p.email,
    p.metadata->>'temp_password'
  INTO v_user_id, v_email, v_stored_password
  FROM profiles p
  WHERE lower(p.email) = lower(user_email)
  AND p.metadata->>'use_temp_auth' = 'true';

  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not found or not using temp auth'
    );
  END IF;

  IF v_stored_password = provided_password THEN
    -- Password matches, create a session token
    RETURN json_build_object(
      'success', true,
      'user_id', v_user_id,
      'email', v_email,
      'message', 'Password verified'
    );
  ELSE
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid password'
    );
  END IF;
END;
$function$;


-- ======================================================================

-- All functions added successfully

-- =====================================================
-- PORTAL-ONLY FUNCTIONS
-- =====================================================
-- Extracted from: 05_ADD_FUNCTIONS.sql
-- Total functions in original file: 242
-- Functions included (portal-related): 102
-- Functions excluded (app-related): 140
-- =====================================================

-- Function 1/102: check_email_queue_health
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

-- Function 2/102: complete_email_batch
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

-- Function 3/102: create_email_batch
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

-- Function 4/102: create_update_email_batch
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

-- Function 5/102: get_email_stats
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

-- Function 6/102: get_next_email_batch
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

-- Function 7/102: get_notification_stats
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

-- Function 8/102: get_pending_email_batch
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

-- Function 9/102: get_pending_notifications
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

-- Function 10/102: get_portal_email_recipients
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

-- Function 11/102: invoke_email_processing
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

-- Function 12/102: mark_email_failed
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

-- Function 13/102: mark_email_sent
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

-- Function 14/102: process_email_queue
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

-- Function 15/102: process_email_queue_manual
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

-- Function 16/102: process_email_queue_trigger
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

-- Function 17/102: process_referral_emails_now
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

-- Function 18/102: queue_email
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

-- Function 19/102: queue_event_email_notifications
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

-- Function 20/102: queue_notification
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

-- Function 21/102: queue_notification_emails
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

-- Function 22/102: queue_survey_email_notifications
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

-- Function 23/102: retry_failed_emails
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

-- Function 24/102: send_calculator_notification
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

-- Function 25/102: set_default_email_preferences
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

-- Function 26/102: trigger_email_notification
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

-- Function 27/102: update_email_notification_status
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

-- Function 28/102: update_email_notification_status
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

-- Function 29/102: update_email_notification_status
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

-- Function 30/102: update_notification_status
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

-- Function 31/102: check_referral_deletion_eligibility
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

-- Function 32/102: check_referral_rate_limit
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

-- Function 33/102: complete_referral_onboarding
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

-- Function 34/102: create_referral
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

-- Function 35/102: delete_referral_admin
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

-- Function 36/102: delete_referral_admin_fixed
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

-- Function 37/102: generate_referral_code
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

-- Function 38/102: get_referral_by_code
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

-- Function 39/102: get_user_referral_stats
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

-- Function 40/102: get_user_referrals
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

-- Function 41/102: process_referral_registration
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

-- Function 42/102: record_referral_conversion
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

-- Function 43/102: resend_referral_invitation
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

-- Function 44/102: update_referral_on_registration
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

-- Function 45/102: validate_referral_eligibility
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

-- Function 46/102: delete_portal_user
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

-- Function 47/102: get_portal_admin_stats
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

-- Function 48/102: get_portal_user_stats
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

-- Function 49/102: has_portal_role
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

-- Function 50/102: is_portal_admin
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

-- Function 51/102: log_portal_membership_change
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

-- Function 52/102: promote_portal_user
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

-- Function 53/102: create_profile_after_signup
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

-- Function 54/102: end_user_impersonation
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

-- Function 55/102: get_my_user_info
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

-- Function 56/102: get_user_context
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

-- Function 57/102: get_user_survey_status
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

-- Function 58/102: reset_user_password
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

-- Function 59/102: start_user_impersonation
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

-- Function 60/102: admin_reset_password
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

-- Function 61/102: cancel_event_registration
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

-- Function 62/102: check_is_admin
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

-- Function 63/102: check_survey_completion
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

-- Function 64/102: close_overdue_surveys
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

-- Function 65/102: count_search_contacts
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

-- Function 66/102: delete_survey_complete
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

-- Function 67/102: delete_survey_force
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

-- Function 68/102: export_event_registrations
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

-- Function 69/102: export_survey_responses
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

-- Function 70/102: generate_event_slug
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

-- Function 71/102: get_contact_analytics
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

-- Function 72/102: get_contact_full_name
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

-- Function 73/102: get_contact_identifier
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

-- Function 74/102: get_contact_submission_stats
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

-- Function 75/102: get_dsp_contacts
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

-- Function 76/102: get_event_with_registration
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

-- Function 77/102: get_survey_analytics
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

-- Function 78/102: get_survey_with_questions
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

-- Function 79/102: get_survey_with_sections
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

-- Function 80/102: get_top_calculator_savers
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

-- Function 81/102: handle_calculator_submission
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

-- Function 82/102: handle_survey_completion
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

-- Function 83/102: handle_survey_published
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

-- Function 84/102: handle_updated_at
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

-- Function 85/102: increment_event_view_count
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

-- Function 86/102: is_admin
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

-- Function 87/102: is_contact_admin
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

-- Function 88/102: is_event_published
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

-- Function 89/102: is_survey_active
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

-- Function 90/102: migrate_recipient_types_to_lists
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

-- Function 91/102: register_for_event
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

-- Function 92/102: reopen_survey
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

-- Function 93/102: save_survey_response
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

-- Function 94/102: search_contacts
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

-- Function 95/102: update_calculator_submission_is_latest
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

-- Function 96/102: update_contact_last_contacted
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

-- Function 97/102: update_contact_submission_timestamp
CREATE OR REPLACE FUNCTION public.update_contact_submission_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- Function 98/102: update_event_date_attendees
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

-- Function 99/102: update_event_date_guests
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

-- Function 100/102: update_recipient_lists_updated_at
CREATE OR REPLACE FUNCTION public.update_recipient_lists_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Function 101/102: update_survey_question_count
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

-- Function 102/102: update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;


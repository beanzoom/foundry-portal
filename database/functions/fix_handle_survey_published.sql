-- Fix handle_survey_published to use due_date instead of deadline
CREATE OR REPLACE FUNCTION public.handle_survey_published()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
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
        'due_date', NEW.due_date,  -- FIXED: Changed from deadline to due_date
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
$$;

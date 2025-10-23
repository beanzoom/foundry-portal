-- Migration 002: Add email notification trigger function for portal database
-- Date: 2025-10-22
-- Purpose: Create trigger_email_notification() function and attach to portal tables
-- Issue: Referrals are queuing emails with wrong template because trigger doesn't exist

-- =====================================================
-- STEP 1: Create the trigger function
-- =====================================================

CREATE OR REPLACE FUNCTION public.trigger_email_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
            SELECT ARRAY(SELECT jsonb_array_elements_text(v_recipient_list.filter_criteria->'roles'))
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
                    CASE
                        WHEN TG_TABLE_NAME = 'portal_referrals' THEN NEW.id::text
                        WHEN TG_TABLE_NAME = 'portal_updates' THEN NEW.id::text
                        WHEN TG_TABLE_NAME = 'portal_surveys' THEN NEW.id::text
                        WHEN TG_TABLE_NAME = 'portal_events' THEN NEW.id::text
                        ELSE NULL
                    END,
                    v_event_payload,
                    v_rule.recipient_list_id,
                    'queued',
                    v_rule.priority,
                    now()
                );
            END LOOP;

        ELSIF v_recipient_list.type = 'dynamic' THEN
            -- Dynamic recipient (email from event payload)
            v_dynamic_email := NULL;

            -- Extract email based on event type
            IF TG_TABLE_NAME = 'portal_referrals' THEN
                v_dynamic_email := NEW.referee_email;
            ELSIF TG_TABLE_NAME = 'portal_events' AND v_recipient_list.filter_criteria->>'source' = 'event_registrant' THEN
                -- For event registrations, email comes from registration record
                -- This will be handled by separate trigger on portal_event_registrations
                CONTINUE;
            END IF;

            IF v_dynamic_email IS NOT NULL THEN
                INSERT INTO email_queue (
                    to_email,
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
                    v_rule.template_id,
                    v_event_type,
                    CASE
                        WHEN TG_TABLE_NAME = 'portal_referrals' THEN NEW.id::text
                        WHEN TG_TABLE_NAME = 'portal_updates' THEN NEW.id::text
                        WHEN TG_TABLE_NAME = 'portal_surveys' THEN NEW.id::text
                        WHEN TG_TABLE_NAME = 'portal_events' THEN NEW.id::text
                        ELSE NULL
                    END,
                    v_event_payload,
                    v_rule.recipient_list_id,
                    'queued',
                    v_rule.priority,
                    now()
                );
            END IF;

        ELSIF v_recipient_list.type = 'static' THEN
            -- Static recipient list (get from config)
            v_static_email := v_recipient_list.filter_criteria->>'email';

            IF v_static_email IS NOT NULL THEN
                INSERT INTO email_queue (
                    to_email,
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
                    v_rule.template_id,
                    v_event_type,
                    CASE
                        WHEN TG_TABLE_NAME = 'portal_referrals' THEN NEW.id::text
                        WHEN TG_TABLE_NAME = 'portal_updates' THEN NEW.id::text
                        WHEN TG_TABLE_NAME = 'portal_surveys' THEN NEW.id::text
                        WHEN TG_TABLE_NAME = 'portal_events' THEN NEW.id::text
                        ELSE NULL
                    END,
                    v_event_payload,
                    v_rule.recipient_list_id,
                    'queued',
                    v_rule.priority,
                    now()
                );
            END IF;
        END IF;
    END LOOP;

    RETURN NEW;
END;
$function$;

-- =====================================================
-- STEP 2: Create triggers on portal tables
-- =====================================================

-- Drop triggers if they exist (idempotent)
DROP TRIGGER IF EXISTS trigger_referral_email_notification ON portal_referrals;
DROP TRIGGER IF EXISTS trigger_update_email_notification ON portal_updates;
DROP TRIGGER IF EXISTS trigger_survey_email_notification ON portal_surveys;
DROP TRIGGER IF EXISTS trigger_event_email_notification ON portal_events;
DROP TRIGGER IF EXISTS trigger_contact_email_notification ON contact_submissions;

-- Create trigger for referrals (INSERT only)
CREATE TRIGGER trigger_referral_email_notification
    AFTER INSERT ON portal_referrals
    FOR EACH ROW
    EXECUTE FUNCTION trigger_email_notification();

-- Create trigger for updates (INSERT and UPDATE)
CREATE TRIGGER trigger_update_email_notification
    AFTER INSERT OR UPDATE ON portal_updates
    FOR EACH ROW
    EXECUTE FUNCTION trigger_email_notification();

-- Create trigger for surveys (INSERT and UPDATE)
CREATE TRIGGER trigger_survey_email_notification
    AFTER INSERT OR UPDATE ON portal_surveys
    FOR EACH ROW
    EXECUTE FUNCTION trigger_email_notification();

-- Create trigger for events (INSERT and UPDATE)
CREATE TRIGGER trigger_event_email_notification
    AFTER INSERT OR UPDATE ON portal_events
    FOR EACH ROW
    EXECUTE FUNCTION trigger_email_notification();

-- Create trigger for contact submissions (INSERT only)
CREATE TRIGGER trigger_contact_email_notification
    AFTER INSERT ON contact_submissions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_email_notification();

-- =====================================================
-- STEP 3: Grant necessary permissions
-- =====================================================

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION trigger_email_notification() TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_email_notification() TO service_role;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check that function was created
SELECT
    p.proname as function_name,
    'Created successfully' as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'trigger_email_notification';

-- Check that triggers were created
SELECT
    event_object_table as table_name,
    trigger_name,
    'Created successfully' as status
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table IN ('portal_referrals', 'portal_updates', 'portal_surveys', 'portal_events', 'contact_submissions')
ORDER BY event_object_table;

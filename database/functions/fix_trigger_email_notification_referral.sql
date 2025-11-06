-- Fix trigger_email_notification to properly handle v_recipient initialization
-- This fixes the "record 'v_recipient' is not assigned yet" error for referral invitations
--
-- The issue occurs in the dynamic recipient list section where v_recipient
-- is accessed before being properly initialized when the referee email doesn't
-- exist in the profiles table (which is expected for new referrals).

CREATE OR REPLACE FUNCTION public.trigger_email_notification()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_rule notification_rules;
    v_recipient_list recipient_lists;
    v_recipient RECORD;
    v_recipient_found BOOLEAN := FALSE; -- Track if v_recipient was initialized
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

        -- Reset recipient found flag for each rule
        v_recipient_found := FALSE;

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
                v_recipient_found := TRUE;
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
                        v_recipient_found := TRUE;
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
                        -- User not found, send to static email anyway
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
                            -- Try to find user in profiles
                            SELECT p.id, p.first_name, p.last_name, p.email
                            INTO v_recipient
                            FROM profiles p
                            WHERE p.email = v_dynamic_email;

                            IF FOUND THEN
                                -- User exists in profiles, use their information
                                v_recipient_found := TRUE;
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
                                -- User doesn't exist in profiles (expected for new referrals)
                                -- Use email from event payload and names from referee fields if available
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

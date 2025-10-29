-- Fix survey email triggers to use the unified email system
-- Surveys should use trigger_email_notification() like updates do

-- Drop the old triggers that use the batch system
DROP TRIGGER IF EXISTS on_portal_survey_published ON portal_surveys;
DROP TRIGGER IF EXISTS on_portal_survey_published_notification ON portal_surveys;

-- Create the correct trigger using trigger_email_notification
-- This will insert into email_queue and trigger immediate processing
CREATE TRIGGER on_portal_survey_notification
    AFTER INSERT OR UPDATE ON portal_surveys
    FOR EACH ROW
    EXECUTE FUNCTION trigger_email_notification();

-- Note: The trigger_email_notification() function already handles surveys
-- It checks for status = 'published' and creates email_queue entries
-- which automatically trigger the edge function via invoke_email_processing()

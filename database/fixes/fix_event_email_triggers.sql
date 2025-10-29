-- Fix event email triggers to use the unified email system
-- Events should use trigger_email_notification() like updates do

-- Drop the old trigger that uses the batch system
DROP TRIGGER IF EXISTS on_portal_event_published ON portal_events;

-- Create the correct trigger using trigger_email_notification
-- This will insert into email_queue and trigger immediate processing
CREATE TRIGGER on_portal_event_notification
    AFTER INSERT OR UPDATE ON portal_events
    FOR EACH ROW
    EXECUTE FUNCTION trigger_email_notification();

-- Note: The trigger_email_notification() function already handles events
-- It checks for status = 'published' and creates email_queue entries
-- which automatically trigger the edge function via invoke_email_processing()

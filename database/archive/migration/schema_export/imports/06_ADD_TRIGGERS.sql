-- =====================================================
-- PORTAL DATABASE TRIGGERS
-- =====================================================
-- Step 6 of Migration: Add Triggers
-- Creates triggers that connect functions to table events
-- =====================================================

-- PREREQUISITES:
-- - Step 5: Functions created (05_ADD_FUNCTIONS_PORTAL_ONLY.sql)
-- - Step 5b: Impersonation table created (05b_CREATE_IMPERSONATION_SESSIONS.sql)
--
-- Note: All trigger functions were created in Step 5 (05_ADD_FUNCTIONS_PORTAL_ONLY.sql)
-- This file only creates the trigger definitions that call those functions

-- =====================================================
-- AUTH & PROFILE TRIGGERS
-- =====================================================

-- Trigger 1: Create profile after signup
-- NOTE: Commented out - requires access to auth.users which may not be available
-- Alternative: Use Supabase Auth Hooks or manually create profiles
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW
--   EXECUTE FUNCTION create_profile_after_signup();

-- Trigger 2: Update profiles.updated_at timestamp
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- EMAIL & NOTIFICATION TRIGGERS
-- =====================================================

-- Trigger 3: Invoke email processing when queue updated
CREATE TRIGGER on_email_queue_insert
  AFTER INSERT ON email_queue
  FOR EACH ROW
  EXECUTE FUNCTION invoke_email_processing();

-- Trigger 4: Update email_notification_batches timestamp
CREATE TRIGGER update_email_notification_batches_updated_at
  BEFORE UPDATE ON email_notification_batches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger 5: Update email_notifications timestamp
CREATE TRIGGER update_email_notifications_updated_at
  BEFORE UPDATE ON email_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger 6: Update email_queue timestamp
CREATE TRIGGER update_email_queue_updated_at
  BEFORE UPDATE ON email_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger 7: Update recipient_lists timestamp
CREATE TRIGGER update_recipient_lists_updated_at
  BEFORE UPDATE ON recipient_lists
  FOR EACH ROW
  EXECUTE FUNCTION update_recipient_lists_updated_at();

-- =====================================================
-- PORTAL UPDATE TRIGGERS
-- =====================================================

-- Trigger 8: Create email batch when update published
CREATE TRIGGER on_portal_update_published
  AFTER INSERT OR UPDATE ON portal_updates
  FOR EACH ROW
  EXECUTE FUNCTION create_update_email_batch();

-- Trigger 9: Queue notification emails for updates
CREATE TRIGGER on_portal_update_notification
  AFTER INSERT OR UPDATE ON portal_updates
  FOR EACH ROW
  EXECUTE FUNCTION trigger_email_notification();

-- Trigger 10: Update portal_updates timestamp
CREATE TRIGGER update_portal_updates_updated_at
  BEFORE UPDATE ON portal_updates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SURVEY TRIGGERS
-- =====================================================

-- Trigger 11: Queue notification emails when survey published
CREATE TRIGGER on_portal_survey_published
  AFTER INSERT OR UPDATE ON portal_surveys
  FOR EACH ROW
  EXECUTE FUNCTION queue_survey_email_notifications();

-- Trigger 12: Handle survey published event
CREATE TRIGGER on_portal_survey_published_notification
  AFTER INSERT OR UPDATE ON portal_surveys
  FOR EACH ROW
  EXECUTE FUNCTION handle_survey_published();

-- Trigger 13: Handle survey completion
CREATE TRIGGER on_survey_response_completed
  AFTER INSERT OR UPDATE ON portal_survey_responses
  FOR EACH ROW
  EXECUTE FUNCTION handle_survey_completion();

-- Trigger 14: Update survey question count
CREATE TRIGGER on_survey_question_change
  AFTER INSERT OR DELETE ON portal_survey_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_survey_question_count();

-- Trigger 15: Update portal_surveys timestamp
CREATE TRIGGER update_portal_surveys_updated_at
  BEFORE UPDATE ON portal_surveys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger 16: Update portal_survey_responses timestamp
CREATE TRIGGER update_portal_survey_responses_updated_at
  BEFORE UPDATE ON portal_survey_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- EVENT TRIGGERS
-- =====================================================

-- Trigger 17: Queue notification emails when event published
CREATE TRIGGER on_portal_event_published
  AFTER INSERT OR UPDATE ON portal_events
  FOR EACH ROW
  EXECUTE FUNCTION queue_event_email_notifications();

-- Trigger 18: Generate slug for events
CREATE TRIGGER on_portal_event_slug
  BEFORE INSERT OR UPDATE ON portal_events
  FOR EACH ROW
  EXECUTE FUNCTION generate_event_slug();

-- Trigger 19: Update event date attendees count
CREATE TRIGGER on_event_registration_change
  AFTER INSERT OR UPDATE OR DELETE ON portal_event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_event_date_attendees();

-- Trigger 20: Update event date guests count
CREATE TRIGGER on_event_guest_change
  AFTER INSERT OR DELETE ON portal_event_guests
  FOR EACH ROW
  EXECUTE FUNCTION update_event_date_guests();

-- Trigger 21: Update portal_events timestamp
CREATE TRIGGER update_portal_events_updated_at
  BEFORE UPDATE ON portal_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger 22: Update portal_event_registrations timestamp
CREATE TRIGGER update_portal_event_registrations_updated_at
  BEFORE UPDATE ON portal_event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- REFERRAL TRIGGERS
-- =====================================================

-- Trigger 23: Queue notification emails for referrals
CREATE TRIGGER on_referral_created
  AFTER INSERT ON portal_referrals
  FOR EACH ROW
  EXECUTE FUNCTION queue_notification_emails();

-- Trigger 24: Update referral on user registration
CREATE TRIGGER on_profile_created_check_referral
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_referral_on_registration();

-- Trigger 25: Update portal_referrals timestamp
CREATE TRIGGER update_portal_referrals_updated_at
  BEFORE UPDATE ON portal_referrals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- CALCULATOR TRIGGERS
-- =====================================================

-- Trigger 26: Handle calculator submission
CREATE TRIGGER on_calculator_submission
  AFTER INSERT ON calculator_submissions
  FOR EACH ROW
  EXECUTE FUNCTION handle_calculator_submission();

-- Trigger 27: Update is_latest flag on calculator submissions
CREATE TRIGGER on_calculator_submission_latest
  BEFORE INSERT OR UPDATE ON calculator_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_calculator_submission_is_latest();

-- Trigger 28: Update calculator_submissions timestamp
CREATE TRIGGER update_calculator_submissions_updated_at
  BEFORE UPDATE ON calculator_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- CONTACT TRIGGERS
-- =====================================================

-- Trigger 29: Queue notification for contact submissions
CREATE TRIGGER on_contact_submission_created
  AFTER INSERT ON contact_submissions
  FOR EACH ROW
  EXECUTE FUNCTION queue_notification_emails();

-- Trigger 30: Update contact last_contacted_at
CREATE TRIGGER on_interaction_created
  AFTER INSERT ON interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_last_contacted();

-- Trigger 31: Update contact_submissions timestamp
CREATE TRIGGER update_contact_submissions_updated_at
  BEFORE UPDATE ON contact_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_submission_timestamp();

-- Trigger 32: Update contacts timestamp
CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PORTAL MEMBERSHIP TRIGGERS
-- =====================================================

-- Trigger 33: Log portal membership changes
CREATE TRIGGER on_portal_membership_change
  AFTER INSERT OR UPDATE ON portal_memberships
  FOR EACH ROW
  EXECUTE FUNCTION log_portal_membership_change();

-- Trigger 34: Update portal_memberships timestamp
CREATE TRIGGER update_portal_memberships_updated_at
  BEFORE UPDATE ON portal_memberships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- BUSINESS TRIGGERS
-- =====================================================

-- Trigger 35: Update businesses timestamp
CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- GENERIC UPDATED_AT TRIGGERS (for remaining tables)
-- =====================================================

-- Apply to all other portal tables that have updated_at columns
-- These use the generic update_updated_at_column function

CREATE TRIGGER update_portal_admin_activity_updated_at
  BEFORE UPDATE ON portal_admin_activity
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portal_audit_log_updated_at
  BEFORE UPDATE ON portal_audit_log
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portal_event_dates_updated_at
  BEFORE UPDATE ON portal_event_dates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portal_event_guests_updated_at
  BEFORE UPDATE ON portal_event_guests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portal_event_reminders_updated_at
  BEFORE UPDATE ON portal_event_reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portal_event_templates_updated_at
  BEFORE UPDATE ON portal_event_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portal_referral_conversions_updated_at
  BEFORE UPDATE ON portal_referral_conversions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portal_survey_answers_updated_at
  BEFORE UPDATE ON portal_survey_answers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portal_survey_questions_updated_at
  BEFORE UPDATE ON portal_survey_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portal_update_reads_updated_at
  BEFORE UPDATE ON portal_update_reads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_rules_updated_at
  BEFORE UPDATE ON notification_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- NOTE: Requires impersonation_sessions table from 05b_CREATE_IMPERSONATION_SESSIONS.sql
CREATE TRIGGER update_impersonation_sessions_updated_at
  BEFORE UPDATE ON impersonation_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TRIGGER COUNT: 47 triggers created (1 commented out)
-- =====================================================
-- Categories:
-- - Auth & Profile: 1 trigger (1 commented - auth.users not accessible)
-- - Email & Notifications: 5 triggers
-- - Portal Updates: 3 triggers
-- - Surveys: 6 triggers
-- - Events: 6 triggers
-- - Referrals: 3 triggers
-- - Calculator: 3 triggers
-- - Contacts: 4 triggers
-- - Portal Memberships: 2 triggers
-- - Businesses: 1 trigger
-- - Impersonation: 1 trigger
-- - Generic updated_at: 12 triggers
--
-- Commented out triggers:
-- - on_auth_user_created (auth.users) - Use Supabase Auth Hooks instead
--
-- Prerequisites before running:
-- - Run 05b_CREATE_IMPERSONATION_SESSIONS.sql first (creates missing table)
-- =====================================================

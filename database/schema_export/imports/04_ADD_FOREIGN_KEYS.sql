/*
================================================================================
ADD FOREIGN KEY CONSTRAINTS
================================================================================
Run this in NEW database after all data is imported.
This adds 32 foreign key constraints to enforce referential integrity.
================================================================================
*/

-- Self-referencing FKs
ALTER TABLE calculator_submissions ADD CONSTRAINT calculator_submissions_previous_submission_id_fkey FOREIGN KEY (previous_submission_id) REFERENCES calculator_submissions(id) ON DELETE NO ACTION;
ALTER TABLE portal_updates ADD CONSTRAINT portal_updates_correction_fk FOREIGN KEY (is_correction_of) REFERENCES portal_updates(id) ON DELETE NO ACTION;

-- Email system FKs
ALTER TABLE email_logs ADD CONSTRAINT email_logs_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES email_notification_batches(id) ON DELETE SET NULL;
ALTER TABLE email_notifications ADD CONSTRAINT email_notifications_event_id_fkey FOREIGN KEY (event_id) REFERENCES notification_events(id) ON DELETE SET NULL;
ALTER TABLE email_notifications ADD CONSTRAINT email_notifications_rule_id_fkey FOREIGN KEY (rule_id) REFERENCES notification_rules(id) ON DELETE SET NULL;
ALTER TABLE email_queue ADD CONSTRAINT email_queue_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES email_notification_batches(id) ON DELETE NO ACTION;
ALTER TABLE notification_logs ADD CONSTRAINT notification_logs_notification_id_fkey FOREIGN KEY (notification_id) REFERENCES email_notifications(id) ON DELETE CASCADE;
ALTER TABLE notification_rules ADD CONSTRAINT notification_rules_event_id_fkey FOREIGN KEY (event_id) REFERENCES notification_events(id) ON DELETE CASCADE;
ALTER TABLE notification_rules ADD CONSTRAINT notification_rules_recipient_list_id_fkey FOREIGN KEY (recipient_list_id) REFERENCES recipient_lists(id) ON DELETE NO ACTION;

-- Profile references
ALTER TABLE portal_admin_activity ADD CONSTRAINT portal_admin_activity_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE portal_events ADD CONSTRAINT portal_events_created_by_fkey FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE NO ACTION;
ALTER TABLE portal_event_registrations ADD CONSTRAINT portal_event_registrations_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE NO ACTION;
ALTER TABLE portal_referrals ADD CONSTRAINT portal_referrals_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE portal_referral_conversions ADD CONSTRAINT portal_referral_conversions_referee_profile_id_fkey FOREIGN KEY (referee_profile_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE portal_referral_rate_limits ADD CONSTRAINT portal_referral_rate_limits_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE referral_conversions ADD CONSTRAINT referral_conversions_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Event system FKs
ALTER TABLE portal_event_dates ADD CONSTRAINT portal_event_dates_event_id_fkey FOREIGN KEY (event_id) REFERENCES portal_events(id) ON DELETE CASCADE;
ALTER TABLE portal_event_registrations ADD CONSTRAINT portal_event_registrations_event_id_fkey FOREIGN KEY (event_id) REFERENCES portal_events(id) ON DELETE CASCADE;
ALTER TABLE portal_event_registrations ADD CONSTRAINT portal_event_registrations_event_date_id_fkey FOREIGN KEY (event_date_id) REFERENCES portal_event_dates(id) ON DELETE CASCADE;
ALTER TABLE portal_event_guests ADD CONSTRAINT portal_event_guests_registration_id_fkey FOREIGN KEY (registration_id) REFERENCES portal_event_registrations(id) ON DELETE CASCADE;
ALTER TABLE portal_event_reminders ADD CONSTRAINT portal_event_reminders_event_id_fkey FOREIGN KEY (event_id) REFERENCES portal_events(id) ON DELETE CASCADE;
ALTER TABLE portal_event_reminders ADD CONSTRAINT portal_event_reminders_registration_id_fkey FOREIGN KEY (registration_id) REFERENCES portal_event_registrations(id) ON DELETE CASCADE;

-- Survey system FKs
ALTER TABLE portal_survey_questions ADD CONSTRAINT portal_survey_questions_survey_id_fkey FOREIGN KEY (survey_id) REFERENCES portal_surveys(id) ON DELETE CASCADE;
ALTER TABLE portal_survey_questions ADD CONSTRAINT portal_survey_questions_section_id_fkey FOREIGN KEY (section_id) REFERENCES portal_survey_sections(id) ON DELETE SET NULL;
ALTER TABLE portal_survey_responses ADD CONSTRAINT portal_survey_responses_survey_id_fkey FOREIGN KEY (survey_id) REFERENCES portal_surveys(id) ON DELETE CASCADE;
ALTER TABLE portal_survey_answers ADD CONSTRAINT portal_survey_answers_response_id_fkey FOREIGN KEY (response_id) REFERENCES portal_survey_responses(id) ON DELETE CASCADE;
ALTER TABLE portal_survey_answers ADD CONSTRAINT portal_survey_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES portal_survey_questions(id) ON DELETE CASCADE;

-- Update system FKs
ALTER TABLE portal_update_reads ADD CONSTRAINT portal_update_reads_update_id_fkey FOREIGN KEY (update_id) REFERENCES portal_updates(id) ON DELETE CASCADE;

-- Referral system FKs
ALTER TABLE portal_referral_conversions ADD CONSTRAINT portal_referral_conversions_referral_id_fkey FOREIGN KEY (referral_id) REFERENCES portal_referrals(id) ON DELETE CASCADE;
ALTER TABLE portal_referral_rate_limits ADD CONSTRAINT portal_referral_rate_limits_referral_id_fkey FOREIGN KEY (referral_id) REFERENCES portal_referrals(id) ON DELETE CASCADE;
ALTER TABLE marketing_campaign_links ADD CONSTRAINT marketing_campaign_links_funnel_id_fkey FOREIGN KEY (funnel_id) REFERENCES portal_referrals(id) ON DELETE CASCADE;
ALTER TABLE referral_conversions ADD CONSTRAINT referral_conversions_referral_id_fkey FOREIGN KEY (referral_id) REFERENCES portal_referrals(id) ON DELETE CASCADE;

-- Foreign keys added successfully
-- Next: Run 05_ADD_FUNCTIONS.sql

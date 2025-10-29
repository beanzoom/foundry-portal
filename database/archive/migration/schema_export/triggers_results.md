Export all triggers on portal tables:

[
  {
    "table_name": "calculator_submissions",
    "trigger_name": "calculator_submission_notification_trigger",
    "trigger_level": "ROW",
    "trigger_timing": "AFTER",
    "trigger_event": "INSERT",
    "trigger_definition": "CREATE TRIGGER calculator_submission_notification_trigger AFTER INSERT ON public.calculator_submissions FOR EACH ROW EXECUTE FUNCTION handle_calculator_submission()",
    "separator": "-- ================================================="
  },
  {
    "table_name": "calculator_submissions",
    "trigger_name": "email_notification_on_calculator_submit",
    "trigger_level": "ROW",
    "trigger_timing": "AFTER",
    "trigger_event": "INSERT",
    "trigger_definition": "CREATE TRIGGER email_notification_on_calculator_submit AFTER INSERT ON public.calculator_submissions FOR EACH ROW EXECUTE FUNCTION trigger_email_notification('calculator_submission')",
    "separator": "-- ================================================="
  },
  {
    "table_name": "calculator_submissions",
    "trigger_name": "maintain_latest_submission",
    "trigger_level": "ROW",
    "trigger_timing": "AFTER",
    "trigger_event": "INSERT",
    "trigger_definition": "CREATE TRIGGER maintain_latest_submission AFTER INSERT ON public.calculator_submissions FOR EACH ROW EXECUTE FUNCTION update_latest_submission()",
    "separator": "-- ================================================="
  },
  {
    "table_name": "calculator_submissions",
    "trigger_name": "trigger_update_calculator_submission_is_latest",
    "trigger_level": "ROW",
    "trigger_timing": "BEFORE",
    "trigger_event": "INSERT",
    "trigger_definition": "CREATE TRIGGER trigger_update_calculator_submission_is_latest BEFORE INSERT OR UPDATE ON public.calculator_submissions FOR EACH ROW EXECUTE FUNCTION update_calculator_submission_is_latest()",
    "separator": "-- ================================================="
  },
  {
    "table_name": "email_logs",
    "trigger_name": "update_email_logs_updated_at",
    "trigger_level": "ROW",
    "trigger_timing": "BEFORE",
    "trigger_event": "UPDATE",
    "trigger_definition": "CREATE TRIGGER update_email_logs_updated_at BEFORE UPDATE ON public.email_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()",
    "separator": "-- ================================================="
  },
  {
    "table_name": "email_notification_batches",
    "trigger_name": "update_email_notification_batches_updated_at",
    "trigger_level": "ROW",
    "trigger_timing": "BEFORE",
    "trigger_event": "UPDATE",
    "trigger_definition": "CREATE TRIGGER update_email_notification_batches_updated_at BEFORE UPDATE ON public.email_notification_batches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()",
    "separator": "-- ================================================="
  },
  {
    "table_name": "email_queue",
    "trigger_name": "trigger_invoke_email_processing",
    "trigger_level": "STATEMENT",
    "trigger_timing": "AFTER",
    "trigger_event": "INSERT",
    "trigger_definition": "CREATE TRIGGER trigger_invoke_email_processing AFTER INSERT ON public.email_queue FOR EACH STATEMENT EXECUTE FUNCTION invoke_email_processing()",
    "separator": "-- ================================================="
  },
  {
    "table_name": "email_queue",
    "trigger_name": "update_email_queue_updated_at",
    "trigger_level": "ROW",
    "trigger_timing": "BEFORE",
    "trigger_event": "UPDATE",
    "trigger_definition": "CREATE TRIGGER update_email_queue_updated_at BEFORE UPDATE ON public.email_queue FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()",
    "separator": "-- ================================================="
  },
  {
    "table_name": "membership_agreements",
    "trigger_name": "update_membership_agreements_updated_at",
    "trigger_level": "ROW",
    "trigger_timing": "BEFORE",
    "trigger_event": "UPDATE",
    "trigger_definition": "CREATE TRIGGER update_membership_agreements_updated_at BEFORE UPDATE ON public.membership_agreements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()",
    "separator": "-- ================================================="
  },
  {
    "table_name": "nda_agreements",
    "trigger_name": "update_nda_agreements_updated_at",
    "trigger_level": "ROW",
    "trigger_timing": "BEFORE",
    "trigger_event": "UPDATE",
    "trigger_definition": "CREATE TRIGGER update_nda_agreements_updated_at BEFORE UPDATE ON public.nda_agreements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()",
    "separator": "-- ================================================="
  },
  {
    "table_name": "portal_event_guests",
    "trigger_name": "update_attendees_on_guest_change",
    "trigger_level": "ROW",
    "trigger_timing": "AFTER",
    "trigger_event": "INSERT",
    "trigger_definition": "CREATE TRIGGER update_attendees_on_guest_change AFTER INSERT OR DELETE ON public.portal_event_guests FOR EACH ROW EXECUTE FUNCTION update_event_date_guests()",
    "separator": "-- ================================================="
  },
  {
    "table_name": "portal_event_registrations",
    "trigger_name": "update_attendees_on_registration",
    "trigger_level": "ROW",
    "trigger_timing": "AFTER",
    "trigger_event": "INSERT",
    "trigger_definition": "CREATE TRIGGER update_attendees_on_registration AFTER INSERT OR DELETE OR UPDATE ON public.portal_event_registrations FOR EACH ROW EXECUTE FUNCTION update_event_date_attendees()",
    "separator": "-- ================================================="
  },
  {
    "table_name": "portal_events",
    "trigger_name": "email_notification_on_event_publish",
    "trigger_level": "ROW",
    "trigger_timing": "AFTER",
    "trigger_event": "UPDATE",
    "trigger_definition": "CREATE TRIGGER email_notification_on_event_publish AFTER UPDATE OF status ON public.portal_events FOR EACH ROW WHEN (((old.status IS DISTINCT FROM new.status) AND (new.status = 'published'::text))) EXECUTE FUNCTION trigger_email_notification('event_published')",
    "separator": "-- ================================================="
  },
  {
    "table_name": "portal_events",
    "trigger_name": "generate_event_slug_trigger",
    "trigger_level": "ROW",
    "trigger_timing": "BEFORE",
    "trigger_event": "INSERT",
    "trigger_definition": "CREATE TRIGGER generate_event_slug_trigger BEFORE INSERT OR UPDATE ON public.portal_events FOR EACH ROW EXECUTE FUNCTION generate_event_slug()",
    "separator": "-- ================================================="
  },
  {
    "table_name": "portal_events",
    "trigger_name": "update_portal_events_updated_at",
    "trigger_level": "ROW",
    "trigger_timing": "BEFORE",
    "trigger_event": "UPDATE",
    "trigger_definition": "CREATE TRIGGER update_portal_events_updated_at BEFORE UPDATE ON public.portal_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()",
    "separator": "-- ================================================="
  },
  {
    "table_name": "portal_memberships",
    "trigger_name": "log_portal_memberships_changes",
    "trigger_level": "ROW",
    "trigger_timing": "AFTER",
    "trigger_event": "INSERT",
    "trigger_definition": "CREATE TRIGGER log_portal_memberships_changes AFTER INSERT OR UPDATE ON public.portal_memberships FOR EACH ROW EXECUTE FUNCTION log_portal_membership_change()",
    "separator": "-- ================================================="
  },
  {
    "table_name": "portal_referral_conversions",
    "trigger_name": "update_portal_referral_conversions_updated_at",
    "trigger_level": "ROW",
    "trigger_timing": "BEFORE",
    "trigger_event": "UPDATE",
    "trigger_definition": "CREATE TRIGGER update_portal_referral_conversions_updated_at BEFORE UPDATE ON public.portal_referral_conversions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()",
    "separator": "-- ================================================="
  },
  {
    "table_name": "portal_referrals",
    "trigger_name": "email_notification_on_referral_created",
    "trigger_level": "ROW",
    "trigger_timing": "AFTER",
    "trigger_event": "INSERT",
    "trigger_definition": "CREATE TRIGGER email_notification_on_referral_created AFTER INSERT ON public.portal_referrals FOR EACH ROW EXECUTE FUNCTION trigger_email_notification()",
    "separator": "-- ================================================="
  },
  {
    "table_name": "portal_referrals",
    "trigger_name": "update_portal_referrals_updated_at",
    "trigger_level": "ROW",
    "trigger_timing": "BEFORE",
    "trigger_event": "UPDATE",
    "trigger_definition": "CREATE TRIGGER update_portal_referrals_updated_at BEFORE UPDATE ON public.portal_referrals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()",
    "separator": "-- ================================================="
  },
  {
    "table_name": "portal_survey_questions",
    "trigger_name": "update_question_count_trigger",
    "trigger_level": "ROW",
    "trigger_timing": "AFTER",
    "trigger_event": "INSERT",
    "trigger_definition": "CREATE TRIGGER update_question_count_trigger AFTER INSERT OR DELETE ON public.portal_survey_questions FOR EACH ROW EXECUTE FUNCTION update_survey_question_count()",
    "separator": "-- ================================================="
  },
  {
    "table_name": "portal_survey_responses",
    "trigger_name": "trigger_survey_completion",
    "trigger_level": "ROW",
    "trigger_timing": "AFTER",
    "trigger_event": "INSERT",
    "trigger_definition": "CREATE TRIGGER trigger_survey_completion AFTER INSERT OR UPDATE OF completed_at ON public.portal_survey_responses FOR EACH ROW EXECUTE FUNCTION handle_survey_completion()",
    "separator": "-- ================================================="
  },
  {
    "table_name": "portal_surveys",
    "trigger_name": "email_notification_on_survey_publish",
    "trigger_level": "ROW",
    "trigger_timing": "AFTER",
    "trigger_event": "UPDATE",
    "trigger_definition": "CREATE TRIGGER email_notification_on_survey_publish AFTER UPDATE OF status ON public.portal_surveys FOR EACH ROW WHEN ((((old.status)::text IS DISTINCT FROM (new.status)::text) AND ((new.status)::text = 'published'::text))) EXECUTE FUNCTION trigger_email_notification('survey_published')",
    "separator": "-- ================================================="
  },
  {
    "table_name": "portal_surveys",
    "trigger_name": "update_portal_surveys_updated_at",
    "trigger_level": "ROW",
    "trigger_timing": "BEFORE",
    "trigger_event": "UPDATE",
    "trigger_definition": "CREATE TRIGGER update_portal_surveys_updated_at BEFORE UPDATE ON public.portal_surveys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()",
    "separator": "-- ================================================="
  },
  {
    "table_name": "portal_updates",
    "trigger_name": "email_notification_on_update_publish",
    "trigger_level": "ROW",
    "trigger_timing": "AFTER",
    "trigger_event": "UPDATE",
    "trigger_definition": "CREATE TRIGGER email_notification_on_update_publish AFTER UPDATE OF status ON public.portal_updates FOR EACH ROW WHEN ((((old.status)::text IS DISTINCT FROM (new.status)::text) AND ((new.status)::text = 'published'::text))) EXECUTE FUNCTION trigger_email_notification('update_published')",
    "separator": "-- ================================================="
  },
  {
    "table_name": "profiles",
    "trigger_name": "auto_accept_terms_trigger",
    "trigger_level": "ROW",
    "trigger_timing": "BEFORE",
    "trigger_event": "INSERT",
    "trigger_definition": "CREATE TRIGGER auto_accept_terms_trigger BEFORE INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION auto_accept_terms_for_admins()",
    "separator": "-- ================================================="
  },
  {
    "table_name": "profiles",
    "trigger_name": "email_notification_on_user_register",
    "trigger_level": "ROW",
    "trigger_timing": "AFTER",
    "trigger_event": "INSERT",
    "trigger_definition": "CREATE TRIGGER email_notification_on_user_register AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION trigger_email_notification('user_registered')",
    "separator": "-- ================================================="
  },
  {
    "table_name": "profiles",
    "trigger_name": "update_preferences_timestamp",
    "trigger_level": "ROW",
    "trigger_timing": "BEFORE",
    "trigger_event": "UPDATE",
    "trigger_definition": "CREATE TRIGGER update_preferences_timestamp BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_preferences_timestamp()",
    "separator": "-- ================================================="
  },
  {
    "table_name": "profiles",
    "trigger_name": "update_referral_status_on_register",
    "trigger_level": "ROW",
    "trigger_timing": "AFTER",
    "trigger_event": "INSERT",
    "trigger_definition": "CREATE TRIGGER update_referral_status_on_register AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_referral_on_registration()",
    "separator": "-- ================================================="
  },
  {
    "table_name": "recipient_lists",
    "trigger_name": "update_recipient_lists_updated_at",
    "trigger_level": "ROW",
    "trigger_timing": "BEFORE",
    "trigger_event": "UPDATE",
    "trigger_definition": "CREATE TRIGGER update_recipient_lists_updated_at BEFORE UPDATE ON public.recipient_lists FOR EACH ROW EXECUTE FUNCTION update_recipient_lists_updated_at()",
    "separator": "-- ================================================="
  }
]


Get trigger summary:

[
  {
    "table_name": "calculator_submissions",
    "trigger_count": 4,
    "trigger_names": "calculator_submission_notification_trigger, email_notification_on_calculator_submit, maintain_latest_submission, trigger_update_calculator_submission_is_latest"
  },
  {
    "table_name": "profiles",
    "trigger_count": 4,
    "trigger_names": "auto_accept_terms_trigger, email_notification_on_user_register, update_preferences_timestamp, update_referral_status_on_register"
  },
  {
    "table_name": "portal_events",
    "trigger_count": 3,
    "trigger_names": "email_notification_on_event_publish, generate_event_slug_trigger, update_portal_events_updated_at"
  },
  {
    "table_name": "email_queue",
    "trigger_count": 2,
    "trigger_names": "trigger_invoke_email_processing, update_email_queue_updated_at"
  },
  {
    "table_name": "portal_referrals",
    "trigger_count": 2,
    "trigger_names": "email_notification_on_referral_created, update_portal_referrals_updated_at"
  },
  {
    "table_name": "portal_surveys",
    "trigger_count": 2,
    "trigger_names": "email_notification_on_survey_publish, update_portal_surveys_updated_at"
  },
  {
    "table_name": "email_logs",
    "trigger_count": 1,
    "trigger_names": "update_email_logs_updated_at"
  },
  {
    "table_name": "email_notification_batches",
    "trigger_count": 1,
    "trigger_names": "update_email_notification_batches_updated_at"
  },
  {
    "table_name": "membership_agreements",
    "trigger_count": 1,
    "trigger_names": "update_membership_agreements_updated_at"
  },
  {
    "table_name": "nda_agreements",
    "trigger_count": 1,
    "trigger_names": "update_nda_agreements_updated_at"
  },
  {
    "table_name": "portal_event_guests",
    "trigger_count": 1,
    "trigger_names": "update_attendees_on_guest_change"
  },
  {
    "table_name": "portal_event_registrations",
    "trigger_count": 1,
    "trigger_names": "update_attendees_on_registration"
  },
  {
    "table_name": "portal_memberships",
    "trigger_count": 1,
    "trigger_names": "log_portal_memberships_changes"
  },
  {
    "table_name": "portal_referral_conversions",
    "trigger_count": 1,
    "trigger_names": "update_portal_referral_conversions_updated_at"
  },
  {
    "table_name": "portal_survey_questions",
    "trigger_count": 1,
    "trigger_names": "update_question_count_trigger"
  },
  {
    "table_name": "portal_survey_responses",
    "trigger_count": 1,
    "trigger_names": "trigger_survey_completion"
  },
  {
    "table_name": "portal_updates",
    "trigger_count": 1,
    "trigger_names": "email_notification_on_update_publish"
  },
  {
    "table_name": "recipient_lists",
    "trigger_count": 1,
    "trigger_names": "update_recipient_lists_updated_at"
  }
]

/*
AFTER RUNNING:
1. Copy ALL output from the first query
2. Save to: exports/08_triggers.txt
3. Review the trigger summary to verify all tables have expected triggers

CRITICAL TRIGGERS TO VERIFY:
- trigger_email_notification (on portal_events, portal_surveys, portal_updates)
- trigger_referral_notification (on portal_referrals)
- Any audit/logging triggers
- Any updated_at timestamp triggers

EXPECTED TRIGGERS:
- email_queue: email notification triggers
- portal_events: email notification trigger, updated_at trigger
- portal_surveys: email notification trigger, updated_at trigger
- portal_updates: email notification trigger, updated_at trigger
- portal_referrals: referral notification trigger, updated_at trigger
- Most other tables: updated_at trigger

If triggers are missing, investigate why.
*/
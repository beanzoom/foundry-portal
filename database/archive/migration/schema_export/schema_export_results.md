PART 1: Export profiles table structure (portal users only)

[
  {
    "create_statement": "CREATE TABLE IF NOT EXISTS profiles (id uuid NOT NULL, first_name text, middle_name text, last_name text, suffix text, preferred_name text, email text, phone_number text, updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()), avatar_url text, avatar_path text, created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()), status USER-DEFINED NOT NULL DEFAULT 'active'::user_status, organization_id uuid, title text, metadata jsonb DEFAULT '{}'::jsonb, last_sign_in_at timestamp with time zone, bio text, year_dsp_began integer, avg_fleet_vehicles integer, avg_drivers integer, mobile text, street1 text, street2 text, city text, state text, zip text, website text, average_fleet_size integer, average_drivers integer, phone text, company_name text, profile_complete boolean DEFAULT false, role text DEFAULT 'user'::text, terms_accepted boolean DEFAULT false, terms_accepted_at timestamp with time zone, terms_version text, email_updates boolean DEFAULT true, email_surveys boolean DEFAULT true, email_events boolean DEFAULT true, preferences_updated_at timestamp with time zone, is_portal_user boolean DEFAULT false, portal_registered_at timestamp with time zone, is_system_account boolean DEFAULT false);"
  }
]

[
  {
    "pk_statement": "ALTER TABLE profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);"
  }
]

PART 2: Export all 47 portal table structures
[
  {
    "table_name": "calculator_submissions",
    "exists_in_db": true,
    "column_count": 22
  },
  {
    "table_name": "contact_interactions",
    "exists_in_db": false,
    "column_count": 0
  },
  {
    "table_name": "contact_tracking",
    "exists_in_db": false,
    "column_count": 0
  },
  {
    "table_name": "email_logs",
    "exists_in_db": true,
    "column_count": 18
  },
  {
    "table_name": "email_logs_backup_042",
    "exists_in_db": true,
    "column_count": 15
  },
  {
    "table_name": "email_notification_batches",
    "exists_in_db": true,
    "column_count": 21
  },
  {
    "table_name": "email_notification_batches_archive",
    "exists_in_db": true,
    "column_count": 16
  },
  {
    "table_name": "email_notification_batches_backup_042",
    "exists_in_db": true,
    "column_count": 18
  },
  {
    "table_name": "email_notifications",
    "exists_in_db": true,
    "column_count": 23
  },
  {
    "table_name": "email_queue",
    "exists_in_db": true,
    "column_count": 28
  },
  {
    "table_name": "email_templates",
    "exists_in_db": true,
    "column_count": 12
  },
  {
    "table_name": "marketing_campaign_links",
    "exists_in_db": true,
    "column_count": 9
  },
  {
    "table_name": "membership_agreements",
    "exists_in_db": true,
    "column_count": 11
  },
  {
    "table_name": "nda_agreements",
    "exists_in_db": true,
    "column_count": 11
  },
  {
    "table_name": "notification_events",
    "exists_in_db": true,
    "column_count": 7
  },
  {
    "table_name": "notification_logs",
    "exists_in_db": true,
    "column_count": 5
  },
  {
    "table_name": "notification_rules",
    "exists_in_db": true,
    "column_count": 12
  },
  {
    "table_name": "portal_admin_activity",
    "exists_in_db": true,
    "column_count": 10
  },
  {
    "table_name": "portal_audit_log",
    "exists_in_db": true,
    "column_count": 7
  },
  {
    "table_name": "portal_event_dates",
    "exists_in_db": true,
    "column_count": 7
  },
  {
    "table_name": "portal_event_guests",
    "exists_in_db": true,
    "column_count": 7
  },
  {
    "table_name": "portal_event_registrations",
    "exists_in_db": true,
    "column_count": 18
  },
  {
    "table_name": "portal_event_reminders",
    "exists_in_db": true,
    "column_count": 7
  },
  {
    "table_name": "portal_events",
    "exists_in_db": true,
    "column_count": 53
  },
  {
    "table_name": "portal_event_templates",
    "exists_in_db": true,
    "column_count": 13
  },
  {
    "table_name": "portal_event_waitlist",
    "exists_in_db": false,
    "column_count": 0
  },
  {
    "table_name": "portal_memberships",
    "exists_in_db": true,
    "column_count": 8
  },
  {
    "table_name": "portal_referral_conversions",
    "exists_in_db": true,
    "column_count": 7
  },
  {
    "table_name": "portal_referral_rate_limits",
    "exists_in_db": true,
    "column_count": 6
  },
  {
    "table_name": "portal_referrals",
    "exists_in_db": true,
    "column_count": 23
  },
  {
    "table_name": "portal_referrals_archive",
    "exists_in_db": true,
    "column_count": 22
  },
  {
    "table_name": "portal_solutions",
    "exists_in_db": false,
    "column_count": 0
  },
  {
    "table_name": "portal_survey_answers",
    "exists_in_db": true,
    "column_count": 5
  },
  {
    "table_name": "portal_survey_questions",
    "exists_in_db": true,
    "column_count": 10
  },
  {
    "table_name": "portal_survey_responses",
    "exists_in_db": true,
    "column_count": 12
  },
  {
    "table_name": "portal_surveys",
    "exists_in_db": true,
    "column_count": 21
  },
  {
    "table_name": "portal_update_reads",
    "exists_in_db": true,
    "column_count": 10
  },
  {
    "table_name": "portal_updates",
    "exists_in_db": true,
    "column_count": 21
  },
  {
    "table_name": "portal_user_deletion_logs",
    "exists_in_db": true,
    "column_count": 6
  },
  {
    "table_name": "recipient_lists",
    "exists_in_db": true,
    "column_count": 12
  },
  {
    "table_name": "referral_conversions",
    "exists_in_db": true,
    "column_count": 6
  },
  {
    "table_name": "referral_deletion_logs",
    "exists_in_db": true,
    "column_count": 10
  }
]

PART 3: Export Foreign Key Constraints

[
  {
    "from_table": "calculator_submissions",
    "from_column": "previous_submission_id",
    "to_table": "calculator_submissions",
    "to_column": "id",
    "constraint_name": "calculator_submissions_previous_submission_id_fkey",
    "delete_rule": "NO ACTION",
    "fk_statement": "ALTER TABLE calculator_submissions ADD CONSTRAINT calculator_submissions_previous_submission_id_fkey FOREIGN KEY (previous_submission_id) REFERENCES calculator_submissions(id) ON DELETE NO ACTION;"
  },
  {
    "from_table": "email_logs",
    "from_column": "batch_id",
    "to_table": "email_notification_batches",
    "to_column": "id",
    "constraint_name": "email_logs_batch_id_fkey",
    "delete_rule": "SET NULL",
    "fk_statement": "ALTER TABLE email_logs ADD CONSTRAINT email_logs_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES email_notification_batches(id) ON DELETE SET NULL;"
  },
  {
    "from_table": "email_notifications",
    "from_column": "event_id",
    "to_table": "notification_events",
    "to_column": "id",
    "constraint_name": "email_notifications_event_id_fkey",
    "delete_rule": "SET NULL",
    "fk_statement": "ALTER TABLE email_notifications ADD CONSTRAINT email_notifications_event_id_fkey FOREIGN KEY (event_id) REFERENCES notification_events(id) ON DELETE SET NULL;"
  },
  {
    "from_table": "email_notifications",
    "from_column": "rule_id",
    "to_table": "notification_rules",
    "to_column": "id",
    "constraint_name": "email_notifications_rule_id_fkey",
    "delete_rule": "SET NULL",
    "fk_statement": "ALTER TABLE email_notifications ADD CONSTRAINT email_notifications_rule_id_fkey FOREIGN KEY (rule_id) REFERENCES notification_rules(id) ON DELETE SET NULL;"
  },
  {
    "from_table": "email_queue",
    "from_column": "batch_id",
    "to_table": "email_notification_batches",
    "to_column": "id",
    "constraint_name": "email_queue_batch_id_fkey",
    "delete_rule": "NO ACTION",
    "fk_statement": "ALTER TABLE email_queue ADD CONSTRAINT email_queue_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES email_notification_batches(id) ON DELETE NO ACTION;"
  },
  {
    "from_table": "marketing_campaign_links",
    "from_column": "funnel_id",
    "to_table": "portal_referrals",
    "to_column": "id",
    "constraint_name": "marketing_campaign_links_funnel_id_fkey",
    "delete_rule": "CASCADE",
    "fk_statement": "ALTER TABLE marketing_campaign_links ADD CONSTRAINT marketing_campaign_links_funnel_id_fkey FOREIGN KEY (funnel_id) REFERENCES portal_referrals(id) ON DELETE CASCADE;"
  },
  {
    "from_table": "notification_logs",
    "from_column": "notification_id",
    "to_table": "email_notifications",
    "to_column": "id",
    "constraint_name": "notification_logs_notification_id_fkey",
    "delete_rule": "CASCADE",
    "fk_statement": "ALTER TABLE notification_logs ADD CONSTRAINT notification_logs_notification_id_fkey FOREIGN KEY (notification_id) REFERENCES email_notifications(id) ON DELETE CASCADE;"
  },
  {
    "from_table": "notification_rules",
    "from_column": "event_id",
    "to_table": "notification_events",
    "to_column": "id",
    "constraint_name": "notification_rules_event_id_fkey",
    "delete_rule": "CASCADE",
    "fk_statement": "ALTER TABLE notification_rules ADD CONSTRAINT notification_rules_event_id_fkey FOREIGN KEY (event_id) REFERENCES notification_events(id) ON DELETE CASCADE;"
  },
  {
    "from_table": "notification_rules",
    "from_column": "recipient_list_id",
    "to_table": "recipient_lists",
    "to_column": "id",
    "constraint_name": "notification_rules_recipient_list_id_fkey",
    "delete_rule": "NO ACTION",
    "fk_statement": "ALTER TABLE notification_rules ADD CONSTRAINT notification_rules_recipient_list_id_fkey FOREIGN KEY (recipient_list_id) REFERENCES recipient_lists(id) ON DELETE NO ACTION;"
  },
  {
    "from_table": "portal_admin_activity",
    "from_column": "admin_id",
    "to_table": "profiles",
    "to_column": "id",
    "constraint_name": "portal_admin_activity_admin_id_fkey",
    "delete_rule": "SET NULL",
    "fk_statement": "ALTER TABLE portal_admin_activity ADD CONSTRAINT portal_admin_activity_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES profiles(id) ON DELETE SET NULL;"
  },
  {
    "from_table": "portal_event_dates",
    "from_column": "event_id",
    "to_table": "portal_events",
    "to_column": "id",
    "constraint_name": "portal_event_dates_event_id_fkey",
    "delete_rule": "CASCADE",
    "fk_statement": "ALTER TABLE portal_event_dates ADD CONSTRAINT portal_event_dates_event_id_fkey FOREIGN KEY (event_id) REFERENCES portal_events(id) ON DELETE CASCADE;"
  },
  {
    "from_table": "portal_event_guests",
    "from_column": "registration_id",
    "to_table": "portal_event_registrations",
    "to_column": "id",
    "constraint_name": "portal_event_guests_registration_id_fkey",
    "delete_rule": "CASCADE",
    "fk_statement": "ALTER TABLE portal_event_guests ADD CONSTRAINT portal_event_guests_registration_id_fkey FOREIGN KEY (registration_id) REFERENCES portal_event_registrations(id) ON DELETE CASCADE;"
  },
  {
    "from_table": "portal_event_registrations",
    "from_column": "event_date_id",
    "to_table": "portal_event_dates",
    "to_column": "id",
    "constraint_name": "portal_event_registrations_event_date_id_fkey",
    "delete_rule": "CASCADE",
    "fk_statement": "ALTER TABLE portal_event_registrations ADD CONSTRAINT portal_event_registrations_event_date_id_fkey FOREIGN KEY (event_date_id) REFERENCES portal_event_dates(id) ON DELETE CASCADE;"
  },
  {
    "from_table": "portal_event_registrations",
    "from_column": "event_id",
    "to_table": "portal_events",
    "to_column": "id",
    "constraint_name": "portal_event_registrations_event_id_fkey",
    "delete_rule": "CASCADE",
    "fk_statement": "ALTER TABLE portal_event_registrations ADD CONSTRAINT portal_event_registrations_event_id_fkey FOREIGN KEY (event_id) REFERENCES portal_events(id) ON DELETE CASCADE;"
  },
  {
    "from_table": "portal_event_registrations",
    "from_column": "user_id",
    "to_table": "profiles",
    "to_column": "id",
    "constraint_name": "portal_event_registrations_user_id_fkey",
    "delete_rule": "NO ACTION",
    "fk_statement": "ALTER TABLE portal_event_registrations ADD CONSTRAINT portal_event_registrations_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE NO ACTION;"
  },
  {
    "from_table": "portal_event_reminders",
    "from_column": "event_id",
    "to_table": "portal_events",
    "to_column": "id",
    "constraint_name": "portal_event_reminders_event_id_fkey",
    "delete_rule": "CASCADE",
    "fk_statement": "ALTER TABLE portal_event_reminders ADD CONSTRAINT portal_event_reminders_event_id_fkey FOREIGN KEY (event_id) REFERENCES portal_events(id) ON DELETE CASCADE;"
  },
  {
    "from_table": "portal_event_reminders",
    "from_column": "registration_id",
    "to_table": "portal_event_registrations",
    "to_column": "id",
    "constraint_name": "portal_event_reminders_registration_id_fkey",
    "delete_rule": "CASCADE",
    "fk_statement": "ALTER TABLE portal_event_reminders ADD CONSTRAINT portal_event_reminders_registration_id_fkey FOREIGN KEY (registration_id) REFERENCES portal_event_registrations(id) ON DELETE CASCADE;"
  },
  {
    "from_table": "portal_events",
    "from_column": "created_by",
    "to_table": "profiles",
    "to_column": "id",
    "constraint_name": "portal_events_created_by_fkey",
    "delete_rule": "NO ACTION",
    "fk_statement": "ALTER TABLE portal_events ADD CONSTRAINT portal_events_created_by_fkey FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE NO ACTION;"
  },
  {
    "from_table": "portal_referral_conversions",
    "from_column": "referee_profile_id",
    "to_table": "profiles",
    "to_column": "id",
    "constraint_name": "portal_referral_conversions_referee_profile_id_fkey",
    "delete_rule": "CASCADE",
    "fk_statement": "ALTER TABLE portal_referral_conversions ADD CONSTRAINT portal_referral_conversions_referee_profile_id_fkey FOREIGN KEY (referee_profile_id) REFERENCES profiles(id) ON DELETE CASCADE;"
  },
  {
    "from_table": "portal_referral_conversions",
    "from_column": "referral_id",
    "to_table": "portal_referrals",
    "to_column": "id",
    "constraint_name": "portal_referral_conversions_referral_id_fkey",
    "delete_rule": "CASCADE",
    "fk_statement": "ALTER TABLE portal_referral_conversions ADD CONSTRAINT portal_referral_conversions_referral_id_fkey FOREIGN KEY (referral_id) REFERENCES portal_referrals(id) ON DELETE CASCADE;"
  },
  {
    "from_table": "portal_referral_rate_limits",
    "from_column": "referral_id",
    "to_table": "portal_referrals",
    "to_column": "id",
    "constraint_name": "portal_referral_rate_limits_referral_id_fkey",
    "delete_rule": "CASCADE",
    "fk_statement": "ALTER TABLE portal_referral_rate_limits ADD CONSTRAINT portal_referral_rate_limits_referral_id_fkey FOREIGN KEY (referral_id) REFERENCES portal_referrals(id) ON DELETE CASCADE;"
  },
  {
    "from_table": "portal_referral_rate_limits",
    "from_column": "user_id",
    "to_table": "profiles",
    "to_column": "id",
    "constraint_name": "portal_referral_rate_limits_user_id_fkey",
    "delete_rule": "CASCADE",
    "fk_statement": "ALTER TABLE portal_referral_rate_limits ADD CONSTRAINT portal_referral_rate_limits_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;"
  },
  {
    "from_table": "portal_referrals",
    "from_column": "referrer_id",
    "to_table": "profiles",
    "to_column": "id",
    "constraint_name": "portal_referrals_referrer_id_fkey",
    "delete_rule": "CASCADE",
    "fk_statement": "ALTER TABLE portal_referrals ADD CONSTRAINT portal_referrals_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES profiles(id) ON DELETE CASCADE;"
  },
  {
    "from_table": "portal_survey_answers",
    "from_column": "question_id",
    "to_table": "portal_survey_questions",
    "to_column": "id",
    "constraint_name": "portal_survey_answers_question_id_fkey",
    "delete_rule": "CASCADE",
    "fk_statement": "ALTER TABLE portal_survey_answers ADD CONSTRAINT portal_survey_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES portal_survey_questions(id) ON DELETE CASCADE;"
  },
  {
    "from_table": "portal_survey_answers",
    "from_column": "response_id",
    "to_table": "portal_survey_responses",
    "to_column": "id",
    "constraint_name": "portal_survey_answers_response_id_fkey",
    "delete_rule": "CASCADE",
    "fk_statement": "ALTER TABLE portal_survey_answers ADD CONSTRAINT portal_survey_answers_response_id_fkey FOREIGN KEY (response_id) REFERENCES portal_survey_responses(id) ON DELETE CASCADE;"
  },
  {
    "from_table": "portal_survey_questions",
    "from_column": "section_id",
    "to_table": "portal_survey_sections",
    "to_column": "id",
    "constraint_name": "portal_survey_questions_section_id_fkey",
    "delete_rule": "SET NULL",
    "fk_statement": "ALTER TABLE portal_survey_questions ADD CONSTRAINT portal_survey_questions_section_id_fkey FOREIGN KEY (section_id) REFERENCES portal_survey_sections(id) ON DELETE SET NULL;"
  },
  {
    "from_table": "portal_survey_questions",
    "from_column": "survey_id",
    "to_table": "portal_surveys",
    "to_column": "id",
    "constraint_name": "portal_survey_questions_survey_id_fkey",
    "delete_rule": "CASCADE",
    "fk_statement": "ALTER TABLE portal_survey_questions ADD CONSTRAINT portal_survey_questions_survey_id_fkey FOREIGN KEY (survey_id) REFERENCES portal_surveys(id) ON DELETE CASCADE;"
  },
  {
    "from_table": "portal_survey_responses",
    "from_column": "survey_id",
    "to_table": "portal_surveys",
    "to_column": "id",
    "constraint_name": "portal_survey_responses_survey_id_fkey",
    "delete_rule": "CASCADE",
    "fk_statement": "ALTER TABLE portal_survey_responses ADD CONSTRAINT portal_survey_responses_survey_id_fkey FOREIGN KEY (survey_id) REFERENCES portal_surveys(id) ON DELETE CASCADE;"
  },
  {
    "from_table": "portal_update_reads",
    "from_column": "update_id",
    "to_table": "portal_updates",
    "to_column": "id",
    "constraint_name": "portal_update_reads_update_id_fkey",
    "delete_rule": "CASCADE",
    "fk_statement": "ALTER TABLE portal_update_reads ADD CONSTRAINT portal_update_reads_update_id_fkey FOREIGN KEY (update_id) REFERENCES portal_updates(id) ON DELETE CASCADE;"
  },
  {
    "from_table": "portal_updates",
    "from_column": "is_correction_of",
    "to_table": "portal_updates",
    "to_column": "id",
    "constraint_name": "portal_updates_correction_fk",
    "delete_rule": "NO ACTION",
    "fk_statement": "ALTER TABLE portal_updates ADD CONSTRAINT portal_updates_correction_fk FOREIGN KEY (is_correction_of) REFERENCES portal_updates(id) ON DELETE NO ACTION;"
  },
  {
    "from_table": "referral_conversions",
    "from_column": "referral_id",
    "to_table": "portal_referrals",
    "to_column": "id",
    "constraint_name": "referral_conversions_referral_id_fkey",
    "delete_rule": "CASCADE",
    "fk_statement": "ALTER TABLE referral_conversions ADD CONSTRAINT referral_conversions_referral_id_fkey FOREIGN KEY (referral_id) REFERENCES portal_referrals(id) ON DELETE CASCADE;"
  },
  {
    "from_table": "referral_conversions",
    "from_column": "user_id",
    "to_table": "profiles",
    "to_column": "id",
    "constraint_name": "referral_conversions_user_id_fkey",
    "delete_rule": "CASCADE",
    "fk_statement": "ALTER TABLE referral_conversions ADD CONSTRAINT referral_conversions_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;"
  }
]

PART 4: Export Indexes

[
  {
    "schemaname": "public",
    "tablename": "calculator_submissions",
    "indexname": "calculator_submissions_pkey",
    "indexdef": "CREATE UNIQUE INDEX calculator_submissions_pkey ON public.calculator_submissions USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "calculator_submissions",
    "indexname": "idx_calc_submissions_company",
    "indexdef": "CREATE INDEX idx_calc_submissions_company ON public.calculator_submissions USING btree (company_name)"
  },
  {
    "schemaname": "public",
    "tablename": "calculator_submissions",
    "indexname": "idx_calc_submissions_date",
    "indexdef": "CREATE INDEX idx_calc_submissions_date ON public.calculator_submissions USING btree (submission_date DESC)"
  },
  {
    "schemaname": "public",
    "tablename": "calculator_submissions",
    "indexname": "idx_calc_submissions_latest",
    "indexdef": "CREATE INDEX idx_calc_submissions_latest ON public.calculator_submissions USING btree (is_latest) WHERE (is_latest = true)"
  },
  {
    "schemaname": "public",
    "tablename": "calculator_submissions",
    "indexname": "idx_calc_submissions_savings",
    "indexdef": "CREATE INDEX idx_calc_submissions_savings ON public.calculator_submissions USING btree (total_monthly_savings DESC)"
  },
  {
    "schemaname": "public",
    "tablename": "calculator_submissions",
    "indexname": "idx_calc_submissions_user",
    "indexdef": "CREATE INDEX idx_calc_submissions_user ON public.calculator_submissions USING btree (user_id)"
  },
  {
    "schemaname": "public",
    "tablename": "calculator_submissions",
    "indexname": "idx_calculator_submissions_afs_total",
    "indexdef": "CREATE INDEX idx_calculator_submissions_afs_total ON public.calculator_submissions USING btree (afs_savings_total) WHERE (afs_savings_total > (0)::numeric)"
  },
  {
    "schemaname": "public",
    "tablename": "email_logs",
    "indexname": "email_logs_pkey",
    "indexdef": "CREATE UNIQUE INDEX email_logs_pkey ON public.email_logs USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "email_logs",
    "indexname": "idx_email_logs_batch",
    "indexdef": "CREATE INDEX idx_email_logs_batch ON public.email_logs USING btree (batch_id)"
  },
  {
    "schemaname": "public",
    "tablename": "email_logs",
    "indexname": "idx_email_logs_batch_id",
    "indexdef": "CREATE INDEX idx_email_logs_batch_id ON public.email_logs USING btree (batch_id)"
  },
  {
    "schemaname": "public",
    "tablename": "email_logs",
    "indexname": "idx_email_logs_resend_id",
    "indexdef": "CREATE INDEX idx_email_logs_resend_id ON public.email_logs USING btree (resend_id)"
  },
  {
    "schemaname": "public",
    "tablename": "email_logs",
    "indexname": "idx_email_logs_sent_at",
    "indexdef": "CREATE INDEX idx_email_logs_sent_at ON public.email_logs USING btree (sent_at DESC)"
  },
  {
    "schemaname": "public",
    "tablename": "email_logs",
    "indexname": "idx_email_logs_status",
    "indexdef": "CREATE INDEX idx_email_logs_status ON public.email_logs USING btree (status)"
  },
  {
    "schemaname": "public",
    "tablename": "email_logs",
    "indexname": "idx_email_logs_to_email",
    "indexdef": "CREATE INDEX idx_email_logs_to_email ON public.email_logs USING btree (to_email)"
  },
  {
    "schemaname": "public",
    "tablename": "email_logs",
    "indexname": "idx_email_logs_user_id",
    "indexdef": "CREATE INDEX idx_email_logs_user_id ON public.email_logs USING btree (user_id)"
  },
  {
    "schemaname": "public",
    "tablename": "email_notification_batches",
    "indexname": "email_notification_batches_pkey",
    "indexdef": "CREATE UNIQUE INDEX email_notification_batches_pkey ON public.email_notification_batches USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "email_notification_batches",
    "indexname": "idx_email_batches_content",
    "indexdef": "CREATE INDEX idx_email_batches_content ON public.email_notification_batches USING btree (content_id)"
  },
  {
    "schemaname": "public",
    "tablename": "email_notification_batches",
    "indexname": "idx_email_batches_content_id",
    "indexdef": "CREATE INDEX idx_email_batches_content_id ON public.email_notification_batches USING btree (content_id)"
  },
  {
    "schemaname": "public",
    "tablename": "email_notification_batches",
    "indexname": "idx_email_batches_created",
    "indexdef": "CREATE INDEX idx_email_batches_created ON public.email_notification_batches USING btree (created_at)"
  },
  {
    "schemaname": "public",
    "tablename": "email_notification_batches",
    "indexname": "idx_email_batches_created_at",
    "indexdef": "CREATE INDEX idx_email_batches_created_at ON public.email_notification_batches USING btree (created_at DESC)"
  },
  {
    "schemaname": "public",
    "tablename": "email_notification_batches",
    "indexname": "idx_email_batches_notification_type",
    "indexdef": "CREATE INDEX idx_email_batches_notification_type ON public.email_notification_batches USING btree (notification_type)"
  },
  {
    "schemaname": "public",
    "tablename": "email_notification_batches",
    "indexname": "idx_email_batches_started",
    "indexdef": "CREATE INDEX idx_email_batches_started ON public.email_notification_batches USING btree (started_at)"
  },
  {
    "schemaname": "public",
    "tablename": "email_notification_batches",
    "indexname": "idx_email_batches_status",
    "indexdef": "CREATE INDEX idx_email_batches_status ON public.email_notification_batches USING btree (status)"
  },
  {
    "schemaname": "public",
    "tablename": "email_notification_batches",
    "indexname": "idx_email_batches_type",
    "indexdef": "CREATE INDEX idx_email_batches_type ON public.email_notification_batches USING btree (notification_type)"
  },
  {
    "schemaname": "public",
    "tablename": "email_notifications",
    "indexname": "email_notifications_pkey",
    "indexdef": "CREATE UNIQUE INDEX email_notifications_pkey ON public.email_notifications USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "email_notifications",
    "indexname": "idx_email_notifications_created",
    "indexdef": "CREATE INDEX idx_email_notifications_created ON public.email_notifications USING btree (created_at DESC)"
  },
  {
    "schemaname": "public",
    "tablename": "email_notifications",
    "indexname": "idx_email_notifications_event",
    "indexdef": "CREATE INDEX idx_email_notifications_event ON public.email_notifications USING btree (event_id)"
  },
  {
    "schemaname": "public",
    "tablename": "email_notifications",
    "indexname": "idx_email_notifications_priority",
    "indexdef": "CREATE INDEX idx_email_notifications_priority ON public.email_notifications USING btree (priority DESC, scheduled_for) WHERE (status = 'pending'::text)"
  },
  {
    "schemaname": "public",
    "tablename": "email_notifications",
    "indexname": "idx_email_notifications_retry",
    "indexdef": "CREATE INDEX idx_email_notifications_retry ON public.email_notifications USING btree (retry_after) WHERE ((status = 'failed'::text) AND (error_count < max_retries))"
  },
  {
    "schemaname": "public",
    "tablename": "email_notifications",
    "indexname": "idx_email_notifications_scheduled",
    "indexdef": "CREATE INDEX idx_email_notifications_scheduled ON public.email_notifications USING btree (scheduled_for) WHERE (status = 'pending'::text)"
  },
  {
    "schemaname": "public",
    "tablename": "email_notifications",
    "indexname": "idx_email_notifications_status",
    "indexdef": "CREATE INDEX idx_email_notifications_status ON public.email_notifications USING btree (status) WHERE (status = ANY (ARRAY['pending'::text, 'processing'::text]))"
  },
  {
    "schemaname": "public",
    "tablename": "email_queue",
    "indexname": "email_queue_pkey",
    "indexdef": "CREATE UNIQUE INDEX email_queue_pkey ON public.email_queue USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "email_queue",
    "indexname": "idx_email_queue_status",
    "indexdef": "CREATE INDEX idx_email_queue_status ON public.email_queue USING btree (status)"
  },
  {
    "schemaname": "public",
    "tablename": "email_queue",
    "indexname": "idx_queue_batch",
    "indexdef": "CREATE INDEX idx_queue_batch ON public.email_queue USING btree (batch_id)"
  },
  {
    "schemaname": "public",
    "tablename": "email_queue",
    "indexname": "idx_queue_created",
    "indexdef": "CREATE INDEX idx_queue_created ON public.email_queue USING btree (created_at DESC)"
  },
  {
    "schemaname": "public",
    "tablename": "email_queue",
    "indexname": "idx_queue_event",
    "indexdef": "CREATE INDEX idx_queue_event ON public.email_queue USING btree (event_type, event_id)"
  },
  {
    "schemaname": "public",
    "tablename": "email_queue",
    "indexname": "idx_queue_expires",
    "indexdef": "CREATE INDEX idx_queue_expires ON public.email_queue USING btree (expires_at) WHERE (status = 'pending'::text)"
  },
  {
    "schemaname": "public",
    "tablename": "email_queue",
    "indexname": "idx_queue_priority",
    "indexdef": "CREATE INDEX idx_queue_priority ON public.email_queue USING btree (priority, scheduled_for) WHERE (status = 'pending'::text)"
  },
  {
    "schemaname": "public",
    "tablename": "email_queue",
    "indexname": "idx_queue_retry",
    "indexdef": "CREATE INDEX idx_queue_retry ON public.email_queue USING btree (status, next_retry_at) WHERE ((status = 'failed'::text) AND (attempts < max_attempts))"
  },
  {
    "schemaname": "public",
    "tablename": "email_queue",
    "indexname": "idx_queue_status_scheduled",
    "indexdef": "CREATE INDEX idx_queue_status_scheduled ON public.email_queue USING btree (status, scheduled_for) WHERE (status = ANY (ARRAY['pending'::text, 'processing'::text]))"
  },
  {
    "schemaname": "public",
    "tablename": "email_queue",
    "indexname": "idx_queue_to_email",
    "indexdef": "CREATE INDEX idx_queue_to_email ON public.email_queue USING btree (to_email)"
  },
  {
    "schemaname": "public",
    "tablename": "email_templates",
    "indexname": "email_templates_pkey",
    "indexdef": "CREATE UNIQUE INDEX email_templates_pkey ON public.email_templates USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "email_templates",
    "indexname": "idx_email_templates_active",
    "indexdef": "CREATE INDEX idx_email_templates_active ON public.email_templates USING btree (is_active)"
  },
  {
    "schemaname": "public",
    "tablename": "email_templates",
    "indexname": "idx_email_templates_category",
    "indexdef": "CREATE INDEX idx_email_templates_category ON public.email_templates USING btree (category)"
  },
  {
    "schemaname": "public",
    "tablename": "marketing_campaign_links",
    "indexname": "idx_marketing_campaign_links_code",
    "indexdef": "CREATE INDEX idx_marketing_campaign_links_code ON public.marketing_campaign_links USING btree (campaign_code)"
  },
  {
    "schemaname": "public",
    "tablename": "marketing_campaign_links",
    "indexname": "idx_marketing_campaign_links_created",
    "indexdef": "CREATE INDEX idx_marketing_campaign_links_created ON public.marketing_campaign_links USING btree (created_at)"
  },
  {
    "schemaname": "public",
    "tablename": "marketing_campaign_links",
    "indexname": "idx_marketing_campaign_links_funnel",
    "indexdef": "CREATE INDEX idx_marketing_campaign_links_funnel ON public.marketing_campaign_links USING btree (funnel_id)"
  },
  {
    "schemaname": "public",
    "tablename": "marketing_campaign_links",
    "indexname": "marketing_campaign_links_funnel_id_campaign_code_key",
    "indexdef": "CREATE UNIQUE INDEX marketing_campaign_links_funnel_id_campaign_code_key ON public.marketing_campaign_links USING btree (funnel_id, campaign_code)"
  },
  {
    "schemaname": "public",
    "tablename": "marketing_campaign_links",
    "indexname": "marketing_campaign_links_pkey",
    "indexdef": "CREATE UNIQUE INDEX marketing_campaign_links_pkey ON public.marketing_campaign_links USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "membership_agreements",
    "indexname": "idx_membership_agreements_agreed_at",
    "indexdef": "CREATE INDEX idx_membership_agreements_agreed_at ON public.membership_agreements USING btree (agreed_at DESC)"
  },
  {
    "schemaname": "public",
    "tablename": "membership_agreements",
    "indexname": "idx_membership_agreements_user_id",
    "indexdef": "CREATE INDEX idx_membership_agreements_user_id ON public.membership_agreements USING btree (user_id)"
  },
  {
    "schemaname": "public",
    "tablename": "membership_agreements",
    "indexname": "idx_membership_agreements_version",
    "indexdef": "CREATE INDEX idx_membership_agreements_version ON public.membership_agreements USING btree (agreement_version)"
  },
  {
    "schemaname": "public",
    "tablename": "membership_agreements",
    "indexname": "membership_agreements_pkey",
    "indexdef": "CREATE UNIQUE INDEX membership_agreements_pkey ON public.membership_agreements USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "membership_agreements",
    "indexname": "membership_agreements_user_id_agreement_version_key",
    "indexdef": "CREATE UNIQUE INDEX membership_agreements_user_id_agreement_version_key ON public.membership_agreements USING btree (user_id, agreement_version)"
  },
  {
    "schemaname": "public",
    "tablename": "nda_agreements",
    "indexname": "idx_nda_agreements_agreed_at",
    "indexdef": "CREATE INDEX idx_nda_agreements_agreed_at ON public.nda_agreements USING btree (agreed_at DESC)"
  },
  {
    "schemaname": "public",
    "tablename": "nda_agreements",
    "indexname": "idx_nda_agreements_user_id",
    "indexdef": "CREATE INDEX idx_nda_agreements_user_id ON public.nda_agreements USING btree (user_id)"
  },
  {
    "schemaname": "public",
    "tablename": "nda_agreements",
    "indexname": "idx_nda_agreements_version",
    "indexdef": "CREATE INDEX idx_nda_agreements_version ON public.nda_agreements USING btree (nda_version)"
  },
  {
    "schemaname": "public",
    "tablename": "nda_agreements",
    "indexname": "nda_agreements_pkey",
    "indexdef": "CREATE UNIQUE INDEX nda_agreements_pkey ON public.nda_agreements USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "nda_agreements",
    "indexname": "nda_agreements_user_id_nda_version_key",
    "indexdef": "CREATE UNIQUE INDEX nda_agreements_user_id_nda_version_key ON public.nda_agreements USING btree (user_id, nda_version)"
  },
  {
    "schemaname": "public",
    "tablename": "notification_events",
    "indexname": "notification_events_pkey",
    "indexdef": "CREATE UNIQUE INDEX notification_events_pkey ON public.notification_events USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "notification_logs",
    "indexname": "idx_notification_logs_created",
    "indexdef": "CREATE INDEX idx_notification_logs_created ON public.notification_logs USING btree (created_at DESC)"
  },
  {
    "schemaname": "public",
    "tablename": "notification_logs",
    "indexname": "idx_notification_logs_event_type",
    "indexdef": "CREATE INDEX idx_notification_logs_event_type ON public.notification_logs USING btree (event_type)"
  },
  {
    "schemaname": "public",
    "tablename": "notification_logs",
    "indexname": "idx_notification_logs_notification",
    "indexdef": "CREATE INDEX idx_notification_logs_notification ON public.notification_logs USING btree (notification_id)"
  },
  {
    "schemaname": "public",
    "tablename": "notification_logs",
    "indexname": "notification_logs_pkey",
    "indexdef": "CREATE UNIQUE INDEX notification_logs_pkey ON public.notification_logs USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "notification_rules",
    "indexname": "idx_notification_rules_enabled",
    "indexdef": "CREATE INDEX idx_notification_rules_enabled ON public.notification_rules USING btree (enabled)"
  },
  {
    "schemaname": "public",
    "tablename": "notification_rules",
    "indexname": "idx_notification_rules_event",
    "indexdef": "CREATE INDEX idx_notification_rules_event ON public.notification_rules USING btree (event_id) WHERE (enabled = true)"
  },
  {
    "schemaname": "public",
    "tablename": "notification_rules",
    "indexname": "notification_rules_event_id_name_key",
    "indexdef": "CREATE UNIQUE INDEX notification_rules_event_id_name_key ON public.notification_rules USING btree (event_id, name)"
  },
  {
    "schemaname": "public",
    "tablename": "notification_rules",
    "indexname": "notification_rules_pkey",
    "indexdef": "CREATE UNIQUE INDEX notification_rules_pkey ON public.notification_rules USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_admin_activity",
    "indexname": "idx_portal_admin_activity_admin",
    "indexdef": "CREATE INDEX idx_portal_admin_activity_admin ON public.portal_admin_activity USING btree (admin_id)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_admin_activity",
    "indexname": "idx_portal_admin_activity_created",
    "indexdef": "CREATE INDEX idx_portal_admin_activity_created ON public.portal_admin_activity USING btree (created_at)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_admin_activity",
    "indexname": "idx_portal_admin_activity_entity",
    "indexdef": "CREATE INDEX idx_portal_admin_activity_entity ON public.portal_admin_activity USING btree (entity_type, entity_id)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_admin_activity",
    "indexname": "portal_admin_activity_pkey",
    "indexdef": "CREATE UNIQUE INDEX portal_admin_activity_pkey ON public.portal_admin_activity USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_audit_log",
    "indexname": "idx_audit_log_admin",
    "indexdef": "CREATE INDEX idx_audit_log_admin ON public.portal_audit_log USING btree (admin_id)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_audit_log",
    "indexname": "idx_audit_log_created",
    "indexdef": "CREATE INDEX idx_audit_log_created ON public.portal_audit_log USING btree (created_at DESC)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_audit_log",
    "indexname": "idx_audit_log_entity",
    "indexdef": "CREATE INDEX idx_audit_log_entity ON public.portal_audit_log USING btree (entity_type, entity_id)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_audit_log",
    "indexname": "portal_audit_log_pkey",
    "indexdef": "CREATE UNIQUE INDEX portal_audit_log_pkey ON public.portal_audit_log USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_event_dates",
    "indexname": "idx_portal_event_dates_event_id",
    "indexdef": "CREATE INDEX idx_portal_event_dates_event_id ON public.portal_event_dates USING btree (event_id)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_event_dates",
    "indexname": "idx_portal_event_dates_start_time",
    "indexdef": "CREATE INDEX idx_portal_event_dates_start_time ON public.portal_event_dates USING btree (start_time)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_event_dates",
    "indexname": "portal_event_dates_event_id_start_time_key",
    "indexdef": "CREATE UNIQUE INDEX portal_event_dates_event_id_start_time_key ON public.portal_event_dates USING btree (event_id, start_time)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_event_dates",
    "indexname": "portal_event_dates_pkey",
    "indexdef": "CREATE UNIQUE INDEX portal_event_dates_pkey ON public.portal_event_dates USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_event_guests",
    "indexname": "idx_portal_event_guests_registration_id",
    "indexdef": "CREATE INDEX idx_portal_event_guests_registration_id ON public.portal_event_guests USING btree (registration_id)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_event_guests",
    "indexname": "portal_event_guests_pkey",
    "indexdef": "CREATE UNIQUE INDEX portal_event_guests_pkey ON public.portal_event_guests USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_event_registrations",
    "indexname": "idx_event_registrations_attended",
    "indexdef": "CREATE INDEX idx_event_registrations_attended ON public.portal_event_registrations USING btree (attended) WHERE (attended IS NOT NULL)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_event_registrations",
    "indexname": "idx_event_registrations_user_id",
    "indexdef": "CREATE INDEX idx_event_registrations_user_id ON public.portal_event_registrations USING btree (user_id)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_event_registrations",
    "indexname": "idx_portal_event_registrations_event",
    "indexdef": "CREATE INDEX idx_portal_event_registrations_event ON public.portal_event_registrations USING btree (event_id)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_event_registrations",
    "indexname": "idx_portal_event_registrations_event_date_id",
    "indexdef": "CREATE INDEX idx_portal_event_registrations_event_date_id ON public.portal_event_registrations USING btree (event_date_id)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_event_registrations",
    "indexname": "idx_portal_event_registrations_event_id",
    "indexdef": "CREATE INDEX idx_portal_event_registrations_event_id ON public.portal_event_registrations USING btree (event_id)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_event_registrations",
    "indexname": "idx_portal_event_registrations_status",
    "indexdef": "CREATE INDEX idx_portal_event_registrations_status ON public.portal_event_registrations USING btree (attendance_status)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_event_registrations",
    "indexname": "idx_portal_event_registrations_user",
    "indexdef": "CREATE INDEX idx_portal_event_registrations_user ON public.portal_event_registrations USING btree (user_id)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_event_registrations",
    "indexname": "idx_portal_event_registrations_user_id",
    "indexdef": "CREATE INDEX idx_portal_event_registrations_user_id ON public.portal_event_registrations USING btree (user_id)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_event_registrations",
    "indexname": "portal_event_registrations_event_date_id_user_id_key",
    "indexdef": "CREATE UNIQUE INDEX portal_event_registrations_event_date_id_user_id_key ON public.portal_event_registrations USING btree (event_date_id, user_id)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_event_registrations",
    "indexname": "portal_event_registrations_event_id_user_id_key",
    "indexdef": "CREATE UNIQUE INDEX portal_event_registrations_event_id_user_id_key ON public.portal_event_registrations USING btree (event_id, user_id)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_event_registrations",
    "indexname": "portal_event_registrations_pkey",
    "indexdef": "CREATE UNIQUE INDEX portal_event_registrations_pkey ON public.portal_event_registrations USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_event_reminders",
    "indexname": "idx_portal_event_reminders_event",
    "indexdef": "CREATE INDEX idx_portal_event_reminders_event ON public.portal_event_reminders USING btree (event_id)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_event_reminders",
    "indexname": "idx_portal_event_reminders_registration",
    "indexdef": "CREATE INDEX idx_portal_event_reminders_registration ON public.portal_event_reminders USING btree (registration_id)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_event_reminders",
    "indexname": "portal_event_reminders_pkey",
    "indexdef": "CREATE UNIQUE INDEX portal_event_reminders_pkey ON public.portal_event_reminders USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_event_reminders",
    "indexname": "portal_event_reminders_registration_id_reminder_type_key",
    "indexdef": "CREATE UNIQUE INDEX portal_event_reminders_registration_id_reminder_type_key ON public.portal_event_reminders USING btree (registration_id, reminder_type)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_event_templates",
    "indexname": "portal_event_templates_pkey",
    "indexdef": "CREATE UNIQUE INDEX portal_event_templates_pkey ON public.portal_event_templates USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_events",
    "indexname": "idx_portal_events_active",
    "indexdef": "CREATE INDEX idx_portal_events_active ON public.portal_events USING btree (is_active) WHERE (is_active = true)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_events",
    "indexname": "idx_portal_events_created_by",
    "indexdef": "CREATE INDEX idx_portal_events_created_by ON public.portal_events USING btree (created_by)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_events",
    "indexname": "idx_portal_events_dates",
    "indexdef": "CREATE INDEX idx_portal_events_dates ON public.portal_events USING btree (start_datetime, end_datetime)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_events",
    "indexname": "idx_portal_events_published_at",
    "indexdef": "CREATE INDEX idx_portal_events_published_at ON public.portal_events USING btree (published_at)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_events",
    "indexname": "idx_portal_events_registration_open",
    "indexdef": "CREATE INDEX idx_portal_events_registration_open ON public.portal_events USING btree (registration_open) WHERE (registration_open = true)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_events",
    "indexname": "idx_portal_events_slug",
    "indexdef": "CREATE INDEX idx_portal_events_slug ON public.portal_events USING btree (slug)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_events",
    "indexname": "idx_portal_events_start_datetime",
    "indexdef": "CREATE INDEX idx_portal_events_start_datetime ON public.portal_events USING btree (start_datetime)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_events",
    "indexname": "idx_portal_events_status",
    "indexdef": "CREATE INDEX idx_portal_events_status ON public.portal_events USING btree (status)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_events",
    "indexname": "idx_portal_events_type",
    "indexdef": "CREATE INDEX idx_portal_events_type ON public.portal_events USING btree (event_type)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_events",
    "indexname": "portal_events_pkey",
    "indexdef": "CREATE UNIQUE INDEX portal_events_pkey ON public.portal_events USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_events",
    "indexname": "portal_events_slug_key",
    "indexdef": "CREATE UNIQUE INDEX portal_events_slug_key ON public.portal_events USING btree (slug)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_memberships",
    "indexname": "idx_portal_memberships_active",
    "indexdef": "CREATE INDEX idx_portal_memberships_active ON public.portal_memberships USING btree (is_active)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_memberships",
    "indexname": "idx_portal_memberships_role",
    "indexdef": "CREATE INDEX idx_portal_memberships_role ON public.portal_memberships USING btree (portal_role) WHERE (is_active = true)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_memberships",
    "indexname": "idx_portal_memberships_status",
    "indexdef": "CREATE INDEX idx_portal_memberships_status ON public.portal_memberships USING btree (status)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_memberships",
    "indexname": "idx_portal_memberships_user_id",
    "indexdef": "CREATE INDEX idx_portal_memberships_user_id ON public.portal_memberships USING btree (user_id) WHERE (is_active = true)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_memberships",
    "indexname": "portal_memberships_pkey",
    "indexdef": "CREATE UNIQUE INDEX portal_memberships_pkey ON public.portal_memberships USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_referral_conversions",
    "indexname": "idx_portal_referral_conversions_referee_profile_id",
    "indexdef": "CREATE INDEX idx_portal_referral_conversions_referee_profile_id ON public.portal_referral_conversions USING btree (referee_profile_id)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_referral_conversions",
    "indexname": "idx_portal_referral_conversions_referral_id",
    "indexdef": "CREATE INDEX idx_portal_referral_conversions_referral_id ON public.portal_referral_conversions USING btree (referral_id)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_referral_conversions",
    "indexname": "portal_referral_conversions_pkey",
    "indexdef": "CREATE UNIQUE INDEX portal_referral_conversions_pkey ON public.portal_referral_conversions USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_referral_conversions",
    "indexname": "unique_referee_conversion",
    "indexdef": "CREATE UNIQUE INDEX unique_referee_conversion ON public.portal_referral_conversions USING btree (referee_profile_id)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_referral_conversions",
    "indexname": "unique_referral_conversion",
    "indexdef": "CREATE UNIQUE INDEX unique_referral_conversion ON public.portal_referral_conversions USING btree (referral_id)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_referral_rate_limits",
    "indexname": "idx_referral_rate_limits_referral_resend",
    "indexdef": "CREATE INDEX idx_referral_rate_limits_referral_resend ON public.portal_referral_rate_limits USING btree (referral_id, action_type, action_timestamp)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_referral_rate_limits",
    "indexname": "idx_referral_rate_limits_user_action",
    "indexdef": "CREATE INDEX idx_referral_rate_limits_user_action ON public.portal_referral_rate_limits USING btree (user_id, action_type, action_timestamp)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_referral_rate_limits",
    "indexname": "portal_referral_rate_limits_pkey",
    "indexdef": "CREATE UNIQUE INDEX portal_referral_rate_limits_pkey ON public.portal_referral_rate_limits USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_referrals",
    "indexname": "idx_portal_referrals_created_at",
    "indexdef": "CREATE INDEX idx_portal_referrals_created_at ON public.portal_referrals USING btree (created_at DESC)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_referrals",
    "indexname": "idx_portal_referrals_expires",
    "indexdef": "CREATE INDEX idx_portal_referrals_expires ON public.portal_referrals USING btree (expires_at) WHERE (expires_at IS NOT NULL)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_referrals",
    "indexname": "idx_portal_referrals_referee_email",
    "indexdef": "CREATE INDEX idx_portal_referrals_referee_email ON public.portal_referrals USING btree (referee_email)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_referrals",
    "indexname": "idx_portal_referrals_referee_email_lower",
    "indexdef": "CREATE INDEX idx_portal_referrals_referee_email_lower ON public.portal_referrals USING btree (lower(referee_email)) WHERE ((referral_type)::text = 'individual'::text)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_referrals",
    "indexname": "idx_portal_referrals_referral_code",
    "indexdef": "CREATE INDEX idx_portal_referrals_referral_code ON public.portal_referrals USING btree (referral_code)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_referrals",
    "indexname": "idx_portal_referrals_referrer_id",
    "indexdef": "CREATE INDEX idx_portal_referrals_referrer_id ON public.portal_referrals USING btree (referrer_id)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_referrals",
    "indexname": "idx_portal_referrals_reusable",
    "indexdef": "CREATE INDEX idx_portal_referrals_reusable ON public.portal_referrals USING btree (is_reusable) WHERE (is_reusable = true)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_referrals",
    "indexname": "idx_portal_referrals_status",
    "indexdef": "CREATE INDEX idx_portal_referrals_status ON public.portal_referrals USING btree (status)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_referrals",
    "indexname": "idx_portal_referrals_type_source",
    "indexdef": "CREATE INDEX idx_portal_referrals_type_source ON public.portal_referrals USING btree (referral_type, referral_source)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_referrals",
    "indexname": "portal_referrals_pkey",
    "indexdef": "CREATE UNIQUE INDEX portal_referrals_pkey ON public.portal_referrals USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_referrals",
    "indexname": "portal_referrals_referral_code_key",
    "indexdef": "CREATE UNIQUE INDEX portal_referrals_referral_code_key ON public.portal_referrals USING btree (referral_code)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_referrals",
    "indexname": "unique_referrer_referee",
    "indexdef": "CREATE UNIQUE INDEX unique_referrer_referee ON public.portal_referrals USING btree (referrer_id, referee_email)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_referrals_archive",
    "indexname": "idx_referrals_archive_deleted_at",
    "indexdef": "CREATE INDEX idx_referrals_archive_deleted_at ON public.portal_referrals_archive USING btree (deleted_at DESC)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_referrals_archive",
    "indexname": "idx_referrals_archive_deleted_by",
    "indexdef": "CREATE INDEX idx_referrals_archive_deleted_by ON public.portal_referrals_archive USING btree (deleted_by)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_referrals_archive",
    "indexname": "idx_referrals_archive_referee_email",
    "indexdef": "CREATE INDEX idx_referrals_archive_referee_email ON public.portal_referrals_archive USING btree (referee_email)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_referrals_archive",
    "indexname": "portal_referrals_archive_pkey",
    "indexdef": "CREATE UNIQUE INDEX portal_referrals_archive_pkey ON public.portal_referrals_archive USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_survey_answers",
    "indexname": "idx_survey_answers_question",
    "indexdef": "CREATE INDEX idx_survey_answers_question ON public.portal_survey_answers USING btree (question_id)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_survey_answers",
    "indexname": "idx_survey_answers_response",
    "indexdef": "CREATE INDEX idx_survey_answers_response ON public.portal_survey_answers USING btree (response_id)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_survey_answers",
    "indexname": "portal_survey_answers_pkey",
    "indexdef": "CREATE UNIQUE INDEX portal_survey_answers_pkey ON public.portal_survey_answers USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_survey_answers",
    "indexname": "portal_survey_answers_response_id_question_id_key",
    "indexdef": "CREATE UNIQUE INDEX portal_survey_answers_response_id_question_id_key ON public.portal_survey_answers USING btree (response_id, question_id)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_survey_questions",
    "indexname": "idx_survey_questions_position",
    "indexdef": "CREATE INDEX idx_survey_questions_position ON public.portal_survey_questions USING btree (\"position\")"
  },
  {
    "schemaname": "public",
    "tablename": "portal_survey_questions",
    "indexname": "idx_survey_questions_section",
    "indexdef": "CREATE INDEX idx_survey_questions_section ON public.portal_survey_questions USING btree (section_id, section_order)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_survey_questions",
    "indexname": "idx_survey_questions_survey",
    "indexdef": "CREATE INDEX idx_survey_questions_survey ON public.portal_survey_questions USING btree (survey_id)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_survey_questions",
    "indexname": "portal_survey_questions_pkey",
    "indexdef": "CREATE UNIQUE INDEX portal_survey_questions_pkey ON public.portal_survey_questions USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_survey_questions",
    "indexname": "portal_survey_questions_survey_id_position_key",
    "indexdef": "CREATE UNIQUE INDEX portal_survey_questions_survey_id_position_key ON public.portal_survey_questions USING btree (survey_id, \"position\")"
  },
  {
    "schemaname": "public",
    "tablename": "portal_survey_responses",
    "indexname": "idx_portal_survey_responses_status",
    "indexdef": "CREATE INDEX idx_portal_survey_responses_status ON public.portal_survey_responses USING btree (status)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_survey_responses",
    "indexname": "idx_survey_responses_complete",
    "indexdef": "CREATE INDEX idx_survey_responses_complete ON public.portal_survey_responses USING btree (is_complete)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_survey_responses",
    "indexname": "idx_survey_responses_completed",
    "indexdef": "CREATE INDEX idx_survey_responses_completed ON public.portal_survey_responses USING btree (completed) WHERE (completed IS NOT NULL)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_survey_responses",
    "indexname": "idx_survey_responses_survey",
    "indexdef": "CREATE INDEX idx_survey_responses_survey ON public.portal_survey_responses USING btree (survey_id)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_survey_responses",
    "indexname": "idx_survey_responses_test",
    "indexdef": "CREATE INDEX idx_survey_responses_test ON public.portal_survey_responses USING btree (is_test_response)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_survey_responses",
    "indexname": "idx_survey_responses_user",
    "indexdef": "CREATE INDEX idx_survey_responses_user ON public.portal_survey_responses USING btree (user_id)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_survey_responses",
    "indexname": "idx_survey_responses_user_id",
    "indexdef": "CREATE INDEX idx_survey_responses_user_id ON public.portal_survey_responses USING btree (user_id)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_survey_responses",
    "indexname": "portal_survey_responses_pkey",
    "indexdef": "CREATE UNIQUE INDEX portal_survey_responses_pkey ON public.portal_survey_responses USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_survey_responses",
    "indexname": "portal_survey_responses_survey_id_user_id_key",
    "indexdef": "CREATE UNIQUE INDEX portal_survey_responses_survey_id_user_id_key ON public.portal_survey_responses USING btree (survey_id, user_id)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_surveys",
    "indexname": "idx_portal_surveys_active",
    "indexdef": "CREATE INDEX idx_portal_surveys_active ON public.portal_surveys USING btree (is_active) WHERE (is_active = true)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_surveys",
    "indexname": "idx_portal_surveys_closed_at",
    "indexdef": "CREATE INDEX idx_portal_surveys_closed_at ON public.portal_surveys USING btree (closed_at) WHERE (closed_at IS NOT NULL)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_surveys",
    "indexname": "idx_portal_surveys_created_by",
    "indexdef": "CREATE INDEX idx_portal_surveys_created_by ON public.portal_surveys USING btree (created_by)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_surveys",
    "indexname": "idx_portal_surveys_published_at",
    "indexdef": "CREATE INDEX idx_portal_surveys_published_at ON public.portal_surveys USING btree (published_at)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_surveys",
    "indexname": "idx_portal_surveys_status",
    "indexdef": "CREATE INDEX idx_portal_surveys_status ON public.portal_surveys USING btree (status)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_surveys",
    "indexname": "idx_portal_surveys_updated_at",
    "indexdef": "CREATE INDEX idx_portal_surveys_updated_at ON public.portal_surveys USING btree (updated_at)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_surveys",
    "indexname": "portal_surveys_pkey",
    "indexdef": "CREATE UNIQUE INDEX portal_surveys_pkey ON public.portal_surveys USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_update_reads",
    "indexname": "idx_portal_update_reads_update",
    "indexdef": "CREATE INDEX idx_portal_update_reads_update ON public.portal_update_reads USING btree (update_id)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_update_reads",
    "indexname": "idx_portal_update_reads_user",
    "indexdef": "CREATE INDEX idx_portal_update_reads_user ON public.portal_update_reads USING btree (user_id)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_update_reads",
    "indexname": "portal_update_reads_pkey",
    "indexdef": "CREATE UNIQUE INDEX portal_update_reads_pkey ON public.portal_update_reads USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_update_reads",
    "indexname": "portal_update_reads_update_id_user_id_key",
    "indexdef": "CREATE UNIQUE INDEX portal_update_reads_update_id_user_id_key ON public.portal_update_reads USING btree (update_id, user_id)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_updates",
    "indexname": "idx_portal_updates_archived",
    "indexdef": "CREATE INDEX idx_portal_updates_archived ON public.portal_updates USING btree (archived_at) WHERE (archived_at IS NOT NULL)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_updates",
    "indexname": "idx_portal_updates_archived_at",
    "indexdef": "CREATE INDEX idx_portal_updates_archived_at ON public.portal_updates USING btree (archived_at) WHERE (archived_at IS NOT NULL)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_updates",
    "indexname": "idx_portal_updates_published",
    "indexdef": "CREATE INDEX idx_portal_updates_published ON public.portal_updates USING btree (published_at DESC) WHERE (published_at IS NOT NULL)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_updates",
    "indexname": "idx_portal_updates_status",
    "indexdef": "CREATE INDEX idx_portal_updates_status ON public.portal_updates USING btree (status)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_updates",
    "indexname": "portal_updates_pkey",
    "indexdef": "CREATE UNIQUE INDEX portal_updates_pkey ON public.portal_updates USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_user_deletion_logs",
    "indexname": "idx_portal_user_deletion_logs_deleted_at",
    "indexdef": "CREATE INDEX idx_portal_user_deletion_logs_deleted_at ON public.portal_user_deletion_logs USING btree (deleted_at)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_user_deletion_logs",
    "indexname": "idx_portal_user_deletion_logs_deleted_by",
    "indexdef": "CREATE INDEX idx_portal_user_deletion_logs_deleted_by ON public.portal_user_deletion_logs USING btree (deleted_by)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_user_deletion_logs",
    "indexname": "portal_user_deletion_logs_pkey",
    "indexdef": "CREATE UNIQUE INDEX portal_user_deletion_logs_pkey ON public.portal_user_deletion_logs USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "indexname": "idx_profiles_email_preferences",
    "indexdef": "CREATE INDEX idx_profiles_email_preferences ON public.profiles USING btree (email_updates, email_surveys, email_events)"
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "indexname": "idx_profiles_organization",
    "indexdef": "CREATE INDEX idx_profiles_organization ON public.profiles USING btree (organization_id)"
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "indexname": "idx_profiles_organization_id",
    "indexdef": "CREATE INDEX idx_profiles_organization_id ON public.profiles USING btree (organization_id)"
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "indexname": "idx_profiles_role",
    "indexdef": "CREATE INDEX idx_profiles_role ON public.profiles USING btree (role)"
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "indexname": "profiles_pkey",
    "indexdef": "CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "recipient_lists",
    "indexname": "idx_recipient_lists_code",
    "indexdef": "CREATE INDEX idx_recipient_lists_code ON public.recipient_lists USING btree (code)"
  },
  {
    "schemaname": "public",
    "tablename": "recipient_lists",
    "indexname": "idx_recipient_lists_is_active",
    "indexdef": "CREATE INDEX idx_recipient_lists_is_active ON public.recipient_lists USING btree (is_active)"
  },
  {
    "schemaname": "public",
    "tablename": "recipient_lists",
    "indexname": "idx_recipient_lists_type",
    "indexdef": "CREATE INDEX idx_recipient_lists_type ON public.recipient_lists USING btree (type)"
  },
  {
    "schemaname": "public",
    "tablename": "recipient_lists",
    "indexname": "recipient_lists_code_key",
    "indexdef": "CREATE UNIQUE INDEX recipient_lists_code_key ON public.recipient_lists USING btree (code)"
  },
  {
    "schemaname": "public",
    "tablename": "recipient_lists",
    "indexname": "recipient_lists_name_key",
    "indexdef": "CREATE UNIQUE INDEX recipient_lists_name_key ON public.recipient_lists USING btree (name)"
  },
  {
    "schemaname": "public",
    "tablename": "recipient_lists",
    "indexname": "recipient_lists_pkey",
    "indexdef": "CREATE UNIQUE INDEX recipient_lists_pkey ON public.recipient_lists USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "referral_conversions",
    "indexname": "idx_referral_conversions_date",
    "indexdef": "CREATE INDEX idx_referral_conversions_date ON public.referral_conversions USING btree (converted_at)"
  },
  {
    "schemaname": "public",
    "tablename": "referral_conversions",
    "indexname": "idx_referral_conversions_referral",
    "indexdef": "CREATE INDEX idx_referral_conversions_referral ON public.referral_conversions USING btree (referral_id)"
  },
  {
    "schemaname": "public",
    "tablename": "referral_conversions",
    "indexname": "idx_referral_conversions_user",
    "indexdef": "CREATE INDEX idx_referral_conversions_user ON public.referral_conversions USING btree (user_id)"
  },
  {
    "schemaname": "public",
    "tablename": "referral_conversions",
    "indexname": "idx_referral_conversions_user_id",
    "indexdef": "CREATE INDEX idx_referral_conversions_user_id ON public.referral_conversions USING btree (user_id)"
  },
  {
    "schemaname": "public",
    "tablename": "referral_conversions",
    "indexname": "referral_conversions_pkey",
    "indexdef": "CREATE UNIQUE INDEX referral_conversions_pkey ON public.referral_conversions USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "referral_conversions",
    "indexname": "referral_conversions_referral_id_user_id_key",
    "indexdef": "CREATE UNIQUE INDEX referral_conversions_referral_id_user_id_key ON public.referral_conversions USING btree (referral_id, user_id)"
  },
  {
    "schemaname": "public",
    "tablename": "referral_deletion_logs",
    "indexname": "idx_deletion_logs_created_at",
    "indexdef": "CREATE INDEX idx_deletion_logs_created_at ON public.referral_deletion_logs USING btree (created_at DESC)"
  },
  {
    "schemaname": "public",
    "tablename": "referral_deletion_logs",
    "indexname": "idx_deletion_logs_deleted_by",
    "indexdef": "CREATE INDEX idx_deletion_logs_deleted_by ON public.referral_deletion_logs USING btree (deleted_by)"
  },
  {
    "schemaname": "public",
    "tablename": "referral_deletion_logs",
    "indexname": "idx_deletion_logs_referral",
    "indexdef": "CREATE INDEX idx_deletion_logs_referral ON public.referral_deletion_logs USING btree (referral_id)"
  },
  {
    "schemaname": "public",
    "tablename": "referral_deletion_logs",
    "indexname": "referral_deletion_logs_pkey",
    "indexdef": "CREATE UNIQUE INDEX referral_deletion_logs_pkey ON public.referral_deletion_logs USING btree (id)"
  }
]

PART 5: Export Row Level Security Policies

[
  {
    "schemaname": "public",
    "tablename": "calculator_submissions",
    "policyname": "Admins can delete calculator submissions",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "DELETE",
    "qual": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['super_admin'::text, 'admin'::text])))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "calculator_submissions",
    "policyname": "Admins can update submissions",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "UPDATE",
    "qual": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'superadmin'::text, 'super_admin'::text])))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "calculator_submissions",
    "policyname": "Admins can view all submissions",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'superadmin'::text, 'super_admin'::text])))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "calculator_submissions",
    "policyname": "Users can create submissions",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(user_id = auth.uid())"
  },
  {
    "schemaname": "public",
    "tablename": "calculator_submissions",
    "policyname": "Users can update recent submissions",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "UPDATE",
    "qual": "((user_id = auth.uid()) AND (created_at > (now() - '24:00:00'::interval)))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "calculator_submissions",
    "policyname": "Users can view own submissions",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(user_id = auth.uid())",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "email_logs",
    "policyname": "Admins can view email logs",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "email_notification_batches",
    "policyname": "Admins can view email batches",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "email_notification_batches",
    "policyname": "Allow all for authenticated users - batches",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "ALL",
    "qual": "true",
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "email_notifications",
    "policyname": "Admins can view all notifications",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "email_notifications",
    "policyname": "Users can view own notifications",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "((created_by = auth.uid()) OR (to_email IN ( SELECT profiles.email\n   FROM profiles\n  WHERE (profiles.id = auth.uid()))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "email_queue",
    "policyname": "Admins can manage email queue",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "email_templates",
    "policyname": "Admins can manage templates",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "email_templates",
    "policyname": "Public can read active templates",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(is_active = true)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "marketing_campaign_links",
    "policyname": "marketing_campaign_links_admin_all",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['super_admin'::text, 'admin'::text, 'portal_admin'::text])))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "marketing_campaign_links",
    "policyname": "marketing_campaign_links_select_all",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "true",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "membership_agreements",
    "policyname": "System can insert membership agreements",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(auth.uid() = user_id)"
  },
  {
    "schemaname": "public",
    "tablename": "membership_agreements",
    "policyname": "Users can view own membership agreements",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(auth.uid() = user_id)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "nda_agreements",
    "policyname": "System can insert NDA agreements",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(auth.uid() = user_id)"
  },
  {
    "schemaname": "public",
    "tablename": "nda_agreements",
    "policyname": "Users can view own NDA agreements",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(auth.uid() = user_id)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "notification_events",
    "policyname": "Public read notification events",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "true",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "notification_logs",
    "policyname": "Admins can view all logs",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "notification_logs",
    "policyname": "Users can view logs for own notifications",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(notification_id IN ( SELECT email_notifications.id\n   FROM email_notifications\n  WHERE ((email_notifications.created_by = auth.uid()) OR (email_notifications.to_email IN ( SELECT profiles.email\n           FROM profiles\n          WHERE (profiles.id = auth.uid()))))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "notification_rules",
    "policyname": "Admins can manage notification rules",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "notification_rules",
    "policyname": "Public read notification rules",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "true",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "portal_admin_activity",
    "policyname": "portal_admin_activity_admin_insert",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "is_portal_admin(auth.uid())"
  },
  {
    "schemaname": "public",
    "tablename": "portal_admin_activity",
    "policyname": "portal_admin_activity_super_admin_view",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM user_roles\n  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'super_admin'::app_role))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "portal_audit_log",
    "policyname": "Admins can view audit log",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['super_admin'::text, 'admin'::text])))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "portal_event_dates",
    "policyname": "Admins can do everything with event dates",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "portal_event_dates",
    "policyname": "Anyone can view event dates",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "true",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "portal_event_guests",
    "policyname": "Admins can manage all guests",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "portal_event_guests",
    "policyname": "Manage guests for own registrations",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM portal_event_registrations\n  WHERE ((portal_event_registrations.id = portal_event_guests.registration_id) AND (portal_event_registrations.user_id = auth.uid()))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "portal_event_guests",
    "policyname": "Users can manage own guests",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM portal_event_registrations\n  WHERE ((portal_event_registrations.id = portal_event_guests.registration_id) AND (portal_event_registrations.user_id = auth.uid()))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "portal_event_guests",
    "policyname": "View guests for own registrations",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM portal_event_registrations\n  WHERE ((portal_event_registrations.id = portal_event_guests.registration_id) AND ((portal_event_registrations.user_id = auth.uid()) OR (EXISTS ( SELECT 1\n           FROM profiles\n          WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "portal_event_registrations",
    "policyname": "Admins can manage all registrations",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "portal_event_registrations",
    "policyname": "Users can create own event registrations",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(auth.uid() = user_id)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_event_registrations",
    "policyname": "Users can create their own registrations",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(user_id = auth.uid())"
  },
  {
    "schemaname": "public",
    "tablename": "portal_event_registrations",
    "policyname": "Users can register for published events",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "((user_id = auth.uid()) AND (EXISTS ( SELECT 1\n   FROM portal_events\n  WHERE ((portal_events.id = portal_event_registrations.event_id) AND (portal_events.status = 'published'::text)))))"
  },
  {
    "schemaname": "public",
    "tablename": "portal_event_registrations",
    "policyname": "Users can update own event registrations",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(auth.uid() = user_id)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "portal_event_registrations",
    "policyname": "Users can update own registrations",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(user_id = auth.uid())",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "portal_event_registrations",
    "policyname": "Users can update their own registrations",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(user_id = auth.uid())",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "portal_event_registrations",
    "policyname": "Users can view own event registrations",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(auth.uid() = user_id)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "portal_event_registrations",
    "policyname": "Users can view own registrations",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(user_id = auth.uid())",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "portal_event_registrations",
    "policyname": "Users can view relevant registrations",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "((user_id = auth.uid()) OR (EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "portal_event_registrations",
    "policyname": "portal_event_registrations_admin_all",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "is_portal_admin(auth.uid())",
    "with_check": "is_portal_admin(auth.uid())"
  },
  {
    "schemaname": "public",
    "tablename": "portal_event_registrations",
    "policyname": "portal_event_registrations_own",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(user_id = auth.uid())",
    "with_check": "((user_id = auth.uid()) AND is_event_published(event_id))"
  },
  {
    "schemaname": "public",
    "tablename": "portal_event_reminders",
    "policyname": "portal_event_reminders_admin",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "is_portal_admin(auth.uid())",
    "with_check": "is_portal_admin(auth.uid())"
  },
  {
    "schemaname": "public",
    "tablename": "portal_event_reminders",
    "policyname": "portal_event_reminders_own_view",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM portal_event_registrations\n  WHERE ((portal_event_registrations.id = portal_event_reminders.registration_id) AND (portal_event_registrations.user_id = auth.uid()))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "portal_event_templates",
    "policyname": "Active templates viewable by authenticated users",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "((auth.role() = 'authenticated'::text) AND (is_active = true))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "portal_event_templates",
    "policyname": "Admins can manage all templates",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "portal_event_templates",
    "policyname": "Anyone can view active templates",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(is_active = true)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "portal_events",
    "policyname": "Admins can do everything with events",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "portal_events",
    "policyname": "Anyone can view published events",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "((status = 'published'::text) OR (created_by = auth.uid()) OR (EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "portal_events",
    "policyname": "portal_events_admin_all",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "is_portal_admin(auth.uid())",
    "with_check": "is_portal_admin(auth.uid())"
  },
  {
    "schemaname": "public",
    "tablename": "portal_events",
    "policyname": "portal_events_users_view",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(status = 'published'::text)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "portal_memberships",
    "policyname": "Allow membership creation",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "((auth.uid() = user_id) OR (auth.uid() IS NULL) OR ((auth.jwt() ->> 'role'::text) = 'service_role'::text))"
  },
  {
    "schemaname": "public",
    "tablename": "portal_memberships",
    "policyname": "Authenticated users can view all memberships",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(auth.role() = 'authenticated'::text)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "portal_memberships",
    "policyname": "Service role bypass membership",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "((auth.jwt() ->> 'role'::text) = 'service_role'::text)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "portal_memberships",
    "policyname": "Users can update own membership",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(auth.uid() = user_id)",
    "with_check": "(auth.uid() = user_id)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_memberships",
    "policyname": "Users can view own membership",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "((auth.uid() = user_id) OR ((auth.jwt() ->> 'role'::text) = 'service_role'::text))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "portal_memberships",
    "policyname": "pm_admins_manage",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM user_roles\n  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role])))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "portal_memberships",
    "policyname": "pm_admins_view_all",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM user_roles\n  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role])))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "portal_memberships",
    "policyname": "pm_users_view_own",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(auth.uid() = user_id)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "portal_referral_conversions",
    "policyname": "Users can view own referral conversions",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM portal_referrals\n  WHERE ((portal_referrals.id = portal_referral_conversions.referral_id) AND (portal_referrals.referrer_id = auth.uid()))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "portal_referral_rate_limits",
    "policyname": "Users can view own rate limits",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(auth.uid() = user_id)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "portal_referrals",
    "policyname": "Admins can delete referrals",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "DELETE",
    "qual": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "portal_referrals",
    "policyname": "Anyone can validate referral codes",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "((referral_code IS NOT NULL) AND (status = ANY (ARRAY['pending'::text, 'sent'::text])))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "portal_referrals",
    "policyname": "Users can create referrals",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(auth.uid() = referrer_id)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_referrals",
    "policyname": "Users can update own referrals",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(auth.uid() = referrer_id)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "portal_referrals",
    "policyname": "Users can view own referrals",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(auth.uid() = referrer_id)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "portal_referrals",
    "policyname": "portal_referrals_admin_update_marketing",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "UPDATE",
    "qual": "(((referral_type)::text = 'marketing'::text) AND (EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['super_admin'::text, 'admin'::text, 'portal_admin'::text]))))))",
    "with_check": "(((referral_type)::text = 'marketing'::text) AND (EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['super_admin'::text, 'admin'::text, 'portal_admin'::text]))))))"
  },
  {
    "schemaname": "public",
    "tablename": "portal_referrals_archive",
    "policyname": "Admins can view archive",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "portal_referrals_archive",
    "policyname": "System can insert to archive",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "portal_survey_answers",
    "policyname": "Admins can view all answers",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(auth.uid() IN ( SELECT profiles.id\n   FROM profiles\n  WHERE (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text, 'superadmin'::text]))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "portal_survey_answers",
    "policyname": "Users can manage own answers",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(response_id IN ( SELECT portal_survey_responses.id\n   FROM portal_survey_responses\n  WHERE (portal_survey_responses.user_id = auth.uid())))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "portal_survey_questions",
    "policyname": "portal_survey_questions_delete",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "DELETE",
    "qual": "(auth.uid() IN ( SELECT user_roles.user_id\n   FROM user_roles\n  WHERE (user_roles.role = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role]))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "portal_survey_questions",
    "policyname": "portal_survey_questions_insert",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(auth.uid() IN ( SELECT user_roles.user_id\n   FROM user_roles\n  WHERE (user_roles.role = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role]))))"
  },
  {
    "schemaname": "public",
    "tablename": "portal_survey_questions",
    "policyname": "portal_survey_questions_select",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "((survey_id IN ( SELECT portal_surveys.id\n   FROM portal_surveys\n  WHERE ((portal_surveys.status)::text = 'published'::text))) OR (auth.uid() IN ( SELECT user_roles.user_id\n   FROM user_roles\n  WHERE (user_roles.role = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role])))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "portal_survey_questions",
    "policyname": "portal_survey_questions_update",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(auth.uid() IN ( SELECT user_roles.user_id\n   FROM user_roles\n  WHERE (user_roles.role = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role]))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "portal_survey_responses",
    "policyname": "Admins can view all responses",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(auth.uid() IN ( SELECT profiles.id\n   FROM profiles\n  WHERE (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text, 'superadmin'::text]))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "portal_survey_responses",
    "policyname": "Users can create own survey responses",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(auth.uid() = user_id)"
  },
  {
    "schemaname": "public",
    "tablename": "portal_survey_responses",
    "policyname": "Users can manage own responses",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(auth.uid() = user_id)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "portal_survey_responses",
    "policyname": "Users can update own survey responses",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(auth.uid() = user_id)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "portal_survey_responses",
    "policyname": "Users can view own survey responses",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(auth.uid() = user_id)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "portal_surveys",
    "policyname": "portal_surveys_delete",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "DELETE",
    "qual": "(auth.uid() IN ( SELECT user_roles.user_id\n   FROM user_roles\n  WHERE (user_roles.role = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role]))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "portal_surveys",
    "policyname": "portal_surveys_insert",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(auth.uid() IN ( SELECT user_roles.user_id\n   FROM user_roles\n  WHERE (user_roles.role = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role]))))"
  },
  {
    "schemaname": "public",
    "tablename": "portal_surveys",
    "policyname": "portal_surveys_select",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(((status)::text = 'published'::text) OR (auth.uid() IN ( SELECT user_roles.user_id\n   FROM user_roles\n  WHERE (user_roles.role = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role])))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "portal_surveys",
    "policyname": "portal_surveys_update",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(auth.uid() IN ( SELECT user_roles.user_id\n   FROM user_roles\n  WHERE (user_roles.role = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role]))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "portal_update_reads",
    "policyname": "portal_update_reads_delete",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "DELETE",
    "qual": "(auth.uid() IN ( SELECT user_roles.user_id\n   FROM user_roles\n  WHERE (user_roles.role = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role]))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "portal_update_reads",
    "policyname": "portal_update_reads_insert",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(user_id = auth.uid())"
  },
  {
    "schemaname": "public",
    "tablename": "portal_update_reads",
    "policyname": "portal_update_reads_select",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "((user_id = auth.uid()) OR (auth.uid() IN ( SELECT user_roles.user_id\n   FROM user_roles\n  WHERE (user_roles.role = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role])))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "portal_update_reads",
    "policyname": "portal_update_reads_update",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(user_id = auth.uid())",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "portal_updates",
    "policyname": "portal_updates_delete",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "DELETE",
    "qual": "(auth.uid() IN ( SELECT user_roles.user_id\n   FROM user_roles\n  WHERE (user_roles.role = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role]))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "portal_updates",
    "policyname": "portal_updates_insert",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(auth.uid() IN ( SELECT user_roles.user_id\n   FROM user_roles\n  WHERE (user_roles.role = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role]))))"
  },
  {
    "schemaname": "public",
    "tablename": "portal_updates",
    "policyname": "portal_updates_select",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(((status)::text = ANY ((ARRAY['published'::character varying, 'archived'::character varying])::text[])) OR (auth.uid() IN ( SELECT user_roles.user_id\n   FROM user_roles\n  WHERE (user_roles.role = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role])))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "portal_updates",
    "policyname": "portal_updates_update",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(auth.uid() IN ( SELECT user_roles.user_id\n   FROM user_roles\n  WHERE (user_roles.role = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role]))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "portal_user_deletion_logs",
    "policyname": "Admins can view user deletion logs",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['super_admin'::text, 'admin'::text])))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "policyname": "Admin full access",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM user_roles\n  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role])))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM user_roles\n  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role])))))"
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "policyname": "Admins can delete users",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "DELETE",
    "qual": "((id <> auth.uid()) AND (EXISTS ( SELECT 1\n   FROM user_roles\n  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role]))))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "policyname": "Admins can update any profile",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(EXISTS ( SELECT 1\n   FROM user_roles\n  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role])))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM user_roles\n  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role])))))"
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "policyname": "Allow authenticated users to view profiles",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "true",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "policyname": "Allow profile creation",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "((auth.uid() = id) OR (auth.uid() IS NULL) OR ((auth.jwt() ->> 'role'::text) = 'service_role'::text))"
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "policyname": "Authenticated users can view all profiles",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(auth.role() = 'authenticated'::text)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "policyname": "Enable update for admin users",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(EXISTS ( SELECT 1\n   FROM user_roles\n  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role])))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM user_roles\n  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role])))))"
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "policyname": "Service role bypass",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "((auth.jwt() ->> 'role'::text) = 'service_role'::text)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "policyname": "System users can manage profiles",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "((auth.uid() = id) OR (EXISTS ( SELECT 1\n   FROM user_roles\n  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role, 'developer'::app_role, 'finance'::app_role]))))))",
    "with_check": "((auth.uid() = id) OR (EXISTS ( SELECT 1\n   FROM user_roles\n  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['super_admin'::app_role, 'admin'::app_role]))))))"
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "policyname": "Users can update own email preferences",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(auth.uid() = id)",
    "with_check": "(auth.uid() = id)"
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "policyname": "Users can update own profile",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(auth.uid() = id)",
    "with_check": "(auth.uid() = id)"
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "policyname": "Users can view own profile",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "((auth.uid() = id) OR ((auth.jwt() ->> 'role'::text) = 'service_role'::text))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "policyname": "write_access",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "ALL",
    "qual": "((auth.uid() = id) OR (EXISTS ( SELECT 1\n   FROM user_roles ur\n  WHERE ((ur.user_id = auth.uid()) AND (ur.role = 'admin'::app_role)))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "recipient_lists",
    "policyname": "Admin users can manage non-system recipient lists",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "ALL",
    "qual": "((EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))) AND ((is_system = false) OR (is_system IS NULL)))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "recipient_lists",
    "policyname": "Admin users can view recipient lists",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "referral_conversions",
    "policyname": "referral_conversions_admin_all",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['super_admin'::text, 'admin'::text, 'portal_admin'::text])))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "referral_conversions",
    "policyname": "referral_conversions_user_own",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(user_id = auth.uid())",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "referral_deletion_logs",
    "policyname": "Admins can view deletion logs",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "referral_deletion_logs",
    "policyname": "System can insert deletion logs",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "true"
  }
]

PART 6: Export Functions used by Portal

[
  {
    "schema_name": "public",
    "function_name": "check_email_queue_health",
    "function_definition": "CREATE OR REPLACE FUNCTION public.check_email_queue_health()\n RETURNS TABLE(metric text, value bigint, status text)\n LANGUAGE sql\nAS $function$\r\n    SELECT 'Pending Emails' as metric,\r\n           COUNT(*) as value,\r\n           CASE\r\n               WHEN COUNT(*) > 100 THEN 'WARNING: High backlog'\r\n               WHEN COUNT(*) > 50 THEN 'CAUTION: Growing backlog'\r\n               ELSE 'OK'\r\n           END as status\r\n    FROM email_queue\r\n    WHERE status = 'pending'\r\n\r\n    UNION ALL\r\n\r\n    SELECT 'Failed Emails (24h)' as metric,\r\n           COUNT(*) as value,\r\n           CASE\r\n               WHEN COUNT(*) > 10 THEN 'WARNING: High failure rate'\r\n               WHEN COUNT(*) > 5 THEN 'CAUTION: Some failures'\r\n               ELSE 'OK'\r\n           END as status\r\n    FROM email_queue\r\n    WHERE status = 'failed'\r\n        AND created_at > now() - interval '24 hours'\r\n\r\n    UNION ALL\r\n\r\n    SELECT 'Sent Emails (24h)' as metric,\r\n           COUNT(*) as value,\r\n           'INFO' as status\r\n    FROM email_queue\r\n    WHERE status = 'sent'\r\n        AND updated_at > now() - interval '24 hours'\r\n\r\n    UNION ALL\r\n\r\n    SELECT 'Oldest Pending (minutes)' as metric,\r\n           EXTRACT(EPOCH FROM (now() - MIN(created_at)))/60 as value,\r\n           CASE\r\n               WHEN EXTRACT(EPOCH FROM (now() - MIN(created_at)))/60 > 60 THEN 'WARNING: Old emails pending'\r\n               WHEN EXTRACT(EPOCH FROM (now() - MIN(created_at)))/60 > 30 THEN 'CAUTION: Emails aging'\r\n               ELSE 'OK'\r\n           END as status\r\n    FROM email_queue\r\n    WHERE status = 'pending';\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "check_referral_deletion_eligibility",
    "function_definition": "CREATE OR REPLACE FUNCTION public.check_referral_deletion_eligibility(p_referral_id uuid)\n RETURNS json\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public', 'pg_temp'\nAS $function$\r\nDECLARE\r\n  v_referral RECORD;\r\n  v_issues TEXT[] := ARRAY[]::TEXT[];\r\n  v_related_data JSONB := '{}'::jsonb;\r\n  v_portal_user_exists BOOLEAN := false;\r\n  v_app_user_exists BOOLEAN := false;\r\nBEGIN\r\n  -- Get referral details\r\n  SELECT * INTO v_referral\r\n  FROM public.portal_referrals\r\n  WHERE id = p_referral_id;\r\n\r\n  IF NOT FOUND THEN\r\n    RETURN json_build_object(\r\n      'eligible', false,\r\n      'reason', 'Referral not found',\r\n      'referral_id', p_referral_id\r\n    );\r\n  END IF;\r\n\r\n  -- Check referral status\r\n  IF v_referral.status IN ('registered', 'completed') THEN\r\n    v_issues := array_append(v_issues, 'User has already registered (status: ' || v_referral.status || ')');\r\n  END IF;\r\n\r\n  -- Check for conversion record\r\n  IF EXISTS (\r\n    SELECT 1 FROM public.portal_referral_conversions\r\n    WHERE referral_id = p_referral_id\r\n  ) THEN\r\n    v_issues := array_append(v_issues, 'Conversion record exists');\r\n  END IF;\r\n\r\n  -- Check if user exists as a PORTAL user (this should block deletion)\r\n  SELECT EXISTS (\r\n    SELECT 1 FROM public.profiles\r\n    WHERE LOWER(email) = LOWER(v_referral.referee_email)\r\n    AND role IN ('super_admin', 'admin', 'portal_member', 'investor')  -- Only portal roles\r\n  ) INTO v_portal_user_exists;\r\n\r\n  -- Check if user exists as an APP user (this should NOT block deletion)\r\n  SELECT EXISTS (\r\n    SELECT 1 FROM public.profiles\r\n    WHERE LOWER(email) = LOWER(v_referral.referee_email)\r\n    AND role = 'user'  -- App user role\r\n  ) INTO v_app_user_exists;\r\n\r\n  IF v_portal_user_exists THEN\r\n    v_issues := array_append(v_issues, 'User is already a member of the PORTAL with email: ' || v_referral.referee_email);\r\n  END IF;\r\n\r\n  -- Gather related data that would be deleted\r\n  v_related_data := jsonb_build_object(\r\n    'contacts', (\r\n      SELECT COUNT(*) FROM public.contacts\r\n      WHERE referral_id = p_referral_id\r\n    ),\r\n    'pending_emails', (\r\n      SELECT COUNT(*) FROM public.email_notifications\r\n      WHERE metadata->>'referral_id' = p_referral_id::text\r\n      AND status IN ('pending', 'failed')\r\n    ),\r\n    'rate_limits', (\r\n      SELECT COUNT(*) FROM public.portal_referral_rate_limits\r\n      WHERE referral_id = p_referral_id\r\n    ),\r\n    'is_app_user', v_app_user_exists,\r\n    'is_portal_user', v_portal_user_exists,\r\n    'note', CASE\r\n      WHEN v_app_user_exists AND NOT v_portal_user_exists\r\n      THEN 'User exists in main app but not portal - OK to refer to portal'\r\n      WHEN v_portal_user_exists\r\n      THEN 'User already has portal access - cannot refer'\r\n      ELSE 'User does not exist in either system - OK to refer'\r\n    END\r\n  );\r\n\r\n  -- Return eligibility status\r\n  IF array_length(v_issues, 1) > 0 THEN\r\n    RETURN json_build_object(\r\n      'eligible', false,\r\n      'reasons', v_issues,\r\n      'referral', row_to_json(v_referral),\r\n      'related_data', v_related_data\r\n    );\r\n  ELSE\r\n    RETURN json_build_object(\r\n      'eligible', true,\r\n      'referral', row_to_json(v_referral),\r\n      'related_data', v_related_data,\r\n      'message', 'Referral is eligible for deletion'\r\n    );\r\n  END IF;\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "check_referral_rate_limit",
    "function_definition": "CREATE OR REPLACE FUNCTION public.check_referral_rate_limit(p_user_id uuid, p_action_type text, p_referral_id uuid DEFAULT NULL::uuid)\n RETURNS boolean\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public', 'pg_temp'\nAS $function$\r\nDECLARE\r\n    action_count INTEGER;\r\n    max_allowed INTEGER;\r\n    time_window INTERVAL;\r\n    user_role TEXT;\r\nBEGIN\r\n    -- Check if user is super_admin - they are exempt from rate limits\r\n    SELECT role INTO user_role\r\n    FROM profiles\r\n    WHERE id = p_user_id;\r\n\r\n    IF user_role = 'super_admin' THEN\r\n        RETURN TRUE; -- Super admins bypass all rate limits\r\n    END IF;\r\n\r\n    -- Set limits based on action type\r\n    IF p_action_type = 'create_referral' THEN\r\n        max_allowed := 10;\r\n        time_window := INTERVAL '1 day';\r\n    ELSIF p_action_type = 'resend_invitation' THEN\r\n        max_allowed := 3;\r\n        time_window := INTERVAL '1 day';\r\n\r\n        -- For resend, check per referral\r\n        IF p_referral_id IS NOT NULL THEN\r\n            SELECT COUNT(*) INTO action_count\r\n            FROM public.portal_referral_rate_limits\r\n            WHERE referral_id = p_referral_id\r\n                AND action_type = p_action_type\r\n                AND action_timestamp > NOW() - time_window;\r\n\r\n            RETURN action_count < max_allowed;\r\n        END IF;\r\n    ELSE\r\n        RETURN FALSE;\r\n    END IF;\r\n\r\n    -- Check user's action count\r\n    SELECT COUNT(*) INTO action_count\r\n    FROM public.portal_referral_rate_limits\r\n    WHERE user_id = p_user_id\r\n        AND action_type = p_action_type\r\n        AND action_timestamp > NOW() - time_window;\r\n\r\n    RETURN action_count < max_allowed;\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "complete_email_batch",
    "function_definition": "CREATE OR REPLACE FUNCTION public.complete_email_batch(p_batch_id uuid, p_emails_sent integer, p_emails_failed integer, p_error_message text DEFAULT NULL::text)\n RETURNS void\n LANGUAGE plpgsql\nAS $function$\r\nBEGIN\r\n  UPDATE email_notification_batches\r\n  SET status = CASE\r\n        WHEN p_emails_failed > 0 AND p_emails_sent = 0 THEN 'failed'\r\n        WHEN p_emails_failed > 0 THEN 'partial'\r\n        ELSE 'completed'\r\n      END,\r\n      emails_sent = p_emails_sent,\r\n      emails_failed = p_emails_failed,\r\n      processed_count = p_emails_sent,\r\n      failed_count = p_emails_failed,\r\n      completed_at = now(),\r\n      error_message = p_error_message,\r\n      updated_at = now()\r\n  WHERE id = p_batch_id;\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "complete_referral_onboarding",
    "function_definition": "CREATE OR REPLACE FUNCTION public.complete_referral_onboarding(p_user_id uuid)\n RETURNS boolean\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public', 'pg_temp'\nAS $function$\r\nDECLARE\r\n    v_conversion_id UUID;\r\n    v_referral_id UUID;\r\nBEGIN\r\n    -- Find conversion record\r\n    SELECT id, referral_id\r\n    INTO v_conversion_id, v_referral_id\r\n    FROM public.portal_referral_conversions\r\n    WHERE referee_profile_id = p_user_id\r\n    AND onboarding_completed_at IS NULL;\r\n\r\n    IF v_conversion_id IS NULL THEN\r\n        RETURN false;\r\n    END IF;\r\n\r\n    -- Update conversion record\r\n    UPDATE public.portal_referral_conversions\r\n    SET\r\n        onboarding_completed_at = NOW(),\r\n        updated_at = NOW()\r\n    WHERE id = v_conversion_id;\r\n\r\n    -- Update referral status\r\n    UPDATE public.portal_referrals\r\n    SET\r\n        status = 'completed',\r\n        updated_at = NOW()\r\n    WHERE id = v_referral_id;\r\n\r\n    -- Update contact status\r\n    UPDATE public.contacts\r\n    SET\r\n        status = 'Active Member',\r\n        updated_at = NOW()\r\n    WHERE referral_id = v_referral_id;\r\n\r\n    RETURN true;\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "create_email_batch",
    "function_definition": "CREATE OR REPLACE FUNCTION public.create_email_batch(p_content_id uuid, p_content_type text, p_target_audience text DEFAULT 'all'::text)\n RETURNS uuid\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public', 'pg_temp'\nAS $function$\r\nDECLARE\r\n  v_batch_id UUID;\r\nBEGIN\r\n  -- Call the portal schema function\r\n  SELECT portal.create_email_batch(p_content_id, p_content_type, p_target_audience) INTO v_batch_id;\r\n  RETURN v_batch_id;\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "create_referral",
    "function_definition": "CREATE OR REPLACE FUNCTION public.create_referral(p_referrer_id uuid, p_referee_first_name text, p_referee_last_name text, p_referee_email text, p_referee_phone text DEFAULT NULL::text, p_dsp_name text DEFAULT NULL::text, p_dsp_code text DEFAULT NULL::text)\n RETURNS json\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public', 'pg_temp'\nAS $function$\r\nDECLARE\r\n    v_referral_id UUID;\r\n    v_referral_code TEXT;\r\n    v_contact_id UUID;\r\n    v_can_proceed BOOLEAN;\r\nBEGIN\r\n    -- Validate user is authenticated\r\n    IF auth.uid() IS NULL OR auth.uid() != p_referrer_id THEN\r\n        RAISE EXCEPTION 'Unauthorized';\r\n    END IF;\r\n\r\n    -- Check rate limiting\r\n    SELECT check_referral_rate_limit(p_referrer_id, 'create_referral') INTO v_can_proceed;\r\n\r\n    IF NOT v_can_proceed THEN\r\n        RAISE EXCEPTION 'Rate limit exceeded. Maximum 10 referrals per day.';\r\n    END IF;\r\n\r\n    -- Check if referral already exists\r\n    IF EXISTS (\r\n        SELECT 1 FROM public.portal_referrals\r\n        WHERE referrer_id = p_referrer_id\r\n        AND LOWER(referee_email) = LOWER(p_referee_email)\r\n    ) THEN\r\n        RAISE EXCEPTION 'You have already sent a referral to this email address';\r\n    END IF;\r\n\r\n    -- Generate unique referral code\r\n    SELECT generate_referral_code() INTO v_referral_code;\r\n\r\n    -- Create the referral\r\n    INSERT INTO public.portal_referrals (\r\n        referrer_id,\r\n        referee_first_name,\r\n        referee_last_name,\r\n        referee_email,\r\n        referee_phone,\r\n        dsp_name,\r\n        dsp_code,\r\n        referral_code,\r\n        status\r\n    ) VALUES (\r\n        p_referrer_id,\r\n        p_referee_first_name,\r\n        p_referee_last_name,\r\n        LOWER(p_referee_email),\r\n        p_referee_phone,\r\n        p_dsp_name,\r\n        p_dsp_code,\r\n        v_referral_code,\r\n        'pending'\r\n    )\r\n    RETURNING id INTO v_referral_id;\r\n\r\n    -- Record rate limit action\r\n    PERFORM record_rate_limit_action(p_referrer_id, 'create_referral');\r\n\r\n    -- Create contact record (using correct column structure)\r\n    -- Note: contacts table doesn't have source, status, or referral_id columns\r\n    -- and uses dsp_id (foreign key) not dsp_name (text)\r\n    -- We'll store basic contact info and track referral via referred_by_text\r\n    INSERT INTO public.contacts (\r\n        first_name,\r\n        last_name,\r\n        email,\r\n        phone,\r\n        referred_by_text,\r\n        contact_status,\r\n        notes\r\n    ) VALUES (\r\n        p_referee_first_name,\r\n        p_referee_last_name,\r\n        LOWER(p_referee_email),\r\n        p_referee_phone,\r\n        'Portal Referral Code: ' || v_referral_code,\r\n        'new',\r\n        'Created via portal referral from user ' || p_referrer_id::TEXT ||\r\n        CASE WHEN p_dsp_name IS NOT NULL THEN ' - DSP: ' || p_dsp_name ELSE '' END\r\n    )\r\n    RETURNING id INTO v_contact_id;\r\n\r\n    -- Return the created referral details\r\n    RETURN json_build_object(\r\n        'referral_id', v_referral_id,\r\n        'referral_code', v_referral_code,\r\n        'contact_id', v_contact_id,\r\n        'success', true\r\n    );\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "create_update_email_batch",
    "function_definition": "CREATE OR REPLACE FUNCTION public.create_update_email_batch()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public', 'pg_temp'\nAS $function$\r\nDECLARE\r\n  v_recipients JSONB;\r\n  v_recipient_array JSONB[];\r\n  v_user RECORD;\r\nBEGIN\r\n  -- Only create batch on status change to 'published'\r\n  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN\r\n\r\n    -- Build recipients array\r\n    v_recipient_array := ARRAY[]::JSONB[];\r\n\r\n    FOR v_user IN\r\n      SELECT id as user_id, email, first_name, last_name\r\n      FROM public.profiles\r\n      WHERE role IN ('portal_member', 'admin', 'super_admin', 'investor')\r\n        AND email IS NOT NULL\r\n    LOOP\r\n      v_recipient_array := array_append(\r\n        v_recipient_array,\r\n        jsonb_build_object(\r\n          'user_id', v_user.user_id::TEXT,\r\n          'email', v_user.email,\r\n          'first_name', v_user.first_name,\r\n          'last_name', v_user.last_name\r\n        )\r\n      );\r\n    END LOOP;\r\n\r\n    -- Convert array to JSONB\r\n    v_recipients := to_jsonb(v_recipient_array);\r\n\r\n    -- Create the batch in portal schema\r\n    INSERT INTO portal.email_notification_batches (\r\n      notification_type,\r\n      content_id,\r\n      content_title,\r\n      content_data,\r\n      status\r\n    ) VALUES (\r\n      'update_published',\r\n      NEW.id,\r\n      NEW.title,\r\n      jsonb_build_object(\r\n        'content', NEW.content,\r\n        'update_type', NEW.update_type,\r\n        'target_audience', COALESCE(NEW.target_audience, 'all'),\r\n        'published_at', COALESCE(NEW.published_at, NOW()),\r\n        'recipients', v_recipients\r\n      ),\r\n      'pending'\r\n    );\r\n\r\n    RAISE NOTICE 'Created email batch for update % with % recipients', NEW.title, array_length(v_recipient_array, 1);\r\n  END IF;\r\n\r\n  RETURN NEW;\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "delete_portal_user",
    "function_definition": "CREATE OR REPLACE FUNCTION public.delete_portal_user(p_user_id uuid, p_admin_id uuid, p_reason text DEFAULT NULL::text)\n RETURNS json\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public', 'pg_temp'\nAS $function$\r\nDECLARE\r\n  v_result JSON;\r\n  v_deleted_counts JSON;\r\nBEGIN\r\n  -- Verify admin permissions\r\n  IF NOT EXISTS (\r\n    SELECT 1 FROM profiles\r\n    WHERE id = p_admin_id\r\n    AND role IN ('super_admin', 'portal_admin')\r\n  ) THEN\r\n    RAISE EXCEPTION 'User % does not have admin permissions', p_admin_id;\r\n  END IF;\r\n\r\n  -- Verify user exists\r\n  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id) THEN\r\n    RAISE EXCEPTION 'User % not found', p_user_id;\r\n  END IF;\r\n\r\n  -- Prevent self-deletion\r\n  IF p_user_id = p_admin_id THEN\r\n    RAISE EXCEPTION 'Cannot delete your own account';\r\n  END IF;\r\n\r\n  -- Count what will be deleted\r\n  SELECT json_build_object(\r\n    'businesses', (SELECT COUNT(*) FROM businesses WHERE user_id = p_user_id),\r\n    'survey_responses', (SELECT COUNT(*) FROM portal_survey_responses WHERE user_id = p_user_id),\r\n    'event_registrations', (SELECT COUNT(*) FROM portal_event_registrations WHERE user_id = p_user_id),\r\n    'referrals_made', (SELECT COUNT(*) FROM portal_referrals WHERE referrer_id = p_user_id),\r\n    'updates_created', (SELECT COUNT(*) FROM portal_updates WHERE created_by = p_user_id),\r\n    'surveys_created', (SELECT COUNT(*) FROM portal_surveys WHERE created_by = p_user_id),\r\n    'events_created', (SELECT COUNT(*) FROM portal_events WHERE created_by = p_user_id),\r\n    'marketing_conversions', (SELECT COUNT(*) FROM marketing_conversions WHERE user_id = p_user_id),\r\n    'portal_memberships', (SELECT COUNT(*) FROM portal_memberships WHERE user_id = p_user_id)\r\n  )\r\n  INTO v_deleted_counts;\r\n\r\n  -- Delete the user (CASCADE will handle related data)\r\n  DELETE FROM profiles WHERE id = p_user_id;\r\n\r\n  -- Return success result\r\n  RETURN json_build_object(\r\n    'success', true,\r\n    'deleted_user_id', p_user_id,\r\n    'deleted_by', p_admin_id,\r\n    'reason', p_reason,\r\n    'deleted_at', NOW(),\r\n    'deleted_data', v_deleted_counts\r\n  );\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "delete_referral_admin",
    "function_definition": "CREATE OR REPLACE FUNCTION public.delete_referral_admin(p_referral_id uuid, p_deletion_reason text DEFAULT NULL::text, p_admin_note text DEFAULT NULL::text)\n RETURNS json\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public', 'pg_temp'\nAS $function$\r\nDECLARE\r\n  v_referral RECORD;\r\n  v_user_role TEXT;\r\n  v_admin_id UUID;\r\n  v_user_email TEXT;\r\nBEGIN\r\n  -- Get the calling user's ID and details\r\n  v_admin_id := auth.uid();\r\n\r\n  -- Get user details for debugging\r\n  SELECT role, email INTO v_user_role, v_user_email\r\n  FROM public.profiles\r\n  WHERE id = v_admin_id;\r\n\r\n  -- Better error message with actual values\r\n  IF v_user_role IS NULL THEN\r\n    RETURN json_build_object(\r\n      'success', false,\r\n      'error', 'User profile not found. Your ID: ' || COALESCE(v_admin_id::text, 'NULL')\r\n    );\r\n  END IF;\r\n\r\n  -- Check admin permissions with detailed error\r\n  IF v_user_role NOT IN ('admin', 'super_admin') THEN\r\n    RETURN json_build_object(\r\n      'success', false,\r\n      'error', 'Insufficient permissions. Your role: ' || v_user_role || ' (email: ' || v_user_email || '). Required: admin or super_admin.'\r\n    );\r\n  END IF;\r\n\r\n  -- Get referral details\r\n  SELECT * INTO v_referral\r\n  FROM public.portal_referrals\r\n  WHERE id = p_referral_id;\r\n\r\n  IF NOT FOUND THEN\r\n    RETURN json_build_object(\r\n      'success', false,\r\n      'error', 'Referral not found with ID: ' || p_referral_id\r\n    );\r\n  END IF;\r\n\r\n  -- Critical check: Prevent deletion of registered users\r\n  IF v_referral.status IN ('registered', 'completed') THEN\r\n    RETURN json_build_object(\r\n      'success', false,\r\n      'error', 'Cannot delete referral: User has already registered (status: ' || v_referral.status || ')'\r\n    );\r\n  END IF;\r\n\r\n  -- Check if there's a conversion record\r\n  IF EXISTS (\r\n    SELECT 1 FROM public.portal_referral_conversions\r\n    WHERE referral_id = p_referral_id\r\n  ) THEN\r\n    RETURN json_build_object(\r\n      'success', false,\r\n      'error', 'Cannot delete referral: Conversion record exists'\r\n    );\r\n  END IF;\r\n\r\n  -- Check if user exists with this email (regardless of portal status for now)\r\n  IF EXISTS (\r\n    SELECT 1 FROM public.profiles\r\n    WHERE LOWER(email) = LOWER(v_referral.referee_email)\r\n  ) THEN\r\n    RETURN json_build_object(\r\n      'success', false,\r\n      'error', 'Cannot delete referral: User account exists with this email: ' || v_referral.referee_email\r\n    );\r\n  END IF;\r\n\r\n  -- For now, just return success without actually deleting (for testing)\r\n  RETURN json_build_object(\r\n    'success', true,\r\n    'message', 'TEST MODE: Would delete referral for ' || v_referral.referee_email,\r\n    'debug_info', jsonb_build_object(\r\n      'admin_id', v_admin_id,\r\n      'admin_email', v_user_email,\r\n      'admin_role', v_user_role,\r\n      'referral_id', p_referral_id,\r\n      'referee_email', v_referral.referee_email,\r\n      'referral_status', v_referral.status\r\n    )\r\n  );\r\n\r\nEXCEPTION\r\n  WHEN OTHERS THEN\r\n    RETURN json_build_object(\r\n      'success', false,\r\n      'error', 'Unexpected error: ' || SQLERRM || ' (Admin: ' || COALESCE(v_user_email, 'unknown') || ', Role: ' || COALESCE(v_user_role, 'unknown') || ')'\r\n    );\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "delete_referral_admin_fixed",
    "function_definition": "CREATE OR REPLACE FUNCTION public.delete_referral_admin_fixed(p_referral_id uuid, p_admin_user_id uuid, p_deletion_reason text DEFAULT NULL::text, p_admin_note text DEFAULT NULL::text)\n RETURNS json\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public', 'pg_temp'\nAS $function$\r\nDECLARE\r\n  v_referral RECORD;\r\n  v_user_role TEXT;\r\n  v_user_email TEXT;\r\nBEGIN\r\n  -- Get admin user details using the passed ID\r\n  SELECT role, email INTO v_user_role, v_user_email\r\n  FROM public.profiles\r\n  WHERE id = p_admin_user_id;\r\n\r\n  -- Check if admin user exists\r\n  IF v_user_role IS NULL THEN\r\n    RETURN json_build_object(\r\n      'success', false,\r\n      'error', 'Admin user not found with ID: ' || p_admin_user_id\r\n    );\r\n  END IF;\r\n\r\n  -- Check admin permissions (only portal admin roles)\r\n  IF v_user_role NOT IN ('admin', 'super_admin') THEN\r\n    RETURN json_build_object(\r\n      'success', false,\r\n      'error', 'Insufficient permissions. Your role: ' || v_user_role || ' (email: ' || v_user_email || '). Required: admin or super_admin.'\r\n    );\r\n  END IF;\r\n\r\n  -- Get referral details\r\n  SELECT * INTO v_referral\r\n  FROM public.portal_referrals\r\n  WHERE id = p_referral_id;\r\n\r\n  IF NOT FOUND THEN\r\n    RETURN json_build_object(\r\n      'success', false,\r\n      'error', 'Referral not found with ID: ' || p_referral_id\r\n    );\r\n  END IF;\r\n\r\n  -- Check if user has registered for the portal\r\n  IF v_referral.status IN ('registered', 'completed') THEN\r\n    RETURN json_build_object(\r\n      'success', false,\r\n      'error', 'Cannot delete referral: User has already registered for the portal (status: ' || v_referral.status || ')'\r\n    );\r\n  END IF;\r\n\r\n  -- Check for conversion record\r\n  IF EXISTS (\r\n    SELECT 1 FROM public.portal_referral_conversions\r\n    WHERE referral_id = p_referral_id\r\n  ) THEN\r\n    RETURN json_build_object(\r\n      'success', false,\r\n      'error', 'Cannot delete referral: Portal conversion record exists'\r\n    );\r\n  END IF;\r\n\r\n  -- IMPORTANT: Only check if user exists as a PORTAL user, not app user\r\n  IF EXISTS (\r\n    SELECT 1 FROM public.profiles\r\n    WHERE LOWER(email) = LOWER(v_referral.referee_email)\r\n    AND role IN ('super_admin', 'admin', 'portal_member', 'investor')  -- Only portal roles\r\n  ) THEN\r\n    RETURN json_build_object(\r\n      'success', false,\r\n      'error', 'Cannot delete referral: User already has portal access with this email: ' || v_referral.referee_email\r\n    );\r\n  END IF;\r\n\r\n  -- Actually delete the referral and related data\r\n\r\n  -- Delete contact records\r\n  DELETE FROM public.contacts\r\n  WHERE referral_id = p_referral_id;\r\n\r\n  -- Cancel pending email notifications\r\n  UPDATE public.email_notifications\r\n  SET status = 'cancelled',\r\n      metadata = metadata || jsonb_build_object(\r\n        'cancelled_reason', 'Referral deleted by admin',\r\n        'cancelled_at', NOW(),\r\n        'cancelled_by', p_admin_user_id\r\n      )\r\n  WHERE metadata->>'referral_id' = p_referral_id::text\r\n  AND status IN ('pending', 'failed');\r\n\r\n  -- Delete rate limit records\r\n  DELETE FROM public.portal_referral_rate_limits\r\n  WHERE referral_id = p_referral_id;\r\n\r\n  -- Delete the referral itself\r\n  DELETE FROM public.portal_referrals\r\n  WHERE id = p_referral_id;\r\n\r\n  -- REMOVED LOGGING FOR NOW - will fix in separate migration once we know the table structure\r\n\r\n  RETURN json_build_object(\r\n    'success', true,\r\n    'message', 'Referral successfully deleted',\r\n    'deleted', jsonb_build_object(\r\n      'referral_id', p_referral_id,\r\n      'referee_email', v_referral.referee_email,\r\n      'deleted_by', v_user_email\r\n    )\r\n  );\r\n\r\nEXCEPTION\r\n  WHEN OTHERS THEN\r\n    RETURN json_build_object(\r\n      'success', false,\r\n      'error', 'Unexpected error: ' || SQLERRM\r\n    );\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "generate_referral_code",
    "function_definition": "CREATE OR REPLACE FUNCTION public.generate_referral_code()\n RETURNS text\n LANGUAGE plpgsql\nAS $function$\r\nDECLARE\r\n    new_code TEXT;\r\n    code_exists BOOLEAN;\r\nBEGIN\r\n    LOOP\r\n        -- Generate a code with format: ref_<random_string>\r\n        new_code := 'ref_' || substr(md5(random()::text || clock_timestamp()::text), 1, 12);\r\n\r\n        -- Check if code already exists\r\n        SELECT EXISTS(SELECT 1 FROM public.portal_referrals WHERE referral_code = new_code) INTO code_exists;\r\n\r\n        -- Exit loop if code is unique\r\n        EXIT WHEN NOT code_exists;\r\n    END LOOP;\r\n\r\n    RETURN new_code;\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "get_email_stats",
    "function_definition": "CREATE OR REPLACE FUNCTION public.get_email_stats(p_days integer DEFAULT 30)\n RETURNS TABLE(total_emails bigint, sent_emails bigint, failed_emails bigint, pending_emails bigint, avg_retry_count numeric, emails_today bigint, emails_this_week bigint, emails_this_month bigint)\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public', 'pg_temp'\nAS $function$\r\nBEGIN\r\n  RETURN QUERY\r\n  SELECT\r\n    COUNT(*) AS total_emails,\r\n    COUNT(*) FILTER (WHERE status = 'sent') AS sent_emails,\r\n    COUNT(*) FILTER (WHERE status = 'failed') AS failed_emails,\r\n    COUNT(*) FILTER (WHERE status = 'pending') AS pending_emails,\r\n    AVG(retry_count) AS avg_retry_count,\r\n    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) AS emails_today,\r\n    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') AS emails_this_week,\r\n    COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)) AS emails_this_month\r\n  FROM public.email_logs\r\n  WHERE created_at >= NOW() - INTERVAL '1 day' * p_days;\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "get_next_email_batch",
    "function_definition": "CREATE OR REPLACE FUNCTION public.get_next_email_batch(p_batch_size integer DEFAULT 10)\n RETURNS TABLE(queue_id uuid, event_type text, event_id text, template_id text, to_email text, to_user_id uuid, event_payload jsonb, metadata jsonb)\n LANGUAGE plpgsql\nAS $function$\r\nBEGIN\r\n    RETURN QUERY\r\n    UPDATE email_queue\r\n    SET\r\n        status = 'processing',\r\n        attempts = attempts + 1,\r\n        last_attempt_at = now(),\r\n        updated_at = now()\r\n    WHERE id IN (\r\n        SELECT id\r\n        FROM email_queue\r\n        WHERE status IN ('queued', 'pending')  -- Accept both queued and pending\r\n            AND scheduled_for <= now()\r\n            AND (expires_at IS NULL OR expires_at > now())\r\n        ORDER BY priority ASC, scheduled_for ASC\r\n        LIMIT p_batch_size\r\n        FOR UPDATE SKIP LOCKED\r\n    )\r\n    RETURNING\r\n        id as queue_id,\r\n        email_queue.event_type,\r\n        email_queue.event_id,\r\n        email_queue.template_id,\r\n        email_queue.to_email,\r\n        email_queue.to_user_id,\r\n        email_queue.event_payload,\r\n        email_queue.metadata;\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "get_notification_stats",
    "function_definition": "CREATE OR REPLACE FUNCTION public.get_notification_stats(p_hours integer DEFAULT 24)\n RETURNS json\n LANGUAGE plpgsql\n STABLE\nAS $function$\r\nDECLARE\r\n  v_stats JSON;\r\nBEGIN\r\n  WITH stats AS (\r\n    SELECT\r\n      COUNT(*) FILTER (WHERE status = 'pending') as pending_count,\r\n      COUNT(*) FILTER (WHERE status = 'processing') as processing_count,\r\n      COUNT(*) FILTER (WHERE status = 'sent' AND sent_at >= NOW() - (p_hours || ' hours')::interval) as sent_count,\r\n      COUNT(*) FILTER (WHERE status = 'failed' AND error_count >= max_retries) as failed_count,\r\n      COUNT(*) FILTER (WHERE status = 'failed' AND error_count < max_retries) as retry_count,\r\n      AVG(EXTRACT(EPOCH FROM (sent_at - created_at))) FILTER (WHERE status = 'sent') as avg_send_time_seconds,\r\n      MAX(created_at) FILTER (WHERE status = 'pending') as oldest_pending\r\n    FROM public.email_notifications\r\n    WHERE created_at >= NOW() - (p_hours || ' hours')::interval\r\n  ),\r\n  event_stats AS (\r\n    SELECT\r\n      event_id,\r\n      COUNT(*) as count\r\n    FROM public.email_notifications\r\n    WHERE created_at >= NOW() - (p_hours || ' hours')::interval\r\n    GROUP BY event_id\r\n    ORDER BY count DESC\r\n    LIMIT 10\r\n  )\r\n  SELECT jsonb_build_object(\r\n    'summary', row_to_json(stats),\r\n    'by_event', json_agg(row_to_json(event_stats))\r\n  ) INTO v_stats\r\n  FROM stats, event_stats\r\n  GROUP BY stats.*;\r\n\r\n  RETURN v_stats;\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "get_pending_email_batch",
    "function_definition": "CREATE OR REPLACE FUNCTION public.get_pending_email_batch()\n RETURNS TABLE(batch_id uuid, notification_type text, content_id text, content_title text, content_data jsonb, recipients jsonb)\n LANGUAGE plpgsql\nAS $function$\r\nBEGIN\r\n    RETURN QUERY\r\n    SELECT\r\n        b.id as batch_id,\r\n        b.notification_type,\r\n        b.content_id,\r\n        CASE\r\n            WHEN b.notification_type = 'update_published' THEN\r\n                COALESCE(b.content_data->>'update_title', 'Update')\r\n            WHEN b.notification_type = 'survey_published' THEN\r\n                COALESCE(b.content_data->>'survey_title', 'Survey')\r\n            WHEN b.notification_type = 'event_published' THEN\r\n                COALESCE(b.content_data->>'event_title', 'Event')\r\n            ELSE 'Notification'\r\n        END as content_title,\r\n        b.content_data,\r\n        b.content_data->'recipients' as recipients\r\n    FROM email_notification_batches b\r\n    WHERE b.status = 'pending'\r\n    ORDER BY b.created_at ASC\r\n    LIMIT 1;\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "get_pending_notifications",
    "function_definition": "CREATE OR REPLACE FUNCTION public.get_pending_notifications(p_limit integer DEFAULT 20)\n RETURNS json\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public', 'pg_temp'\nAS $function$\r\nDECLARE\r\n  v_notifications JSON;\r\nBEGIN\r\n  -- Mark notifications as processing and return them\r\n  WITH pending AS (\r\n    UPDATE public.email_notifications\r\n    SET\r\n      status = 'processing',\r\n      updated_at = NOW()\r\n    WHERE id IN (\r\n      SELECT id\r\n      FROM public.email_notifications\r\n      WHERE (\r\n        (status = 'pending' AND scheduled_for <= NOW())\r\n        OR (status = 'failed' AND retry_after <= NOW() AND error_count < max_retries)\r\n      )\r\n      ORDER BY priority DESC, scheduled_for ASC\r\n      LIMIT p_limit\r\n      FOR UPDATE SKIP LOCKED\r\n    )\r\n    RETURNING *\r\n  )\r\n  SELECT json_agg(row_to_json(pending)) INTO v_notifications\r\n  FROM pending;\r\n\r\n  -- Log processing start for each notification\r\n  INSERT INTO public.notification_logs (notification_id, event_type, details)\r\n  SELECT\r\n    (n->>'id')::UUID,\r\n    'processing',\r\n    jsonb_build_object('batch_size', p_limit)\r\n  FROM json_array_elements(COALESCE(v_notifications, '[]'::json)) AS n;\r\n\r\n  RETURN COALESCE(v_notifications, '[]'::json);\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "get_portal_admin_stats",
    "function_definition": "CREATE OR REPLACE FUNCTION public.get_portal_admin_stats()\n RETURNS json\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public', 'pg_temp'\nAS $function$\r\nDECLARE\r\n  result JSON;\r\nBEGIN\r\n  result := json_build_object(\r\n    'updates', (\r\n      SELECT json_build_object(\r\n        'total', COALESCE(COUNT(*), 0)::INTEGER,\r\n        'published', COALESCE(COUNT(*) FILTER (WHERE status = 'published'), 0)::INTEGER,\r\n        'draft', COALESCE(COUNT(*) FILTER (WHERE status = 'draft'), 0)::INTEGER,\r\n        'recent', COALESCE(\r\n          (SELECT json_agg(row_to_json(r))\r\n           FROM (\r\n             SELECT id, title, status, created_at\r\n             FROM portal_updates\r\n             ORDER BY created_at DESC\r\n             LIMIT 5\r\n           ) r\r\n          ), '[]'::json\r\n        )\r\n      )\r\n      FROM portal_updates\r\n    ),\r\n    'surveys', (\r\n      SELECT json_build_object(\r\n        'total', COALESCE(COUNT(*), 0)::INTEGER,\r\n        'active', COALESCE(COUNT(*) FILTER (WHERE status = 'published'), 0)::INTEGER,\r\n        'total_responses', COALESCE((\r\n          SELECT COUNT(*)::INTEGER FROM portal_survey_responses\r\n        ), 0),\r\n        'completed_responses', COALESCE((\r\n          SELECT COUNT(*)::INTEGER FROM portal_survey_responses WHERE is_complete = true\r\n        ), 0),\r\n        'recent', COALESCE(\r\n          (SELECT json_agg(row_to_json(r))\r\n           FROM (\r\n             SELECT \r\n               id, \r\n               title, \r\n               CASE WHEN status = 'published' THEN true ELSE false END as is_active,\r\n               created_at\r\n             FROM portal_surveys\r\n             ORDER BY created_at DESC\r\n             LIMIT 5\r\n           ) r\r\n          ), '[]'::json\r\n        )\r\n      )\r\n      FROM portal_surveys\r\n    ),\r\n    'events', COALESCE((\r\n      SELECT json_build_object(\r\n        'total', COUNT(*)::INTEGER,\r\n        'upcoming', COUNT(*) FILTER (WHERE start_datetime > NOW())::INTEGER,\r\n        'total_registrations', COALESCE((\r\n          SELECT COUNT(*)::INTEGER FROM portal_event_registrations\r\n        ), 0),\r\n        'recent', COALESCE(\r\n          (SELECT json_agg(row_to_json(r))\r\n           FROM (\r\n             SELECT \r\n               id, \r\n               title, \r\n               event_type,\r\n               start_datetime,\r\n               CASE \r\n                 WHEN start_datetime > NOW() THEN 'upcoming'\r\n                 WHEN end_datetime > NOW() THEN 'ongoing'\r\n                 ELSE 'past'\r\n               END as status\r\n             FROM portal_events\r\n             ORDER BY created_at DESC\r\n             LIMIT 5\r\n           ) r\r\n          ), '[]'::json\r\n        )\r\n      )\r\n      FROM portal_events\r\n    ), json_build_object(\r\n      'total', 0,\r\n      'upcoming', 0,\r\n      'total_registrations', 0,\r\n      'recent', '[]'::json\r\n    )),\r\n    'users', json_build_object(\r\n      'total_portal_users', COALESCE((\r\n        SELECT COUNT(DISTINCT id)::INTEGER \r\n        FROM profiles \r\n        WHERE role IN ('portal_member', 'pilotowner', 'investor', 'user', 'super_admin', 'admin')\r\n      ), 0),\r\n      'active_today', COALESCE((\r\n        SELECT COUNT(DISTINCT user_id)::INTEGER\r\n        FROM portal_survey_responses \r\n        WHERE started_at > NOW() - INTERVAL '24 hours'\r\n      ), 0)\r\n    )\r\n  );\r\n  \r\n  RETURN result;\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "get_portal_email_recipients",
    "function_definition": "CREATE OR REPLACE FUNCTION public.get_portal_email_recipients(p_target_audience text DEFAULT 'all'::text, p_notification_type text DEFAULT 'updates'::text)\n RETURNS TABLE(user_id uuid, email text, first_name text, last_name text)\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public', 'pg_temp'\nAS $function$\r\nBEGIN\r\n  RETURN QUERY\r\n  WITH portal_users AS (\r\n    -- 1. System admins (super_admin and admin) - they automatically have portal access\r\n    SELECT DISTINCT\r\n      sua.user_id,\r\n      p.email,\r\n      p.first_name,\r\n      p.last_name,\r\n      'portal_admin' as portal_role\r\n    FROM system_user_assignments sua\r\n    INNER JOIN profiles p ON p.id = sua.user_id\r\n    WHERE sua.system_role IN ('super_admin', 'admin')\r\n      AND sua.is_active = true\r\n      AND p.email IS NOT NULL\r\n\r\n    UNION\r\n\r\n    -- 2. Explicit portal memberships from portal_memberships table\r\n    SELECT DISTINCT\r\n      pm.user_id,\r\n      p.email,\r\n      p.first_name,\r\n      p.last_name,\r\n      pm.portal_role\r\n    FROM portal_memberships pm\r\n    INNER JOIN profiles p ON p.id = pm.user_id\r\n    WHERE pm.is_active = true\r\n      AND p.email IS NOT NULL\r\n\r\n    UNION\r\n\r\n    -- 3. Portal members from profiles table (users with portal_member role)\r\n    SELECT DISTINCT\r\n      p.id as user_id,\r\n      p.email,\r\n      p.first_name,\r\n      p.last_name,\r\n      'portal_member' as portal_role\r\n    FROM profiles p\r\n    WHERE p.role = 'portal_member'\r\n      AND p.email IS NOT NULL\r\n  )\r\n  SELECT DISTINCT\r\n    pu.user_id,\r\n    pu.email::TEXT,\r\n    pu.first_name::TEXT,\r\n    pu.last_name::TEXT\r\n  FROM portal_users pu\r\n  LEFT JOIN user_email_preferences ep ON ep.user_id = pu.user_id\r\n  WHERE\r\n    -- Check email preferences\r\n    (\r\n      ep.user_id IS NULL -- No preferences = enabled by default\r\n      OR (\r\n        -- Check specific notification type preferences\r\n        CASE\r\n          WHEN p_notification_type = 'updates' THEN COALESCE(ep.updates_enabled, true)\r\n          WHEN p_notification_type = 'surveys' THEN COALESCE(ep.surveys_enabled, true)\r\n          WHEN p_notification_type = 'events' THEN COALESCE(ep.events_enabled, true)\r\n          ELSE true\r\n        END\r\n        AND COALESCE(ep.frequency, 'immediate') != 'never'\r\n      )\r\n    )\r\n    -- Apply target audience filter if specified\r\n    AND (\r\n      p_target_audience = 'all'\r\n      OR (p_target_audience = 'investors' AND pu.portal_role = 'portal_investor')\r\n      OR (p_target_audience = 'members' AND pu.portal_role = 'portal_member')\r\n      OR (p_target_audience = 'admins' AND pu.portal_role = 'portal_admin')\r\n    )\r\n  ORDER BY pu.email;\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "get_portal_user_stats",
    "function_definition": "CREATE OR REPLACE FUNCTION public.get_portal_user_stats()\n RETURNS json\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public', 'pg_temp'\nAS $function$\r\nBEGIN\r\n  RETURN json_build_object(\r\n    'total', (\r\n      SELECT COUNT(DISTINCT p.id) \r\n      FROM public.profiles p\r\n      LEFT JOIN public.user_roles ur ON ur.user_id = p.id\r\n      WHERE \r\n        p.role::text IN ('super_admin', 'admin', 'portal_member', 'investor')\r\n        OR (ur.role IS NOT NULL AND ur.role::text IN ('super_admin', 'admin', 'portal_member', 'investor'))\r\n    ),\r\n    'breakdown', json_build_object(\r\n      'super_admin', (\r\n        SELECT COUNT(DISTINCT p.id) \r\n        FROM public.profiles p\r\n        LEFT JOIN public.user_roles ur ON ur.user_id = p.id\r\n        WHERE p.role::text = 'super_admin' \r\n           OR (ur.role IS NOT NULL AND ur.role::text = 'super_admin')\r\n      ),\r\n      'admin', (\r\n        SELECT COUNT(DISTINCT p.id) \r\n        FROM public.profiles p\r\n        LEFT JOIN public.user_roles ur ON ur.user_id = p.id\r\n        WHERE p.role::text = 'admin' OR (ur.role IS NOT NULL AND ur.role::text = 'admin')\r\n      ),\r\n      'portal_member', (\r\n        SELECT COUNT(DISTINCT p.id) \r\n        FROM public.profiles p\r\n        LEFT JOIN public.user_roles ur ON ur.user_id = p.id\r\n        WHERE p.role::text = 'portal_member' OR (ur.role IS NOT NULL AND ur.role::text = 'portal_member')\r\n      ),\r\n      'investor', (\r\n        SELECT COUNT(DISTINCT p.id) \r\n        FROM public.profiles p\r\n        LEFT JOIN public.user_roles ur ON ur.user_id = p.id\r\n        WHERE p.role::text = 'investor' OR (ur.role IS NOT NULL AND ur.role::text = 'investor')\r\n      )\r\n    ),\r\n    'other_users', (\r\n      SELECT COUNT(*) \r\n      FROM public.profiles p\r\n      LEFT JOIN public.user_roles ur ON ur.user_id = p.id\r\n      WHERE \r\n        (p.role IS NULL OR p.role::text NOT IN ('super_admin', 'admin', 'portal_member', 'investor'))\r\n        AND (ur.role IS NULL OR ur.role::text NOT IN ('super_admin', 'admin', 'portal_member', 'investor'))\r\n    )\r\n  );\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "get_referral_by_code",
    "function_definition": "CREATE OR REPLACE FUNCTION public.get_referral_by_code(p_code text)\n RETURNS TABLE(referee_first_name text, referee_last_name text, referee_email text, referrer_name text, dsp_name text, status text)\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\nBEGIN\r\n  RETURN QUERY\r\n  SELECT\r\n    pr.referee_first_name,\r\n    pr.referee_last_name,\r\n    pr.referee_email,\r\n    COALESCE(p.first_name || ' ' || p.last_name, 'A FleetDRMS Member') as referrer_name,\r\n    pr.dsp_name,\r\n    pr.status\r\n  FROM portal_referrals pr\r\n  LEFT JOIN profiles p ON pr.referrer_id = p.id\r\n  WHERE pr.referral_code = p_code\r\n    AND pr.status IN ('pending', 'sent')\r\n  LIMIT 1;\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "get_user_referral_stats",
    "function_definition": "CREATE OR REPLACE FUNCTION public.get_user_referral_stats(p_user_id uuid)\n RETURNS json\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public', 'pg_temp'\nAS $function$\r\nDECLARE\r\n    v_stats JSON;\r\nBEGIN\r\n    -- Validate user is authenticated\r\n    IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN\r\n        RAISE EXCEPTION 'Unauthorized';\r\n    END IF;\r\n\r\n    SELECT json_build_object(\r\n        'total_referrals', COUNT(*),\r\n        'invitations_sent', COUNT(CASE WHEN status IN ('sent', 'registered', 'completed') THEN 1 END),\r\n        'registrations', COUNT(CASE WHEN status IN ('registered', 'completed') THEN 1 END),\r\n        'completed', COUNT(CASE WHEN status = 'completed' THEN 1 END),\r\n        'pending', COUNT(CASE WHEN status = 'pending' THEN 1 END),\r\n        'conversion_rate',\r\n            CASE\r\n                WHEN COUNT(CASE WHEN status IN ('sent', 'registered', 'completed') THEN 1 END) > 0\r\n                THEN ROUND(\r\n                    (COUNT(CASE WHEN status IN ('registered', 'completed') THEN 1 END)::NUMERIC /\r\n                     COUNT(CASE WHEN status IN ('sent', 'registered', 'completed') THEN 1 END)::NUMERIC) * 100,\r\n                    2\r\n                )\r\n                ELSE 0\r\n            END,\r\n        'this_month', COUNT(CASE WHEN created_at >= date_trunc('month', CURRENT_DATE) THEN 1 END),\r\n        'last_referral_date', MAX(created_at)\r\n    ) INTO v_stats\r\n    FROM public.portal_referrals\r\n    WHERE referrer_id = p_user_id;\r\n\r\n    RETURN v_stats;\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "get_user_referrals",
    "function_definition": "CREATE OR REPLACE FUNCTION public.get_user_referrals(p_user_id uuid)\n RETURNS TABLE(id uuid, referee_first_name text, referee_last_name text, referee_email text, referee_phone text, dsp_name text, dsp_code text, referral_code text, status text, invitation_sent_at timestamp with time zone, last_resent_at timestamp with time zone, resend_count integer, registered_at timestamp with time zone, created_at timestamp with time zone, conversion_date timestamp with time zone, onboarding_completed boolean)\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public', 'pg_temp'\nAS $function$\r\nBEGIN\r\n    -- Validate user is authenticated\r\n    IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN\r\n        RAISE EXCEPTION 'Unauthorized';\r\n    END IF;\r\n\r\n    RETURN QUERY\r\n    SELECT\r\n        r.id,\r\n        r.referee_first_name,\r\n        r.referee_last_name,\r\n        r.referee_email,\r\n        r.referee_phone,\r\n        r.dsp_name,\r\n        r.dsp_code,\r\n        r.referral_code,\r\n        r.status,\r\n        r.invitation_sent_at,\r\n        r.last_resent_at,\r\n        r.resend_count,\r\n        r.registered_at,\r\n        r.created_at,\r\n        rc.converted_at as conversion_date,\r\n        (rc.onboarding_completed_at IS NOT NULL) as onboarding_completed\r\n    FROM public.portal_referrals r\r\n    LEFT JOIN public.portal_referral_conversions rc ON rc.referral_id = r.id\r\n    WHERE r.referrer_id = p_user_id\r\n    ORDER BY r.created_at DESC;\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "has_portal_role",
    "function_definition": "CREATE OR REPLACE FUNCTION public.has_portal_role(p_user_id uuid, p_roles text[] DEFAULT NULL::text[])\n RETURNS boolean\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public', 'pg_temp'\nAS $function$\r\nBEGIN\r\n  IF p_roles IS NULL OR array_length(p_roles, 1) IS NULL THEN\r\n    RETURN EXISTS (\r\n      SELECT 1 FROM public.portal_memberships\r\n      WHERE user_id = p_user_id AND is_active = true\r\n    );\r\n  ELSE\r\n    RETURN EXISTS (\r\n      SELECT 1 FROM public.portal_memberships\r\n      WHERE user_id = p_user_id \r\n      AND portal_role = ANY(p_roles)\r\n      AND is_active = true\r\n    );\r\n  END IF;\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "invoke_email_processing",
    "function_definition": "CREATE OR REPLACE FUNCTION public.invoke_email_processing()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public', 'pg_temp'\nAS $function$\r\nDECLARE\r\n  v_edge_function_url text;\r\n  v_service_role_key text;\r\nBEGIN\r\n  -- Get configuration from table\r\n  SELECT value INTO v_edge_function_url\r\n  FROM email_config\r\n  WHERE key = 'supabase_url';\r\n\r\n  SELECT value INTO v_service_role_key\r\n  FROM email_config\r\n  WHERE key = 'service_role_key';\r\n\r\n  IF v_edge_function_url IS NOT NULL AND v_service_role_key IS NOT NULL THEN\r\n    -- Append function path\r\n    v_edge_function_url := v_edge_function_url || '/functions/v1/process-email-queue';\r\n\r\n    -- Make async HTTP request to Edge Function using pg_net\r\n    PERFORM net.http_post(\r\n      url := v_edge_function_url,\r\n      headers := jsonb_build_object(\r\n        'Authorization', 'Bearer ' || v_service_role_key,\r\n        'Content-Type', 'application/json'\r\n      ),\r\n      body := jsonb_build_object('batchSize', 10),\r\n      timeout_milliseconds := 30000\r\n    );\r\n  END IF;\r\n\r\n  RETURN NEW;\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "is_portal_admin",
    "function_definition": "CREATE OR REPLACE FUNCTION public.is_portal_admin(user_id uuid)\n RETURNS boolean\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public', 'pg_temp'\nAS $function$\r\nDECLARE\r\n  v_role TEXT;\r\n  v_is_admin BOOLEAN := false;\r\nBEGIN\r\n  -- Check profiles table\r\n  SELECT role INTO v_role FROM public.profiles WHERE id = user_id;\r\n  v_is_admin := v_role IN ('super_admin', 'superadmin', 'admin');\r\n  \r\n  -- Check system_user_assignments if not admin yet\r\n  IF NOT v_is_admin AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_user_assignments') THEN\r\n    v_is_admin := EXISTS (\r\n      SELECT 1 FROM public.system_user_assignments \r\n      WHERE system_user_assignments.user_id = is_portal_admin.user_id \r\n      AND system_role IN ('super_admin', 'admin')\r\n      AND is_active = true\r\n    );\r\n  END IF;\r\n  \r\n  -- Check user_roles if not admin yet\r\n  IF NOT v_is_admin AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') THEN\r\n    v_is_admin := EXISTS (\r\n      SELECT 1 FROM public.user_roles \r\n      WHERE user_roles.user_id = is_portal_admin.user_id \r\n      AND role IN ('super_admin', 'admin')\r\n    );\r\n  END IF;\r\n  \r\n  RETURN v_is_admin;\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "log_portal_membership_change",
    "function_definition": "CREATE OR REPLACE FUNCTION public.log_portal_membership_change()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\r\nDECLARE\r\n  v_user_email TEXT;\r\nBEGIN\r\n  -- Check if portal_admin_activity table exists\r\n  IF EXISTS (\r\n    SELECT 1 FROM information_schema.tables \r\n    WHERE table_schema = 'public' \r\n    AND table_name = 'portal_admin_activity'\r\n  ) THEN\r\n    -- Get user email for entity_title\r\n    SELECT email INTO v_user_email FROM public.profiles WHERE id = NEW.user_id;\r\n    \r\n    IF TG_OP = 'INSERT' THEN\r\n      INSERT INTO public.portal_admin_activity (\r\n        admin_id,\r\n        action,\r\n        entity_type,\r\n        entity_id,\r\n        entity_title,\r\n        changes,\r\n        created_at\r\n      ) VALUES (\r\n        auth.uid(),\r\n        'portal_role_assignment',\r\n        'portal_member',\r\n        NEW.id,\r\n        COALESCE(v_user_email, 'Unknown User') || ' - Portal: ' || NEW.portal_role,\r\n        jsonb_build_object(\r\n          'user_id', NEW.user_id,\r\n          'role', NEW.portal_role,\r\n          'subscription_tier', NEW.subscription_tier,\r\n          'operation', 'create',\r\n          'context', 'portal'\r\n        ),\r\n        NOW()\r\n      );\r\n    ELSIF TG_OP = 'UPDATE' THEN\r\n      IF OLD.is_active != NEW.is_active THEN\r\n        INSERT INTO public.portal_admin_activity (\r\n          admin_id,\r\n          action,\r\n          entity_type,\r\n          entity_id,\r\n          entity_title,\r\n          changes,\r\n          created_at\r\n        ) VALUES (\r\n          auth.uid(),\r\n          CASE WHEN NEW.is_active THEN 'portal_role_activation' ELSE 'portal_role_deactivation' END,\r\n          'portal_member',\r\n          NEW.id,\r\n          COALESCE(v_user_email, 'Unknown User') || ' - Portal: ' || NEW.portal_role,\r\n          jsonb_build_object(\r\n            'user_id', NEW.user_id,\r\n            'role', NEW.portal_role,\r\n            'subscription_tier', NEW.subscription_tier,\r\n            'is_active', NEW.is_active,\r\n            'operation', 'update',\r\n            'context', 'portal'\r\n          ),\r\n          NOW()\r\n        );\r\n      END IF;\r\n    END IF;\r\n  END IF;\r\n  RETURN NEW;\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "mark_email_failed",
    "function_definition": "CREATE OR REPLACE FUNCTION public.mark_email_failed(p_queue_id uuid, p_error text, p_error_details jsonb DEFAULT '{}'::jsonb)\n RETURNS void\n LANGUAGE plpgsql\nAS $function$\r\nDECLARE\r\n    v_attempts integer;\r\n    v_max_attempts integer;\r\n    v_retry_delay interval;\r\nBEGIN\r\n    SELECT attempts, max_attempts\r\n    INTO v_attempts, v_max_attempts\r\n    FROM email_queue\r\n    WHERE id = p_queue_id;\r\n\r\n    -- Calculate retry delay (exponential backoff)\r\n    v_retry_delay := (power(2, LEAST(v_attempts, 6))::text || ' minutes')::interval;\r\n\r\n    UPDATE email_queue\r\n    SET\r\n        status = CASE\r\n            WHEN v_attempts >= v_max_attempts THEN 'failed'\r\n            ELSE 'pending'\r\n        END,\r\n        last_error = p_error,\r\n        error_details = p_error_details,\r\n        next_retry_at = CASE\r\n            WHEN v_attempts < v_max_attempts THEN now() + v_retry_delay\r\n            ELSE NULL\r\n        END,\r\n        scheduled_for = CASE\r\n            WHEN v_attempts < v_max_attempts THEN now() + v_retry_delay\r\n            ELSE scheduled_for\r\n        END,\r\n        updated_at = now()\r\n    WHERE id = p_queue_id;\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "mark_email_sent",
    "function_definition": "CREATE OR REPLACE FUNCTION public.mark_email_sent(p_queue_id uuid, p_resend_id text DEFAULT NULL::text, p_metadata jsonb DEFAULT '{}'::jsonb)\n RETURNS void\n LANGUAGE plpgsql\nAS $function$\r\nBEGIN\r\n    UPDATE email_queue\r\n    SET\r\n        status = 'sent',\r\n        processed_at = now(),\r\n        metadata = metadata || p_metadata,\r\n        updated_at = now()\r\n    WHERE id = p_queue_id;\r\n\r\n    -- Also log to email_logs if desired\r\n    INSERT INTO email_logs (\r\n        id,\r\n        to_email,\r\n        subject,\r\n        template,\r\n        status,\r\n        resend_id,\r\n        sent_at,\r\n        metadata\r\n    )\r\n    SELECT\r\n        gen_random_uuid(),\r\n        eq.to_email,\r\n        COALESCE(et.subject, 'Email Notification'),\r\n        et.name,\r\n        'sent',\r\n        p_resend_id,\r\n        now(),\r\n        eq.metadata || p_metadata\r\n    FROM email_queue eq\r\n    LEFT JOIN email_templates et ON eq.template_id = et.id::text\r\n    WHERE eq.id = p_queue_id;\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "process_email_queue",
    "function_definition": "CREATE OR REPLACE FUNCTION public.process_email_queue()\n RETURNS integer\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public', 'pg_temp'\nAS $function$\r\nDECLARE\r\n  processed_count INTEGER := 0;\r\n  queue_record RECORD;\r\nBEGIN\r\n  -- Get emails ready to be sent\r\n  FOR queue_record IN\r\n    SELECT * FROM public.email_queue\r\n    WHERE status = 'queued'\r\n      AND scheduled_for <= NOW()\r\n      AND attempts < max_attempts\r\n    ORDER BY priority DESC, scheduled_for\r\n    LIMIT 10\r\n  LOOP\r\n    -- Mark as processing\r\n    UPDATE public.email_queue\r\n    SET status = 'processing',\r\n        attempts = attempts + 1,\r\n        processor_id = gen_random_uuid()::text\r\n    WHERE id = queue_record.id;\r\n    \r\n    -- Here you would trigger the actual email send\r\n    -- For now, we'll just mark it as ready for the Edge Function\r\n    \r\n    processed_count := processed_count + 1;\r\n  END LOOP;\r\n  \r\n  RETURN processed_count;\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "process_email_queue_manual",
    "function_definition": "CREATE OR REPLACE FUNCTION public.process_email_queue_manual(p_batch_size integer DEFAULT 10)\n RETURNS jsonb\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public', 'pg_temp'\nAS $function$\r\nDECLARE\r\n    v_processed int := 0;\r\n    v_email RECORD;\r\n    v_result jsonb := jsonb_build_object('processed', 0, 'errors', ARRAY[]::text[]);\r\nBEGIN\r\n    -- Get batch of pending emails\r\n    FOR v_email IN\r\n        SELECT *\r\n        FROM email_queue\r\n        WHERE status = 'pending'\r\n            AND scheduled_for <= now()\r\n            AND (expires_at IS NULL OR expires_at > now())\r\n        ORDER BY priority DESC, created_at ASC\r\n        LIMIT p_batch_size\r\n        FOR UPDATE SKIP LOCKED\r\n    LOOP\r\n        -- Mark as processing\r\n        UPDATE email_queue\r\n        SET status = 'processing',\r\n            attempts = attempts + 1,\r\n            last_attempt_at = now()\r\n        WHERE id = v_email.id;\r\n\r\n        v_processed := v_processed + 1;\r\n\r\n        -- Note: Actual email sending would happen via edge function\r\n        -- This is just for manual queue inspection\r\n        RAISE NOTICE 'Would process email % to %', v_email.id, v_email.to_email;\r\n    END LOOP;\r\n\r\n    v_result := jsonb_set(v_result, '{processed}', to_jsonb(v_processed));\r\n    RETURN v_result;\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "process_email_queue_trigger",
    "function_definition": "CREATE OR REPLACE FUNCTION public.process_email_queue_trigger()\n RETURNS void\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public', 'pg_temp'\nAS $function$\r\nDECLARE\r\n    v_batch RECORD;\r\n    v_result jsonb;\r\nBEGIN\r\n    -- Process emails by calling the edge function via HTTP\r\n    -- Note: This requires pg_net extension\r\n\r\n    -- For now, we'll just mark emails for processing\r\n    -- The actual sending needs to be done by the edge function\r\n\r\n    -- Get batch of emails to process\r\n    FOR v_batch IN\r\n        SELECT * FROM get_next_email_batch(10)\r\n    LOOP\r\n        RAISE NOTICE 'Would process email: % to %', v_batch.queue_id, v_batch.to_email;\r\n\r\n        -- In production, this would call the edge function\r\n        -- For now, we need to manually process or use the UI\r\n    END LOOP;\r\n\r\n    -- Alternative: Use Supabase's HTTP client if available\r\n    -- This is what actually needs to happen:\r\n    -- PERFORM net.http_post(\r\n    --     url := 'https://your-project.supabase.co/functions/v1/process-email-queue',\r\n    --     headers := '{\"Authorization\": \"Bearer YOUR_SERVICE_KEY\"}'::jsonb,\r\n    --     body := '{\"batchSize\": 10}'::jsonb\r\n    -- );\r\n\r\n    RETURN;\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "process_referral_emails_now",
    "function_definition": "CREATE OR REPLACE FUNCTION public.process_referral_emails_now()\n RETURNS jsonb\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public', 'pg_temp'\nAS $function$\r\nDECLARE\r\n  v_result jsonb;\r\n  v_edge_function_url text;\r\n  v_service_role_key text;\r\nBEGIN\r\n  v_edge_function_url := current_setting('app.supabase_url', true) || '/functions/v1/process-email-queue';\r\n  v_service_role_key := current_setting('app.service_role_key', true);\r\n\r\n  -- Check configuration\r\n  IF v_edge_function_url IS NULL OR v_service_role_key IS NULL THEN\r\n    RETURN jsonb_build_object(\r\n      'success', false,\r\n      'error', 'Missing configuration: app.supabase_url or app.service_role_key not set'\r\n    );\r\n  END IF;\r\n\r\n  -- Call Edge Function synchronously and return result\r\n  SELECT content::jsonb INTO v_result\r\n  FROM net.http_post(\r\n    url := v_edge_function_url,\r\n    headers := jsonb_build_object(\r\n      'Authorization', 'Bearer ' || v_service_role_key,\r\n      'Content-Type', 'application/json'\r\n    ),\r\n    body := jsonb_build_object('batchSize', 50),\r\n    timeout_milliseconds := 60000\r\n  );\r\n\r\n  RETURN v_result;\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "process_referral_registration",
    "function_definition": "CREATE OR REPLACE FUNCTION public.process_referral_registration(p_referral_code text, p_user_id uuid, p_user_email text)\n RETURNS json\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public', 'pg_temp'\nAS $function$\r\nDECLARE\r\n    v_referral_id UUID;\r\n    v_referrer_id UUID;\r\n    v_conversion_id UUID;\r\n    v_contact_id UUID;\r\nBEGIN\r\n    -- Find the referral by code and email\r\n    SELECT id, referrer_id\r\n    INTO v_referral_id, v_referrer_id\r\n    FROM public.portal_referrals\r\n    WHERE referral_code = p_referral_code\r\n    AND LOWER(referee_email) = LOWER(p_user_email)\r\n    AND status IN ('pending', 'sent');\r\n\r\n    IF v_referral_id IS NULL THEN\r\n        -- Not a valid referral, but don't error - just return\r\n        RETURN json_build_object(\r\n            'success', false,\r\n            'message', 'No matching referral found'\r\n        );\r\n    END IF;\r\n\r\n    -- Check if conversion already exists\r\n    IF EXISTS (\r\n        SELECT 1 FROM public.portal_referral_conversions\r\n        WHERE referral_id = v_referral_id\r\n    ) THEN\r\n        RETURN json_build_object(\r\n            'success', false,\r\n            'message', 'Referral already converted'\r\n        );\r\n    END IF;\r\n\r\n    -- Create conversion record\r\n    INSERT INTO public.portal_referral_conversions (\r\n        referral_id,\r\n        referee_profile_id,\r\n        converted_at\r\n    ) VALUES (\r\n        v_referral_id,\r\n        p_user_id,\r\n        NOW()\r\n    )\r\n    RETURNING id INTO v_conversion_id;\r\n\r\n    -- Update referral status\r\n    UPDATE public.portal_referrals\r\n    SET\r\n        status = 'registered',\r\n        registered_at = NOW(),\r\n        updated_at = NOW()\r\n    WHERE id = v_referral_id;\r\n\r\n    -- Update contact record if exists\r\n    UPDATE public.contacts\r\n    SET\r\n        is_portal_member = true,\r\n        portal_profile_id = p_user_id,\r\n        status = 'Registered',\r\n        updated_at = NOW()\r\n    WHERE referral_id = v_referral_id\r\n    RETURNING id INTO v_contact_id;\r\n\r\n    RETURN json_build_object(\r\n        'success', true,\r\n        'conversion_id', v_conversion_id,\r\n        'referrer_id', v_referrer_id,\r\n        'contact_updated', v_contact_id IS NOT NULL\r\n    );\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "promote_portal_user",
    "function_definition": "CREATE OR REPLACE FUNCTION public.promote_portal_user(p_user_id uuid, p_new_role text)\n RETURNS TABLE(success boolean, message text, old_role text, new_role text)\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public', 'pg_temp'\nAS $function$\r\nDECLARE\r\n  v_caller_role TEXT;\r\n  v_current_role TEXT;\r\n  v_user_email TEXT;\r\nBEGIN\r\n  -- Get caller's role\r\n  SELECT role INTO v_caller_role\r\n  FROM profiles\r\n  WHERE id = auth.uid();\r\n\r\n  -- Only super_admins can promote users\r\n  IF v_caller_role != 'super_admin' THEN\r\n    RETURN QUERY SELECT FALSE, 'Only super administrators can promote users', NULL::TEXT, NULL::TEXT;\r\n    RETURN;\r\n  END IF;\r\n\r\n  -- Validate new role is a valid portal role\r\n  IF p_new_role NOT IN ('portal_member', 'investor', 'admin', 'super_admin') THEN\r\n    RETURN QUERY SELECT FALSE, 'Invalid portal role. Must be: portal_member, investor, admin, or super_admin', NULL::TEXT, NULL::TEXT;\r\n    RETURN;\r\n  END IF;\r\n\r\n  -- Get current user info\r\n  SELECT role, email INTO v_current_role, v_user_email\r\n  FROM profiles\r\n  WHERE id = p_user_id;\r\n\r\n  IF v_current_role IS NULL THEN\r\n    RETURN QUERY SELECT FALSE, 'User not found or not a portal user', NULL::TEXT, NULL::TEXT;\r\n    RETURN;\r\n  END IF;\r\n\r\n  -- Prevent promoting system users (role='user')\r\n  IF v_current_role = 'user' THEN\r\n    RETURN QUERY SELECT FALSE, 'Cannot promote system users. User must be a portal member first.', v_current_role, NULL::TEXT;\r\n    RETURN;\r\n  END IF;\r\n\r\n  -- Update the user's role\r\n  UPDATE profiles\r\n  SET\r\n    role = p_new_role,\r\n    updated_at = NOW()\r\n  WHERE id = p_user_id;\r\n\r\n  -- Return success\r\n  RETURN QUERY SELECT TRUE,\r\n    format('User %s promoted from %s to %s', v_user_email, v_current_role, p_new_role),\r\n    v_current_role,\r\n    p_new_role;\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "queue_email",
    "function_definition": "CREATE OR REPLACE FUNCTION public.queue_email(p_event_type text, p_event_id text DEFAULT NULL::text, p_event_payload jsonb DEFAULT '{}'::jsonb, p_template_id text DEFAULT NULL::text, p_recipient_list_id text DEFAULT NULL::text, p_to_email text DEFAULT NULL::text, p_to_user_id uuid DEFAULT NULL::uuid, p_priority integer DEFAULT 5, p_scheduled_for timestamp with time zone DEFAULT now(), p_metadata jsonb DEFAULT '{}'::jsonb)\n RETURNS uuid\n LANGUAGE plpgsql\nAS $function$\r\nDECLARE\r\n    v_queue_id uuid;\r\nBEGIN\r\n    -- Validate that we have either a recipient list or individual recipient\r\n    IF p_recipient_list_id IS NULL AND p_to_email IS NULL THEN\r\n        RAISE EXCEPTION 'Must provide either recipient_list_id or to_email';\r\n    END IF;\r\n\r\n    IF p_to_email IS NOT NULL THEN\r\n        -- Single recipient\r\n        INSERT INTO email_queue (\r\n            event_type, event_id, event_payload, template_id,\r\n            to_email, to_user_id, priority, scheduled_for, metadata\r\n        )\r\n        VALUES (\r\n            p_event_type, p_event_id, p_event_payload, p_template_id,\r\n            p_to_email, p_to_user_id, p_priority, p_scheduled_for, p_metadata\r\n        )\r\n        RETURNING id INTO v_queue_id;\r\n    END IF;\r\n\r\n    RETURN v_queue_id;\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "queue_event_email_notifications",
    "function_definition": "CREATE OR REPLACE FUNCTION public.queue_event_email_notifications()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\r\nDECLARE\r\n    v_batch_id UUID;\r\n    v_recipients JSONB;\r\n    v_recipient_count INT;\r\nBEGIN\r\n    -- Only process on status change to 'published'\r\n    IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN\r\n\r\n        -- Don't create duplicate batches\r\n        IF EXISTS (\r\n            SELECT 1 FROM email_notification_batches\r\n            WHERE content_id = NEW.id::TEXT\r\n            AND notification_type = 'event_published'\r\n        ) THEN\r\n            RAISE NOTICE 'Email batch already exists for event %', NEW.id;\r\n            RETURN NEW;\r\n        END IF;\r\n\r\n        v_batch_id := gen_random_uuid();\r\n\r\n        -- Get recipients (all portal users)\r\n        SELECT\r\n            COUNT(*),\r\n            jsonb_agg(jsonb_build_object(\r\n                'user_id', p.id,\r\n                'email', p.email,\r\n                'first_name', p.first_name,\r\n                'last_name', p.last_name\r\n            ))\r\n        INTO v_recipient_count, v_recipients\r\n        FROM profiles p\r\n        WHERE p.email IS NOT NULL\r\n        AND p.email != ''\r\n        AND p.role IN ('portal_member', 'admin', 'super_admin', 'investor');\r\n\r\n        IF v_recipient_count > 0 THEN\r\n            -- Insert batch\r\n            INSERT INTO email_notification_batches (\r\n                id,\r\n                notification_type,\r\n                content_id,\r\n                content_data,\r\n                status,\r\n                created_at\r\n            ) VALUES (\r\n                v_batch_id,\r\n                'event_published',\r\n                NEW.id::TEXT,\r\n                jsonb_build_object(\r\n                    'event_id', NEW.id,\r\n                    'event_title', NEW.title,\r\n                    'event_description', NEW.description,\r\n                    'event_date', NEW.event_date,\r\n                    'location', NEW.location,\r\n                    'recipients', v_recipients\r\n                ),\r\n                'pending',\r\n                NOW()\r\n            );\r\n\r\n            -- Update event record\r\n            NEW.email_batch_id := v_batch_id;\r\n            NEW.email_sent_at := NOW();\r\n\r\n            RAISE NOTICE 'Created email batch % for event % with % recipients',\r\n                v_batch_id, NEW.id, v_recipient_count;\r\n        ELSE\r\n            RAISE NOTICE 'No recipients found for event %', NEW.id;\r\n        END IF;\r\n    END IF;\r\n\r\n    RETURN NEW;\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "queue_notification",
    "function_definition": "CREATE OR REPLACE FUNCTION public.queue_notification(p_event_id text, p_event_data jsonb, p_triggered_by uuid DEFAULT NULL::uuid)\n RETURNS json\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public'\nAS $function$\r\n  DECLARE\r\n    v_rule RECORD;\r\n    v_template RECORD;\r\n    v_recipients UUID[];\r\n    v_recipient UUID;\r\n    v_email TEXT;\r\n    v_user_name TEXT;\r\n    v_queued_count INTEGER := 0;\r\n    v_result JSON;\r\n    v_dynamic_emails TEXT[];\r\n    v_dynamic_email TEXT;\r\n    v_static_email TEXT;\r\n    v_notification_id UUID;\r\n  BEGIN\r\n    RAISE NOTICE 'queue_notification called with event_id: %, data: %', p_event_id, p_event_data;\r\n\r\n    -- Get active rules for this event\r\n    FOR v_rule IN\r\n      SELECT * FROM public.notification_rules\r\n      WHERE event_id = p_event_id AND enabled = true\r\n      ORDER BY priority\r\n    LOOP\r\n      RAISE NOTICE 'Processing rule: % (type: %)', v_rule.name, v_rule.recipient_type;\r\n\r\n      -- Get the template\r\n      SELECT * INTO v_template\r\n      FROM public.email_templates\r\n      WHERE id = v_rule.template_id AND is_active = true;\r\n\r\n      IF v_template IS NULL THEN\r\n        RAISE NOTICE 'No active template found for rule';\r\n        CONTINUE;\r\n      END IF;\r\n\r\n      -- Determine recipients based on recipient_type\r\n      v_recipients := ARRAY[]::UUID[];\r\n      v_dynamic_emails := ARRAY[]::TEXT[];\r\n\r\n      -- HANDLE STATIC RECIPIENT TYPE\r\n      IF v_rule.recipient_type = 'static' THEN\r\n        -- Get the static email from recipient_config\r\n        v_static_email := v_rule.recipient_config->>'email';\r\n\r\n        IF v_static_email IS NOT NULL THEN\r\n          -- Insert notification for static email\r\n          INSERT INTO public.email_notifications (\r\n            id,\r\n            event_id,\r\n            rule_id,\r\n            to_email,\r\n            subject,\r\n            template_id,\r\n            template_data,\r\n            status,\r\n            priority,\r\n            created_by,\r\n            created_at\r\n          ) VALUES (\r\n            gen_random_uuid(),\r\n            p_event_id,\r\n            v_rule.id,\r\n            v_static_email,\r\n            v_template.subject,\r\n            v_template.id,\r\n            p_event_data,\r\n            'pending',\r\n            v_rule.priority,\r\n            p_triggered_by,\r\n            NOW()\r\n          );\r\n\r\n          v_queued_count := v_queued_count + 1;\r\n          RAISE NOTICE 'Queued static email for %', v_static_email;\r\n        END IF;\r\n\r\n      ELSIF v_rule.recipient_type = 'role' THEN\r\n        -- Get all users with specified roles\r\n        IF v_rule.recipient_config ? 'roles' THEN\r\n          SELECT array_agg(id) INTO v_recipients\r\n          FROM public.profiles\r\n          WHERE role = ANY((v_rule.recipient_config->>'roles')::text[])\r\n            AND email IS NOT NULL;\r\n        ELSE\r\n          -- Fallback to default roles\r\n          SELECT array_agg(id) INTO v_recipients\r\n          FROM public.profiles\r\n          WHERE role IN ('portal_member', 'admin', 'super_admin', 'investor')\r\n            AND email IS NOT NULL;\r\n        END IF;\r\n\r\n        RAISE NOTICE 'Found % recipients with roles', COALESCE(array_length(v_recipients, 1), 0);\r\n\r\n      ELSIF v_rule.recipient_type = 'dynamic' THEN\r\n        -- Handle dynamic recipient type\r\n        -- Check if it's a simple field reference (like the welcome email)\r\n        IF v_rule.recipient_config ? 'field' AND v_rule.recipient_config ? 'source' THEN\r\n          -- Extract email from event data\r\n          v_dynamic_email := p_event_data->>(v_rule.recipient_config->>'field');\r\n\r\n          IF v_dynamic_email IS NOT NULL THEN\r\n            -- Insert notification for dynamic email\r\n            INSERT INTO public.email_notifications (\r\n              id,\r\n              event_id,\r\n              rule_id,\r\n              to_email,\r\n              subject,\r\n              template_id,\r\n              template_data,\r\n              status,\r\n              priority,\r\n              created_by,\r\n              created_at\r\n            ) VALUES (\r\n              gen_random_uuid(),\r\n              p_event_id,\r\n              v_rule.id,\r\n              v_dynamic_email,\r\n              v_template.subject,\r\n              v_template.id,\r\n              p_event_data,\r\n              'pending',\r\n              v_rule.priority,\r\n              p_triggered_by,\r\n              NOW()\r\n            );\r\n\r\n            v_queued_count := v_queued_count + 1;\r\n            RAISE NOTICE 'Queued dynamic email for %', v_dynamic_email;\r\n          END IF;\r\n\r\n        ELSIF v_rule.recipient_config ? 'query' THEN\r\n          -- Handle SQL query based dynamic recipients (existing code)\r\n          BEGIN\r\n            EXECUTE v_rule.recipient_config->>'query' INTO v_dynamic_emails;\r\n            RAISE NOTICE 'Dynamic query returned % emails', COALESCE(array_length(v_dynamic_emails,\r\n   1), 0);\r\n          EXCEPTION\r\n            WHEN OTHERS THEN\r\n              -- If query fails, try simpler approach\r\n              SELECT array_agg(email) INTO v_dynamic_emails\r\n              FROM public.profiles\r\n              WHERE role IN ('portal_member', 'admin', 'super_admin', 'investor')\r\n                AND email IS NOT NULL;\r\n              RAISE NOTICE 'Fallback query returned % emails',\r\n  COALESCE(array_length(v_dynamic_emails, 1), 0);\r\n          END;\r\n\r\n          -- Queue emails for dynamic query results\r\n          IF v_dynamic_emails IS NOT NULL AND array_length(v_dynamic_emails, 1) > 0 THEN\r\n            FOREACH v_dynamic_email IN ARRAY v_dynamic_emails\r\n            LOOP\r\n              IF v_dynamic_email IS NOT NULL THEN\r\n                INSERT INTO public.email_notifications (\r\n                  id,\r\n                  event_id,\r\n                  rule_id,\r\n                  to_email,\r\n                  subject,\r\n                  template_id,\r\n                  template_data,\r\n                  status,\r\n                  priority,\r\n                  created_by,\r\n                  created_at\r\n                ) VALUES (\r\n                  gen_random_uuid(),\r\n                  p_event_id,\r\n                  v_rule.id,\r\n                  v_dynamic_email,\r\n                  v_template.subject,\r\n                  v_template.id,\r\n                  p_event_data || jsonb_build_object('user_name', 'Portal Member'),\r\n                  'pending',\r\n                  v_rule.priority,\r\n                  p_triggered_by,\r\n                  NOW()\r\n                );\r\n\r\n                v_queued_count := v_queued_count + 1;\r\n                RAISE NOTICE 'Queued email for %', v_dynamic_email;\r\n              END IF;\r\n            END LOOP;\r\n          END IF;\r\n        END IF;\r\n      END IF;\r\n\r\n      -- Queue email for role-based recipients\r\n      IF v_recipients IS NOT NULL AND array_length(v_recipients, 1) > 0 THEN\r\n        FOREACH v_recipient IN ARRAY v_recipients\r\n        LOOP\r\n          -- Get recipient details\r\n          SELECT email, COALESCE(first_name, 'Portal Member')\r\n          INTO v_email, v_user_name\r\n          FROM public.profiles\r\n          WHERE id = v_recipient;\r\n\r\n          IF v_email IS NOT NULL THEN\r\n            -- Add user_name to event data\r\n            p_event_data := p_event_data || jsonb_build_object('user_name', v_user_name);\r\n\r\n            -- Insert into email_notifications table\r\n            INSERT INTO public.email_notifications (\r\n              id,\r\n              event_id,\r\n              rule_id,\r\n              to_email,\r\n              subject,\r\n              template_id,\r\n              template_data,\r\n              status,\r\n              priority,\r\n              created_by,\r\n              created_at\r\n            ) VALUES (\r\n              gen_random_uuid(),\r\n              p_event_id,\r\n              v_rule.id,\r\n              v_email,\r\n              v_template.subject,\r\n              v_template.id,\r\n              p_event_data,\r\n              'pending',\r\n              v_rule.priority,\r\n              v_recipient,  -- Use the user's ID as created_by\r\n              NOW()\r\n            );\r\n\r\n            v_queued_count := v_queued_count + 1;\r\n            RAISE NOTICE 'Queued email for %', v_email;\r\n          END IF;\r\n        END LOOP;\r\n      END IF;\r\n    END LOOP;\r\n\r\n    -- Return result\r\n    v_result := json_build_object(\r\n      'success', true,\r\n      'queued_count', v_queued_count,\r\n      'event_id', p_event_id\r\n    );\r\n\r\n    RAISE NOTICE 'queue_notification result: %', v_result;\r\n    RETURN v_result;\r\n  EXCEPTION\r\n    WHEN OTHERS THEN\r\n      RAISE NOTICE 'Error in queue_notification: %', SQLERRM;\r\n      RETURN json_build_object(\r\n        'success', false,\r\n        'error', SQLERRM\r\n      );\r\n  END;\r\n  $function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "queue_notification_emails",
    "function_definition": "CREATE OR REPLACE FUNCTION public.queue_notification_emails()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\r\nDECLARE\r\n    v_event_type TEXT;\r\n    v_event_payload JSONB;\r\n    v_rule RECORD;\r\n    v_recipient_list RECORD;\r\n    v_recipient RECORD;\r\n    v_roles TEXT[];\r\n    v_source_field TEXT;\r\n    v_recipient_email TEXT;\r\n    v_recipient_id UUID;\r\n    v_base_url TEXT := 'https://portal.fleetdrms.com';\r\n    v_portal_url TEXT;\r\n    v_referrer RECORD;\r\nBEGIN\r\n    -- Determine event type based on table and operation\r\n    IF TG_TABLE_NAME = 'portal_updates' THEN\r\n        IF TG_OP = 'INSERT' THEN\r\n            v_event_type := 'update_published';\r\n        ELSE\r\n            RETURN NEW;\r\n        END IF;\r\n        -- Build portal URL for updates\r\n        v_portal_url := v_base_url || '/updates/' || NEW.id;\r\n    ELSIF TG_TABLE_NAME = 'portal_events' THEN\r\n        IF TG_OP = 'INSERT' THEN\r\n            v_event_type := 'event_created';\r\n        ELSIF TG_OP = 'UPDATE' AND OLD.event_date IS DISTINCT FROM NEW.event_date THEN\r\n            v_event_type := 'event_updated';\r\n        ELSE\r\n            RETURN NEW;\r\n        END IF;\r\n        -- Build portal URL for events\r\n        v_portal_url := v_base_url || '/events/' || NEW.id;\r\n    ELSIF TG_TABLE_NAME = 'portal_referrals' THEN\r\n        IF TG_OP = 'INSERT' THEN\r\n            v_event_type := 'referral_created';\r\n            -- Build portal URL for referral registration\r\n            v_portal_url := v_base_url || '/register?ref=' || NEW.referral_code;\r\n        ELSE\r\n            RETURN NEW;\r\n        END IF;\r\n    ELSIF TG_TABLE_NAME = 'contact_submissions' THEN\r\n        IF TG_OP = 'INSERT' THEN\r\n            v_event_type := 'contact_form_submitted';\r\n        ELSE\r\n            RETURN NEW;\r\n        END IF;\r\n    ELSE\r\n        RETURN NEW;\r\n    END IF;\r\n\r\n    -- Build event payload\r\n    v_event_payload := to_jsonb(NEW);\r\n    IF v_portal_url IS NOT NULL THEN\r\n        v_event_payload := v_event_payload || jsonb_build_object('portal_url', v_portal_url);\r\n    END IF;\r\n\r\n    -- For referral events, look up the referrer's information from profiles table\r\n    IF TG_TABLE_NAME = 'portal_referrals' AND NEW.referrer_id IS NOT NULL THEN\r\n        RAISE NOTICE 'Looking up referrer with ID: %', NEW.referrer_id;\r\n\r\n        SELECT first_name, last_name, email\r\n        INTO v_referrer\r\n        FROM profiles\r\n        WHERE id = NEW.referrer_id;\r\n\r\n        IF FOUND THEN\r\n            RAISE NOTICE 'Found referrer: % %', v_referrer.first_name, v_referrer.last_name;\r\n            -- Add referrer information to payload\r\n            v_event_payload := v_event_payload || jsonb_build_object(\r\n                'referrer_first_name', COALESCE(v_referrer.first_name, ''),\r\n                'referrer_last_name', COALESCE(v_referrer.last_name, ''),\r\n                'referrer_email', COALESCE(v_referrer.email, '')\r\n            );\r\n            RAISE NOTICE 'Added referrer to payload';\r\n        ELSE\r\n            RAISE NOTICE 'Referrer NOT found in profiles table';\r\n        END IF;\r\n    END IF;\r\n\r\n    -- Find all enabled notification rules for this event type\r\n    FOR v_rule IN\r\n        SELECT * FROM notification_rules\r\n        WHERE event_id = v_event_type\r\n        AND enabled = true\r\n    LOOP\r\n        -- Get the recipient list\r\n        SELECT * INTO v_recipient_list\r\n        FROM recipient_lists\r\n        WHERE id = v_rule.recipient_list_id;\r\n\r\n        IF NOT FOUND THEN\r\n            CONTINUE;\r\n        END IF;\r\n\r\n        -- Handle different recipient list types\r\n        IF v_recipient_list.type = 'role_based' THEN\r\n            -- Role-based recipient list\r\n            SELECT ARRAY(SELECT jsonb_array_elements_text(v_recipient_list.config->'roles'))\r\n            INTO v_roles;\r\n\r\n            FOR v_recipient IN\r\n                SELECT DISTINCT p.email, p.id as user_id, p.first_name, p.last_name\r\n                FROM profiles p\r\n                WHERE p.role = ANY(v_roles)\r\n                AND p.email IS NOT NULL\r\n            LOOP\r\n                INSERT INTO email_queue (\r\n                    to_email,\r\n                    to_user_id,\r\n                    template_id,\r\n                    event_type,\r\n                    event_id,\r\n                    event_payload,\r\n                    recipient_list_id,\r\n                    status,\r\n                    priority,\r\n                    created_at\r\n                )\r\n                VALUES (\r\n                    v_recipient.email,\r\n                    v_recipient.user_id,\r\n                    v_rule.template_id,\r\n                    v_event_type,\r\n                    NEW.id::text,\r\n                    v_event_payload || jsonb_build_object(\r\n                        'recipient_first_name', v_recipient.first_name,\r\n                        'recipient_last_name', v_recipient.last_name\r\n                    ),\r\n                    v_rule.recipient_list_id,\r\n                    'pending',\r\n                    v_rule.priority,\r\n                    NOW()\r\n                );\r\n            END LOOP;\r\n        ELSIF v_recipient_list.type = 'static' THEN\r\n            -- Static recipient list\r\n            FOR v_recipient IN\r\n                SELECT DISTINCT\r\n                    u.email,\r\n                    u.id as user_id,\r\n                    u.first_name,\r\n                    u.last_name\r\n                FROM jsonb_array_elements(v_recipient_list.config->'user_ids') AS user_id_elem\r\n                JOIN profiles u ON u.id = (user_id_elem#>>'{}')::uuid\r\n                WHERE u.email IS NOT NULL\r\n            LOOP\r\n                INSERT INTO email_queue (\r\n                    to_email,\r\n                    to_user_id,\r\n                    template_id,\r\n                    event_type,\r\n                    event_id,\r\n                    event_payload,\r\n                    recipient_list_id,\r\n                    status,\r\n                    priority,\r\n                    created_at\r\n                )\r\n                VALUES (\r\n                    v_recipient.email,\r\n                    v_recipient.user_id,\r\n                    v_rule.template_id,\r\n                    v_event_type,\r\n                    NEW.id::text,\r\n                    v_event_payload || jsonb_build_object(\r\n                        'recipient_first_name', v_recipient.first_name,\r\n                        'recipient_last_name', v_recipient.last_name\r\n                    ),\r\n                    v_rule.recipient_list_id,\r\n                    'pending',\r\n                    v_rule.priority,\r\n                    NOW()\r\n                );\r\n            END LOOP;\r\n        ELSIF v_recipient_list.type = 'dynamic' THEN\r\n            -- Dynamic recipient list - extract email from event payload using configured path\r\n            v_source_field := v_recipient_list.config->>'source';\r\n\r\n            IF v_source_field IS NOT NULL THEN\r\n                -- Remove \"event.\" prefix if present\r\n                v_source_field := regexp_replace(v_source_field, '^event\\.', '');\r\n\r\n                -- Extract email from event payload\r\n                v_recipient_email := v_event_payload->>v_source_field;\r\n\r\n                IF v_recipient_email IS NOT NULL AND v_recipient_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$' THEN\r\n                    -- Look up user by email to get their ID and name\r\n                    SELECT id, first_name, last_name\r\n                    INTO v_recipient_id, v_recipient.first_name, v_recipient.last_name\r\n                    FROM profiles\r\n                    WHERE email = v_recipient_email;\r\n\r\n                    -- Determine which name to use for personalization\r\n                    -- For referee emails, use referee's name from the payload\r\n                    IF v_source_field = 'referee_email' THEN\r\n                        INSERT INTO email_queue (\r\n                            to_email,\r\n                            to_user_id,\r\n                            template_id,\r\n                            event_type,\r\n                            event_id,\r\n                            event_payload,\r\n                            recipient_list_id,\r\n                            status,\r\n                            priority,\r\n                            created_at\r\n                        )\r\n                        VALUES (\r\n                            v_recipient_email,\r\n                            v_recipient_id,\r\n                            v_rule.template_id,\r\n                            v_event_type,\r\n                            NEW.id::text,\r\n                            v_event_payload || jsonb_build_object(\r\n                                'recipient_first_name', COALESCE(v_event_payload->>'referee_first_name', ''),\r\n                                'recipient_last_name', COALESCE(v_event_payload->>'referee_last_name', '')\r\n                            ),\r\n                            v_rule.recipient_list_id,\r\n                            'pending',\r\n                            v_rule.priority,\r\n                            NOW()\r\n                        );\r\n                    ELSE\r\n                        -- For other recipients, use their profiles name if found\r\n                        IF v_recipient_id IS NOT NULL THEN\r\n                            INSERT INTO email_queue (\r\n                                to_email,\r\n                                to_user_id,\r\n                                template_id,\r\n                                event_type,\r\n                                event_id,\r\n                                event_payload,\r\n                                recipient_list_id,\r\n                                status,\r\n                                priority,\r\n                                created_at\r\n                            )\r\n                            VALUES (\r\n                                v_recipient_email,\r\n                                v_recipient_id,\r\n                                v_rule.template_id,\r\n                                v_event_type,\r\n                                NEW.id::text,\r\n                                v_event_payload || jsonb_build_object(\r\n                                    'recipient_first_name', v_recipient.first_name,\r\n                                    'recipient_last_name', v_recipient.last_name\r\n                                ),\r\n                                v_rule.recipient_list_id,\r\n                                'pending',\r\n                                v_rule.priority,\r\n                                NOW()\r\n                            );\r\n                        END IF;\r\n                    END IF;\r\n                END IF;\r\n            END IF;\r\n\r\n        ELSIF v_recipient_list.type = 'custom' THEN\r\n            -- Custom recipient list logic can be added here in the future\r\n            CONTINUE;\r\n        END IF;\r\n    END LOOP;\r\n\r\n    RETURN NEW;\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "queue_survey_email_notifications",
    "function_definition": "CREATE OR REPLACE FUNCTION public.queue_survey_email_notifications()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\r\nDECLARE\r\n    v_batch_id UUID;\r\n    v_recipients JSONB;\r\n    v_recipient_count INT;\r\nBEGIN\r\n    -- Only process on status change to 'published'\r\n    IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN\r\n\r\n        -- Don't create duplicate batches\r\n        IF EXISTS (\r\n            SELECT 1 FROM email_notification_batches\r\n            WHERE content_id = NEW.id::TEXT\r\n            AND notification_type = 'survey_published'\r\n        ) THEN\r\n            RAISE NOTICE 'Email batch already exists for survey %', NEW.id;\r\n            RETURN NEW;\r\n        END IF;\r\n\r\n        v_batch_id := gen_random_uuid();\r\n\r\n        -- Get recipients (all portal users)\r\n        SELECT\r\n            COUNT(*),\r\n            jsonb_agg(jsonb_build_object(\r\n                'user_id', p.id,\r\n                'email', p.email,\r\n                'first_name', p.first_name,\r\n                'last_name', p.last_name\r\n            ))\r\n        INTO v_recipient_count, v_recipients\r\n        FROM profiles p\r\n        WHERE p.email IS NOT NULL\r\n        AND p.email != ''\r\n        AND p.role IN ('portal_member', 'admin', 'super_admin', 'investor');\r\n\r\n        IF v_recipient_count > 0 THEN\r\n            -- Insert batch\r\n            INSERT INTO email_notification_batches (\r\n                id,\r\n                notification_type,\r\n                content_id,\r\n                content_data,\r\n                status,\r\n                created_at\r\n            ) VALUES (\r\n                v_batch_id,\r\n                'survey_published',\r\n                NEW.id::TEXT,\r\n                jsonb_build_object(\r\n                    'survey_id', NEW.id,\r\n                    'survey_title', NEW.title,\r\n                    'survey_description', NEW.description,\r\n                    'recipients', v_recipients\r\n                ),\r\n                'pending',\r\n                NOW()\r\n            );\r\n\r\n            -- Update survey record\r\n            NEW.email_batch_id := v_batch_id;\r\n            NEW.email_sent_at := NOW();\r\n\r\n            RAISE NOTICE 'Created email batch % for survey % with % recipients',\r\n                v_batch_id, NEW.id, v_recipient_count;\r\n        END IF;\r\n    END IF;\r\n\r\n    RETURN NEW;\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "record_referral_conversion",
    "function_definition": "CREATE OR REPLACE FUNCTION public.record_referral_conversion(p_referral_code text, p_user_id uuid, p_metadata jsonb DEFAULT NULL::jsonb)\n RETURNS boolean\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public', 'pg_temp'\nAS $function$\r\nDECLARE\r\n  v_referral_id UUID;\r\n  v_is_reusable BOOLEAN;\r\n  v_max_uses INTEGER;\r\n  v_current_uses INTEGER;\r\nBEGIN\r\n  -- Get referral info\r\n  SELECT id, is_reusable, max_uses, usage_count\r\n  INTO v_referral_id, v_is_reusable, v_max_uses, v_current_uses\r\n  FROM portal_referrals\r\n  WHERE referral_code = p_referral_code;\r\n\r\n  IF v_referral_id IS NULL THEN\r\n    RAISE EXCEPTION 'Referral code not found: %', p_referral_code;\r\n  END IF;\r\n\r\n  -- Check if code is reusable and hasn't exceeded max uses\r\n  IF v_is_reusable THEN\r\n    IF v_max_uses IS NOT NULL AND v_current_uses >= v_max_uses THEN\r\n      RAISE EXCEPTION 'Referral code has exceeded maximum uses';\r\n    END IF;\r\n  END IF;\r\n\r\n  -- Record the conversion\r\n  INSERT INTO referral_conversions (\r\n    referral_id,\r\n    user_id,\r\n    converted_at,\r\n    conversion_metadata\r\n  ) VALUES (\r\n    v_referral_id,\r\n    p_user_id,\r\n    NOW(),\r\n    p_metadata\r\n  )\r\n  ON CONFLICT (referral_id, user_id) DO NOTHING; -- Prevent duplicate conversions\r\n\r\n  -- Increment usage count\r\n  UPDATE portal_referrals\r\n  SET usage_count = usage_count + 1\r\n  WHERE id = v_referral_id;\r\n\r\n  RETURN true;\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "resend_referral_invitation",
    "function_definition": "CREATE OR REPLACE FUNCTION public.resend_referral_invitation(p_referral_id uuid)\n RETURNS json\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public', 'pg_temp'\nAS $function$\r\nDECLARE\r\n    v_referrer_id UUID;\r\n    v_can_proceed BOOLEAN;\r\n    v_current_resend_count INTEGER;\r\nBEGIN\r\n    -- Get referrer_id and validate ownership\r\n    SELECT referrer_id, resend_count\r\n    INTO v_referrer_id, v_current_resend_count\r\n    FROM public.portal_referrals\r\n    WHERE id = p_referral_id;\r\n\r\n    IF v_referrer_id IS NULL THEN\r\n        RAISE EXCEPTION 'Referral not found';\r\n    END IF;\r\n\r\n    IF auth.uid() IS NULL OR auth.uid() != v_referrer_id THEN\r\n        RAISE EXCEPTION 'Unauthorized';\r\n    END IF;\r\n\r\n    -- Check rate limiting for resend\r\n    SELECT check_referral_rate_limit(v_referrer_id, 'resend_invitation', p_referral_id) INTO v_can_proceed;\r\n\r\n    IF NOT v_can_proceed THEN\r\n        RAISE EXCEPTION 'Rate limit exceeded. Maximum 3 resends per referral per day.';\r\n    END IF;\r\n\r\n    -- Update referral with resend information\r\n    UPDATE public.portal_referrals\r\n    SET\r\n        last_resent_at = NOW(),\r\n        resend_count = v_current_resend_count + 1,\r\n        updated_at = NOW()\r\n    WHERE id = p_referral_id;\r\n\r\n    -- Record rate limit action\r\n    PERFORM record_rate_limit_action(v_referrer_id, 'resend_invitation', p_referral_id);\r\n\r\n    RETURN json_build_object(\r\n        'success', true,\r\n        'resend_count', v_current_resend_count + 1,\r\n        'resent_at', NOW()\r\n    );\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "retry_failed_emails",
    "function_definition": "CREATE OR REPLACE FUNCTION public.retry_failed_emails(p_hours integer DEFAULT 24)\n RETURNS integer\n LANGUAGE plpgsql\nAS $function$\r\nDECLARE\r\n    v_count int;\r\nBEGIN\r\n    UPDATE email_queue\r\n    SET status = 'pending',\r\n        attempts = 0,\r\n        last_error = null,\r\n        last_attempt_at = null\r\n    WHERE status = 'failed'\r\n        AND created_at > now() - interval '1 hour' * p_hours\r\n        AND attempts < max_attempts;\r\n\r\n    GET DIAGNOSTICS v_count = ROW_COUNT;\r\n\r\n    RAISE NOTICE 'Reset % failed emails to pending status', v_count;\r\n    RETURN v_count;\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "send_calculator_notification",
    "function_definition": "CREATE OR REPLACE FUNCTION public.send_calculator_notification(p_submission_data jsonb)\n RETURNS jsonb\n LANGUAGE plpgsql\nAS $function$\r\nDECLARE\r\n  v_result JSONB;\r\nBEGIN\r\n  -- Queue the notification\r\n  v_result := public.queue_notification(\r\n    'calculator_submission',\r\n    jsonb_build_object(\r\n      'user_name', p_submission_data->>'user_name',\r\n      'user_email', p_submission_data->>'user_email',\r\n      'company_name', p_submission_data->>'company_name',\r\n      'fleet_size', p_submission_data->>'fleet_size',\r\n      'submission_date', COALESCE(p_submission_data->>'submission_date', NOW()::text),\r\n      'total_monthly_savings', p_submission_data->>'total_monthly_savings',\r\n      'total_annual_savings', p_submission_data->>'total_annual_savings',\r\n      'labor_savings_total', p_submission_data->>'labor_savings_total',\r\n      'system_savings_total', p_submission_data->>'system_savings_total',\r\n      'fixed_savings_total', p_submission_data->>'fixed_savings_total',\r\n      'labor_savings_items', p_submission_data->'labor_savings_items',\r\n      'labor_savings_items_count', jsonb_array_length(COALESCE(p_submission_data->'labor_savings_items', '[]'::jsonb)),\r\n      'system_replacement_items', p_submission_data->'system_replacement_items',\r\n      'system_replacement_items_count', jsonb_array_length(COALESCE(p_submission_data->'system_replacement_items', '[]'::jsonb)),\r\n      'fixed_savings_items', p_submission_data->'fixed_savings_items',\r\n      'fixed_savings_items_count', jsonb_array_length(COALESCE(p_submission_data->'fixed_savings_items', '[]'::jsonb)),\r\n      'notes', p_submission_data->>'notes',\r\n      'admin_calculator_url', 'https://fleetdrms.com/portal/admin/calculator',\r\n      'admin_dashboard_url', 'https://fleetdrms.com/portal/admin'\r\n    ),\r\n    p_submission_data->>'user_id'\r\n  );\r\n\r\n  RETURN v_result;\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "set_default_email_preferences",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_default_email_preferences()\n RETURNS void\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public', 'pg_temp'\nAS $function$\r\nBEGIN\r\n  UPDATE public.profiles\r\n  SET \r\n    email_updates = COALESCE(email_updates, true),\r\n    email_surveys = COALESCE(email_surveys, true),\r\n    email_events = COALESCE(email_events, true)\r\n  WHERE email_updates IS NULL \r\n     OR email_surveys IS NULL \r\n     OR email_events IS NULL;\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "trigger_email_notification",
    "function_definition": "CREATE OR REPLACE FUNCTION public.trigger_email_notification()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\r\nDECLARE\r\n    v_rule notification_rules;\r\n    v_recipient_list recipient_lists;\r\n    v_recipient RECORD;\r\n    v_template email_templates;\r\n    v_roles text[];\r\n    v_event_type text;\r\n    v_event_payload jsonb;\r\n    v_base_url text := 'https://portal.fleetdrms.com';\r\n    v_portal_url text;\r\n    v_dynamic_email text;\r\n    v_static_email text;\r\n    v_referrer RECORD;\r\n    v_email_pref_column text; -- Which email preference column to check\r\nBEGIN\r\n    -- Determine event type and email preference column based on table and operation\r\n    IF TG_TABLE_NAME = 'portal_updates' THEN\r\n        IF TG_OP = 'INSERT' AND NEW.status = 'published' THEN\r\n            v_event_type := 'update_published';\r\n            v_email_pref_column := 'email_updates';\r\n        ELSIF TG_OP = 'UPDATE' AND OLD.status != 'published' AND NEW.status = 'published' THEN\r\n            v_event_type := 'update_published';\r\n            v_email_pref_column := 'email_updates';\r\n        ELSE\r\n            RETURN NEW;\r\n        END IF;\r\n        v_portal_url := v_base_url || '/updates/' || NEW.id;\r\n\r\n    ELSIF TG_TABLE_NAME = 'portal_surveys' THEN\r\n        IF TG_OP = 'INSERT' AND NEW.status = 'published' THEN\r\n            v_event_type := 'survey_published';\r\n            v_email_pref_column := 'email_surveys';\r\n        ELSIF TG_OP = 'UPDATE' AND OLD.status != 'published' AND NEW.status = 'published' THEN\r\n            v_event_type := 'survey_published';\r\n            v_email_pref_column := 'email_surveys';\r\n        ELSE\r\n            RETURN NEW;\r\n        END IF;\r\n        v_portal_url := v_base_url || '/surveys/' || NEW.id;\r\n\r\n    ELSIF TG_TABLE_NAME = 'portal_events' THEN\r\n        IF TG_OP = 'INSERT' AND NEW.status = 'published' THEN\r\n            v_event_type := 'event_published';\r\n            v_email_pref_column := 'email_events';\r\n        ELSIF TG_OP = 'UPDATE' AND OLD.status != 'published' AND NEW.status = 'published' THEN\r\n            v_event_type := 'event_published';\r\n            v_email_pref_column := 'email_events';\r\n        ELSE\r\n            RETURN NEW;\r\n        END IF;\r\n        v_portal_url := v_base_url || '/events/' || NEW.id;\r\n\r\n    ELSIF TG_TABLE_NAME = 'portal_referrals' THEN\r\n        IF TG_OP = 'INSERT' THEN\r\n            v_event_type := 'referral_created';\r\n            v_email_pref_column := 'email_updates'; -- Default to email_updates for referrals\r\n            v_portal_url := v_base_url || '/register?ref=' || NEW.referral_code;\r\n\r\n            -- For referral events, look up the referrer's information\r\n            IF NEW.referrer_id IS NOT NULL THEN\r\n                SELECT first_name, last_name, email\r\n                INTO v_referrer\r\n                FROM profiles\r\n                WHERE id = NEW.referrer_id;\r\n            END IF;\r\n        ELSE\r\n            RETURN NEW;\r\n        END IF;\r\n\r\n    ELSIF TG_TABLE_NAME = 'contact_submissions' THEN\r\n        IF TG_OP = 'INSERT' THEN\r\n            v_event_type := 'contact_form_submitted';\r\n            v_email_pref_column := 'email_updates'; -- Default to email_updates for contact submissions\r\n        ELSE\r\n            RETURN NEW;\r\n        END IF;\r\n    ELSE\r\n        RETURN NEW;\r\n    END IF;\r\n\r\n    -- Build event payload\r\n    v_event_payload := to_jsonb(NEW);\r\n    IF v_portal_url IS NOT NULL THEN\r\n        v_event_payload := v_event_payload || jsonb_build_object('portal_url', v_portal_url);\r\n    END IF;\r\n\r\n    -- Add referrer info to payload if this was a referral event\r\n    IF TG_TABLE_NAME = 'portal_referrals' AND v_referrer IS NOT NULL THEN\r\n        v_event_payload := v_event_payload || jsonb_build_object(\r\n            'referrer_first_name', COALESCE(v_referrer.first_name, ''),\r\n            'referrer_last_name', COALESCE(v_referrer.last_name, ''),\r\n            'referrer_email', COALESCE(v_referrer.email, '')\r\n        );\r\n    END IF;\r\n\r\n    -- Find all enabled notification rules for this event type\r\n    FOR v_rule IN\r\n        SELECT * FROM notification_rules\r\n        WHERE event_id = v_event_type\r\n        AND enabled = true\r\n    LOOP\r\n        -- Get the recipient list\r\n        SELECT * INTO v_recipient_list\r\n        FROM recipient_lists\r\n        WHERE id = v_rule.recipient_list_id;\r\n\r\n        IF NOT FOUND THEN\r\n            CONTINUE;\r\n        END IF;\r\n\r\n        -- Handle different recipient list types\r\n        IF v_recipient_list.type = 'role_based' THEN\r\n            -- Role-based recipient list\r\n            SELECT ARRAY(SELECT jsonb_array_elements_text(v_recipient_list.config->'roles'))\r\n            INTO v_roles;\r\n\r\n            -- Build dynamic query based on event type's email preference column\r\n            FOR v_recipient IN EXECUTE format(\r\n                'SELECT DISTINCT p.email, p.id as user_id, p.first_name, p.last_name\r\n                 FROM profiles p\r\n                 WHERE p.role = ANY($1)\r\n                 AND p.email IS NOT NULL\r\n                 AND (p.%I = true OR p.%I IS NULL)',\r\n                v_email_pref_column, v_email_pref_column\r\n            ) USING v_roles\r\n            LOOP\r\n                INSERT INTO email_queue (\r\n                    to_email,\r\n                    to_user_id,\r\n                    template_id,\r\n                    event_type,\r\n                    event_id,\r\n                    event_payload,\r\n                    recipient_list_id,\r\n                    status,\r\n                    priority,\r\n                    created_at\r\n                )\r\n                VALUES (\r\n                    v_recipient.email,\r\n                    v_recipient.user_id,\r\n                    v_rule.template_id,\r\n                    v_event_type,\r\n                    NEW.id::text,\r\n                    v_event_payload || jsonb_build_object(\r\n                        'recipient_first_name', v_recipient.first_name,\r\n                        'recipient_last_name', v_recipient.last_name\r\n                    ),\r\n                    v_rule.recipient_list_id::text,\r\n                    'queued',\r\n                    v_rule.priority,\r\n                    NOW()\r\n                );\r\n            END LOOP;\r\n\r\n        ELSIF v_recipient_list.type = 'static' THEN\r\n            -- Static recipient list - emails stored in config.emails array\r\n            -- For static lists, we send regardless of email preferences (admin override)\r\n            IF v_recipient_list.config ? 'emails' THEN\r\n                FOR v_static_email IN\r\n                    SELECT jsonb_array_elements_text(v_recipient_list.config->'emails')\r\n                LOOP\r\n                    -- Try to get user info if they exist\r\n                    SELECT p.id, p.first_name, p.last_name, p.email\r\n                    INTO v_recipient\r\n                    FROM profiles p\r\n                    WHERE p.email = v_static_email;\r\n\r\n                    IF FOUND THEN\r\n                        INSERT INTO email_queue (\r\n                            to_email,\r\n                            to_user_id,\r\n                            template_id,\r\n                            event_type,\r\n                            event_id,\r\n                            event_payload,\r\n                            recipient_list_id,\r\n                            status,\r\n                            priority,\r\n                            created_at\r\n                        )\r\n                        VALUES (\r\n                            v_recipient.email,\r\n                            v_recipient.id,\r\n                            v_rule.template_id,\r\n                            v_event_type,\r\n                            NEW.id::text,\r\n                            v_event_payload || jsonb_build_object(\r\n                                'recipient_first_name', v_recipient.first_name,\r\n                                'recipient_last_name', v_recipient.last_name\r\n                            ),\r\n                            v_rule.recipient_list_id::text,\r\n                            'queued',\r\n                            v_rule.priority,\r\n                            NOW()\r\n                        );\r\n                    ELSE\r\n                        INSERT INTO email_queue (\r\n                            to_email,\r\n                            to_user_id,\r\n                            template_id,\r\n                            event_type,\r\n                            event_id,\r\n                            event_payload,\r\n                            recipient_list_id,\r\n                            status,\r\n                            priority,\r\n                            created_at\r\n                        )\r\n                        VALUES (\r\n                            v_static_email,\r\n                            NULL,\r\n                            v_rule.template_id,\r\n                            v_event_type,\r\n                            NEW.id::text,\r\n                            v_event_payload,\r\n                            v_rule.recipient_list_id::text,\r\n                            'queued',\r\n                            v_rule.priority,\r\n                            NOW()\r\n                        );\r\n                    END IF;\r\n                END LOOP;\r\n            END IF;\r\n\r\n        ELSIF v_recipient_list.type = 'dynamic' THEN\r\n            -- Dynamic recipient list - extract email from event payload\r\n            IF v_recipient_list.config ? 'source' THEN\r\n                DECLARE\r\n                    v_source_path text;\r\n                BEGIN\r\n                    v_source_path := v_recipient_list.config->>'source';\r\n\r\n                    IF v_source_path LIKE 'event.%' THEN\r\n                        v_source_path := substring(v_source_path from 7);\r\n                        v_dynamic_email := v_event_payload->>v_source_path;\r\n\r\n                        IF v_dynamic_email IS NOT NULL AND v_dynamic_email != '' THEN\r\n                            SELECT p.id, p.first_name, p.last_name, p.email\r\n                            INTO v_recipient\r\n                            FROM profiles p\r\n                            WHERE p.email = v_dynamic_email;\r\n\r\n                            IF FOUND THEN\r\n                                INSERT INTO email_queue (\r\n                                    to_email,\r\n                                    to_user_id,\r\n                                    template_id,\r\n                                    event_type,\r\n                                    event_id,\r\n                                    event_payload,\r\n                                    recipient_list_id,\r\n                                    status,\r\n                                    priority,\r\n                                    created_at\r\n                                )\r\n                                VALUES (\r\n                                    v_recipient.email,\r\n                                    v_recipient.id,\r\n                                    v_rule.template_id,\r\n                                    v_event_type,\r\n                                    NEW.id::text,\r\n                                    v_event_payload || jsonb_build_object(\r\n                                        'recipient_first_name', v_recipient.first_name,\r\n                                        'recipient_last_name', v_recipient.last_name\r\n                                    ),\r\n                                    v_rule.recipient_list_id::text,\r\n                                    'queued',\r\n                                    v_rule.priority,\r\n                                    NOW()\r\n                                );\r\n                            ELSE\r\n                                INSERT INTO email_queue (\r\n                                    to_email,\r\n                                    to_user_id,\r\n                                    template_id,\r\n                                    event_type,\r\n                                    event_id,\r\n                                    event_payload,\r\n                                    recipient_list_id,\r\n                                    status,\r\n                                    priority,\r\n                                    created_at\r\n                                )\r\n                                VALUES (\r\n                                    v_dynamic_email,\r\n                                    NULL,\r\n                                    v_rule.template_id,\r\n                                    v_event_type,\r\n                                    NEW.id::text,\r\n                                    v_event_payload || jsonb_build_object(\r\n                                        'recipient_first_name', COALESCE(v_event_payload->>'referee_first_name', ''),\r\n                                        'recipient_last_name', COALESCE(v_event_payload->>'referee_last_name', '')\r\n                                    ),\r\n                                    v_rule.recipient_list_id::text,\r\n                                    'queued',\r\n                                    v_rule.priority,\r\n                                    NOW()\r\n                                );\r\n                            END IF;\r\n                        END IF;\r\n                    END IF;\r\n                END;\r\n            END IF;\r\n\r\n        ELSIF v_recipient_list.type = 'custom' THEN\r\n            CONTINUE;\r\n        END IF;\r\n    END LOOP;\r\n\r\n    RETURN NEW;\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "update_email_notification_status",
    "function_definition": "CREATE OR REPLACE FUNCTION public.update_email_notification_status(p_batch_id uuid, p_user_id text, p_email text, p_status text, p_resend_id text DEFAULT NULL::text, p_error_message text DEFAULT NULL::text)\n RETURNS void\n LANGUAGE plpgsql\nAS $function$\r\nBEGIN\r\n    -- For now, just log that we processed this recipient\r\n    -- In production, you'd want to track individual recipient status\r\n    IF p_status = 'failed' THEN\r\n        UPDATE email_notification_batches\r\n        SET error_message = COALESCE(error_message || '; ', '') || p_email || ': ' || COALESCE(p_error_message, 'Failed')\r\n        WHERE id = p_batch_id;\r\n    END IF;\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "update_email_notification_status",
    "function_definition": "CREATE OR REPLACE FUNCTION public.update_email_notification_status(p_batch_id uuid, p_user_id uuid, p_email text, p_status text, p_resend_id text DEFAULT NULL::text, p_error_message text DEFAULT NULL::text)\n RETURNS void\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public', 'pg_temp'\nAS $function$\r\nBEGIN\r\n  -- Log the email status (you could create a separate table for this)\r\n  -- For now, just update the batch counts\r\n  IF p_status = 'sent' THEN\r\n    UPDATE portal.email_notification_batches\r\n    SET emails_sent = emails_sent + 1\r\n    WHERE id = p_batch_id;\r\n  ELSIF p_status = 'failed' THEN\r\n    UPDATE portal.email_notification_batches\r\n    SET\r\n      emails_failed = emails_failed + 1,\r\n      error_message = COALESCE(error_message || '; ', '') || p_error_message\r\n    WHERE id = p_batch_id;\r\n  END IF;\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "update_email_notification_status",
    "function_definition": "CREATE OR REPLACE FUNCTION public.update_email_notification_status(p_batch_id uuid, p_status text, p_emails_sent integer DEFAULT 0, p_emails_failed integer DEFAULT 0)\n RETURNS void\n LANGUAGE plpgsql\nAS $function$\r\nBEGIN\r\n    UPDATE email_notification_batches\r\n    SET\r\n        status = p_status,\r\n        processed_at = CASE WHEN p_status IN ('sent', 'completed', 'failed') THEN NOW() ELSE processed_at END,\r\n        error_message = CASE WHEN p_status = 'failed' THEN 'Processing failed' ELSE NULL END\r\n    WHERE id = p_batch_id;\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "update_notification_status",
    "function_definition": "CREATE OR REPLACE FUNCTION public.update_notification_status(p_notification_id uuid, p_status text, p_error_message text DEFAULT NULL::text, p_email_provider_id text DEFAULT NULL::text)\n RETURNS void\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public', 'pg_temp'\nAS $function$\r\nDECLARE\r\n  v_current_error_count INTEGER;\r\n  v_max_retries INTEGER;\r\nBEGIN\r\n  -- Get current error count and max retries\r\n  SELECT error_count, max_retries\r\n  INTO v_current_error_count, v_max_retries\r\n  FROM public.email_notifications\r\n  WHERE id = p_notification_id;\r\n\r\n  -- Update notification based on status\r\n  IF p_status = 'sent' THEN\r\n    UPDATE public.email_notifications\r\n    SET\r\n      status = 'sent',\r\n      sent_at = NOW(),\r\n      email_provider_id = p_email_provider_id,\r\n      updated_at = NOW()\r\n    WHERE id = p_notification_id;\r\n\r\n    -- Log success\r\n    INSERT INTO public.notification_logs (notification_id, event_type, details)\r\n    VALUES (p_notification_id, 'sent', jsonb_build_object('provider_id', p_email_provider_id));\r\n\r\n  ELSIF p_status = 'failed' THEN\r\n    UPDATE public.email_notifications\r\n    SET\r\n      status = CASE\r\n        WHEN v_current_error_count + 1 >= v_max_retries THEN 'failed'\r\n        ELSE 'failed'\r\n      END,\r\n      failed_at = CASE\r\n        WHEN v_current_error_count + 1 >= v_max_retries THEN NOW()\r\n        ELSE failed_at\r\n      END,\r\n      error_message = p_error_message,\r\n      error_count = error_count + 1,\r\n      retry_after = CASE\r\n        WHEN v_current_error_count + 1 < v_max_retries\r\n        THEN NOW() + (interval '1 minute' * power(2, v_current_error_count + 1))  -- Exponential backoff\r\n        ELSE NULL\r\n      END,\r\n      updated_at = NOW()\r\n    WHERE id = p_notification_id;\r\n\r\n    -- Log failure\r\n    INSERT INTO public.notification_logs (notification_id, event_type, details)\r\n    VALUES (\r\n      p_notification_id,\r\n      CASE\r\n        WHEN v_current_error_count + 1 >= v_max_retries THEN 'failed'\r\n        ELSE 'retried'\r\n      END,\r\n      jsonb_build_object(\r\n        'error', p_error_message,\r\n        'attempt', v_current_error_count + 1,\r\n        'max_retries', v_max_retries\r\n      )\r\n    );\r\n  END IF;\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "update_referral_on_registration",
    "function_definition": "CREATE OR REPLACE FUNCTION public.update_referral_on_registration()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\r\nBEGIN\r\n  -- Check if this new profile was created via a referral\r\n  -- Look for matching email in portal_referrals (case-insensitive)\r\n  UPDATE portal_referrals\r\n  SET\r\n    status = 'registered',\r\n    registered_at = NEW.created_at\r\n  WHERE LOWER(referee_email) = LOWER(NEW.email)\r\n    AND status IN ('pending', 'sent')\r\n    AND registered_at IS NULL;\r\n\r\n  RETURN NEW;\r\nEND;\r\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "validate_referral_eligibility",
    "function_definition": "CREATE OR REPLACE FUNCTION public.validate_referral_eligibility(p_email text)\n RETURNS json\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public', 'pg_temp'\nAS $function$\r\nDECLARE\r\n  v_profile RECORD;\r\nBEGIN\r\n  -- Check if email exists in profiles\r\n  SELECT\r\n    id,\r\n    email,\r\n    is_portal_user,\r\n    role\r\n  INTO v_profile\r\n  FROM public.profiles\r\n  WHERE LOWER(email) = LOWER(p_email);\r\n\r\n  IF v_profile.id IS NULL THEN\r\n    -- Email doesn't exist at all - OK to refer\r\n    RETURN json_build_object(\r\n      'eligible', true,\r\n      'message', 'Email is eligible for referral'\r\n    );\r\n  END IF;\r\n\r\n  -- Check if they're already a portal user\r\n  IF v_profile.is_portal_user = true THEN\r\n    RETURN json_build_object(\r\n      'eligible', false,\r\n      'reason', 'already_portal_user',\r\n      'message', 'This person already has access to the DSP Portal'\r\n    );\r\n  END IF;\r\n\r\n  -- They're an app user but not portal user - OK to refer\r\n  RETURN json_build_object(\r\n    'eligible', true,\r\n    'is_app_user', true,\r\n    'message', 'This person uses the Fleet DRMS app but not the portal - they can be referred'\r\n  );\r\nEND;\r\n$function$\n"
  }
]
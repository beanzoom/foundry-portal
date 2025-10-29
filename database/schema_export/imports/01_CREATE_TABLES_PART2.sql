/*
================================================================================
PART 2: PORTAL CONTENT & SYSTEM TABLES (Tables 23-50)
================================================================================
Purpose: Create portal events, surveys, updates, and system tables
Prerequisites: Part 1 must be completed first
Execution time: ~2 minutes
Next: Import data using 02_IMPORT_DATA.sql
================================================================================
*/

-- ----------------------------------------------------------------------------
-- PHASE 3: PORTAL CONTENT TABLES (Events, Surveys, Updates)
-- ----------------------------------------------------------------------------

-- Events System
CREATE TABLE portal_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid,
  title text NOT NULL,
  description text,
  slug varchar(255),
  type varchar(50) NOT NULL DEFAULT 'in_person',
  event_type varchar(20) DEFAULT 'virtual',
  status text DEFAULT 'draft',
  category varchar(50),
  event_date timestamptz NOT NULL,
  start_datetime timestamptz DEFAULT now(),
  end_datetime timestamptz DEFAULT (now() + interval '1 hour'),
  timezone varchar(100) DEFAULT 'America/New_York',
  location text,
  location_name varchar(255),
  location_address text,
  location_city varchar(100),
  location_state varchar(50),
  location_zip varchar(20),
  location_country varchar(100) DEFAULT 'USA',
  location_coordinates jsonb,
  location_url text,
  virtual_link text,
  virtual_platform varchar(50),
  virtual_instructions text,
  video_platform varchar(50),
  video_url text,
  video_meeting_id varchar(100),
  video_passcode varchar(100),
  registration_required bool DEFAULT false,
  registration_open bool DEFAULT true,
  registration_limit int4,
  registration_deadline timestamptz,
  registration_fee numeric,
  max_guests_per_registration int4 DEFAULT 0,
  is_private bool DEFAULT false,
  is_active bool NOT NULL DEFAULT true,
  target_audience text DEFAULT 'all',
  banner_image_url text,
  thumbnail_image_url text,
  agenda jsonb,
  speakers jsonb,
  sponsors jsonb,
  resources jsonb,
  tags _text,
  metadata jsonb DEFAULT '{}',
  views_count int4 DEFAULT 0,
  email_batch_id uuid,
  email_sent_at timestamptz,
  published_at timestamptz,
  cancellation_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE portal_event_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  max_attendees int4,
  current_attendees int4 DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE portal_event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid,
  event_date_id uuid,
  user_id uuid,
  attendance_status varchar(20) DEFAULT 'registered',
  payment_status varchar(20) DEFAULT 'pending',
  payment_amount numeric,
  payment_date timestamptz,
  check_in_time timestamptz,
  cancellation_date timestamptz,
  cancellation_reason text,
  notes text,
  attended bool DEFAULT false,
  metadata jsonb DEFAULT '{}',
  registered_at timestamptz DEFAULT now(),
  cancelled_at timestamptz,
  checked_in_at timestamptz,
  attended_at timestamptz
);

CREATE TABLE portal_event_guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid,
  first_name varchar(100) NOT NULL,
  last_name varchar(100) NOT NULL,
  email varchar(255),
  checked_in_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE portal_event_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid,
  registration_id uuid,
  reminder_type varchar(50),
  email_sent bool DEFAULT false,
  sms_sent bool DEFAULT false,
  sent_at timestamptz DEFAULT now()
);

CREATE TABLE portal_event_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid,
  name varchar(200) NOT NULL,
  type varchar(50) NOT NULL,
  default_title varchar(200),
  default_description text,
  default_max_guests int4 DEFAULT 0,
  default_location_name varchar(200),
  default_location_address text,
  default_video_platform varchar(50),
  is_active bool DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Surveys System
CREATE TABLE portal_surveys (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by uuid,
  title varchar(255) NOT NULL,
  description text,
  status varchar(50) NOT NULL DEFAULT 'draft',
  target_audience text DEFAULT 'all',
  is_compulsory bool DEFAULT false,
  allow_anonymous bool DEFAULT false,
  max_responses int4,
  question_count int4 DEFAULT 0,
  is_active bool NOT NULL DEFAULT true,
  tags jsonb,
  due_date timestamptz,
  scheduled_publish_at timestamptz,
  scheduled_close_at timestamptz,
  email_batch_id uuid,
  email_sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  published_at timestamptz,
  closed_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE portal_survey_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  display_order int4 NOT NULL DEFAULT 0,
  show_condition jsonb DEFAULT '{}',
  is_required bool DEFAULT false,
  can_skip bool DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE portal_survey_questions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id uuid NOT NULL,
  section_id uuid,
  question_type varchar(50) NOT NULL,
  question_text text NOT NULL,
  options jsonb,
  required bool DEFAULT true,
  position int4 NOT NULL,
  section_order int4 DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE portal_survey_responses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id uuid NOT NULL,
  user_id uuid NOT NULL,
  current_question_position int4 DEFAULT 1,
  answered_questions int4 DEFAULT 0,
  is_complete bool DEFAULT false,
  completed bool DEFAULT false,
  is_test_response bool DEFAULT false,
  status text DEFAULT 'in_progress',
  started_at timestamptz DEFAULT now(),
  last_saved_at timestamptz,
  completed_at timestamptz
);

CREATE TABLE portal_survey_answers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  response_id uuid NOT NULL,
  question_id uuid NOT NULL,
  answer_value jsonb NOT NULL,
  answered_at timestamptz DEFAULT now()
);

-- Updates System
CREATE TABLE portal_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid,
  archived_by uuid,
  is_correction_of uuid,
  title varchar(255) NOT NULL,
  content text NOT NULL,
  update_type varchar(20) NOT NULL DEFAULT 'advisory',
  type varchar(50) DEFAULT 'general',
  status varchar(20) DEFAULT 'draft',
  target_audience varchar(20) DEFAULT 'all',
  priority int4 DEFAULT 0,
  correction_note text,
  view_count int4 DEFAULT 0,
  acknowledgment_count int4 DEFAULT 0,
  dismissal_count int4 DEFAULT 0,
  email_batch_id uuid,
  email_sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  published_at timestamptz,
  archived_at timestamptz
);

CREATE TABLE portal_update_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  update_id uuid NOT NULL,
  user_id uuid NOT NULL,
  view_count int4 DEFAULT 1,
  time_to_acknowledge interval,
  device_info jsonb,
  first_viewed_at timestamptz DEFAULT now(),
  last_viewed_at timestamptz DEFAULT now(),
  acknowledged_at timestamptz,
  dismissed_at timestamptz
);

-- ----------------------------------------------------------------------------
-- PHASE 4: REFERRAL & MARKETING SYSTEM
-- ----------------------------------------------------------------------------

CREATE TABLE portal_referral_conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id uuid NOT NULL,
  referee_profile_id uuid NOT NULL,
  converted_at timestamptz DEFAULT now(),
  onboarding_completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE portal_referral_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  referral_id uuid,
  action_type text NOT NULL,
  action_timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE marketing_campaign_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id uuid NOT NULL,
  campaign_name text NOT NULL,
  campaign_code varchar(50) NOT NULL,
  landing_url text NOT NULL,
  direct_url text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE referral_conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id uuid NOT NULL,
  user_id uuid NOT NULL,
  conversion_metadata jsonb,
  converted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- PHASE 5: EMAIL & NOTIFICATION SYSTEM
-- ----------------------------------------------------------------------------

CREATE TABLE email_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id uuid,
  event_id text,
  created_by uuid,
  to_email text NOT NULL,
  cc_email text,
  bcc_email text,
  subject text NOT NULL,
  template_id text NOT NULL,
  template_data jsonb DEFAULT '{}',
  status text DEFAULT 'pending',
  priority int4 DEFAULT 5,
  error_count int4 DEFAULT 0,
  max_retries int4 DEFAULT 3,
  error_message text,
  email_provider_id text,
  metadata jsonb DEFAULT '{}',
  scheduled_for timestamptz DEFAULT now(),
  sent_at timestamptz,
  failed_at timestamptz,
  retry_after timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid,
  event_type text NOT NULL,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid,
  user_id uuid,
  to_email text NOT NULL,
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  template text,
  template_data jsonb,
  html_content text,
  text_content text,
  error_message text,
  retry_count int4 DEFAULT 0,
  resend_id text,
  provider text DEFAULT 'resend',
  metadata jsonb DEFAULT '{}',
  sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE email_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid,
  created_by uuid,
  event_type text NOT NULL DEFAULT 'unknown',
  event_id text,
  template_id text,
  recipient_list_id text,
  to_email text,
  to_user_id uuid,
  processor_id text,
  event_payload jsonb DEFAULT '{}',
  email_options jsonb DEFAULT '{}',
  error_details jsonb,
  metadata jsonb DEFAULT '{}',
  status text DEFAULT 'queued',
  priority int4 DEFAULT 5,
  attempts int4 DEFAULT 0,
  max_attempts int4 DEFAULT 3,
  retry_strategy text DEFAULT 'exponential',
  last_error text,
  tags _text,
  scheduled_for timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  processed_at timestamptz,
  last_attempt_at timestamptz,
  next_retry_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- PHASE 6: AUDIT, BACKUP & ARCHIVE TABLES
-- ----------------------------------------------------------------------------

CREATE TABLE portal_user_deletion_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deleted_user_id uuid NOT NULL,
  deleted_by uuid NOT NULL,
  deletion_reason text,
  user_data jsonb,
  deleted_at timestamptz DEFAULT now()
);

CREATE TABLE referral_deletion_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id uuid NOT NULL,
  deleted_by uuid NOT NULL,
  deletion_summary jsonb NOT NULL,
  deletion_reason text,
  admin_note text,
  ip_address text,
  user_agent text,
  deleted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE portal_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Backup/Archive tables (no constraints needed)
CREATE TABLE email_logs_backup_042 (
  id uuid, batch_id uuid, to_email text, subject text, status text,
  template text, template_data jsonb, html_content text, text_content text,
  sent_at timestamptz, error_message text, retry_count int4, metadata jsonb,
  created_at timestamptz, updated_at timestamptz
);

CREATE TABLE email_notification_batches_backup_042 (
  id uuid, notification_type text, update_id uuid, survey_id uuid, event_id uuid,
  status text, total_recipients int4, processed_count int4, failed_count int4,
  metadata jsonb, started_at timestamptz, completed_at timestamptz,
  created_at timestamptz, updated_at timestamptz, content_id text,
  content_data jsonb, processed_at timestamptz, error_message text
);

CREATE TABLE email_notification_batches_archive (
  id uuid, update_id uuid, survey_id uuid, event_id uuid, notification_type text,
  total_recipients int4, emails_sent int4, emails_failed int4,
  started_at timestamptz, completed_at timestamptz, status text, error_message text,
  metadata jsonb, created_by uuid, archived_at timestamptz, archive_reason text
);

CREATE TABLE portal_referrals_archive (
  id uuid NOT NULL, referrer_id uuid NOT NULL, referee_first_name text NOT NULL,
  referee_last_name text NOT NULL, referee_email text NOT NULL, referee_phone text,
  referee_company text, referral_code text NOT NULL, invitation_sent_at timestamptz,
  reminder_sent_at timestamptz, expires_at timestamptz, status text NOT NULL,
  metadata jsonb DEFAULT '{}', created_at timestamptz, updated_at timestamptz,
  deleted_at timestamptz DEFAULT now(), deleted_by uuid, deletion_reason text,
  deletion_metadata jsonb DEFAULT '{}', had_contact_record bool DEFAULT false,
  had_email_notifications int4 DEFAULT 0, had_conversion_record bool DEFAULT false
);

-- Part 2 Complete: 28 additional tables created (50 total)
-- Next: Run 02_IMPORT_DATA.sql to copy data from old database

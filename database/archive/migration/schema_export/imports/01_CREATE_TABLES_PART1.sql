/*
================================================================================
PART 1: SETUP, TYPES, AND FOUNDATION TABLES (1-22)
================================================================================
Purpose: Create database extensions, custom types, and foundation tables
Execution time: ~2 minutes
Next: Run 01_CREATE_TABLES_PART2.sql
================================================================================
*/

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_net";

SET timezone = 'UTC';
SET search_path TO public, pg_temp;

-- Custom Types
DO $$ BEGIN CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'deleted'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE contact_title_enum AS ENUM ('owner', 'manager', 'driver', 'dispatcher', 'operations', 'other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE interaction_type_enum AS ENUM ('call', 'email', 'meeting', 'demo', 'follow_up', 'other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- PROFILES (Root table)
CREATE TABLE profiles (
  id uuid NOT NULL PRIMARY KEY,
  first_name text, middle_name text, last_name text, suffix text, preferred_name text,
  email text, phone_number text, phone text, mobile text,
  avatar_url text, avatar_path text,
  company_name text, title text, bio text, website text,
  street1 text, street2 text, city text, state text, zip text,
  organization_id uuid,
  year_dsp_began int4, avg_fleet_vehicles int4, avg_drivers int4,
  average_fleet_size int4, average_drivers int4,
  role text DEFAULT 'user'::text,
  status user_status NOT NULL DEFAULT 'active'::user_status,
  profile_complete bool DEFAULT false,
  terms_accepted bool DEFAULT false,
  terms_accepted_at timestamptz,
  terms_version text,
  email_updates bool DEFAULT true,
  email_surveys bool DEFAULT true,
  email_events bool DEFAULT true,
  preferences_updated_at timestamptz,
  is_portal_user bool DEFAULT false,
  portal_registered_at timestamptz,
  is_system_account bool DEFAULT false,
  last_sign_in_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz DEFAULT timezone('utc'::text, now())
);

-- Independent tables
CREATE TABLE notification_events (id text PRIMARY KEY, name text NOT NULL, description text, category text NOT NULL, payload_schema jsonb, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE recipient_lists (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, code text NOT NULL, description text, type text NOT NULL, config jsonb DEFAULT '{}'::jsonb, is_system bool DEFAULT false, is_active bool DEFAULT true, icon text, color text, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE email_templates (id text PRIMARY KEY, name text NOT NULL, subject text NOT NULL, body_html text NOT NULL, body_text text, variables _text, category text DEFAULT 'general'::text, is_active bool DEFAULT true, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(), created_by uuid, metadata jsonb DEFAULT '{}'::jsonb);
CREATE TABLE regions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code varchar(10) NOT NULL, name varchar(100) NOT NULL, states _text NOT NULL, divisions jsonb DEFAULT '{}'::jsonb, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE markets (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name varchar(255) NOT NULL, description text, region_id uuid, timezone varchar(50) DEFAULT 'America/New_York', states _text DEFAULT '{}', primary_state varchar(2), is_active bool DEFAULT true, created_by uuid, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE stations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), market_id uuid, station_code varchar(50) NOT NULL, city varchar(100), state varchar(2), zip varchar(10), full_address text, is_active bool DEFAULT true, created_by uuid, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE dsps (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), station_id uuid, primary_station_id uuid, dsp_code varchar(50), dsp_name varchar(255) NOT NULL, website varchar(255), notes text, is_active bool DEFAULT true, created_by uuid, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());

-- First-level dependencies
CREATE TABLE membership_agreements (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, agreement_version text NOT NULL DEFAULT '1.0', agreed_text text NOT NULL, typed_name text NOT NULL, expected_name text NOT NULL, ip_address inet, user_agent text, agreed_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE nda_agreements (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, nda_version text NOT NULL DEFAULT '1.0', agreed_text text NOT NULL, typed_name text NOT NULL, expected_name text NOT NULL, ip_address inet, user_agent text, agreed_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE portal_memberships (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, portal_role text NOT NULL, joined_at timestamptz DEFAULT now(), subscription_tier text, is_active bool DEFAULT true, notes text, status text DEFAULT 'active');
CREATE TABLE portal_admin_activity (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), admin_id uuid, action varchar(50) NOT NULL, entity_type varchar(50) NOT NULL, entity_id uuid, entity_title varchar(255), changes jsonb, ip_address inet, user_agent text, created_at timestamptz DEFAULT now());
CREATE TABLE businesses (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, owner_id uuid, company_name text NOT NULL, type varchar(50), website text, description text, services_offered text, primary_markets text, is_amazon_dsp bool DEFAULT false, year_dsp_began int4, year_established int4, avg_fleet_vehicles int4, fleet_size int4, avg_drivers int4, driver_count int4, email text, phone text, mobile text, street1 text, street2 text, city text, state text, zip text, address text, is_primary bool DEFAULT false, display_order int4 DEFAULT 0, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE dsp_locations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), dsp_id uuid NOT NULL, station_id uuid NOT NULL, is_primary bool DEFAULT false, is_active bool DEFAULT true, created_by uuid, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE notification_rules (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), event_id text NOT NULL, recipient_list_id uuid NOT NULL, name text NOT NULL, description text, template_id text NOT NULL, priority int4 DEFAULT 5, enabled bool DEFAULT true, conditions jsonb DEFAULT '{}', metadata jsonb DEFAULT '{}', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE email_notification_batches (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), notification_type text NOT NULL, update_id uuid, survey_id uuid, event_id uuid, content_id text, content_title text, content_data jsonb, status text NOT NULL DEFAULT 'pending', total_recipients int4 DEFAULT 0, processed_count int4 DEFAULT 0, failed_count int4 DEFAULT 0, emails_sent int4 DEFAULT 0, emails_failed int4 DEFAULT 0, error_message text, metadata jsonb DEFAULT '{}', started_at timestamptz DEFAULT now(), processed_at timestamptz, completed_at timestamptz, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE portal_referrals (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), referrer_id uuid NOT NULL, referee_first_name text NOT NULL, referee_last_name text NOT NULL, referee_email text NOT NULL, referee_phone text, dsp_name text, dsp_code text, referral_code text NOT NULL, referral_type varchar(20) DEFAULT 'individual', referral_source varchar(50), status text NOT NULL DEFAULT 'pending', is_reusable bool DEFAULT false, usage_count int4 DEFAULT 0, max_uses int4, invitation_sent_at timestamptz, last_resent_at timestamptz, resend_count int4 DEFAULT 0, registered_at timestamptz, expires_at timestamptz, source_metadata jsonb, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE calculator_submissions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid, previous_submission_id uuid, user_email text, user_name text, company_name text, fleet_size int4, total_monthly_savings numeric NOT NULL DEFAULT 0, total_annual_savings numeric NOT NULL DEFAULT 0, labor_savings_total numeric DEFAULT 0, system_savings_total numeric DEFAULT 0, fixed_savings_total numeric DEFAULT 0, afs_savings_total numeric DEFAULT 0, labor_savings_items jsonb DEFAULT '[]', system_replacement_items jsonb DEFAULT '[]', fixed_savings_items jsonb DEFAULT '[]', afs_savings_items jsonb DEFAULT '[]', notes text, is_latest bool DEFAULT true, submission_date timestamptz DEFAULT now(), created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE contacts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), dsp_id uuid, station_id uuid, market_id uuid, referred_by_contact_id uuid, referral_id uuid, portal_profile_id uuid, first_name varchar(100), last_name varchar(100), email varchar(255), phone varchar(20), title contact_title_enum, referred_by_text varchar(255), tags _text, notes text, contact_status varchar(50) DEFAULT 'new', is_active bool DEFAULT true, is_portal_member bool DEFAULT false, last_contacted_at timestamptz, created_by uuid, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE contact_submissions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid, assigned_to uuid, resolved_by uuid, name varchar(255) NOT NULL, email varchar(255) NOT NULL, phone varchar(50), company varchar(255), subject varchar(500) NOT NULL, category varchar(50) NOT NULL, message text NOT NULL, status varchar(50) NOT NULL DEFAULT 'new', priority varchar(20) DEFAULT 'normal', admin_notes text, resolved_at timestamptz, read_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE contact_dsp_locations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), contact_id uuid NOT NULL, dsp_location_id uuid NOT NULL, is_primary bool DEFAULT false, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE interactions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), contact_id uuid NOT NULL, interaction_type interaction_type_enum NOT NULL, details text NOT NULL, interaction_date timestamptz DEFAULT now(), created_by uuid, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());

-- Part 1 Complete: 22 tables created

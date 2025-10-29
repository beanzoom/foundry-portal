/*
================================================================================
DATA EXPORT SCRIPT - Run in OLD database Supabase SQL Editor
================================================================================
Purpose: Export all portal data as INSERT statements
How to use:
  1. Open OLD database in Supabase SQL Editor
  2. Run each section below ONE AT A TIME
  3. Copy results and save to corresponding numbered files
  4. Then run 03_IMPORT_DATA.sql in NEW database

IMPORTANT: Run each query separately and save results to individual files
================================================================================
*/

-- =============================================================================
-- FILE 1: profiles.sql
-- =============================================================================
SELECT
  'INSERT INTO profiles VALUES (' ||
  quote_literal(id::text) || '::uuid, ' ||
  COALESCE(quote_literal(first_name), 'NULL') || ', ' ||
  COALESCE(quote_literal(last_name), 'NULL') || ', ' ||
  COALESCE(quote_literal(email), 'NULL') || ', ' ||
  COALESCE(quote_literal(phone), 'NULL') || ', ' ||
  COALESCE(quote_literal(company), 'NULL') || ', ' ||
  COALESCE(quote_literal(title), 'NULL') || ', ' ||
  COALESCE(quote_literal(avatar_url), 'NULL') || ', ' ||
  COALESCE(quote_literal(status::text), 'NULL') || '::user_status, ' ||
  COALESCE(is_admin::text, 'false') || ', ' ||
  COALESCE(is_portal_admin::text, 'false') || ', ' ||
  COALESCE(quote_literal(bio), 'NULL') || ', ' ||
  COALESCE(quote_literal(linkedin_url), 'NULL') || ', ' ||
  COALESCE(quote_literal(address), 'NULL') || ', ' ||
  COALESCE(quote_literal(city), 'NULL') || ', ' ||
  COALESCE(quote_literal(state), 'NULL') || ', ' ||
  COALESCE(quote_literal(zip), 'NULL') || ', ' ||
  COALESCE(quote_literal(country), 'NULL') || ', ' ||
  COALESCE(quote_literal(timezone), 'NULL') || ', ' ||
  COALESCE(quote_literal(metadata::text), 'NULL') || '::jsonb, ' ||
  COALESCE(quote_literal(created_at::text), 'NULL') || '::timestamptz, ' ||
  COALESCE(quote_literal(updated_at::text), 'NULL') || '::timestamptz, ' ||
  COALESCE(quote_literal(last_login::text), 'NULL') || '::timestamptz, ' ||
  COALESCE(quote_literal(email_verified_at::text), 'NULL') || '::timestamptz, ' ||
  COALESCE(quote_literal(deleted_at::text), 'NULL') || '::timestamptz);'
FROM profiles
WHERE deleted_at IS NULL
ORDER BY created_at;

-- =============================================================================
-- FILE 2: portal_memberships.sql
-- =============================================================================
SELECT
  'INSERT INTO portal_memberships VALUES (' ||
  quote_literal(id::text) || '::uuid, ' ||
  quote_literal(user_id::text) || '::uuid, ' ||
  COALESCE(quote_literal(membership_type), 'NULL') || ', ' ||
  COALESCE(quote_literal(status), 'NULL') || ', ' ||
  COALESCE(quote_literal(tier), 'NULL') || ', ' ||
  COALESCE(quote_literal(start_date::text), 'NULL') || '::date, ' ||
  COALESCE(quote_literal(end_date::text), 'NULL') || '::date, ' ||
  COALESCE(quote_literal(renewal_date::text), 'NULL') || '::date, ' ||
  COALESCE(auto_renew::text, 'false') || ', ' ||
  COALESCE(quote_literal(payment_status), 'NULL') || ', ' ||
  COALESCE(quote_literal(amount_paid), 'NULL') || ', ' ||
  COALESCE(quote_literal(metadata::text), 'NULL') || '::jsonb, ' ||
  COALESCE(quote_literal(created_at::text), 'NULL') || '::timestamptz, ' ||
  COALESCE(quote_literal(updated_at::text), 'NULL') || '::timestamptz);'
FROM portal_memberships
ORDER BY created_at;

-- =============================================================================
-- FILE 3: membership_agreements.sql
-- =============================================================================
SELECT
  'INSERT INTO membership_agreements VALUES (' ||
  quote_literal(id::text) || '::uuid, ' ||
  quote_literal(user_id::text) || '::uuid, ' ||
  COALESCE(quote_literal(agreement_type), 'NULL') || ', ' ||
  COALESCE(quote_literal(version), 'NULL') || ', ' ||
  COALESCE(ip_address::text, 'NULL') || ', ' ||
  COALESCE(accepted::text, 'false') || ', ' ||
  COALESCE(quote_literal(accepted_at::text), 'NULL') || '::timestamptz, ' ||
  COALESCE(quote_literal(created_at::text), 'NULL') || '::timestamptz);'
FROM membership_agreements
ORDER BY created_at;

-- =============================================================================
-- FILE 4: nda_agreements.sql
-- =============================================================================
SELECT
  'INSERT INTO nda_agreements VALUES (' ||
  quote_literal(id::text) || '::uuid, ' ||
  quote_literal(user_id::text) || '::uuid, ' ||
  COALESCE(quote_literal(version), 'NULL') || ', ' ||
  COALESCE(ip_address::text, 'NULL') || ', ' ||
  COALESCE(quote_literal(signed_at::text), 'NULL') || '::timestamptz, ' ||
  COALESCE(quote_literal(created_at::text), 'NULL') || '::timestamptz);'
FROM nda_agreements
ORDER BY created_at;

-- =============================================================================
-- FILE 5: notification_events.sql (independent table)
-- =============================================================================
SELECT
  'INSERT INTO notification_events VALUES (' ||
  quote_literal(id) || ', ' ||
  quote_literal(event_name) || ', ' ||
  COALESCE(quote_literal(description), 'NULL') || ', ' ||
  COALESCE(quote_literal(category), 'NULL') || ', ' ||
  COALESCE(is_active::text, 'true') || ', ' ||
  COALESCE(quote_literal(metadata::text), 'NULL') || '::jsonb, ' ||
  COALESCE(quote_literal(created_at::text), 'NULL') || '::timestamptz, ' ||
  COALESCE(quote_literal(updated_at::text), 'NULL') || '::timestamptz);'
FROM notification_events
ORDER BY created_at;

-- =============================================================================
-- FILE 6: recipient_lists.sql
-- =============================================================================
SELECT
  'INSERT INTO recipient_lists VALUES (' ||
  quote_literal(id) || ', ' ||
  quote_literal(name) || ', ' ||
  COALESCE(quote_literal(description), 'NULL') || ', ' ||
  COALESCE(quote_literal(list_type), 'NULL') || ', ' ||
  COALESCE(quote_literal(criteria::text), 'NULL') || '::jsonb, ' ||
  COALESCE(is_active::text, 'true') || ', ' ||
  COALESCE(quote_literal(created_by::text), 'NULL') || '::uuid, ' ||
  COALESCE(quote_literal(created_at::text), 'NULL') || '::timestamptz, ' ||
  COALESCE(quote_literal(updated_at::text), 'NULL') || '::timestamptz);'
FROM recipient_lists
ORDER BY created_at;

-- =============================================================================
-- FILE 7: email_templates.sql
-- =============================================================================
SELECT
  'INSERT INTO email_templates VALUES (' ||
  quote_literal(id) || ', ' ||
  quote_literal(name) || ', ' ||
  COALESCE(quote_literal(description), 'NULL') || ', ' ||
  quote_literal(subject) || ', ' ||
  quote_literal(body_html) || ', ' ||
  COALESCE(quote_literal(body_text), 'NULL') || ', ' ||
  COALESCE(quote_literal(template_type), 'NULL') || ', ' ||
  COALESCE(quote_literal(variables::text), 'NULL') || '::jsonb, ' ||
  COALESCE(is_active::text, 'true') || ', ' ||
  COALESCE(quote_literal(created_by::text), 'NULL') || '::uuid, ' ||
  COALESCE(quote_literal(created_at::text), 'NULL') || '::timestamptz, ' ||
  COALESCE(quote_literal(updated_at::text), 'NULL') || '::timestamptz);'
FROM email_templates
ORDER BY created_at;

-- =============================================================================
-- FILE 8: notification_rules.sql
-- =============================================================================
SELECT
  'INSERT INTO notification_rules VALUES (' ||
  quote_literal(id::text) || '::uuid, ' ||
  quote_literal(event_id) || ', ' ||
  quote_literal(template_id) || ', ' ||
  COALESCE(quote_literal(recipient_list_id), 'NULL') || ', ' ||
  COALESCE(quote_literal(name), 'NULL') || ', ' ||
  COALESCE(quote_literal(description), 'NULL') || ', ' ||
  COALESCE(is_active::text, 'true') || ', ' ||
  COALESCE(quote_literal(conditions::text), 'NULL') || '::jsonb, ' ||
  COALESCE(send_delay_minutes::text, '0') || ', ' ||
  COALESCE(quote_literal(created_by::text), 'NULL') || '::uuid, ' ||
  COALESCE(quote_literal(created_at::text), 'NULL') || '::timestamptz, ' ||
  COALESCE(quote_literal(updated_at::text), 'NULL') || '::timestamptz);'
FROM notification_rules
ORDER BY created_at;

-- =============================================================================
-- FILE 9: regions.sql
-- =============================================================================
SELECT
  'INSERT INTO regions VALUES (' ||
  quote_literal(id::text) || '::uuid, ' ||
  quote_literal(name) || ', ' ||
  COALESCE(quote_literal(code), 'NULL') || ', ' ||
  COALESCE(is_active::text, 'true') || ', ' ||
  COALESCE(quote_literal(created_at::text), 'NULL') || '::timestamptz, ' ||
  COALESCE(quote_literal(updated_at::text), 'NULL') || '::timestamptz);'
FROM regions
ORDER BY name;

-- =============================================================================
-- FILE 10: markets.sql
-- =============================================================================
SELECT
  'INSERT INTO markets VALUES (' ||
  quote_literal(id::text) || '::uuid, ' ||
  COALESCE(quote_literal(region_id::text), 'NULL') || '::uuid, ' ||
  quote_literal(name) || ', ' ||
  COALESCE(quote_literal(code), 'NULL') || ', ' ||
  COALESCE(is_active::text, 'true') || ', ' ||
  COALESCE(quote_literal(created_at::text), 'NULL') || '::timestamptz, ' ||
  COALESCE(quote_literal(updated_at::text), 'NULL') || '::timestamptz);'
FROM markets
ORDER BY name;

-- =============================================================================
-- CONTINUE IN NEXT FILE (02_EXPORT_DATA_PART2.sql)
-- This is getting long - will split into multiple export scripts
-- =============================================================================

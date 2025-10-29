#!/bin/bash
#
# Portal Data Migration Script
# Run this to migrate data from OLD FleetDRMS to NEW Foundry Portal database
#

set -e  # Exit on any error

# Connection strings
export OLD_DB="postgresql://postgres:QsmmiGZ6SzsdJ5os@db.kssbljbxapejckgassgf.supabase.co:5432/postgres"
export NEW_DB="postgresql://postgres:sklhzv1baIYYIqr1@db.shthtiwcbdnhvxikxiex.supabase.co:5432/postgres"

echo "=========================================="
echo "Portal Data Migration"
echo "=========================================="
echo ""

# Test connections
echo "Step 1: Testing database connections..."
echo ""

echo "Testing OLD database (FleetDRMS)..."
psql "$OLD_DB" -c "SELECT COUNT(*) as portal_users FROM profiles WHERE role IN ('portal_member', 'admin', 'super_admin', 'investor');" || {
    echo "❌ Failed to connect to OLD database"
    exit 1
}
echo "✅ Connected to OLD database"
echo ""

echo "Testing NEW database (Foundry Portal)..."
psql "$NEW_DB" -c "SELECT COUNT(*) as current_profiles FROM profiles;" || {
    echo "❌ Failed to connect to NEW database"
    exit 1
}
echo "✅ Connected to NEW database"
echo ""

echo "=========================================="
echo "Step 2: Exporting data from OLD database"
echo "=========================================="
echo ""

# Export Priority 1 - MUST MIGRATE
echo "Exporting Priority 1 (MUST MIGRATE)..."
psql "$OLD_DB" -c "\COPY (SELECT * FROM profiles WHERE role IN ('portal_member', 'admin', 'super_admin', 'investor')) TO '/tmp/portal_profiles.csv' WITH CSV HEADER;"
echo "✅ profiles exported"

psql "$OLD_DB" -c "\COPY portal_memberships TO '/tmp/portal_memberships.csv' WITH CSV HEADER;"
echo "✅ portal_memberships exported"

psql "$OLD_DB" -c "\COPY membership_agreements TO '/tmp/membership_agreements.csv' WITH CSV HEADER;"
echo "✅ membership_agreements exported"

psql "$OLD_DB" -c "\COPY nda_agreements TO '/tmp/nda_agreements.csv' WITH CSV HEADER;"
echo "✅ nda_agreements exported"

# Export Priority 2 - HIGH
echo ""
echo "Exporting Priority 2 (HIGH PRIORITY)..."
psql "$OLD_DB" -c "\COPY portal_updates TO '/tmp/portal_updates.csv' WITH CSV HEADER;"
echo "✅ portal_updates exported"

psql "$OLD_DB" -c "\COPY portal_update_reads TO '/tmp/portal_update_reads.csv' WITH CSV HEADER;"
echo "✅ portal_update_reads exported"

psql "$OLD_DB" -c "\COPY portal_surveys TO '/tmp/portal_surveys.csv' WITH CSV HEADER;"
echo "✅ portal_surveys exported"

psql "$OLD_DB" -c "\COPY portal_survey_sections TO '/tmp/portal_survey_sections.csv' WITH CSV HEADER;"
echo "✅ portal_survey_sections exported"

psql "$OLD_DB" -c "\COPY portal_survey_questions TO '/tmp/portal_survey_questions.csv' WITH CSV HEADER;"
echo "✅ portal_survey_questions exported"

psql "$OLD_DB" -c "\COPY portal_survey_responses TO '/tmp/portal_survey_responses.csv' WITH CSV HEADER;"
echo "✅ portal_survey_responses exported"

psql "$OLD_DB" -c "\COPY portal_survey_answers TO '/tmp/portal_survey_answers.csv' WITH CSV HEADER;"
echo "✅ portal_survey_answers exported"

psql "$OLD_DB" -c "\COPY portal_events TO '/tmp/portal_events.csv' WITH CSV HEADER;"
echo "✅ portal_events exported"

psql "$OLD_DB" -c "\COPY portal_event_templates TO '/tmp/portal_event_templates.csv' WITH CSV HEADER;"
echo "✅ portal_event_templates exported"

psql "$OLD_DB" -c "\COPY portal_event_dates TO '/tmp/portal_event_dates.csv' WITH CSV HEADER;"
echo "✅ portal_event_dates exported"

psql "$OLD_DB" -c "\COPY portal_event_registrations TO '/tmp/portal_event_registrations.csv' WITH CSV HEADER;"
echo "✅ portal_event_registrations exported"

psql "$OLD_DB" -c "\COPY portal_event_guests TO '/tmp/portal_event_guests.csv' WITH CSV HEADER;"
echo "✅ portal_event_guests exported"

psql "$OLD_DB" -c "\COPY portal_event_reminders TO '/tmp/portal_event_reminders.csv' WITH CSV HEADER;"
echo "✅ portal_event_reminders exported"

psql "$OLD_DB" -c "\COPY portal_referrals TO '/tmp/portal_referrals.csv' WITH CSV HEADER;"
echo "✅ portal_referrals exported"

psql "$OLD_DB" -c "\COPY portal_referral_conversions TO '/tmp/portal_referral_conversions.csv' WITH CSV HEADER;"
echo "✅ portal_referral_conversions exported"

psql "$OLD_DB" -c "\COPY portal_referral_rate_limits TO '/tmp/portal_referral_rate_limits.csv' WITH CSV HEADER;"
echo "✅ portal_referral_rate_limits exported"

# Export Priority 3 - MEDIUM
echo ""
echo "Exporting Priority 3 (MEDIUM PRIORITY)..."
psql "$OLD_DB" -c "\COPY email_templates TO '/tmp/email_templates.csv' WITH CSV HEADER;"
echo "✅ email_templates exported"

psql "$OLD_DB" -c "\COPY recipient_lists TO '/tmp/recipient_lists.csv' WITH CSV HEADER;"
echo "✅ recipient_lists exported"

psql "$OLD_DB" -c "\COPY notification_rules TO '/tmp/notification_rules.csv' WITH CSV HEADER;"
echo "✅ notification_rules exported"

psql "$OLD_DB" -c "\COPY notification_events TO '/tmp/notification_events.csv' WITH CSV HEADER;"
echo "✅ notification_events exported"

psql "$OLD_DB" -c "\COPY businesses TO '/tmp/businesses.csv' WITH CSV HEADER;"
echo "✅ businesses exported"

psql "$OLD_DB" -c "\COPY calculator_submissions TO '/tmp/calculator_submissions.csv' WITH CSV HEADER;"
echo "✅ calculator_submissions exported"

psql "$OLD_DB" -c "\COPY contacts TO '/tmp/contacts.csv' WITH CSV HEADER;"
echo "✅ contacts exported"

psql "$OLD_DB" -c "\COPY contact_submissions TO '/tmp/contact_submissions.csv' WITH CSV HEADER;"
echo "✅ contact_submissions exported"

psql "$OLD_DB" -c "\COPY contact_dsp_locations TO '/tmp/contact_dsp_locations.csv' WITH CSV HEADER;"
echo "✅ contact_dsp_locations exported"

psql "$OLD_DB" -c "\COPY interactions TO '/tmp/interactions.csv' WITH CSV HEADER;"
echo "✅ interactions exported"

psql "$OLD_DB" -c "\COPY markets TO '/tmp/markets.csv' WITH CSV HEADER;"
echo "✅ markets exported"

psql "$OLD_DB" -c "\COPY regions TO '/tmp/regions.csv' WITH CSV HEADER;"
echo "✅ regions exported"

psql "$OLD_DB" -c "\COPY stations TO '/tmp/stations.csv' WITH CSV HEADER;"
echo "✅ stations exported"

psql "$OLD_DB" -c "\COPY dsps TO '/tmp/dsps.csv' WITH CSV HEADER;"
echo "✅ dsps exported"

psql "$OLD_DB" -c "\COPY dsp_locations TO '/tmp/dsp_locations.csv' WITH CSV HEADER;"
echo "✅ dsp_locations exported"

psql "$OLD_DB" -c "\COPY marketing_campaign_links TO '/tmp/marketing_campaign_links.csv' WITH CSV HEADER;"
echo "✅ marketing_campaign_links exported"

psql "$OLD_DB" -c "\COPY referral_conversions TO '/tmp/referral_conversions.csv' WITH CSV HEADER;"
echo "✅ referral_conversions exported"

# Export Priority 4 - LOW (last 1000 rows only)
echo ""
echo "Exporting Priority 4 (LOW PRIORITY - last 1000 rows)..."
psql "$OLD_DB" -c "\COPY (SELECT * FROM portal_admin_activity ORDER BY created_at DESC LIMIT 1000) TO '/tmp/portal_admin_activity.csv' WITH CSV HEADER;"
echo "✅ portal_admin_activity exported"

psql "$OLD_DB" -c "\COPY (SELECT * FROM portal_audit_log ORDER BY created_at DESC LIMIT 1000) TO '/tmp/portal_audit_log.csv' WITH CSV HEADER;"
echo "✅ portal_audit_log exported"

echo ""
echo "=========================================="
echo "Step 3: Verifying exports"
echo "=========================================="
echo ""

echo "Checking exported files..."
ls -lh /tmp/*.csv | grep -E "portal_|profiles|memberships|nda_|businesses|calculator|contacts|email|notification|markets|regions|stations|dsps|interactions|referral"
echo ""

echo "Row counts in exported files:"
echo "profiles: $(wc -l < /tmp/portal_profiles.csv) rows (should be ~10: 9 users + 1 header)"
echo "portal_updates: $(wc -l < /tmp/portal_updates.csv) rows"
echo "portal_surveys: $(wc -l < /tmp/portal_surveys.csv) rows"
echo "portal_events: $(wc -l < /tmp/portal_events.csv) rows"
echo "portal_referrals: $(wc -l < /tmp/portal_referrals.csv) rows"
echo ""

read -p "Do the row counts look correct? Press Enter to continue or Ctrl+C to cancel..."

echo ""
echo "=========================================="
echo "Step 4: Importing to NEW database"
echo "=========================================="
echo ""

# Import in dependency order
echo "Importing Priority 1 (profiles first - everything depends on this)..."
psql "$NEW_DB" -c "\COPY profiles FROM '/tmp/portal_profiles.csv' WITH CSV HEADER;"
echo "✅ profiles imported"

psql "$NEW_DB" -c "\COPY portal_memberships FROM '/tmp/portal_memberships.csv' WITH CSV HEADER;"
echo "✅ portal_memberships imported"

psql "$NEW_DB" -c "\COPY membership_agreements FROM '/tmp/membership_agreements.csv' WITH CSV HEADER;"
echo "✅ membership_agreements imported"

psql "$NEW_DB" -c "\COPY nda_agreements FROM '/tmp/nda_agreements.csv' WITH CSV HEADER;"
echo "✅ nda_agreements imported"

echo ""
echo "Importing reference data (markets, dsps, etc)..."
psql "$NEW_DB" -c "\COPY regions FROM '/tmp/regions.csv' WITH CSV HEADER;"
echo "✅ regions imported"

psql "$NEW_DB" -c "\COPY markets FROM '/tmp/markets.csv' WITH CSV HEADER;"
echo "✅ markets imported"

psql "$NEW_DB" -c "\COPY stations FROM '/tmp/stations.csv' WITH CSV HEADER;"
echo "✅ stations imported"

psql "$NEW_DB" -c "\COPY dsps FROM '/tmp/dsps.csv' WITH CSV HEADER;"
echo "✅ dsps imported"

psql "$NEW_DB" -c "\COPY dsp_locations FROM '/tmp/dsp_locations.csv' WITH CSV HEADER;"
echo "✅ dsp_locations imported"

echo ""
echo "Importing Priority 2 (portal content)..."
psql "$NEW_DB" -c "\COPY email_templates FROM '/tmp/email_templates.csv' WITH CSV HEADER;"
echo "✅ email_templates imported"

psql "$NEW_DB" -c "\COPY recipient_lists FROM '/tmp/recipient_lists.csv' WITH CSV HEADER;"
echo "✅ recipient_lists imported"

psql "$NEW_DB" -c "\COPY notification_rules FROM '/tmp/notification_rules.csv' WITH CSV HEADER;"
echo "✅ notification_rules imported"

psql "$NEW_DB" -c "\COPY notification_events FROM '/tmp/notification_events.csv' WITH CSV HEADER;"
echo "✅ notification_events imported"

psql "$NEW_DB" -c "\COPY portal_updates FROM '/tmp/portal_updates.csv' WITH CSV HEADER;"
echo "✅ portal_updates imported"

psql "$NEW_DB" -c "\COPY portal_update_reads FROM '/tmp/portal_update_reads.csv' WITH CSV HEADER;"
echo "✅ portal_update_reads imported"

psql "$NEW_DB" -c "\COPY portal_surveys FROM '/tmp/portal_surveys.csv' WITH CSV HEADER;"
echo "✅ portal_surveys imported"

psql "$NEW_DB" -c "\COPY portal_survey_sections FROM '/tmp/portal_survey_sections.csv' WITH CSV HEADER;"
echo "✅ portal_survey_sections imported"

psql "$NEW_DB" -c "\COPY portal_survey_questions FROM '/tmp/portal_survey_questions.csv' WITH CSV HEADER;"
echo "✅ portal_survey_questions imported"

psql "$NEW_DB" -c "\COPY portal_survey_responses FROM '/tmp/portal_survey_responses.csv' WITH CSV HEADER;"
echo "✅ portal_survey_responses imported"

psql "$NEW_DB" -c "\COPY portal_survey_answers FROM '/tmp/portal_survey_answers.csv' WITH CSV HEADER;"
echo "✅ portal_survey_answers imported"

psql "$NEW_DB" -c "\COPY portal_event_templates FROM '/tmp/portal_event_templates.csv' WITH CSV HEADER;"
echo "✅ portal_event_templates imported"

psql "$NEW_DB" -c "\COPY portal_events FROM '/tmp/portal_events.csv' WITH CSV HEADER;"
echo "✅ portal_events imported"

psql "$NEW_DB" -c "\COPY portal_event_dates FROM '/tmp/portal_event_dates.csv' WITH CSV HEADER;"
echo "✅ portal_event_dates imported"

psql "$NEW_DB" -c "\COPY portal_event_registrations FROM '/tmp/portal_event_registrations.csv' WITH CSV HEADER;"
echo "✅ portal_event_registrations imported"

psql "$NEW_DB" -c "\COPY portal_event_guests FROM '/tmp/portal_event_guests.csv' WITH CSV HEADER;"
echo "✅ portal_event_guests imported"

psql "$NEW_DB" -c "\COPY portal_event_reminders FROM '/tmp/portal_event_reminders.csv' WITH CSV HEADER;"
echo "✅ portal_event_reminders imported"

psql "$NEW_DB" -c "\COPY portal_referrals FROM '/tmp/portal_referrals.csv' WITH CSV HEADER;"
echo "✅ portal_referrals imported"

psql "$NEW_DB" -c "\COPY portal_referral_conversions FROM '/tmp/portal_referral_conversions.csv' WITH CSV HEADER;"
echo "✅ portal_referral_conversions imported"

psql "$NEW_DB" -c "\COPY portal_referral_rate_limits FROM '/tmp/portal_referral_rate_limits.csv' WITH CSV HEADER;"
echo "✅ portal_referral_rate_limits imported"

echo ""
echo "Importing Priority 3 (user data)..."
psql "$NEW_DB" -c "\COPY businesses FROM '/tmp/businesses.csv' WITH CSV HEADER;"
echo "✅ businesses imported"

psql "$NEW_DB" -c "\COPY calculator_submissions FROM '/tmp/calculator_submissions.csv' WITH CSV HEADER;"
echo "✅ calculator_submissions imported"

psql "$NEW_DB" -c "\COPY contacts FROM '/tmp/contacts.csv' WITH CSV HEADER;"
echo "✅ contacts imported"

psql "$NEW_DB" -c "\COPY contact_dsp_locations FROM '/tmp/contact_dsp_locations.csv' WITH CSV HEADER;"
echo "✅ contact_dsp_locations imported"

psql "$NEW_DB" -c "\COPY contact_submissions FROM '/tmp/contact_submissions.csv' WITH CSV HEADER;"
echo "✅ contact_submissions imported"

psql "$NEW_DB" -c "\COPY interactions FROM '/tmp/interactions.csv' WITH CSV HEADER;"
echo "✅ interactions imported"

psql "$NEW_DB" -c "\COPY marketing_campaign_links FROM '/tmp/marketing_campaign_links.csv' WITH CSV HEADER;"
echo "✅ marketing_campaign_links imported"

psql "$NEW_DB" -c "\COPY referral_conversions FROM '/tmp/referral_conversions.csv' WITH CSV HEADER;"
echo "✅ referral_conversions imported"

echo ""
echo "Importing Priority 4 (audit logs)..."
psql "$NEW_DB" -c "\COPY portal_admin_activity FROM '/tmp/portal_admin_activity.csv' WITH CSV HEADER;"
echo "✅ portal_admin_activity imported"

psql "$NEW_DB" -c "\COPY portal_audit_log FROM '/tmp/portal_audit_log.csv' WITH CSV HEADER;"
echo "✅ portal_audit_log imported"

echo ""
echo "=========================================="
echo "Step 5: Verification"
echo "=========================================="
echo ""

echo "Checking row counts in NEW database..."
psql "$NEW_DB" << 'EOF'
SELECT
  'profiles' as table_name,
  COUNT(*) as row_count,
  9 as expected,
  CASE WHEN COUNT(*) = 9 THEN '✅' ELSE '❌' END as status
FROM profiles
UNION ALL
SELECT 'portal_updates', COUNT(*), 2, CASE WHEN COUNT(*) >= 1 THEN '✅' ELSE '❌' END FROM portal_updates
UNION ALL
SELECT 'portal_surveys', COUNT(*), 1, CASE WHEN COUNT(*) >= 1 THEN '✅' ELSE '❌' END FROM portal_surveys
UNION ALL
SELECT 'portal_events', COUNT(*), 1, CASE WHEN COUNT(*) >= 1 THEN '✅' ELSE '❌' END FROM portal_events
UNION ALL
SELECT 'portal_referrals', COUNT(*), 9, CASE WHEN COUNT(*) >= 1 THEN '✅' ELSE '❌' END FROM portal_referrals
UNION ALL
SELECT 'businesses', COUNT(*), 9, CASE WHEN COUNT(*) >= 1 THEN '✅' ELSE '❌' END FROM businesses
ORDER BY table_name;
EOF

echo ""
echo "Checking for orphaned records (should all be 0)..."
psql "$NEW_DB" << 'EOF'
SELECT 'Orphaned businesses' as issue, COUNT(*) as count
FROM businesses b
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = b.user_id)
UNION ALL
SELECT 'Orphaned referrals', COUNT(*)
FROM portal_referrals pr
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = pr.referrer_id)
UNION ALL
SELECT 'Orphaned memberships', COUNT(*)
FROM portal_memberships pm
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = pm.user_id)
UNION ALL
SELECT 'Orphaned survey responses', COUNT(*)
FROM portal_survey_responses psr
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = psr.user_id);
EOF

echo ""
echo "=========================================="
echo "✅ MIGRATION COMPLETE!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Test login with a portal user account"
echo "2. Verify portal content loads (updates, surveys, events)"
echo "3. Check admin panel functionality"
echo "4. Review Supabase logs for any errors"
echo "5. Proceed to Step 8: Verify Migration"
echo ""
echo "Temporary CSV files are in /tmp/ - you can delete them if everything looks good:"
echo "  rm /tmp/portal_*.csv /tmp/profiles.csv /tmp/businesses.csv /tmp/calculator*.csv /tmp/contacts*.csv /tmp/email*.csv /tmp/notification*.csv /tmp/markets.csv /tmp/regions.csv /tmp/stations.csv /tmp/dsps*.csv /tmp/interactions.csv /tmp/membership*.csv /tmp/nda*.csv /tmp/marketing*.csv /tmp/referral*.csv /tmp/recipient*.csv"
echo ""

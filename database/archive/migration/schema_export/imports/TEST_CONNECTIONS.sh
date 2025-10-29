#!/bin/bash
#
# Test Database Connections
# Run this first to verify psql can connect to both databases
#

# Connection strings
export OLD_DB="postgresql://postgres:mY8MaPTmsIKwAZND@db.kssbljbxapejckgassgf.supabase.co:5432/postgres"
export NEW_DB="postgresql://postgres:sklhzv1baIYYIqr1@db.shthtiwcbdnhvxikxiex.supabase.co:5432/postgres"

echo "=========================================="
echo "Testing Database Connections"
echo "=========================================="
echo ""

echo "1. Testing OLD database (FleetDRMS)..."
echo "   Host: db.kssbljbxapejckgassgf.supabase.co"
echo ""
psql "$OLD_DB" -c "SELECT
  COUNT(*) as total_profiles,
  COUNT(*) FILTER (WHERE role IN ('portal_member', 'admin', 'super_admin', 'investor')) as portal_users,
  COUNT(*) FILTER (WHERE role = 'user') as app_users
FROM profiles;" && echo "✅ OLD database connected successfully!" || echo "❌ Failed to connect to OLD database"

echo ""
echo "2. Testing NEW database (Foundry Portal)..."
echo "   Host: db.shthtiwcbdnhvxikxiex.supabase.co"
echo ""
psql "$NEW_DB" -c "SELECT
  COUNT(*) as profiles,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as tables,
  (SELECT COUNT(*) FROM pg_proc WHERE pronamespace = 'public'::regnamespace) as functions
FROM profiles;" && echo "✅ NEW database connected successfully!" || echo "❌ Failed to connect to NEW database"

echo ""
echo "=========================================="
echo "Connection Test Complete"
echo "=========================================="
echo ""
echo "If both connections succeeded, you're ready to run:"
echo "  ./RUN_MIGRATION.sh"
echo ""

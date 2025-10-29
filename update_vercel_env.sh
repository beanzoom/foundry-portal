#!/bin/bash
#
# Update Vercel Environment Variables to NEW Database
# Run this to update production environment variables
#

echo "=========================================="
echo "Updating Vercel Environment Variables"
echo "=========================================="
echo ""
echo "This will update your Vercel production environment to use the NEW database."
echo ""
echo "NEW Database:"
echo "  Project ID: shthtiwcbdnhvxikxiex"
echo "  URL: https://shthtiwcbdnhvxikxiex.supabase.co"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo ""
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

echo ""
echo "Step 1: Login to Vercel..."
vercel login

echo ""
echo "Step 2: Link to project (if not already linked)..."
vercel link

echo ""
echo "Step 3: Updating environment variables..."
echo ""

# Remove old variables first (optional - will prompt for confirmation)
echo "Removing old VITE_SUPABASE_PROJECT_ID..."
vercel env rm VITE_SUPABASE_PROJECT_ID production -y 2>/dev/null || echo "Variable didn't exist, skipping..."

echo "Adding new VITE_SUPABASE_PROJECT_ID..."
echo "shthtiwcbdnhvxikxiex" | vercel env add VITE_SUPABASE_PROJECT_ID production

echo ""
echo "Removing old VITE_SUPABASE_URL..."
vercel env rm VITE_SUPABASE_URL production -y 2>/dev/null || echo "Variable didn't exist, skipping..."

echo "Adding new VITE_SUPABASE_URL..."
echo "https://shthtiwcbdnhvxikxiex.supabase.co" | vercel env add VITE_SUPABASE_URL production

echo ""
echo "Removing old VITE_SUPABASE_PUBLISHABLE_KEY..."
vercel env rm VITE_SUPABASE_PUBLISHABLE_KEY production -y 2>/dev/null || echo "Variable didn't exist, skipping..."

echo "Adding new VITE_SUPABASE_PUBLISHABLE_KEY..."
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNodGh0aXdjYmRuaHZ4aWt4aWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NjM2ODQsImV4cCI6MjA3NzIzOTY4NH0.ICbmEjGYHr6fXqK024hC4rGO-Se3axdBuoC2UArqr20" | vercel env add VITE_SUPABASE_PUBLISHABLE_KEY production

echo ""
echo "Removing old SUPABASE_SERVICE_ROLE_KEY..."
vercel env rm SUPABASE_SERVICE_ROLE_KEY production -y 2>/dev/null || echo "Variable didn't exist, skipping..."

echo "Adding new SUPABASE_SERVICE_ROLE_KEY..."
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNodGh0aXdjYmRuaHZ4aWt4aWV4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY2MzY4NCwiZXhwIjoyMDc3MjM5Njg0fQ.7b0k9jLdEltjWLU-awtbdApQzmonMoJhaixoZh84wn4" | vercel env add SUPABASE_SERVICE_ROLE_KEY production

echo ""
echo "=========================================="
echo "✅ Environment Variables Updated!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Redeploy to production: vercel --prod"
echo "2. Or trigger redeploy in Vercel dashboard"
echo ""

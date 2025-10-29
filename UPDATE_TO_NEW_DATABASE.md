# Update Portal to Use NEW Database

**Current status:** Portal is pointing to OLD database (FleetDRMS shared)
**Target:** Point portal to NEW database (Foundry Portal standalone)

---

## Step 1: Get NEW Database Credentials

Go to NEW Supabase project: https://supabase.com/dashboard/project/shthtiwcbdnhvxikxiex

1. Click **Settings** → **API**
2. Copy these values:

**Project URL:**
```
https://shthtiwcbdnhvxikxiex.supabase.co
```

**anon/public key** (under "Project API keys"):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNodGh0aXdjYmRuaHZ4aWt4aWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1NTQzNzcsImV4cCI6MjA2MjEzMDM3N30... [COPY FULL KEY]
```

**service_role key** (under "Project API keys"):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNodGh0aXdjYmRuaHZ4aWt4aWV4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjU1NDM3NywiZXhwIjoyMDYyMTMwMzc3fQ... [COPY FULL KEY]
```

---

## Step 2: Update Local .env File

Edit `/home/joeylutes/projects/foundry-portal/.env`:

### OLD values (FleetDRMS shared database):
```bash
VITE_SUPABASE_PROJECT_ID="kssbljbxapejckgassgf"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtzc2JsamJ4YXBlamNrZ2Fzc2dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk4OTIwOTYsImV4cCI6MjA1NTQ2ODA5Nn0.GaMolqo-Anbj8BO51Aw7hXfJU1aeeCOhTeIffBk83GM"
VITE_SUPABASE_URL="https://kssbljbxapejckgassgf.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtzc2JsamJ4YXBlamNrZ2Fzc2dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTg5MjA5NiwiZXhwIjoyMDU1NDY4MDk2fQ.Utzx7q7nuJXInQta7NeZLYin8qs2XoLW_66w3fOXsvI"
```

### NEW values (Foundry Portal standalone database):
```bash
VITE_SUPABASE_PROJECT_ID="shthtiwcbdnhvxikxiex"
VITE_SUPABASE_PUBLISHABLE_KEY="[PASTE anon/public KEY FROM STEP 1]"
VITE_SUPABASE_URL="https://shthtiwcbdnhvxikxiex.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="[PASTE service_role KEY FROM STEP 1]"
```

**Also update the comment:**
```bash
# Foundry Portal - Environment Configuration
# Connected to NEW standalone Supabase database (Foundry Portal)
```

---

## Step 3: Update Vercel Environment Variables

### Option A: Using Vercel Dashboard (Easiest)

1. Go to https://vercel.com/dashboard
2. Select your project: **foundry-portal**
3. Click **Settings** → **Environment Variables**
4. Update these variables for **Production** environment:

| Variable Name | New Value |
|---------------|-----------|
| `VITE_SUPABASE_PROJECT_ID` | `shthtiwcbdnhvxikxiex` |
| `VITE_SUPABASE_URL` | `https://shthtiwcbdnhvxikxiex.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | [Paste anon/public key from Step 1] |
| `SUPABASE_SERVICE_ROLE_KEY` | [Paste service_role key from Step 1] |

5. Click **Save** on each one
6. You'll need to **redeploy** for changes to take effect

### Option B: Using Vercel CLI (Faster)

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Set environment variables
vercel env add VITE_SUPABASE_PROJECT_ID production
# When prompted, enter: shthtiwcbdnhvxikxiex

vercel env add VITE_SUPABASE_URL production
# When prompted, enter: https://shthtiwcbdnhvxikxiex.supabase.co

vercel env add VITE_SUPABASE_PUBLISHABLE_KEY production
# When prompted, paste the anon/public key from Step 1

vercel env add SUPABASE_SERVICE_ROLE_KEY production
# When prompted, paste the service_role key from Step 1
```

---

## Step 4: Redeploy to Vercel

After updating environment variables, you must redeploy:

### Option A: Trigger redeploy via Dashboard
1. Go to Vercel Dashboard → Your project
2. Click **Deployments**
3. Find latest deployment
4. Click **⋯** (three dots) → **Redeploy**
5. Select **Use existing Build Cache: No**
6. Click **Redeploy**

### Option B: Redeploy via CLI
```bash
cd /home/joeylutes/projects/foundry-portal
vercel --prod
```

### Option C: Git push (if auto-deploy enabled)
```bash
git commit --allow-empty -m "Trigger redeploy for new database"
git push
```

---

## Step 5: Verify Production

After deployment completes (~2-3 minutes):

1. **Test login:** Go to https://portal.fleetdrms.com
2. **Login with portal user:** Use one of these:
   - joey.lutes@fleetdrms.com
   - ryan@codellogistics.com
   - damion.jackson@fleetdrms.com
3. **Verify data loads:**
   - Dashboard shows correct info
   - Portal updates display
   - Surveys/events visible
   - Business info correct

---

## Step 6: Test Local Development

After updating local `.env`:

```bash
cd /home/joeylutes/projects/foundry-portal

# Install dependencies if needed
npm install

# Start dev server
npm run dev
```

Open http://localhost:5173 and verify:
- ✅ Can login with portal user
- ✅ Dashboard loads
- ✅ Content displays correctly
- ✅ No console errors about Supabase

---

## Rollback Plan (If Something Goes Wrong)

If production breaks after updating to NEW database:

### Quick rollback in Vercel:
1. Go to Vercel Dashboard → Deployments
2. Find the **previous deployment** (before the redeploy)
3. Click **⋯** → **Promote to Production**
4. This immediately reverts to old database

### Fix and redeploy:
1. Check Vercel logs for errors
2. Verify environment variables are correct
3. Check NEW database RLS policies allow access
4. Redeploy once fixed

---

## Verification Checklist

After updating everything:

### Local Development
- [ ] `.env` file updated with NEW database credentials
- [ ] `npm run dev` starts without errors
- [ ] Can login with portal user locally
- [ ] Dashboard displays correct data
- [ ] No Supabase errors in browser console

### Production (Vercel)
- [ ] Environment variables updated in Vercel
- [ ] Successfully redeployed
- [ ] Can access https://portal.fleetdrms.com
- [ ] Can login with portal user
- [ ] Dashboard displays correct data
- [ ] Portal updates/surveys/events load
- [ ] Business information displays
- [ ] No errors in Vercel logs

---

## Troubleshooting

### Error: "Invalid API key"
**Fix:** Double-check you copied the full anon/public key from NEW database

### Error: "Row Level Security policy violation"
**Fix:** Check RLS policies in NEW database allow portal users access

### Error: "Could not connect to database"
**Fix:** Verify `VITE_SUPABASE_URL` is correct: `https://shthtiwcbdnhvxikxiex.supabase.co`

### Production works but local doesn't (or vice versa)
**Fix:** Make sure BOTH `.env` (local) AND Vercel environment variables are updated

### Old data still showing
**Fix:**
1. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
2. Clear browser cache
3. Check which database is actually connected (look in Network tab)

---

## Current Values Reference

### OLD Database (FleetDRMS - shared with app)
- Project ID: `kssbljbxapejckgassgf`
- URL: `https://kssbljbxapejckgassgf.supabase.co`
- Has: 25 total users (9 portal + 16 app users)
- Status: Keep for app, portal migrated away

### NEW Database (Foundry Portal - standalone)
- Project ID: `shthtiwcbdnhvxikxiex`
- URL: `https://shthtiwcbdnhvxikxiex.supabase.co`
- Has: 9 portal users only (no app users)
- Status: Ready for production!

---

## Summary

**What we're doing:**
- Pointing portal app from OLD shared database → NEW standalone database
- Update both local development AND production (Vercel)
- All 9 portal users and their data are already migrated to NEW database

**Why:**
- Separate portal from app database
- Portal now has its own clean database
- No more mixing portal users with app users

**Next:** After updating, portal will use NEW database with only portal-relevant data! 🚀

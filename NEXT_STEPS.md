# Next Steps: Deploy to Production

✅ **Completed:**
- Database migration (9 users, 9 businesses, all portal data)
- Local `.env` updated to NEW database

📋 **Remaining:**
- Update Vercel environment variables
- Redeploy to production
- Test production site

---

## Option 1: Automatic Update (Recommended - 5 minutes)

Run this script to update Vercel automatically:

```bash
cd /home/joeylutes/projects/foundry-portal
./update_vercel_env.sh
```

This will:
1. Login to Vercel (if needed)
2. Remove old environment variables
3. Add new environment variables with NEW database
4. Prompt you to redeploy

Then redeploy:
```bash
vercel --prod
```

---

## Option 2: Manual Update via Dashboard (10 minutes)

1. Go to https://vercel.com/dashboard
2. Select your **foundry-portal** project
3. Click **Settings** → **Environment Variables**
4. Update these 4 variables for **Production**:

### Variables to Update:

**VITE_SUPABASE_PROJECT_ID**
```
shthtiwcbdnhvxikxiex
```

**VITE_SUPABASE_URL**
```
https://shthtiwcbdnhvxikxiex.supabase.co
```

**VITE_SUPABASE_PUBLISHABLE_KEY**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNodGh0aXdjYmRuaHZ4aWt4aWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NjM2ODQsImV4cCI6MjA3NzIzOTY4NH0.ICbmEjGYHr6fXqK024hC4rGO-Se3axdBuoC2UArqr20
```

**SUPABASE_SERVICE_ROLE_KEY**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNodGh0aXdjYmRuaHZ4aWt4aWV4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY2MzY4NCwiZXhwIjoyMDc3MjM5Njg0fQ.7b0k9jLdEltjWLU-awtbdApQzmonMoJhaixoZh84wn4
```

5. Click **Save** on each one
6. Go to **Deployments** → Click latest deployment **⋯** → **Redeploy**

---

## After Deployment

### Test Production (2 minutes)

1. **Visit:** https://portal.fleetdrms.com
2. **Login with:** joey.lutes@fleetdrms.com (or any portal user)
3. **Verify:**
   - ✅ Login works
   - ✅ Dashboard loads
   - ✅ Portal updates display
   - ✅ Business info shows correctly
   - ✅ No console errors

### Test Local Development (2 minutes)

```bash
cd /home/joeylutes/projects/foundry-portal
npm run dev
```

Open http://localhost:5173 and verify:
- ✅ Can login
- ✅ Data loads correctly
- ✅ No Supabase errors

---

## Rollback (If Needed)

If something goes wrong:

### Quick Rollback in Vercel:
1. Go to Vercel Dashboard → Deployments
2. Find deployment from **before** the update
3. Click **⋯** → **Promote to Production**
4. Site immediately reverts to OLD database

---

## Database Info Reference

### OLD Database (FleetDRMS - shared)
- **Project ID:** kssbljbxapejckgassgf
- **URL:** https://kssbljbxapejckgassgf.supabase.co
- **Users:** 25 total (9 portal + 16 app)
- **Status:** Still used by app, portal migrated away

### NEW Database (Foundry Portal - standalone)
- **Project ID:** shthtiwcbdnhvxikxiex
- **URL:** https://shthtiwcbdnhvxikxiex.supabase.co
- **Users:** 9 portal users only
- **Status:** ✅ Ready for production!

---

## What Happens After Update

**Before (Current):**
```
Portal App (Vercel) → OLD Database (shared with app)
```

**After (New):**
```
Portal App (Vercel) → NEW Database (portal only)
Fleet App          → OLD Database (app only)
```

Complete separation! 🎉

---

## Summary

**Ready to deploy?**

1. Run: `./update_vercel_env.sh`
2. Run: `vercel --prod`
3. Test: https://portal.fleetdrms.com
4. Done! 🚀

**Estimated time:** 5-10 minutes total

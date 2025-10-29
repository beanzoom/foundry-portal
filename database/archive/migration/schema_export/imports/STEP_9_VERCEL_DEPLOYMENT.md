# Step 9: Vercel Production Deployment

**Status**: Ready to execute after publishing test passes
**Estimated Time**: 10-15 minutes
**Risk Level**: Low (can rollback if issues occur)

---

## Prerequisites

✅ **Before proceeding, ensure**:
1. Local environment fully tested and working
2. Publishing functionality verified (Update/Survey/Event)
3. All portal features working on localhost
4. No console errors during normal usage

---

## Environment Variables to Update

Navigate to: **Vercel Dashboard** → **foundry-portal** → **Settings** → **Environment Variables**

### Variables to Change

| Variable | Old Value (FleetDRMS) | New Value (Foundry Portal) |
|----------|------------------------|----------------------------|
| `VITE_SUPABASE_PROJECT_ID` | kssbljbxapejckgassgf | **shthtiwcbdnhvxikxiex** |
| `VITE_SUPABASE_URL` | https://kssbljbxapejckgassgf.supabase.co | **https://shthtiwcbdnhvxikxiex.supabase.co** |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | [OLD_ANON_KEY] | **eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNodGh0aXdjYmRuaHZ4aWt4aWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NjM2ODQsImV4cCI6MjA3NzIzOTY4NH0.ICbmEjGYHr6fXqK024hC4rGO-Se3axdBuoC2UArqr20** |
| `SUPABASE_SERVICE_ROLE_KEY` | [OLD_SERVICE_KEY] | **eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNodGh0aXdjYmRuaHZ4aWt4aWV4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY2MzY4NCwiZXhwIjoyMDc3MjM5Njg0fQ.7b0k9jLdEltjWLU-awtbdApQzmonMoJhaixoZh84wn4** |

### Variables to Keep (No Change)

| Variable | Value | Notes |
|----------|-------|-------|
| `VITE_PRODUCTION_PORTAL_DOMAIN` | https://portal.fleetdrms.com | Domain stays the same |
| `VITE_PRODUCTION_BASE_DOMAIN` | fleetdrms.com | Domain stays the same |
| `VITE_FOUNDRY_REFERRAL_CODE` | FOUNDRB567 | Referral code unchanged |
| `VITE_APP_NAME` | Fleet DRMS Portal | App name unchanged |
| `VITE_APP_ENV` | production | Environment unchanged |

---

## Deployment Steps

### 1. Update Environment Variables

1. Log into Vercel dashboard
2. Navigate to **foundry-portal** project
3. Go to **Settings** → **Environment Variables**
4. For each variable in the table above:
   - Click **Edit** (pencil icon)
   - Replace with new value
   - Click **Save**
5. Ensure variables apply to **Production** environment

### 2. Trigger New Deployment

**Option A: Redeploy from Dashboard**
1. Go to **Deployments** tab
2. Click on most recent deployment
3. Click **⋯** menu → **Redeploy**
4. Confirm redeployment

**Option B: Push to Git**
1. Make a small commit (e.g., update README)
2. Push to main branch
3. Vercel auto-deploys

**Option C: Vercel CLI** (if installed)
```bash
cd /home/joeylutes/projects/foundry-portal
vercel --prod
```

### 3. Monitor Deployment

1. Watch build logs for errors
2. Wait for deployment to complete (2-4 minutes)
3. Check deployment status shows "Ready"

### 4. Verify Production

**Test at https://portal.fleetdrms.com**:

1. **Login Test**
   - Try logging in with joey.lutes@beanzoom.com
   - Verify NDA/membership flow (if needed)
   - Check dashboard loads

2. **Content Test**
   - Navigate to Updates, Surveys, Events
   - Verify content loads correctly
   - Check no 404 errors in console

3. **Admin Test** (if super_admin)
   - Go to /admin/updates
   - Try publishing an update
   - Verify no errors

4. **Referral Test**
   - Check /portal/referrals page
   - Verify referrals display

---

## Verification Queries

Run these against **NEW database** to verify production is using it:

```sql
-- Check recent logins (should start seeing activity after deployment)
SELECT email, last_sign_in_at
FROM auth.users
ORDER BY last_sign_in_at DESC NULLS LAST
LIMIT 5;

-- Check for new email batches (if anyone publishes)
SELECT *
FROM email_notification_batches
ORDER BY created_at DESC
LIMIT 3;

-- Monitor portal activity
SELECT *
FROM portal_admin_activity
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

---

## Rollback Plan

**If something goes wrong**, rollback to old database:

### Quick Rollback Steps

1. Go back to Vercel → Settings → Environment Variables
2. Change back to OLD values:
   - `VITE_SUPABASE_PROJECT_ID` → **kssbljbxapejckgassgf**
   - `VITE_SUPABASE_URL` → **https://kssbljbxapejckgassgf.supabase.co**
   - `VITE_SUPABASE_PUBLISHABLE_KEY` → [OLD_ANON_KEY]
   - `SUPABASE_SERVICE_ROLE_KEY` → [OLD_SERVICE_KEY]
3. Redeploy
4. Verify production works again

**Old database connection string** (for reference):
```
postgresql://postgres:mY8MaPTmsIKwAZND@db.kssbljbxapejckgassgf.supabase.co:5432/postgres
```

---

## Common Issues

### Issue 1: "Invalid API Key" Error
**Cause**: Publishable key or service role key incorrect
**Fix**: Double-check keys in Vercel match NEW database keys

### Issue 2: "Failed to connect to Supabase"
**Cause**: Project ID or URL typo
**Fix**: Verify `VITE_SUPABASE_PROJECT_ID` is **shthtiwcbdnhvxikxiex**

### Issue 3: Users Can't Login
**Cause**: auth.users table might be empty or emails wrong
**Fix**: Verify auth.users has 9 records in NEW database

### Issue 4: Email Sending Fails
**Cause**: email_config pointing to wrong database
**Fix**: Verify email_config.supabase_url points to NEW database

### Issue 5: Publishing Doesn't Create Batches
**Cause**: Trigger not firing or schema reference issue
**Fix**: Check trigger exists on portal_updates table

---

## Post-Deployment Monitoring

**Monitor for 24-48 hours**:

1. **User Activity**
   - Check login success rate
   - Monitor error rates in Vercel logs
   - Watch for 404s or 500s

2. **Database Load**
   - Monitor Supabase dashboard for connection count
   - Check query performance
   - Watch for slow queries

3. **Email System**
   - Verify email batches being created
   - Check email_queue for pending emails
   - Monitor send success rate

4. **User Reports**
   - Watch for user complaints
   - Monitor support channels
   - Be ready to rollback if critical issues

---

## Success Criteria

✅ **Deployment is successful when**:
- Users can login without errors
- All portal pages load correctly
- Admin publishing works
- No console errors during normal usage
- Email batches created when publishing
- Referrals display correctly
- No increase in error rates

---

## Contact Information

**If you need help**:
- Check Vercel deployment logs first
- Check Supabase database logs
- Review browser console errors
- Check [CURRENT_STATUS.md](CURRENT_STATUS.md) for migration details

---

**Estimated Deployment Time**: 10-15 minutes
**Rollback Time**: 5 minutes
**Risk Level**: Low (rollback available)

---

*Last Updated: 2025-10-28*
*Ready to deploy after local testing completes*

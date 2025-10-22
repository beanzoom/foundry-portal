# Foundry Portal - Vercel Deployment Guide

## Overview

**Current Setup**: Hosted on Lovable.dev
**New Setup**: Vercel deployment
**Local Port**: 8092
**Production Domain**: portal.fleetdrms.com (to be configured)

---

## Prerequisites

1. ✅ Vercel account (free or paid)
2. ✅ GitHub repository with portal code
3. ✅ Supabase project credentials
4. ✅ Domain access (portal.fleetdrms.com)

---

## Step 1: Install Vercel CLI (Optional but Recommended)

```bash
npm install -g vercel
```

---

## Step 2: Connect Repository to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import your GitHub repository: `foundry-portal`
4. Configure project:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Option B: Via Vercel CLI

```bash
cd /home/joeylutes/projects/foundry-portal
vercel
```

Follow the prompts to link your project.

---

## Step 3: Configure Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables

Add these variables for **Production**, **Preview**, and **Development**:

| Variable Name | Value | Notes |
|---------------|-------|-------|
| `VITE_SUPABASE_PROJECT_ID` | `kssbljbxapejckgassgf` | From .env file |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `eyJhbGci...` | Anon key (safe to expose) |
| `VITE_SUPABASE_URL` | `https://kssbljbxapejckgassgf.supabase.co` | Supabase URL |
| `VITE_PRODUCTION_PORTAL_DOMAIN` | `https://portal.fleetdrms.com` | Your portal domain |
| `VITE_PRODUCTION_BASE_DOMAIN` | `fleetdrms.com` | Your base domain |
| `VITE_FOUNDRY_REFERRAL_CODE` | `FOUNDRB567` | Referral code |

**IMPORTANT**:
- All variables must start with `VITE_` to be accessible in the browser
- Don't add `VITE_SUPABASE_SERVICE_ROLE_KEY` (server-side only, not safe for browser)

---

## Step 4: Configure Custom Domain

### In Vercel Dashboard:

1. Go to Project → Settings → Domains
2. Add custom domain: `portal.fleetdrms.com`
3. Vercel will provide DNS records to add:
   - **Type**: CNAME
   - **Name**: portal
   - **Value**: cname.vercel-dns.com

### In Your DNS Provider (e.g., Cloudflare, Route53):

Add the CNAME record:
```
Type: CNAME
Name: portal
Value: cname.vercel-dns.com
TTL: Auto or 3600
```

**Wait 5-15 minutes** for DNS propagation.

---

## Step 5: Deploy

### Automatic Deployment (Recommended)

Vercel automatically deploys when you push to your main branch:

```bash
git add .
git commit -m "Initial portal deployment"
git push origin main
```

### Manual Deployment (via CLI)

```bash
cd /home/joeylutes/projects/foundry-portal
vercel --prod
```

---

## Step 6: Verify Deployment

1. **Check Deployment Status**:
   - Go to Vercel Dashboard → Deployments
   - Wait for "Ready" status (usually 2-5 minutes)

2. **Test Preview URL**:
   - Vercel provides a preview URL like: `foundry-portal-xxx.vercel.app`
   - Open it and verify portal loads

3. **Test Custom Domain** (after DNS propagation):
   - Open https://portal.fleetdrms.com
   - Verify SSL certificate is active
   - Test login and navigation

---

## Step 7: Configure CORS in Supabase (if needed)

If you get CORS errors, add Vercel domains to Supabase:

1. Go to Supabase Dashboard → Settings → API
2. Under "Site URL", add: `https://portal.fleetdrms.com`
3. Under "Redirect URLs", add:
   - `https://portal.fleetdrms.com/**`
   - `https://*.vercel.app/**` (for preview deployments)

---

## Deployment Architecture

### Current (Lovable.dev)
```
User → Lovable.dev → Supabase Database
```

### New (Vercel)
```
User → Vercel (portal.fleetdrms.com) → Supabase Database (SAME as main app)
```

### Parallel During Migration
```
User → Lovable.dev (current) → Supabase Database
User → Vercel (new)         → Supabase Database (SAME database!)
```

**IMPORTANT**: Both Lovable.dev and Vercel connect to the **SAME** Supabase database.

---

## Build Configuration

### `vercel.json` (Already Created)
- Configures SPA routing (all routes → index.html)
- Sets cache headers for assets
- Maps environment variables

### Build Commands
- **Development**: `npm run dev` (port 8092)
- **Production**: `npm run build` → outputs to `dist/`
- **Preview**: Vercel builds automatically on PR branches

---

## Environment-Specific Behavior

### Development (Local - Port 8092)
- Uses `.env` file
- Hot module reloading
- Source maps enabled
- Debug logging enabled

### Preview (Vercel Preview Deployments)
- Branch deployments (e.g., `feature-xyz.vercel.app`)
- Uses Vercel environment variables
- Optimized build
- No source maps

### Production (portal.fleetdrms.com)
- Main branch only
- Uses Vercel environment variables
- Fully optimized build
- No source maps
- Production logging level

---

## Rollback Strategy

### If Issues Arise:

1. **Quick Rollback**:
   - Vercel Dashboard → Deployments
   - Find last working deployment
   - Click "..." → "Promote to Production"

2. **DNS Rollback**:
   - Revert CNAME record to point back to Lovable.dev
   - Users will be redirected to old deployment

3. **Keep Lovable.dev Active**:
   - Don't delete Lovable.dev deployment immediately
   - Run both in parallel for 1-2 weeks
   - Monitor for issues

---

## Testing Checklist

Before going live on `portal.fleetdrms.com`:

- [ ] Portal loads without errors
- [ ] User authentication works
- [ ] Portal dashboard loads
- [ ] Events page works
- [ ] Updates page works
- [ ] Surveys page works
- [ ] Referrals page works
- [ ] Admin pages load (for admin users)
- [ ] Email notifications send correctly
- [ ] No CORS errors
- [ ] SSL certificate is valid
- [ ] Mobile responsive layout works

---

## Monitoring

### Vercel Analytics (Built-in)
- Real-time performance metrics
- Core Web Vitals
- Page load times
- Error tracking

### Custom Monitoring
- Check Supabase logs for database errors
- Monitor email queue (`email_queue` table)
- Check browser console for JS errors

---

## Cost Comparison

### Lovable.dev
- Current cost: ?

### Vercel
- **Free Tier**:
  - 100GB bandwidth/month
  - Unlimited deployments
  - Custom domains
  - SSL certificates

- **Pro Tier** ($20/month if needed):
  - 1TB bandwidth/month
  - Advanced analytics
  - Team collaboration

**Recommendation**: Start with Free tier, upgrade if needed.

---

## Migration Timeline

### Phase 1: Setup (Today)
- ✅ Create Vercel project
- ✅ Configure environment variables
- ✅ Deploy to preview URL
- ✅ Test thoroughly

### Phase 2: DNS Configuration (Day 2)
- Add custom domain `portal.fleetdrms.com`
- Configure DNS records
- Wait for propagation
- Test custom domain

### Phase 3: Parallel Operation (Week 1-2)
- Run both Lovable.dev AND Vercel
- Monitor for issues
- Verify email notifications work
- Test with real users

### Phase 4: Cutover (Week 3)
- Point `portal.fleetdrms.com` to Vercel
- Monitor closely for 48 hours
- Keep Lovable.dev as backup

### Phase 5: Decommission (Week 4)
- Archive Lovable.dev deployment
- Update documentation
- Celebrate! 🎉

---

## Troubleshooting

### Issue: Build fails on Vercel
**Solution**: Check build logs in Vercel Dashboard. Common issues:
- Missing environment variables
- TypeScript errors
- Missing dependencies

**Fix**:
```bash
# Test build locally first
npm run build
```

### Issue: Portal loads but shows blank page
**Solution**: Check browser console for errors. Usually:
- Missing environment variables (VITE_SUPABASE_URL)
- CORS errors

**Fix**: Verify all `VITE_*` environment variables are set in Vercel.

### Issue: Authentication doesn't work
**Solution**: Check Supabase redirect URLs
1. Supabase Dashboard → Authentication → URL Configuration
2. Add `https://portal.fleetdrms.com/**`
3. Add `https://*.vercel.app/**` for preview deployments

### Issue: Database connection errors
**Solution**: Verify Supabase credentials
- Check `VITE_SUPABASE_URL` matches your project
- Check `VITE_SUPABASE_PUBLISHABLE_KEY` is the anon key (not service role)

---

## Quick Reference Commands

```bash
# Install dependencies
npm install

# Run locally on port 8092
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Deploy to Vercel (manual)
vercel

# Deploy to production (manual)
vercel --prod

# Check Vercel project status
vercel ls

# View deployment logs
vercel logs
```

---

## Support & Resources

- **Vercel Docs**: https://vercel.com/docs
- **Vite Deployment**: https://vitejs.dev/guide/static-deploy.html
- **Supabase Auth**: https://supabase.com/docs/guides/auth
- **Local Setup**: See [SETUP.md](./SETUP.md)

---

**Ready to deploy!** Follow the steps above to get your portal on Vercel.
